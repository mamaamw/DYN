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

// GET - Liste des emails
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'inbox';
    const search = searchParams.get('search') || '';
    const starred = searchParams.get('starred') === 'true';

    const where: any = {
      userId,
      deletedAt: null,
      folder,
    };

    if (starred) {
      where.isStarred = true;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
        { to: { contains: search, mode: 'insensitive' } },
      ];
    }

    const emails = await prisma.email.findMany({
      where,
      include: {
        attachments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(emails);
  } catch (error) {
    console.error('Erreur lors de la récupération des emails:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des emails' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel email (brouillon ou envoi)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { from, to, cc, bcc, subject, body: emailBody, folder, attachments } = body;

    // Validation
    if (!from || !subject) {
      return NextResponse.json(
        { error: 'L\'expéditeur et le sujet sont requis' },
        { status: 400 }
      );
    }

    // Si c'est un envoi (folder = sent), vérifier qu'il y a un destinataire
    if (folder === 'sent' && !to) {
      return NextResponse.json(
        { error: 'Le destinataire est requis pour envoyer un email' },
        { status: 400 }
      );
    }

    const email = await prisma.email.create({
      data: {
        from,
        to: to || '',
        cc: cc || null,
        bcc: bcc || null,
        subject,
        body: emailBody || '',
        folder: folder || 'drafts',
        sentAt: folder === 'sent' ? new Date() : null,
        userId,
        attachments: attachments
          ? {
              create: attachments.map((att: any) => ({
                filename: att.filename,
                filesize: att.filesize,
                mimetype: att.mimetype,
                url: att.url,
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json(email, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'email' },
      { status: 500 }
    );
  }
}
