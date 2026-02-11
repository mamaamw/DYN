import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: payload.userId,
        deletedAt: null,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Vérifier que l'événement existe et appartient à l'utilisateur
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: payload.userId,
        deletedAt: null,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      location,
      color,
      attendees,
      reminder,
      recurrence,
    } = body;

    // Validation si les dates sont modifiées
    if (startDate && endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        return NextResponse.json(
          { error: 'La date de fin doit être après la date de début' },
          { status: 400 }
        );
      }
    }

    // Construire l'objet de mise à jour avec seulement les champs fournis
    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (allDay !== undefined) updateData.allDay = allDay;
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (color !== undefined) updateData.color = color;
    if (attendees !== undefined) updateData.attendees = attendees ? JSON.stringify(attendees) : null;
    if (reminder !== undefined) updateData.reminder = reminder;
    if (recurrence !== undefined) updateData.recurrence = recurrence;

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    // Log de l'action
    await prisma.systemLog.create({
      data: {
        userId: payload.userId,
        action: 'UPDATE_EVENT',
        entity: 'Event',
        entityId: event.id,
        description: `Événement mis à jour: ${event.title}`,
        level: 'INFO',
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Vérifier que l'événement existe et appartient à l'utilisateur
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: payload.userId,
        deletedAt: null,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });

    // Log de l'action
    await prisma.systemLog.create({
      data: {
        userId: payload.userId,
        action: 'DELETE_EVENT',
        entity: 'Event',
        entityId: eventId,
        description: `Événement supprimé: ${existingEvent.title}`,
        level: 'INFO',
      },
    });

    return NextResponse.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
