import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH - Restaurer un client soft-deleted (admin uniquement)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    
    // Résoudre l'ID (slug ou numérique)
    let clientId: number;
    const numericId = parseInt(idParam);
    
    if (!isNaN(numericId)) {
      clientId = numericId;
    } else {
      // C'est un slug, trouver le client correspondant
      const client = await prisma.newClient.findUnique({
        where: { slug: idParam },
        select: { id: true }
      });
      
      if (!client) {
        return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
      }
      
      clientId = client.id;
    }

    // TODO: Vérifier que l'utilisateur est admin

    const client = await prisma.newClient.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    if (!client.deletedAt) {
      return NextResponse.json(
        { error: 'Ce client n\'est pas supprimé' },
        { status: 400 }
      );
    }

    // Restaurer le client en mettant deletedAt à null
    const updateData: any = { deletedAt: null };
    
    // Restaurer le slug original si nécessaire
    if (client.slug) {
      const deletedSuffix = `_deleted_${clientId}`;
      if (client.slug.endsWith(deletedSuffix)) {
        const originalSlug = client.slug.slice(0, -deletedSuffix.length);
        
        // Vérifier si le slug original est disponible
        const existingClient = await prisma.newClient.findUnique({
          where: { slug: originalSlug }
        });
        
        if (!existingClient) {
          updateData.slug = originalSlug;
        }
        // Sinon, garder le slug actuel avec le suffixe
      }
    }
    
    const restoredClient = await prisma.newClient.update({
      where: { id: clientId },
      data: updateData,
    });

    // TODO: Enregistrer dans l'historique la restauration

    return NextResponse.json(restoredClient);
  } catch (error) {
    console.error('Error restoring client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la restauration du client' },
      { status: 500 }
    );
  }
}
