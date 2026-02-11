import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Vérifier authentification admin
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // 1. État du système
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      pid: process.pid
    };

    // 2. Statistiques utilisateurs
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      usersLast24h,
      usersLast7days,
      deletedUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { isActive: true, deletedAt: null }
      }),
      prisma.user.count({
        where: {
          lastLogin: { gte: last24h },
          deletedAt: null
        }
      }),
      prisma.user.count({
        where: {
          lastLogin: { gte: last7days },
          deletedAt: null
        }
      }),
      prisma.user.count({
        where: { deletedAt: { not: null } }
      })
    ]);

    // 3. Statistiques base de données
    const [
      clientsCount,
      newClientsCount,
      categoriesCount,
      searchesCount
    ] = await Promise.all([
      prisma.client.count(),
      prisma.newClient.count({ where: { deletedAt: null } }),
      prisma.category.count(),
      prisma.search.count()
    ]);

    // 4. Activité des logs système
    const [
      totalLogs,
      logsLast24h,
      logsLast7days,
      errorLogs,
      warningLogs,
      recentLogs
    ] = await Promise.all([
      prisma.systemLog.count(),
      prisma.systemLog.count({
        where: { createdAt: { gte: last24h } }
      }),
      prisma.systemLog.count({
        where: { createdAt: { gte: last7days } }
      }),
      prisma.systemLog.count({
        where: { level: 'ERROR' }
      }),
      prisma.systemLog.count({
        where: { level: 'WARNING' }
      }),
      prisma.systemLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Récupérer les infos des utilisateurs pour les logs récents
    const recentUserIds = recentLogs
      .map(log => log.userId)
      .filter((id): id is number => id !== null);
    
    const uniqueUserIds = [...new Set(recentUserIds)];
    
    const usersForLogs = uniqueUserIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: {
        id: true,
        username: true,
        email: true
      }
    }) : [];

    // Mapper les utilisateurs aux logs
    const recentLogsWithUsers = recentLogs.map(log => ({
      ...log,
      user: log.userId ? usersForLogs.find(u => u.id === log.userId) : undefined
    }));

    // 5. Actions par type (dernières 24h)
    const actionStats = await prisma.$queryRaw<Array<{ action: string; count: bigint }>>`
      SELECT action, COUNT(*) as count
      FROM "public"."SystemLog"
      WHERE "createdAt" >= ${last24h}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;

    // 6. Utilisateurs les plus actifs (dernières 24h)
    const activeUserStats = await prisma.$queryRaw<Array<{ userId: number; count: bigint }>>`
      SELECT "userId", COUNT(*) as count
      FROM "public"."SystemLog"
      WHERE "createdAt" >= ${last24h} AND "userId" IS NOT NULL
      GROUP BY "userId"
      ORDER BY count DESC
      LIMIT 5
    `;

    // Récupérer les infos des utilisateurs actifs
    const activeUserIds = activeUserStats.map(stat => stat.userId);
    const activeUsersInfo = activeUserIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: activeUserIds } },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true
      }
    }) : [];

    const topActiveUsers = activeUserStats.map(stat => ({
      ...activeUsersInfo.find(u => u.id === stat.userId),
      actionCount: Number(stat.count)
    }));

    // 7. Taille de la base de données
    const dbSize = await prisma.$queryRaw<Array<{ size: bigint }>>`
      SELECT pg_database_size(current_database()) as size
    `;

    // 8. Alertes système
    const alerts = [];

    // Vérifier s'il y a des erreurs récentes
    const recentErrors = await prisma.systemLog.count({
      where: {
        level: 'ERROR',
        createdAt: { gte: last24h }
      }
    });

    if (recentErrors > 10) {
      alerts.push({
        level: 'error',
        message: `${recentErrors} erreurs détectées dans les dernières 24h`,
        timestamp: new Date()
      });
    }

    // Vérifier la mémoire
    const memUsage = (systemInfo.memoryUsage.heapUsed / systemInfo.memoryUsage.heapTotal) * 100;
    if (memUsage > 80) {
      alerts.push({
        level: 'warning',
        message: `Utilisation mémoire élevée: ${memUsage.toFixed(2)}%`,
        timestamp: new Date()
      });
    }

    // Vérifier les logs anciens
    const oldLogs = await prisma.systemLog.count({
      where: {
        createdAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
      }
    });

    if (oldLogs > 10000) {
      alerts.push({
        level: 'info',
        message: `${oldLogs.toLocaleString()} logs de plus de 90 jours à nettoyer`,
        timestamp: new Date()
      });
    }

    return NextResponse.json({
      system: {
        ...systemInfo,
        uptime: Math.floor(systemInfo.uptime),
        memory: {
          used: systemInfo.memoryUsage.heapUsed,
          total: systemInfo.memoryUsage.heapTotal,
          percentage: memUsage
        }
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        last24h: usersLast24h,
        last7days: usersLast7days,
        deleted: deletedUsers,
        topActive: topActiveUsers
      },
      database: {
        size: Number(dbSize[0].size),
        tables: {
          clients: clientsCount,
          newClients: newClientsCount,
          categories: categoriesCount,
          searches: searchesCount
        }
      },
      logs: {
        total: totalLogs,
        last24h: logsLast24h,
        last7days: logsLast7days,
        errors: errorLogs,
        warnings: warningLogs,
        recent: recentLogsWithUsers,
        actionStats: actionStats.map(stat => ({
          action: stat.action,
          count: Number(stat.count)
        }))
      },
      alerts,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Erreur GET /api/admin/monitoring:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
