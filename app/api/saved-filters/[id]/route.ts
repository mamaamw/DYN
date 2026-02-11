import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// DELETE /api/saved-filters/[id] - Supprimer un filtre sauvegardé
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { id } = await params;
    const filterId = parseInt(id, 10);

    if (isNaN(filterId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Vérifier que le filtre appartient bien à l'utilisateur
    const filter = await prisma.savedFilter.findUnique({
      where: { id: filterId }
    });

    if (!filter) {
      return NextResponse.json({ error: 'Filtre non trouvé' }, { status: 404 });
    }

    if (filter.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas la permission de supprimer ce filtre' },
        { status: 403 }
      );
    }

    await prisma.savedFilter.delete({
      where: { id: filterId }
    });

    return NextResponse.json({ message: 'Filtre supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du filtre:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du filtre' },
      { status: 500 }
    );
  }
}
