import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'chat');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// POST /api/chat/upload - Upload file for chat
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = parseInt(formData.get('conversationId') as string);
    const message = formData.get('message') as string || ''; // Message optionnel

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID requis' }, { status: 400 });
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 });
    }

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

    // Créer le répertoire s'il n'existe pas
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const filename = `${Date.now()}-${randomBytes(16).toString('hex')}.${fileExtension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Créer l'enregistrement du fichier dans StorageFile
    const storageFile = await prisma.storageFile.create({
      data: {
        filename,
        originalName: file.name,
        filesize: file.size,
        mimetype: file.type,
        path: filepath,
        url: `/uploads/chat/${filename}`,
        folder: 'chat',
        description: `Fichier partagé dans la conversation ${conversationId}`,
        isPublic: false,
        userId: payload.userId
      }
    });

    // Créer le message avec le fichier
    const messageContent = message.trim() ? message : file.name;
    const messageRecord = await prisma.message.create({
      data: {
        conversationId,
        senderId: payload.userId,
        content: messageContent,
        messageType: 'file',
        metadata: JSON.stringify({
          fileId: storageFile.id,
          filename: storageFile.filename,
          originalName: storageFile.originalName,
          filesize: storageFile.filesize,
          mimetype: storageFile.mimetype,
          url: storageFile.url,
          hasMessage: message.trim() !== '' // Indique si un message accompagne le fichier
        })
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      message: messageRecord,
      file: {
        id: storageFile.id,
        filename: storageFile.filename,
        originalName: storageFile.originalName,
        filesize: storageFile.filesize,
        mimetype: storageFile.mimetype,
        url: storageFile.url
      }
    });

  } catch (error) {
    console.error('Chat upload error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}