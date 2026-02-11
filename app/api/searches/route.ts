import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/searches - Récupérer toutes les recherches
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

    // Récupérer toutes les recherches avec leurs clients liés
    const searchClients = await prisma.searchClient.findMany({
      include: {
        search: true,
        newClient: {
          select: {
            id: true,
            firstName: true,
            surname: true,
            nickname: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformer les données pour le format attendu par le frontend
    const searches = searchClients.map(sc => ({
      ...sc.search,
      newClientId: sc.newClientId,
      newClient: sc.newClient
    }));

    return NextResponse.json({ searches });
  } catch (error: any) {
    console.error('Erreur GET /api/searches:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/searches - Mettre à jour une recherche
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
    const { id, generalReference, detailedReference, startDate, endDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Validation: vérifier que la date de début n'est pas après la date de fin
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return NextResponse.json(
          { error: 'La date de début ne peut pas être après la date de fin' },
          { status: 400 }
        );
      }
    }

    const search = await prisma.search.update({
      where: { id },
      data: {
        generalReference,
        detailedReference,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      }
    });

    return NextResponse.json({ search });
  } catch (error: any) {
    console.error('Erreur PUT /api/searches:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/searches - Supprimer une recherche
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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await prisma.search.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur DELETE /api/searches:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
