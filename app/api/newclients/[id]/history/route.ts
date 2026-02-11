import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
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

    const history = await prisma.clientHistory.findMany({
      where: { newClientId: clientId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching client history:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération de l\'historique' }, { status: 500 });
  }
}
