import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/saved-filters - Récupérer tous les filtres sauvegardés de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const filters = await prisma.savedFilter.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(filters);
  } catch (error) {
    console.error('Erreur lors de la récupération des filtres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des filtres' },
      { status: 500 }
    );
  }
}

// POST /api/saved-filters - Créer un nouveau filtre sauvegardé
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { name, filters } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom du filtre est requis' },
        { status: 400 }
      );
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        name: name.trim(),
        filters: JSON.stringify(filters),
        userId: decoded.userId
      }
    });

    return NextResponse.json(savedFilter, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du filtre:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde du filtre' },
      { status: 500 }
    );
  }
}
