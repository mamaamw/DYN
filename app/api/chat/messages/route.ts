import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/chat/messages - Envoyer un message
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content, messageType } = body;

    // Vérifier que l'utilisateur est participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: payload.userId
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: payload.userId,
        content,
        messageType: messageType || 'text'
      }
    });

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Récupérer l'expéditeur
    const sender = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true
      }
    });

    return NextResponse.json({
      message: {
        ...message,
        sender
      }
    });

  } catch (error: any) {
    console.error('Erreur POST /api/chat/messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
