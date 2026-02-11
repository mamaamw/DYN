import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/users/deleted - Get all soft-deleted users (admin only)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acces refuse - Administrateur requis' },
        { status: 403 }
      );
    }

    // Get deleted users
    const deletedUsers = await prisma.user.findMany({
      where: {
        deletedAt: { not: null },
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        deletedAt: true,
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });

    return NextResponse.json(deletedUsers);
  } catch (error) {
    console.error('Error fetching deleted users:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des utilisateurs supprimes' },
      { status: 500 }
    );
  }
}
