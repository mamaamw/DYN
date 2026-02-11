import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/database/stats - Get database statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Administrateur requis' }, { status: 403 });
    }

    // Get counts for each table
    const [
      usersCount,
      activeUsersCount,
      deletedUsersCount,
      clientsCount,
      newClientsCount,
      activeNewClientsCount,
      deletedNewClientsCount,
      categoriesCount,
      userCategoriesCount,
      contactIdentifiersCount,
      searchesCount,
      systemLogsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: { not: null } } }),
      prisma.client.count(),
      prisma.newClient.count(),
      prisma.newClient.count({ where: { deletedAt: null } }),
      prisma.newClient.count({ where: { deletedAt: { not: null } } }),
      prisma.category.count(),
      prisma.userCategory.count(),
      prisma.contactIdentifier.count(),
      prisma.search.count(),
      prisma.systemLog.count(),
    ]);

    // Get database size (PostgreSQL specific)
    let databaseSize = null;
    try {
      const sizeResult = await prisma.$queryRaw<Array<{ size: bigint }>>`
        SELECT pg_database_size(current_database()) as size
      `;
      if (sizeResult && sizeResult[0]) {
        databaseSize = Number(sizeResult[0].size);
      }
    } catch (error) {
      console.error('Error getting database size:', error);
    }

    // Get table sizes
    let tableSizes: Array<{ name: string; size: number; rows: number }> = [];
    try {
      const tablesResult = await prisma.$queryRaw<Array<{ 
        tablename: string;
        size: bigint;
        row_count: bigint;
      }>>`
        SELECT 
          t.tablename,
          pg_total_relation_size('"' || t.schemaname || '"."' || t.tablename || '"') as size,
          s.n_live_tup as row_count
        FROM pg_tables t
        LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname AND t.schemaname = s.schemaname
        WHERE t.schemaname = 'public'
        ORDER BY size DESC
        LIMIT 20
      `;
      tableSizes = tablesResult.map((row) => ({
        name: row.tablename,
        size: Number(row.size),
        rows: Number(row.row_count || 0),
      }));
    } catch (error) {
      console.error('Error getting table sizes:', error);
    }

    // Get recent activity
    const recentLogs = await prisma.systemLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        action: true,
        createdAt: true,
      },
    });

    const stats = {
      tables: {
        users: {
          total: usersCount,
          active: activeUsersCount,
          deleted: deletedUsersCount,
        },
        clients: {
          total: clientsCount,
        },
        newClients: {
          total: newClientsCount,
          active: activeNewClientsCount,
          deleted: deletedNewClientsCount,
        },
        categories: categoriesCount,
        userCategories: userCategoriesCount,
        contactIdentifiers: contactIdentifiersCount,
        searches: searchesCount,
        systemLogs: systemLogsCount,
      },
      database: {
        size: databaseSize,
        tables: tableSizes,
      },
      activity: {
        recentLogs,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Database stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
