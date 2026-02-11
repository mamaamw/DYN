import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les catégories du rôle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleCategories = await (prisma as any).roleCategory.findMany({
      where: { roleName: name },
      include: {
        category: true
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories = roleCategories.map((rc: any) => rc.category);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories du rôle:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { categoryNames } = body;

    if (!Array.isArray(categoryNames)) {
      return NextResponse.json(
        { error: 'categoryNames doit être un tableau' },
        { status: 400 }
      );
    }

    // Supprimer les associations existantes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).roleCategory.deleteMany({
      where: { roleName: name }
    });

    // Récupérer les catégories pour les noms fournis
    const selectedCategories = await prisma.category.findMany({
      where: {
        name: {
          in: categoryNames
        }
      }
    });

    // Créer les nouvelles associations
    if (selectedCategories.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).roleCategory.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: selectedCategories.map((cat: any) => ({
          roleName: name,
          categoryId: cat.id
        }))
      });
    }

    return NextResponse.json({ categories: selectedCategories });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des catégories du rôle:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
