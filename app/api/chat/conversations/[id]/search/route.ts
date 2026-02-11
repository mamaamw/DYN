import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/chat/conversations/[id]/search - Rechercher des messages
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const params = await context.params;
    const conversationId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

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

    // Rechercher les messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        content: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Récupérer les infos des expéditeurs
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true
      }
    });

    const messagesWithSenders = messages.map(msg => ({
      ...msg,
      sender: senders.find(s => s.id === msg.senderId)
    }));

    return NextResponse.json({ 
      messages: messagesWithSenders,
      count: messages.length 
    });

  } catch (error: any) {
    console.error('Erreur GET /api/chat/conversations/[id]/search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
