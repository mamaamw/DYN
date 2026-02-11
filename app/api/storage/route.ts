import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

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

// GET - Liste des fichiers
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');
    const search = searchParams.get('search') || '';
    const starred = searchParams.get('starred') === 'true';

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (folder && folder !== 'all') {
      where.folder = folder;
    }

    if (starred) {
      where.isStarred = true;
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const files = await prisma.storageFile.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculer l'espace de stockage utilisé
    const totalSize = await prisma.storageFile.aggregate({
      where: {
        userId,
        deletedAt: null,
      },
      _sum: {
        filesize: true,
      },
    });

    return NextResponse.json({
      files,
      totalSize: totalSize._sum.filesize || 0,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fichiers' },
      { status: 500 }
    );
  }
}

// POST - Upload un fichier
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || null;
    const description = formData.get('description') as string || null;
    const tags = formData.get('tags') as string || null;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Créer le dossier d'upload s'il n'existe pas
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (err) {
      // Le dossier existe déjà
    }

    // Générer un nom de fichier unique
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uniqueFilename = `${Date.now()}-${randomBytes(8).toString('hex')}-${file.name}`;
    const filePath = join(UPLOAD_DIR, uniqueFilename);

    // Sauvegarder le fichier
    await writeFile(filePath, buffer);

    // Créer l'entrée en base de données
    const storageFile = await prisma.storageFile.create({
      data: {
        filename: uniqueFilename,
        originalName: file.name,
        filesize: buffer.length,
        mimetype: file.type,
        path: filePath,
        url: `/uploads/${uniqueFilename}`,
        folder: folder,
        description: description,
        tags: tags,
        userId,
      },
    });

    return NextResponse.json(storageFile, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
}
