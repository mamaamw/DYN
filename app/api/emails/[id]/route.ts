import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getUserFromToken(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// GET - Récupérer un email par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const email = await prisma.email.findFirst({
      where: {
        id: parseInt(id),
        userId,
        deletedAt: null,
      },
      include: {
        attachments: true,
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email non trouvé' }, { status: 404 });
    }

    // Marquer comme lu automatiquement lors de la lecture
    if (!email.isRead) {
      await prisma.email.update({
        where: { id: parseInt(id) },
        data: { isRead: true },
      });
    }

    return NextResponse.json(email);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'email' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un email
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Vérifier que l'email appartient à l'utilisateur
    const existingEmail = await prisma.email.findFirst({
      where: {
        id: parseInt(id),
        userId,
        deletedAt: null,
      },
    });

    if (!existingEmail) {
      return NextResponse.json({ error: 'Email non trouvé' }, { status: 404 });
    }

    // Mettre à jour l'email
    const updatedEmail = await prisma.email.update({
      where: { id: parseInt(id) },
      data: {
        from: body.from,
        to: body.to,
        cc: body.cc,
        bcc: body.bcc,
        subject: body.subject,
        body: body.body,
        folder: body.folder,
        isRead: body.isRead,
        isStarred: body.isStarred,
        isImportant: body.isImportant,
        sentAt: body.folder === 'sent' && !existingEmail.sentAt ? new Date() : existingEmail.sentAt,
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json(updatedEmail);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'email' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un email (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que l'email appartient à l'utilisateur
    const existingEmail = await prisma.email.findFirst({
      where: {
        id: parseInt(id),
        userId,
        deletedAt: null,
      },
    });

    if (!existingEmail) {
      return NextResponse.json({ error: 'Email non trouvé' }, { status: 404 });
    }

    // Soft delete
    await prisma.email.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Email supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'email' },
      { status: 500 }
    );
  }
}
