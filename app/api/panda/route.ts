import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/panda - Récupérer tous les identifiants de contact avec leurs infos
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

    const contacts = await prisma.contactIdentifier.findMany({
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        info: true,
        tasks: true,
        position: true, // Inclure la position stockée
        createdAt: true,
        newClient: {
          select: {
            id: true,
            firstName: true,
            surname: true,
            nickname: true,
            requestor: true,
            priority: true,
            createdAt: true,
            searches: {
              select: {
                searchId: true,
                createdAt: true,
                search: {
                  select: {
                    id: true,
                    generalReference: true,
                    detailedReference: true,
                    startDate: true,
                    endDate: true,
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformer les données pour le format attendu
    const transformedContacts = contacts.map(contact => ({
      ...contact,
      newClient: contact.newClient ? {
        ...contact.newClient,
        searches: contact.newClient.searches.map(sc => sc.search)
      } : null
    }));

    return NextResponse.json({ contacts: transformedContacts });
  } catch (error: any) {
    console.error('Erreur GET /api/panda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
