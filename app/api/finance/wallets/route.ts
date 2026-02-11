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

    const wallets = await prisma.wallet.findMany({
      include: {
        project: true,
        expenses: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculer le montant restant pour chaque portefeuille
    const walletsWithBalance = wallets.map(wallet => {
      const totalExpenses = wallet.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        ...wallet,
        remaining: wallet.amount - totalExpenses,
        totalExpenses,
      };
    });

    return NextResponse.json(walletsWithBalance);
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des portefeuilles' }, { status: 500 });
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
    const { name, description, amount, currency, projectId } = body;

    if (!name || amount === undefined) {
      return NextResponse.json({ error: 'Nom et montant requis' }, { status: 400 });
    }

    const wallet = await prisma.wallet.create({
      data: {
        name,
        description,
        amount: parseFloat(amount),
        currency: currency || 'BTC',
        projectId: projectId ? parseInt(projectId) : null,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du portefeuille' }, { status: 500 });
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
    const { id, name, description, amount, currency, projectId } = body;

    if (!id || !name || amount === undefined) {
      return NextResponse.json({ error: 'ID, nom et montant requis' }, { status: 400 });
    }

    const wallet = await prisma.wallet.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        amount: parseFloat(amount),
        currency: currency || 'BTC',
        projectId: projectId ? parseInt(projectId) : null,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error updating wallet:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification du portefeuille' }, { status: 500 });
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

    // Vérifier qu'il n'y a pas de dépenses associées
    const expenses = await prisma.expense.findMany({
      where: { walletId: parseInt(id) },
    });

    if (expenses.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un portefeuille avec des dépenses associées' },
        { status: 400 }
      );
    }

    await prisma.wallet.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wallet:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du portefeuille' }, { status: 500 });
  }
}
