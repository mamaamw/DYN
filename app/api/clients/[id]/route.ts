import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSystemLog, getClientIp, getUserAgent } from '@/lib/logger';
import { verifyToken } from '@/lib/auth';

// GET: Récupérer un client par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
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

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du client' },
      { status: 500 }
    );
  }
}

// PUT: Mettre à jour un client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

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

    const body = await request.json();
    const { firstName, lastName, email, phone1, phone2 } = body;

    // Vérifier que le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        firstName: firstName || existingClient.firstName,
        lastName: lastName || existingClient.lastName,
        email: email || existingClient.email,
        phone1: phone1 !== undefined ? phone1 : existingClient.phone1,
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

    // Log mise à jour client
    await createSystemLog({
      userId: logUserId,
      action: 'UPDATE',
      entity: 'Client',
      entityId: client.id,
      description: `Client mis à jour: ${client.firstName} ${client.lastName}`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO',
      metadata: {
        clientId: client.id,
        changes: {
          firstName: firstName !== existingClient.firstName,
          lastName: lastName !== existingClient.lastName,
          email: email !== existingClient.email,
        },
      },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Error updating client:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du client' },
      { status: 500 }
    );
  }
}

// DELETE: Supprimer un client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

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

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    await prisma.client.delete({
      where: { id: clientId },
    });

    // Log suppression client
    await createSystemLog({
      userId: logUserId,
      action: 'DELETE',
      entity: 'Client',
      entityId: clientId,
      description: `Client supprimé: ${client.firstName} ${client.lastName} (${client.email})`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'WARNING',
      metadata: {
        clientId: clientId,
        email: client.email,
      },
    });

    return NextResponse.json(
      { message: 'Client supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du client' },
      { status: 500 }
    );
  }
}
