import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
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
    const searchId = parseInt(id);
    const body = await request.json();
    const { endDate, newClientId } = body;

    // Validation
    if (!endDate) {
      return NextResponse.json(
        { error: 'La date de fin est obligatoire' },
        { status: 400 }
      );
    }

    if (!newClientId) {
      return NextResponse.json(
        { error: 'L\'ID du client est obligatoire' },
        { status: 400 }
      );
    }

    // Récupérer la recherche existante
    const existingSearch = await prisma.search.findUnique({
      where: { id: searchId },
    });

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Recherche non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la date de fin
    const updatedSearch = await prisma.search.update({
      where: { id: searchId },
      data: {
        endDate: new Date(endDate),
      },
    });

    // Enregistrer dans l'historique
    await prisma.clientHistory.create({
      data: {
        newClientId: newClientId,
        userId: payload.userId,
        action: 'PROLONGATION_RECHERCHE',
        changes: `Date de fin prolongée jusqu'au ${new Date(endDate).toLocaleDateString('fr-FR')}`,
      },
    });

    return NextResponse.json(updatedSearch);
  } catch (error) {
    console.error('Error updating search:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la recherche' },
      { status: 500 }
    );
  }
}
