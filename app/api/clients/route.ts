import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSystemLog, getClientIp, getUserAgent } from '@/lib/logger';
import { verifyToken } from '@/lib/auth';

// GET: Lister tous les clients
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        User: {
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
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clients' },
      { status: 500 }
    );
  }
}

// POST: Créer un nouveau client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone1, phone2, userId } = body;

    // Récupérer l'utilisateur connecté pour les logs
    let logUserId: number | undefined;
    try {
      const token = request.cookies.get('token')?.value;
      if (token) {
        const decoded = verifyToken(token);
        if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
          logUserId = decoded.userId as number;
        }
      }
    } catch (error) {
      // Ignorer les erreurs de token
    }

    // Validation basique
    if (!firstName || !lastName || !email || !userId) {
      return NextResponse.json(
        { error: 'firstName, lastName, email et userId sont requis' },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone1: phone1 || null,
        userId,
      },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log création client
    await createSystemLog({
      userId: logUserId,
      action: 'CREATE',
      entity: 'Client',
      entityId: client.id,
      description: `Client créé: ${client.firstName} ${client.lastName} (${client.email})`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO',
      metadata: {
        clientId: client.id,
        email: client.email,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du client' },
      { status: 500 }
    );
  }
}
