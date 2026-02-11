import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id]/categories - Get user categories
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);

    // Permettre à un utilisateur de récupérer ses propres catégories ou si c'est un admin
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (decoded.userId !== userId && (!currentUser || currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    const userCategories = await prisma.userCategory.findMany({
      where: { userId },
      include: {
        category: true,
      },
    });

    const categories = userCategories.map(uc => uc.category);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching user categories:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/users/[id]/categories - Assign categories to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Administrateur requis' }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { categoryNames } = body;

    if (!Array.isArray(categoryNames)) {
      return NextResponse.json({ error: 'categoryNames doit être un tableau' }, { status: 400 });
    }

    // Get or create categories in database
    const categories = await Promise.all(
      categoryNames.map(async (name) => {
        let category = await prisma.category.findUnique({
          where: { name },
        });

        if (!category) {
          // Create category in database from JSON definition
          const { getCategories } = await import('@/lib/categories');
          const allCategories = getCategories();
          const categoryDef = allCategories.find(c => c.name === name);

          if (categoryDef) {
            category = await prisma.category.create({
              data: {
                name: categoryDef.name,
                label: categoryDef.label,
                description: categoryDef.description || '',
                color: categoryDef.color,
                icon: categoryDef.icon,
              },
            });
          }
        }

        return category;
      })
    );

    const validCategories = categories.filter(c => c !== null);

    // Delete existing assignments
    await prisma.userCategory.deleteMany({
      where: { userId },
    });

    // Create new assignments
    if (validCategories.length > 0) {
      await prisma.userCategory.createMany({
        data: validCategories.map(category => ({
          userId,
          categoryId: category!.id,
        })),
      });
    }

    // Return updated categories
    const userCategories = await prisma.userCategory.findMany({
      where: { userId },
      include: {
        category: true,
      },
    });

    const updatedCategories = userCategories.map(uc => uc.category);

    return NextResponse.json({ success: true, categories: updatedCategories });
  } catch (error) {
    console.error('Error assigning categories:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
