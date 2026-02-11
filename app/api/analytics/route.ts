import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/analytics - Récupérer les statistiques analytiques
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

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month'; // day, week, month, year
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Définir les dates selon la période
    const now = new Date();
    let dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      switch (period) {
        case 'day':
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          };
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          dateFilter = { gte: weekAgo };
          break;
        case 'month':
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          };
          break;
        case 'year':
          dateFilter = {
            gte: new Date(now.getFullYear(), 0, 1),
          };
          break;
        default:
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          };
      }
    }

    // Statistiques globales
    const [
      totalClients,
      totalUsers,
      totalTodos,
      totalTasks,
      totalEvents,
      totalSearches,
    ] = await Promise.all([
      prisma.newClient.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      prisma.todo.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.event.count({ where: { deletedAt: null } }),
      prisma.search.count(),
    ]);

    // Clients par période
    const clientsByPeriod = await prisma.newClient.groupBy({
      by: ['createdAt'],
      where: {
        deletedAt: null,
        createdAt: dateFilter,
      },
      _count: true,
    });

    // Clients par priorité
    const clientsByPriority = await prisma.newClient.groupBy({
      by: ['priority'],
      where: { deletedAt: null },
      _count: true,
    });

    // Todos par statut
    const todosByStatus = await prisma.todo.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });

    // Todos par outil
    const todosByTool = await prisma.todo.groupBy({
      by: ['tool'],
      where: {
        deletedAt: null,
        tool: { not: null },
      },
      _count: true,
    });

    // Todos par type d'action
    const todosByAction = await prisma.todo.groupBy({
      by: ['actionType'],
      where: {
        deletedAt: null,
        actionType: { not: null },
      },
      _count: true,
    });

    // Tâches par statut
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });

    // Tâches par priorité
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: { deletedAt: null },
      _count: true,
    });

    // Événements par période
    const eventsByPeriod = await prisma.event.groupBy({
      by: ['startDate'],
      where: {
        deletedAt: null,
        startDate: dateFilter,
      },
      _count: true,
    });

    // Activité par utilisateur
    const activityByUser = await prisma.clientHistory.groupBy({
      by: ['userId', 'action'],
      where: {
        createdAt: dateFilter,
      },
      _count: true,
    });

    // Recherches par client
    const searchClientLinks = await prisma.searchClient.groupBy({
      by: ['newClientId'],
      _count: true,
      orderBy: {
        _count: {
          newClientId: 'desc',
        },
      },
      take: 10,
    });

    // Enrichir avec les informations des clients
    const searchesByClient = await Promise.all(
      searchClientLinks.map(async (link) => {
        const client = await prisma.newClient.findUnique({
          where: { id: link.newClientId },
          select: { firstName: true, surname: true, nickname: true },
        });
        return {
          newClientId: link.newClientId,
          _count: link._count,
          client,
        };
      })
    );

    // Logs par niveau (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const logsByLevel = await prisma.systemLog.groupBy({
      by: ['level'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    // Statistiques temporelles détaillées
    const getTimeSeriesData = async () => {
      const timeData = [];
      const intervals = period === 'year' ? 12 : period === 'month' ? 30 : 7;
      
      for (let i = intervals - 1; i >= 0; i--) {
        const date = new Date();
        let startRange: Date;
        let endRange: Date;
        
        if (period === 'year') {
          startRange = new Date(date.getFullYear(), date.getMonth() - i, 1);
          endRange = new Date(date.getFullYear(), date.getMonth() - i + 1, 0);
        } else if (period === 'month') {
          startRange = new Date(date);
          startRange.setDate(date.getDate() - i);
          startRange.setHours(0, 0, 0, 0);
          endRange = new Date(startRange);
          endRange.setHours(23, 59, 59, 999);
        } else {
          startRange = new Date(date);
          startRange.setDate(date.getDate() - i);
          startRange.setHours(0, 0, 0, 0);
          endRange = new Date(startRange);
          endRange.setHours(23, 59, 59, 999);
        }

        const [clients, todos, tasks, events] = await Promise.all([
          prisma.newClient.count({
            where: {
              createdAt: { gte: startRange, lte: endRange },
              deletedAt: null,
            },
          }),
          prisma.todo.count({
            where: {
              createdAt: { gte: startRange, lte: endRange },
              deletedAt: null,
            },
          }),
          prisma.task.count({
            where: {
              createdAt: { gte: startRange, lte: endRange },
              deletedAt: null,
            },
          }),
          prisma.event.count({
            where: {
              startDate: { gte: startRange, lte: endRange },
              deletedAt: null,
            },
          }),
        ]);

        timeData.push({
          date: startRange.toISOString(),
          clients,
          todos,
          tasks,
          events,
        });
      }
      
      return timeData;
    };

    const timeSeriesData = await getTimeSeriesData();

    // Taux de succès des todos
    const successRate = todosByStatus.reduce((acc, item) => {
      const total = todosByStatus.reduce((sum, i) => sum + i._count, 0);
      if (item.status.includes('succes')) {
        return acc + (item._count / total) * 100;
      }
      return acc;
    }, 0);

    const failureRate = todosByStatus.reduce((acc, item) => {
      const total = todosByStatus.reduce((sum, i) => sum + i._count, 0);
      if (item.status === 'failed') {
        return acc + (item._count / total) * 100;
      }
      return acc;
    }, 0);

    return NextResponse.json({
      overview: {
        totalClients,
        totalUsers,
        totalTodos,
        totalTasks,
        totalEvents,
        totalSearches,
        successRate: successRate.toFixed(2),
        failureRate: failureRate.toFixed(2),
      },
      timeSeries: timeSeriesData,
      clientsByPriority: clientsByPriority.map((item) => ({
        priority: item.priority,
        count: item._count,
      })),
      todosByStatus: todosByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      todosByTool: todosByTool.map((item) => ({
        tool: item.tool,
        count: item._count,
      })),
      todosByAction: todosByAction.map((item) => ({
        action: item.actionType,
        count: item._count,
      })),
      tasksByStatus: tasksByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      tasksByPriority: tasksByPriority.map((item) => ({
        priority: item.priority,
        count: item._count,
      })),
      activityByUser: activityByUser.map((item) => ({
        userId: item.userId,
        action: item.action,
        count: item._count,
      })),
      logsByLevel: logsByLevel.map((item) => ({
        level: item.level,
        count: item._count,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analytics' },
      { status: 500 }
    );
  }
}
