import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const todo = await prisma.todo.findUnique({
      where: { id: parseInt(id) }
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    // Seul le propriétaire ou un admin peut voir
    if (todo.userId !== payload.userId && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json({ todo });
  } catch (error) {
    console.error('Erreur lors du chargement du todo:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const body = await request.json();
    const { id } = await params;

    const todo = await prisma.todo.findUnique({
      where: { id: parseInt(id) }
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    // Seul le propriétaire ou un admin peut modifier
    if (todo.userId !== payload.userId && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Normaliser la date d'exécution si fournie (string 'YYYY-MM-DD' -> Date | null)
    let execDate: Date | null | undefined = undefined;
    if (body.hasOwnProperty('executionDate')) {
      if (body.executionDate === '' || body.executionDate === null) {
        execDate = null;
      } else if (typeof body.executionDate === 'string') {
        // Convertir la chaîne en Date (UTC)
        execDate = new Date(body.executionDate);
      } else if (body.executionDate instanceof Date) {
        execDate = body.executionDate;
      }
    }

    const updated = await prisma.todo.update({
      where: { id: parseInt(id) },
      data: {
        executionDate: execDate,
        result: body.result,
        log: body.log,
        status: body.status
      }
    });

    return NextResponse.json({ todo: updated });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du todo:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const todo = await prisma.todo.findUnique({
      where: { id: parseInt(id) }
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    // Seul le propriétaire ou un admin peut supprimer
    if (todo.userId !== payload.userId && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await prisma.todo.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du todo:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
