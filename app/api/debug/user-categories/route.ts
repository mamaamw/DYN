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

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    // Récupérer les catégories de l'utilisateur
    const userCategories = await prisma.userCategory.findMany({
      where: { userId: payload.userId },
      include: { category: true }
    });

    // Récupérer toutes les catégories disponibles
    const allCategories = await prisma.category.findMany();

    return NextResponse.json({
      user,
      assignedCategories: userCategories.map(uc => ({
        id: uc.categoryId,
        name: uc.category.name,
        label: uc.category.label,
        icon: uc.category.icon
      })),
      totalAssigned: userCategories.length,
      allCategories: allCategories.map(c => ({
        id: c.id,
        name: c.name,
        label: c.label,
        icon: c.icon
      })),
      totalAvailable: allCategories.length,
      canCreateClients: userCategories.length > 0
    });

  } catch (error) {
    console.error('Error checking user categories:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la vérification des catégories',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
