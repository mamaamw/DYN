import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/chat/users - Liste des utilisateurs pour démarrer une conversation
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Récupérer tous les utilisateurs sauf l'utilisateur actuel
    const users = await prisma.user.findMany({
      where: {
        id: { not: payload.userId },
        deletedAt: null,
        isActive: true,
        OR: search ? [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ] : undefined
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      take: 50
    });

    return NextResponse.json({ users });

  } catch (error: any) {
    console.error('Erreur GET /api/chat/users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
