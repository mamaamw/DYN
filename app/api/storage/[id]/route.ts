import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { unlink } from 'fs/promises';

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

// GET - Récupérer un fichier par ID
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

    const file = await prisma.storageFile.findFirst({
      where: {
        id: parseInt(id),
        userId,
        deletedAt: null,
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error('Erreur lors de la récupération du fichier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du fichier' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un fichier
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

    // Vérifier que le fichier appartient à l'utilisateur
    const existingFile = await prisma.storageFile.findFirst({
      where: {
        id: parseInt(id),
        userId,
        deletedAt: null,
      },
    });

    if (!existingFile) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    // Mettre à jour le fichier
    const updatedFile = await prisma.storageFile.update({
      where: { id: parseInt(id) },
      data: {
        originalName: body.originalName,
        folder: body.folder,
        description: body.description,
        tags: body.tags,
        isStarred: body.isStarred,
        isPublic: body.isPublic,
      },
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fichier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du fichier' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un fichier
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

    // Vérifier que le fichier appartient à l'utilisateur
    const existingFile = await prisma.storageFile.findFirst({
      where: {
        id: parseInt(id),
        userId,
        deletedAt: null,
      },
    });

    if (!existingFile) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    // Supprimer le fichier physiquement
    try {
      await unlink(existingFile.path);
    } catch (err) {
      console.error('Erreur lors de la suppression du fichier physique:', err);
    }

    // Soft delete en base de données
    await prisma.storageFile.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Fichier supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du fichier' },
      { status: 500 }
    );
  }
}
