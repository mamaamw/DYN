import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
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
    
    // Résoudre l'ID (slug ou numérique)
    let clientId: number;
    const numericId = parseInt(id);
    
    if (!isNaN(numericId)) {
      clientId = numericId;
    } else {
      // C'est un slug, trouver le client correspondant
      const client = await prisma.newClient.findUnique({
        where: { slug: id },
        select: { id: true }
      });
      
      if (!client) {
        return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
      }
      
      clientId = client.id;
    }
    
    const body = await request.json();
    const { generalReference, detailedReference, startDate, endDate, linkToExisting } = body;

    // Validation
    if (!generalReference) {
      return NextResponse.json(
        { error: 'La référence générale est obligatoire' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Les dates de début et de fin sont obligatoires' },
        { status: 400 }
      );
    }

    // Vérifier que la date de début n'est pas après la date de fin
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return NextResponse.json(
        { error: 'La date de début ne peut pas être après la date de fin' },
        { status: 400 }
      );
    }

    // Vérifier si une recherche identique existe déjà
    const existingSearch = await prisma.search.findUnique({
      where: {
        generalReference_detailedReference: {
          generalReference: generalReference || null,
          detailedReference: detailedReference || null,
        },
      },
      include: {
        clients: {
          include: {
            newClient: {
              select: {
                id: true,
                nickname: true,
                surname: true,
                firstName: true,
              }
            }
          }
        }
      }
    });

    let search;
    let action = 'NOUVELLE_RECHERCHE';
    let message = `Nouvelle recherche créée: ${generalReference}`;

    if (existingSearch && !linkToExisting) {
      // Retourner les informations sur la recherche existante pour validation
      return NextResponse.json({
        requiresValidation: true,
        existingSearch: {
          id: existingSearch.id,
          generalReference: existingSearch.generalReference,
          detailedReference: existingSearch.detailedReference,
          startDate: existingSearch.startDate,
          endDate: existingSearch.endDate,
          linkedClients: existingSearch.clients.map(sc => ({
            id: sc.newClient.id,
            name: sc.newClient.nickname || `${sc.newClient.firstName || ''} ${sc.newClient.surname || ''}`.trim() || 'Sans nom'
          }))
        }
      });
    } else if (existingSearch && linkToExisting) {
      // Vérifier si le lien existe déjà
      const existingLink = await prisma.searchClient.findUnique({
        where: {
          searchId_newClientId: {
            searchId: existingSearch.id,
            newClientId: clientId
          }
        }
      });

      if (existingLink) {
        return NextResponse.json(
          { error: 'Ce client est déjà lié à cette recherche' },
          { status: 400 }
        );
      }

      // Lier le client à la recherche existante
      await prisma.searchClient.create({
        data: {
          searchId: existingSearch.id,
          newClientId: clientId
        }
      });

      // Mettre à jour les dates si nécessaire
      await prisma.search.update({
        where: { id: existingSearch.id },
        data: {
          endDate: new Date(endDate),
          updatedAt: new Date()
        }
      });

      search = existingSearch;
      action = 'LIEN_RECHERCHE';
      message = `Client lié à une recherche existante: ${generalReference}`;
    } else {
      // Créer une nouvelle recherche
      search = await prisma.search.create({
        data: {
          generalReference,
          detailedReference,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      });

      // Créer le lien avec le client
      await prisma.searchClient.create({
        data: {
          searchId: search.id,
          newClientId: clientId
        }
      });
    }

    // Enregistrer dans l'historique
    await prisma.clientHistory.create({
      data: {
        newClientId: clientId,
        userId: payload.userId,
        action,
        changes: message,
      },
    });

    return NextResponse.json(search);
  } catch (error) {
    console.error('Error creating/linking search:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la recherche' },
      { status: 500 }
    );
  }
}

export async function GET(
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
    
    // Résoudre l'ID (slug ou numérique)
    let clientId: number;
    const numericId = parseInt(id);
    
    if (!isNaN(numericId)) {
      clientId = numericId;
    } else {
      // C'est un slug, trouver le client correspondant
      const client = await prisma.newClient.findUnique({
        where: { slug: id },
        select: { id: true }
      });
      
      if (!client) {
        return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
      }
      
      clientId = client.id;
    }

    // Récupérer toutes les recherches liées au client via SearchClient
    const searchClients = await prisma.searchClient.findMany({
      where: {
        newClientId: clientId,
      },
      include: {
        search: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformer pour retourner les objets Search directement
    const searches = searchClients.map(sc => sc.search);

    return NextResponse.json(searches);
  } catch (error) {
    console.error('Error fetching searches:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des recherches' },
      { status: 500 }
    );
  }
}
