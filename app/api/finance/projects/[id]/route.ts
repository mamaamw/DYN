import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);

    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        deletedAt: null,
      },
      include: {
        expenses: {
          include: {
            wallet: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
        _count: {
          select: {
            wallets: true,
            expenses: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    // Récupérer tous les wallets liés au projet (directement ou via les dépenses)
    const walletIds = [...new Set(project.expenses.map(e => e.walletId))];
    const wallets = await prisma.wallet.findMany({
      where: {
        OR: [
          { projectId: projectId },
          { id: { in: walletIds } }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      ...project,
      wallets,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération du projet' }, { status: 500 });
  }
}
