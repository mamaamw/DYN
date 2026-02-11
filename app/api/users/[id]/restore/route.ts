import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { createSystemLog, getClientIp, getUserAgent } from '@/lib/logger';

// PATCH /api/users/[id]/restore - Restore a soft-deleted user (admin only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
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

    const params = await context.params;
    const userId = parseInt(params.id);

    // Verify user exists and is deleted
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    if (!user.deletedAt) {
      return NextResponse.json(
        { error: 'Cet utilisateur n\'est pas supprime' },
        { status: 400 }
      );
    }

    // Restore user
    const restoredUser = await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
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
      },
    });

    // Log restauration utilisateur
    await createSystemLog({
      userId: decoded.userId,
      action: 'RESTORE',
      entity: 'User',
      entityId: userId,
      description: `Utilisateur restauré: ${restoredUser.firstName} ${restoredUser.lastName} (${restoredUser.username})`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO',
      metadata: {
        targetUserId: userId,
        email: restoredUser.email,
      },
    });

    return NextResponse.json({
      success: true,
      user: restoredUser,
      message: 'Utilisateur restaure avec succes',
    });
  } catch (error) {
    console.error('User restore error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la restauration de l\'utilisateur' },
      { status: 500 }
    );
  }
}
