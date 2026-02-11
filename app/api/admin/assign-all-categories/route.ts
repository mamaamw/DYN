import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Endpoint pour assigner toutes les catégories à tous les utilisateurs
// À utiliser une seule fois après déploiement
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin uniquement' }, { status: 403 });
    }

    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true }
    });

    // Récupérer toutes les catégories
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, label: true }
    });

    let assigned = 0;
    let skipped = 0;

    // Assigner toutes les catégories à tous les utilisateurs
    for (const user of users) {
      for (const category of categories) {
        // Vérifier si l'assignation existe déjà
        const existing = await prisma.userCategory.findFirst({
          where: {
            userId: user.id,
            categoryId: category.id
          }
        });

        if (!existing) {
          await prisma.userCategory.create({
            data: {
              userId: user.id,
              categoryId: category.id
            }
          });
          assigned++;
        } else {
          skipped++;
        }
      }
    }

    // Récupérer le résumé final
    const summary = [];
    for (const user of users) {
      const userCats = await prisma.userCategory.findMany({
        where: { userId: user.id },
        include: { category: true }
      });
      summary.push({
        username: user.username || user.email,
        categories: userCats.map(uc => uc.category.label)
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Catégories assignées avec succès',
      stats: {
        users: users.length,
        categories: categories.length,
        assigned,
        skipped
      },
      summary
    });

  } catch (error) {
    console.error('Error assigning categories:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'assignation des catégories',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
