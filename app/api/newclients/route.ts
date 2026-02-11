import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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

    // Récupérer le paramètre de recherche
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');

    // Récupérer l'utilisateur pour vérifier son rôle
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    let whereCondition: any = {
      deletedAt: null,
    };

    // Ajouter les conditions de recherche
    if (searchQuery) {
      const orConditions: any[] = [
        { nickname: { contains: searchQuery, mode: 'insensitive' } },
        { surname: { contains: searchQuery, mode: 'insensitive' } },
        { firstName: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { requestor: { contains: searchQuery, mode: 'insensitive' } },
        { 
          contactIdentifiers: {
            some: {
              accountNumber: { contains: searchQuery, mode: 'insensitive' }
            }
          }
        }
      ];

      // Détection du format customId (YY-ClientID-ContactPosition)
      const customIdMatch = searchQuery.match(/^(\d{2})-(\d+)-(\d+)$/);
      if (customIdMatch) {
        const [, , clientId, position] = customIdMatch;
        orConditions.push(
          {
            AND: [
              { id: parseInt(clientId) },
              { 
                contactIdentifiers: {
                  some: {
                    position: parseInt(position)
                  }
                }
              }
            ]
          }
        );
      }

      whereCondition.OR = orConditions;
    }

    // Les administrateurs voient tous les clients
    if (user?.role !== 'ADMIN') {
      // Pour les utilisateurs normaux, filtrer par catégories
      const userCategories = await prisma.userCategory.findMany({
        where: { userId: payload.userId },
        select: { categoryId: true }
      });

      const categoryIds = userCategories.map(uc => uc.categoryId);

      // Si l'utilisateur n'a aucune catégorie, il ne voit aucun client
      if (categoryIds.length === 0) {
        return NextResponse.json([]);
      }

      whereCondition.categories = {
        some: {
          categoryId: {
            in: categoryIds
          }
        }
      };
    }

    // Récupérer les clients
    const newClients = await prisma.newClient.findMany({
      where: whereCondition,
      include: {
        contactIdentifiers: true,
        searches: {
          include: {
            search: true,
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
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformer les données pour retourner searches comme un tableau de Search
    const transformedClients = newClients.map(client => ({
      ...client,
      searches: client.searches.map(sc => sc.search),
    }));

    return NextResponse.json(transformedClients);
  } catch (error) {
    console.error('Error fetching new clients:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'utilisateur authentifié
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const userId = payload.userId;

    // Récupérer l'utilisateur pour vérifier son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Récupérer les catégories de l'utilisateur
    const userCategories = await prisma.userCategory.findMany({
      where: { userId },
      select: { categoryId: true }
    });

    // Si l'utilisateur n'est pas admin et n'a aucune catégorie, impossible de créer un client
    if (user?.role !== 'ADMIN' && userCategories.length === 0) {
      return NextResponse.json(
        { error: 'Vous devez être assigné à au moins une catégorie pour créer un client' },
        { status: 403 }
      );
    }

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
      categoryIds = [],
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

    // Variable pour stocker les warnings
    let detectedWarnings: any[] | null = null;

    // Vérifier si des numéros de compte existent déjà avec le même type
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

        // Chercher les doublons exacts (même numéro + même type)
        const existingExact = await prisma.contactIdentifier.findMany({
          where: {
            OR: accountsToCheck.map((c: any) => ({
              accountNumber: c.accountNumber,
              accountType: c.accountType,
            })),
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

    // Vérifier si une recherche identique existe déjà (si des données de recherche sont fournies)
    if ((generalReference || detailedReference) && !body.linkToExisting) {
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

      if (existingSearch) {
        // Retourner les informations pour validation
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
          },
          // Renvoyer les données du formulaire pour pouvoir recréer la requête
          formData: {
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
            contactIdentifiers,
            categoryIds
          }
        });
      }
    }

    // Créer le client et la recherche en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Générer un slug unique
      const name = nickname || `${surname || ''} ${firstName || ''}`.trim() || 'client';
      const baseSlug = name
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      
      let slug = baseSlug;
      let counter = 1;
      
      // Vérifier l'unicité
      while (true) {
        const existing = await tx.newClient.findUnique({
          where: { slug }
        });
        
        if (!existing) break;
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      // 1. Créer le client
      const newClient = await tx.newClient.create({
        data: {
          slug,
          nickname: nickname || null,
          surname: surname || null,
          firstName: firstName || null,
          description: description || null,
          requestor: requestor || null,
          priority: priority || 'Moyenne',
          externalHelp: externalHelp || false,
          userId,
          contactIdentifiers: {
            create: contactIdentifiers.map((contact: any, index: number) => ({
              accountNumber: contact.accountNumber,
              accountType: contact.accountType,
              info: contact.info || null,
              position: index + 1,
            })),
          },
          categories: {
            create: userCategories.map(uc => ({
              categoryId: uc.categoryId
            }))
          }
        },
        include: {
          contactIdentifiers: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          categories: {
            include: {
              category: true
            }
          }
        },
      });

      // 2. Créer la recherche si des données sont fournies
      if (generalReference || detailedReference || searchStartDate || searchEndDate) {
        // Vérifier si une recherche identique existe déjà
        const existingSearch = await tx.search.findUnique({
          where: {
            generalReference_detailedReference: {
              generalReference: generalReference || null,
              detailedReference: detailedReference || null,
            },
          },
        });

        let search;
        if (existingSearch) {
          // Utiliser la recherche existante
          search = existingSearch;
        } else {
          // Créer une nouvelle recherche
          search = await tx.search.create({
            data: {
              generalReference: generalReference || null,
              detailedReference: detailedReference || null,
              startDate: searchStartDate ? new Date(searchStartDate) : null,
              endDate: searchEndDate ? new Date(searchEndDate) : null,
            },
          });
        }

        // 3. Créer le lien SearchClient
        await tx.searchClient.create({
          data: {
            searchId: search.id,
            newClientId: newClient.id
          }
        });

        // 4. Récupérer les recherches pour le client
        const searchClients = await tx.searchClient.findMany({
          where: { newClientId: newClient.id },
          include: { search: true },
          orderBy: { createdAt: 'desc' }
        });

        return {
          ...newClient,
          searches: searchClients.map(sc => sc.search)
        };
      }

      return {
        ...newClient,
        searches: []
      };
    });

    const newClient = result;


    // Enregistrer la création dans l'historique (seulement si userId existe)
    if (userId) {
      await prisma.clientHistory.create({
        data: {
          newClientId: newClient.id,
          userId,
          action: 'CREATE',
          changes: JSON.stringify({
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
            contactIdentifiers,
          }),
        },
      });
    }

    // Inclure les warnings dans la réponse si présents
    const response: any = { ...newClient };
    if (detectedWarnings && detectedWarnings.length > 0) {
      response.warnings = detectedWarnings;
    }
    
    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating new client:', error);
    
    // Gérer l'erreur de contrainte unique Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un ou plusieurs numéros de compte avec le même type existent déjà dans la base de données' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du client' },
      { status: 500 }
    );
  }
}
