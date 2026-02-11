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

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Statistiques utilisateurs
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsers7Days,
      newUsers30Days,
      deletedUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: last7days }, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: last30days }, deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: { not: null } } })
    ]);

    // 2. Statistiques clients
    const [
      totalClientsOld,
      totalClientsNew,
      newClientsToday,
      newClients7Days,
      newClients30Days,
      deletedClients
    ] = await Promise.all([
      prisma.client.count(),
      prisma.newClient.count({ where: { deletedAt: null } }),
      prisma.newClient.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
      prisma.newClient.count({ where: { createdAt: { gte: last7days }, deletedAt: null } }),
      prisma.newClient.count({ where: { createdAt: { gte: last30days }, deletedAt: null } }),
      prisma.newClient.count({ where: { deletedAt: { not: null } } })
    ]);

    // 3. Statistiques logs
    const [
      totalLogs,
      logsToday,
      logs7Days,
      logs30Days,
      errorLogs,
      warningLogs,
      criticalLogs
    ] = await Promise.all([
      prisma.systemLog.count(),
      prisma.systemLog.count({ where: { createdAt: { gte: today } } }),
      prisma.systemLog.count({ where: { createdAt: { gte: last7days } } }),
      prisma.systemLog.count({ where: { createdAt: { gte: last30days } } }),
      prisma.systemLog.count({ where: { level: 'ERROR' } }),
      prisma.systemLog.count({ where: { level: 'WARNING' } }),
      prisma.systemLog.count({ where: { level: 'CRITICAL' } })
    ]);

    // 4. Statistiques autres
    const [
      totalCategories,
      totalSearches,
      totalContactIdentifiers,
      searches7Days
    ] = await Promise.all([
      prisma.category.count(),
      prisma.search.count(),
      prisma.contactIdentifier.count(),
      prisma.search.count({ where: { createdAt: { gte: last7days } } })
    ]);

    // 5. Activité récente (derniers 10 logs)
    const recentActivity = await prisma.systemLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // Récupérer les utilisateurs pour l'activité récente
    const activityUserIds = recentActivity
      .map(log => log.userId)
      .filter((id): id is number => id !== null);
    
    const uniqueActivityUserIds = [...new Set(activityUserIds)];
    
    const usersForActivity = uniqueActivityUserIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: uniqueActivityUserIds } },
          select: { id: true, username: true, email: true, firstName: true, lastName: true }
        })
      : [];

    const recentActivityWithUsers = recentActivity.map(log => ({
      ...log,
      user: log.userId ? usersForActivity.find(u => u.id === log.userId) : undefined
    }));

    // 6. Erreurs récentes (dernières 5)
    const recentErrors = await prisma.systemLog.findMany({
      where: {
        level: { in: ['ERROR', 'CRITICAL'] },
        createdAt: { gte: last7days }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // 7. Distribution des utilisateurs par rôle
    const usersByRole = await prisma.$queryRaw<Array<{ role: string; count: bigint }>>`
      SELECT role, COUNT(*) as count
      FROM "public"."User"
      WHERE "deletedAt" IS NULL
      GROUP BY role
      ORDER BY count DESC
    `;

    // 8. Clients par priorité
    const clientsByPriority = await prisma.$queryRaw<Array<{ priority: string; count: bigint }>>`
      SELECT priority, COUNT(*) as count
      FROM "public"."NewClient"
      WHERE "deletedAt" IS NULL
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'Immédiate' THEN 1
          WHEN 'Haute' THEN 2
          WHEN 'Moyenne' THEN 3
          WHEN 'Faible' THEN 4
          ELSE 5
        END
    `;

    // 9. Activité des 7 derniers jours (logs par jour)
    const activityByDay = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM "public"."SystemLog"
      WHERE "createdAt" >= ${last7days}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    // 10. Utilisateurs les plus actifs (7 derniers jours)
    const topUsers = await prisma.$queryRaw<Array<{ userId: number; count: bigint }>>`
      SELECT "userId", COUNT(*) as count
      FROM "public"."SystemLog"
      WHERE "createdAt" >= ${last7days} 
        AND "userId" IS NOT NULL
      GROUP BY "userId"
      ORDER BY count DESC
      LIMIT 5
    `;

    const topUserIds = topUsers.map(u => u.userId);
    const topUsersInfo = topUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: topUserIds } },
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        })
      : [];

    const topUsersWithInfo = topUsers.map(stat => ({
      ...topUsersInfo.find(u => u.id === stat.userId),
      actionCount: Number(stat.count)
    }));

    // 11. Alertes
    const alerts = [];

    // Erreurs critiques récentes
    if (criticalLogs > 0) {
      alerts.push({
        level: 'critical',
        title: 'Erreurs critiques',
        message: `${criticalLogs} erreur(s) critique(s) détectée(s)`,
        count: criticalLogs
      });
    }

    // Erreurs récentes
    const recentErrorCount = await prisma.systemLog.count({
      where: {
        level: 'ERROR',
        createdAt: { gte: today }
      }
    });

    if (recentErrorCount > 5) {
      alerts.push({
        level: 'error',
        title: 'Erreurs aujourd\'hui',
        message: `${recentErrorCount} erreur(s) détectée(s) aujourd'hui`,
        count: recentErrorCount
      });
    }

    // Utilisateurs inactifs à nettoyer
    const inactiveUsers = await prisma.user.count({
      where: {
        isActive: false,
        deletedAt: null
      }
    });

    if (inactiveUsers > 0) {
      alerts.push({
        level: 'warning',
        title: 'Utilisateurs inactifs',
        message: `${inactiveUsers} utilisateur(s) inactif(s) à vérifier`,
        count: inactiveUsers
      });
    }

    // Logs anciens
    const oldLogs = await prisma.systemLog.count({
      where: {
        createdAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
      }
    });

    if (oldLogs > 10000) {
      alerts.push({
        level: 'info',
        title: 'Logs anciens',
        message: `${oldLogs.toLocaleString()} log(s) de plus de 90 jours`,
        count: oldLogs
      });
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        new7Days: newUsers7Days,
        new30Days: newUsers30Days,
        deleted: deletedUsers,
        byRole: usersByRole.map(r => ({ role: r.role, count: Number(r.count) }))
      },
      clients: {
        totalOld: totalClientsOld,
        totalNew: totalClientsNew,
        total: totalClientsOld + totalClientsNew,
        newToday: newClientsToday,
        new7Days: newClients7Days,
        new30Days: newClients30Days,
        deleted: deletedClients,
        byPriority: clientsByPriority.map(p => ({ priority: p.priority, count: Number(p.count) }))
      },
      logs: {
        total: totalLogs,
        today: logsToday,
        last7Days: logs7Days,
        last30Days: logs30Days,
        errors: errorLogs,
        warnings: warningLogs,
        critical: criticalLogs,
        activityByDay: activityByDay.map(d => ({ date: d.date, count: Number(d.count) }))
      },
      stats: {
        categories: totalCategories,
        searches: totalSearches,
        searchesLast7Days: searches7Days,
        contactIdentifiers: totalContactIdentifiers
      },
      recentActivity: recentActivityWithUsers,
      recentErrors,
      topUsers: topUsersWithInfo,
      alerts,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Erreur GET /api/admin/dashboard:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
