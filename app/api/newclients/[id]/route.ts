import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    
    // Essayer d'abord de trouver par slug, sinon par ID numérique
    let newClient;
    const numericId = parseInt(idParam);
    
    if (!isNaN(numericId)) {
      // Si c'est un nombre, chercher par ID
      newClient = await prisma.newClient.findUnique({
        where: { id: numericId },
        include: {
          contactIdentifiers: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          searches: {
            include: {
              search: true
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Sinon, chercher par slug
      newClient = await prisma.newClient.findUnique({
        where: { slug: idParam },
        include: {
          contactIdentifiers: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          searches: {
            include: {
              search: true
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }

    if (!newClient) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    // Transformer les données pour le format attendu
    const clientData = {
      ...newClient,
      searches: newClient.searches.map(sc => sc.search)
    };

    return NextResponse.json(clientData);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération du client' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;

    const body = await request.json();
    const {
      nickname,
      surname,
      firstName,
      description,
      requestor,
      priority,
      externalHelp,
      generalReference,
      detailedReference,
      searchStartDate,
      searchEndDate,
      contactIdentifiers = [],
    } = body;

    // Validation: vérifier que la date de début n'est pas après la date de fin
    if (searchStartDate && searchEndDate) {
      const start = new Date(searchStartDate);
      const end = new Date(searchEndDate);
      if (start > end) {
        return NextResponse.json(
          { error: 'La date de début ne peut pas être après la date de fin' },
          { status: 400 }
        );
      }
    }

    // Récupérer l'ancien client pour comparer les changements (accepter ID numérique ou slug)
    const numericId = parseInt(idParam);
    let oldClient;
    
    if (!isNaN(numericId)) {
      // Si c'est un nombre, chercher par ID
      oldClient = await prisma.newClient.findUnique({
        where: { id: numericId },
        include: { 
          contactIdentifiers: true,
          searches: {
            include: {
              search: true,
            },
          },
        },
      });
    } else {
      // Sinon, chercher par slug
      oldClient = await prisma.newClient.findUnique({
        where: { slug: idParam },
        include: { 
          contactIdentifiers: true,
          searches: {
            include: {
              search: true,
            },
          },
        },
      });
    }

    if (!oldClient) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }
    
    // Utiliser l'ID réel du client trouvé
    const id = oldClient.id;

    // Pour l'instant, on utilise userId optionnel
    // TODO: Récupérer l'utilisateur connecté depuis la session
    const userId = null;

    // Variable pour stocker les warnings
    let detectedWarnings: any[] | null = null;

    // Vérifier si des numéros de compte existent déjà avec le même type (sauf ceux du client actuel)
    if (contactIdentifiers && contactIdentifiers.length > 0) {
      const accountsToCheck = contactIdentifiers
        .map((c: any) => ({ accountNumber: c.accountNumber, accountType: c.accountType }))
        .filter((c: any) => c.accountNumber);
      
      if (accountsToCheck.length > 0) {
        // Vérifier les doublons DANS la liste même
        const seen = new Map<string, boolean>();
        for (const contact of accountsToCheck) {
          const key = `${contact.accountNumber}|${contact.accountType}`;
          if (seen.has(key)) {
            return NextResponse.json(
              { 
                error: `Le numéro "${contact.accountNumber}" avec le type "${contact.accountType}" apparaît plusieurs fois dans votre formulaire`
              },
              { status: 400 }
            );
          }
          seen.set(key, true);
        }

        // Chercher les doublons exacts (même numéro + même type) chez d'autres clients
        const existingExact = await prisma.contactIdentifier.findMany({
          where: {
            OR: accountsToCheck.map((c: any) => ({
              accountNumber: c.accountNumber,
              accountType: c.accountType,
            })),
            newClientId: { not: id } // Exclure les contacts du client actuel
          },
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
        });
        
        if (existingExact.length > 0) {
          const duplicates = existingExact.map(c => ({
            accountNumber: c.accountNumber,
            accountType: c.accountType,
            client: c.newClient.nickname || c.newClient.surname || c.newClient.firstName || `Client #${c.newClient.id}`
          }));
          return NextResponse.json(
            { 
              error: 'Certains numéros de compte avec le même type existent déjà dans la base de données',
              duplicates
            },
            { status: 409 }
          );
        }

        // Chercher les warnings (même numéro mais type différent)
        const accountNumbers = accountsToCheck.map((c: any) => c.accountNumber);
        const existingDifferent = await prisma.contactIdentifier.findMany({
          where: {
            accountNumber: { in: accountNumbers },
            newClientId: { not: id },
            NOT: {
              OR: accountsToCheck.map((c: any) => ({
                accountNumber: c.accountNumber,
                accountType: c.accountType,
              })),
            }
          },
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
        });

        detectedWarnings = existingDifferent.length > 0 
          ? existingDifferent.map(c => ({
              accountNumber: c.accountNumber,
              accountType: c.accountType,
              client: c.newClient.nickname || c.newClient.surname || c.newClient.firstName || `Client #${c.newClient.id}`
            }))
          : null;
      }
    }

    // Mettre à jour le client et ses contacts dans une transaction
    const updatedClient = await prisma.$transaction(async (tx) => {
      // Supprimer les anciens contacts AVANT de créer les nouveaux
      await tx.contactIdentifier.deleteMany({
        where: { newClientId: id },
      });

      // Supprimer les anciens liens SearchClient pour ce client
      await tx.searchClient.deleteMany({
        where: { newClientId: id },
      });

      // Mettre à jour le client d'abord
      const updated = await tx.newClient.update({
        where: { id },
        data: {
          nickname: nickname || null,
          surname: surname || null,
          firstName: firstName || null,
          description: description || null,
          requestor: requestor || null,
          priority: priority || 'Moyenne',
          externalHelp: externalHelp || false,
        },
      });

      // Créer les nouveaux contacts séparément avec position
      if (contactIdentifiers && contactIdentifiers.length > 0) {
        await tx.contactIdentifier.createMany({
          data: contactIdentifiers.map((contact: any, index: number) => ({
            newClientId: id,
            accountNumber: contact.accountNumber,
            accountType: contact.accountType,
            info: contact.info || null,
            position: index + 1,
          })),
        });
      }

      // Créer ou lier la recherche
      if (generalReference || detailedReference || searchStartDate || searchEndDate) {
        // Vérifier si une recherche avec ces références existe déjà
        let search = await tx.search.findFirst({
          where: {
            generalReference: generalReference || null,
            detailedReference: detailedReference || null,
          },
        });

        // Si la recherche n'existe pas, la créer
        if (!search) {
          search = await tx.search.create({
            data: {
              generalReference: generalReference || null,
              detailedReference: detailedReference || null,
              startDate: searchStartDate ? new Date(searchStartDate) : null,
              endDate: searchEndDate ? new Date(searchEndDate) : null,
            },
          });
        }

        // Créer le lien SearchClient
        await tx.searchClient.create({
          data: {
            searchId: search.id,
            newClientId: id,
          },
        });
      }

      // Récupérer le client mis à jour avec ses relations
      const updatedData = await tx.newClient.findUnique({
        where: { id },
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
      });

      // Enregistrer les changements dans l'historique seulement si userId existe
      if (userId) {
        const changes: any = {};
        if (oldClient.nickname !== (nickname || null)) changes.nickname = { old: oldClient.nickname, new: nickname || null };
      if (oldClient.surname !== (surname || null)) changes.surname = { old: oldClient.surname, new: surname || null };
      if (oldClient.firstName !== (firstName || null)) changes.firstName = { old: oldClient.firstName, new: firstName || null };
      if (oldClient.description !== (description || null)) changes.description = { old: oldClient.description, new: description || null };
      if (oldClient.requestor !== (requestor || null)) changes.requestor = { old: oldClient.requestor, new: requestor || null };
      if (oldClient.priority !== (priority || 'Moyenne')) changes.priority = { old: oldClient.priority, new: priority || 'Moyenne' };
      if (oldClient.externalHelp !== (externalHelp || false)) changes.externalHelp = { old: oldClient.externalHelp, new: externalHelp || false };
      
      // Comparer les recherches
      const oldSearchLink = oldClient.searches[0];
      const oldSearch = oldSearchLink?.search;
      const newSearch = {
        generalReference: generalReference || null,
        detailedReference: detailedReference || null,
        startDate: searchStartDate || null,
        endDate: searchEndDate || null,
      };
      
      if (oldSearch) {
        if (oldSearch.generalReference !== newSearch.generalReference) {
          changes.generalReference = { old: oldSearch.generalReference, new: newSearch.generalReference };
        }
        if (oldSearch.detailedReference !== newSearch.detailedReference) {
          changes.detailedReference = { old: oldSearch.detailedReference, new: newSearch.detailedReference };
        }
        const oldStartDate = oldSearch.startDate?.toISOString();
        const newStartDate = newSearch.startDate ? new Date(newSearch.startDate).toISOString() : null;
        if (oldStartDate !== newStartDate) {
          changes.searchStartDate = { old: oldStartDate, new: newStartDate };
        }
        const oldEndDate = oldSearch.endDate?.toISOString();
        const newEndDate = newSearch.endDate ? new Date(newSearch.endDate).toISOString() : null;
        if (oldEndDate !== newEndDate) {
          changes.searchEndDate = { old: oldEndDate, new: newEndDate };
        }
      }

      // Comparer les identifiants de contact
      const oldContacts = oldClient.contactIdentifiers.map(c => ({
        accountNumber: c.accountNumber,
        accountType: c.accountType,
        info: c.info,
      }));
      
      const newContacts = contactIdentifiers.map((c: any) => ({
        accountNumber: c.accountNumber,
        accountType: c.accountType,
        info: c.info || null,
      }));

      // Vérifier si les contacts ont vraiment changé
      const contactsChanged = JSON.stringify(oldContacts) !== JSON.stringify(newContacts);
      
      if (contactsChanged) {
        changes.contactIdentifiers = {
          old: oldContacts,
          new: newContacts,
        };
      }

      // N'enregistrer dans l'historique que s'il y a des changements
      if (Object.keys(changes).length > 0) {
        await tx.clientHistory.create({
          data: {
            newClientId: id,
            userId,
            action: 'UPDATE',
            changes: JSON.stringify(changes),
          },
        });
      }
      }

      return updatedData;
    });

    // Inclure les warnings dans la réponse si présents
    const response: any = { ...updatedClient };
    if (detectedWarnings && detectedWarnings.length > 0) {
      response.warnings = detectedWarnings;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating client:', error);
    
    // Gérer l'erreur de contrainte unique Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un ou plusieurs numéros de compte avec le même type existent déjà dans la base de données' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: 'Erreur lors de la modification du client' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;

    // Vérifier si c'est une suppression permanente (admin uniquement)
    const url = new URL(request.url);
    const permanent = url.searchParams.get('permanent') === 'true';

    // Pour l'instant, on utilise l'utilisateur ID 1 par défaut
    // TODO: Récupérer l'utilisateur connecté depuis la session
    const userId = 1;

    // Résoudre l'ID (slug ou numérique) et récupérer les données du client
    const numericId = parseInt(idParam);
    let client;
    
    if (!isNaN(numericId)) {
      // Si c'est un nombre, chercher par ID
      client = await prisma.newClient.findUnique({
        where: { id: numericId },
        include: { contactIdentifiers: true },
      });
    } else {
      // Sinon, chercher par slug
      client = await prisma.newClient.findUnique({
        where: { slug: idParam },
        include: { contactIdentifiers: true },
      });
    }

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }
    
    // Utiliser l'ID réel du client trouvé
    const id = client.id;

    if (permanent) {
      // Suppression permanente (hard delete) - admin uniquement
      // TODO: Vérifier que l'utilisateur est admin
      
      // Enregistrer la suppression dans l'historique avant de supprimer
      await prisma.clientHistory.create({
        data: {
          newClientId: id,
          userId,
          action: 'DELETE_PERMANENT',
          changes: JSON.stringify(client),
        },
      });

      await prisma.newClient.delete({
        where: { id },
      });

      return NextResponse.json({ success: true, permanent: true });
    } else {
      // Soft delete (utilisateurs normaux)
      await prisma.$transaction(async (tx) => {
        // Enregistrer la suppression dans l'historique
        await tx.clientHistory.create({
          data: {
            newClientId: id,
            userId,
            action: 'DELETE',
            changes: JSON.stringify(client),
          },
        });

        // Modifier le slug pour libérer le nickname et marquer comme supprimé
        const updateData: any = { deletedAt: new Date() };
        if (client.slug) {
          updateData.slug = `${client.slug}_deleted_${id}`;
        }

        await tx.newClient.update({
          where: { id },
          data: updateData,
        });
      });

      return NextResponse.json({ success: true, permanent: false });
    }
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du client' }, { status: 500 });
  }
}
