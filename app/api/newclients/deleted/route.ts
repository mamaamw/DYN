import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer tous les clients soft-deleted (admin uniquement)
export async function GET() {
  try {
    // TODO: Vérifier que l'utilisateur est admin
    
    const deletedClients = await prisma.newClient.findMany({
      where: {
        deletedAt: { not: null }, // Uniquement les clients soft-deleted
      },
      include: {
        contactIdentifiers: true,
        searches: true,
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
        deletedAt: 'desc', // Les plus récemment supprimés en premier
      },
    });

    return NextResponse.json(deletedClients);
  } catch (error) {
    console.error('Error fetching deleted clients:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clients supprimés' },
      { status: 500 }
    );
  }
}
