import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/chat/conversations/[id] - Obtenir les messages d'une conversation
// Query param: ?action=messages (default) ou ?action=participants
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
    const action = searchParams.get('action') || 'messages';

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

    // Si on demande les participants
    if (action === 'participants') {
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId },
        include: {
          conversation: {
            select: {
              id: true,
              name: true,
              isGroup: true
            }
          }
        }
      });

      // Récupérer les infos des utilisateurs
      const userIds = participants.map(p => p.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      const participantsWithUsers = participants.map(p => ({
        ...p,
        user: users.find(u => u.id === p.userId)
      }));

      return NextResponse.json({ 
        participants: participantsWithUsers,
        conversation: participants[0]?.conversation 
      });
    }

    // Récupérer les messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'asc'
      }
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

    // Mettre à jour lastReadAt
    await prisma.conversationParticipant.update({
      where: {
        id: participant.id
      },
      data: {
        lastReadAt: new Date()
      }
    });

    // Récupérer les participants avec lastReadAt pour l'accusé de lecture
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: {
        userId: true,
        lastReadAt: true
      }
    });

    return NextResponse.json({ messages: messagesWithSenders, participants });

  } catch (error: any) {
    console.error('Erreur GET /api/chat/conversations/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
