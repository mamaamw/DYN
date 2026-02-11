import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/chat/conversations - Liste des conversations de l'utilisateur
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

    // Récupérer toutes les conversations de l'utilisateur
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: payload.userId
          }
        }
      },
      include: {
        participants: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Pour chaque conversation, obtenir l'autre participant (ou les infos du groupe)
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        if (conv.isGroup) {
          return {
            id: conv.id,
            name: conv.name,
            isGroup: true,
            lastMessage: conv.messages[0]?.content,
            lastMessageTime: conv.messages[0]?.createdAt,
            unreadCount: await prisma.message.count({
              where: {
                conversationId: conv.id,
                senderId: { not: payload.userId },
                createdAt: {
                  gt: conv.participants.find(p => p.userId === payload.userId)?.lastReadAt || new Date(0)
                }
              }
            })
          };
        } else {
          // Conversation 1-to-1
          const otherParticipant = conv.participants.find(p => p.userId !== payload.userId);
          if (!otherParticipant) return null;

          const otherUser = await prisma.user.findUnique({
            where: { id: otherParticipant.userId },
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              isActive: true
            }
          });

          return {
            id: conv.id,
            name: `${otherUser?.firstName} ${otherUser?.lastName}`,
            isGroup: false,
            otherUser,
            lastMessage: conv.messages[0]?.content,
            lastMessageTime: conv.messages[0]?.createdAt,
            unreadCount: await prisma.message.count({
              where: {
                conversationId: conv.id,
                senderId: { not: payload.userId },
                createdAt: {
                  gt: conv.participants.find(p => p.userId === payload.userId)?.lastReadAt || new Date(0)
                }
              }
            })
          };
        }
      })
    );

    return NextResponse.json({
      conversations: conversationsWithDetails.filter(c => c !== null)
    });

  } catch (error: any) {
    console.error('Erreur GET /api/chat/conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/chat/conversations - Créer une nouvelle conversation
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
    const { participantIds, name, isGroup } = body;

    // Vérifier si c'est une conversation 1-to-1 qui existe déjà
    if (!isGroup && participantIds.length === 1) {
      const existingConv = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: { in: [payload.userId, participantIds[0]] }
            }
          }
        }
      });

      if (existingConv) {
        return NextResponse.json({ conversation: existingConv });
      }
    }

    // Créer la conversation
    const conversation = await prisma.conversation.create({
      data: {
        name,
        isGroup: isGroup || false,
        participants: {
          create: [
            { userId: payload.userId },
            ...participantIds.map((id: number) => ({ userId: id }))
          ]
        }
      },
      include: {
        participants: true
      }
    });

    // Log système
    await prisma.systemLog.create({
      data: {
        action: 'CREATE_CONVERSATION',
        userId: payload.userId,
        entity: 'Conversation',
        entityId: conversation.id,
        description: `Nouvelle conversation ${isGroup ? 'de groupe' : '1-to-1'} créée`
      }
    });

    return NextResponse.json({ conversation });

  } catch (error: any) {
    console.error('Erreur POST /api/chat/conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
