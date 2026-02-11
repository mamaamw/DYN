import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    // Calculate date filter
    let dateFilter: { gte?: Date } = {};
    const now = new Date();
    
    if (period === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: startOfToday };
    } else if (period === 'yesterday') {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      dateFilter = { gte: startOfYesterday };
    } else if (period === '7d') {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      dateFilter = { gte: date };
    } else if (period === '30d') {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      dateFilter = { gte: date };
    } else if (period === 'currentMonth') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { gte: startOfMonth };
    } else if (period === 'lastMonth') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateFilter = { gte: startOfLastMonth };
    }

    // Get all projects
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    const activeProjects = projects.filter(p => p.status === 'active').length;

    // Get all wallets
    const wallets = await prisma.wallet.findMany({
      include: {
        expenses: {
          where: period !== 'all' ? { date: dateFilter } : {},
        },
      },
    });

    const totalBudget = wallets.reduce((sum, w) => sum + w.amount, 0);

    // Get expenses with filters
    const expenses = await prisma.expense.findMany({
      where: period !== 'all' ? { date: dateFilter } : {},
      include: {
        project: {
          select: { name: true },
        },
        wallet: {
          select: { currency: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRemaining = totalBudget - totalExpenses;

    // Expenses by type
    const expensesByType: { [key: string]: { total: number; count: number } } = {};
    expenses.forEach(exp => {
      if (!expensesByType[exp.type]) {
        expensesByType[exp.type] = { total: 0, count: 0 };
      }
      expensesByType[exp.type].total += exp.amount;
      expensesByType[exp.type].count += 1;
    });

    // Expenses by project
    const expensesByProject: { [key: string]: { total: number; count: number } } = {};
    expenses.forEach(exp => {
      const projectName = exp.project.name;
      if (!expensesByProject[projectName]) {
        expensesByProject[projectName] = { total: 0, count: 0 };
      }
      expensesByProject[projectName].total += exp.amount;
      expensesByProject[projectName].count += 1;
    });

    // Expenses by month
    const expensesByMonth: { [key: string]: { total: number; count: number } } = {};
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthKey = `${date.toLocaleDateString('fr-FR', { month: 'short' })} ${date.getFullYear()}`;
      if (!expensesByMonth[monthKey]) {
        expensesByMonth[monthKey] = { total: 0, count: 0 };
      }
      expensesByMonth[monthKey].total += exp.amount;
      expensesByMonth[monthKey].count += 1;
    });

    // Top wallets
    const walletsWithRemaining = wallets.map(w => {
      const totalExpenses = w.expenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        name: w.name,
        amount: w.amount,
        remaining: w.amount - totalExpenses,
        currency: w.currency,
      };
    });

    const topWallets = walletsWithRemaining
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Recent expenses
    const recentExpenses = expenses.slice(0, 10).map(exp => ({
      name: exp.name,
      amount: exp.amount,
      currency: exp.wallet.currency || 'BTC',
      date: exp.date,
      projectName: exp.project.name,
    }));

    const analytics = {
      totalProjects: projects.length,
      activeProjects,
      totalWallets: wallets.length,
      totalBudget,
      totalExpenses,
      totalRemaining,
      expensesByType: Object.entries(expensesByType).map(([type, data]) => ({
        type,
        total: data.total,
        count: data.count,
      })),
      expensesByProject: Object.entries(expensesByProject)
        .map(([projectName, data]) => ({
          projectName,
          total: data.total,
          count: data.count,
        }))
        .sort((a, b) => b.total - a.total),
      expensesByMonth: Object.entries(expensesByMonth)
        .map(([month, data]) => ({
          month,
          total: data.total,
          count: data.count,
        }))
        .reverse()
        .slice(0, 6),
      topWallets,
      recentExpenses,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des analytics' }, { status: 500 });
  }
}
