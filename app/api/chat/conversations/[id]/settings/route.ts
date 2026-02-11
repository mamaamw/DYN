import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/chat/conversations/[id]/settings - Mettre à jour les paramètres de rétention
export async function PATCH(
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
    const { autoDeleteDays } = await request.json();

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

    // Mettre à jour les paramètres
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { autoDeleteDays: autoDeleteDays === null ? null : parseInt(autoDeleteDays) }
    });

    // Si autoDeleteDays est défini, soft delete les messages anciens
    if (conversation.autoDeleteDays !== null) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - conversation.autoDeleteDays);

      await prisma.message.updateMany({
        where: {
          conversationId,
          createdAt: {
            lt: cutoffDate
          },
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      autoDeleteDays: conversation.autoDeleteDays 
    });

  } catch (error: any) {
    console.error('Erreur PATCH /api/chat/conversations/[id]/settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
