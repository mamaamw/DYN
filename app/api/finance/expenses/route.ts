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
    const projectId = searchParams.get('projectId');
    const walletId = searchParams.get('walletId');

    const whereCondition: any = {};
    if (projectId) whereCondition.projectId = parseInt(projectId);
    if (walletId) whereCondition.walletId = parseInt(walletId);

    const expenses = await prisma.expense.findMany({
      where: whereCondition,
      include: {
        project: true,
        wallet: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des dépenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, amount, currency, type, date, projectId, walletId } = body;

    if (!name || !amount || !type || !date || !projectId || !walletId) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    // Vérifier que le portefeuille a assez de fonds
    const wallet = await prisma.wallet.findUnique({
      where: { id: parseInt(walletId) },
      include: {
        expenses: true,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Portefeuille non trouvé' }, { status: 404 });
    }

    const totalExpenses = wallet.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = wallet.amount - totalExpenses;

    if (remaining < parseFloat(amount)) {
      return NextResponse.json({ 
        error: `Fonds insuffisants. Disponible: ${remaining.toFixed(2)}€` 
      }, { status: 400 });
    }

    // Créer la dépense et associer le portefeuille au projet
    const [expense] = await prisma.$transaction([
      prisma.expense.create({
        data: {
          name,
          description,
          amount: parseFloat(amount),
          currency: currency || 'BTC',
          type,
          date: new Date(date),
          projectId: parseInt(projectId),
          walletId: parseInt(walletId),
        },
        include: {
          project: true,
          wallet: true,
        },
      }),
      // Associer automatiquement le portefeuille au projet
      prisma.wallet.update({
        where: { id: parseInt(walletId) },
        data: { projectId: parseInt(projectId) },
      }),
    ]);

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la dépense' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, amount, currency, type, date, projectId, walletId } = body;

    if (!id || !name || !amount || !type || !date || !projectId || !walletId) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    // Récupérer l'ancienne dépense
    const oldExpense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
    });

    if (!oldExpense) {
      return NextResponse.json({ error: 'Dépense non trouvée' }, { status: 404 });
    }

    // Vérifier que le portefeuille a assez de fonds (en comptant l'ancienne dépense)
    const wallet = await prisma.wallet.findUnique({
      where: { id: parseInt(walletId) },
      include: {
        expenses: true,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Portefeuille non trouvé' }, { status: 404 });
    }

    const totalExpenses = wallet.expenses
      .filter(exp => exp.id !== parseInt(id))
      .reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = wallet.amount - totalExpenses;

    if (remaining < parseFloat(amount)) {
      return NextResponse.json({ 
        error: `Fonds insuffisants. Disponible: ${remaining.toFixed(2)}` 
      }, { status: 400 });
    }

    // Mettre à jour la dépense et associer le portefeuille au projet
    const [expense] = await prisma.$transaction([
      prisma.expense.update({
        where: { id: parseInt(id) },
        data: {
          name,
          description,
          amount: parseFloat(amount),
          currency: currency || 'BTC',
          type,
          date: new Date(date),
          projectId: parseInt(projectId),
          walletId: parseInt(walletId),
        },
        include: {
          project: true,
          wallet: true,
        },
      }),
      // Associer automatiquement le portefeuille au projet
      prisma.wallet.update({
        where: { id: parseInt(walletId) },
        data: { projectId: parseInt(projectId) },
      }),
    ]);

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification de la dépense' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de la dépense' }, { status: 500 });
  }
}
