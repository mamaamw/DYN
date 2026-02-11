import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/chat/search - Rechercher dans toutes les conversations de l'utilisateur
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ messages: [], count: 0 });
    }

    // Récupérer toutes les conversations de l'utilisateur
    const userConversations = await prisma.conversationParticipant.findMany({
      where: { userId: payload.userId },
      select: { conversationId: true }
    });

    const conversationIds = userConversations.map(c => c.conversationId);

    // Rechercher les messages dans toutes ces conversations
    const messages = await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        deletedAt: null,
        content: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
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

    // Récupérer les infos des conversations
    const conversations = await prisma.conversation.findMany({
      where: { id: { in: [...new Set(messages.map(m => m.conversationId))] } },
      include: {
        participants: {
          include: {
            conversation: {
              select: { id: true, name: true, isGroup: true }
            }
          }
        }
      }
    });

    const messagesWithDetails = messages.map(msg => {
      const conversation = conversations.find(c => c.id === msg.conversationId);
      const sender = senders.find(s => s.id === msg.senderId);
      
      // Trouver le nom de la conversation
      let conversationName = conversation?.name || '';
      if (!conversation?.isGroup) {
        const otherParticipant = conversation?.participants.find(p => p.userId !== payload.userId);
        if (otherParticipant) {
          const otherUser = senders.find(s => s.id === otherParticipant.userId);
          conversationName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : '';
        }
      }

      return {
        ...msg,
        sender,
        conversation: {
          id: msg.conversationId,
          name: conversationName,
          isGroup: conversation?.isGroup || false
        }
      };
    });

    return NextResponse.json({ 
      messages: messagesWithDetails,
      count: messages.length 
    });

  } catch (error: any) {
    console.error('Erreur GET /api/chat/search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
