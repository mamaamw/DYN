import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { createSystemLog, getClientIp, getUserAgent } from '@/lib/logger';

export async function PUT(
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
    const body = await request.json();
    const { role, isActive, emailVerified, username, firstName, lastName, email } = body;

    // Vérifier l'unicité du username si modifié
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Ce nom d\'utilisateur est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    // Vérifier l'unicité de l'email si modifié
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        emailVerified: emailVerified !== undefined ? emailVerified : undefined,
        username: username || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
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
      },
    });

    // Log mise à jour utilisateur
    const changes = [];
    if (role) changes.push(`role: ${role}`);
    if (isActive !== undefined) changes.push(`actif: ${isActive}`);
    if (emailVerified !== undefined) changes.push(`email vérifié: ${emailVerified}`);
    if (username) changes.push(`username: ${username}`);
    if (firstName) changes.push(`prénom: ${firstName}`);
    if (lastName) changes.push(`nom: ${lastName}`);
    if (email) changes.push(`email: ${email}`);

    await createSystemLog({
      userId: decoded.userId,
      action: 'UPDATE',
      entity: 'User',
      entityId: userId,
      description: `Utilisateur modifié: ${updatedUser.firstName} ${updatedUser.lastName}${changes.length > 0 ? ' - ' + changes.join(', ') : ''}`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO',
      metadata: {
        targetUserId: userId,
        changes: { role, isActive, emailVerified, username, firstName, lastName, email },
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise a jour de l\'utilisateur' },
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
    const url = new URL(request.url);
    const permanent = url.searchParams.get('permanent') === 'true';

    // Prevent self-deletion
    if (userId === decoded.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    // Récupérer les infos de l'utilisateur avant suppression
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (permanent) {
      // Suppression permanente (admin uniquement)
      await prisma.user.delete({
        where: { id: userId },
      });

      // Log suppression permanente
      await createSystemLog({
        userId: decoded.userId,
        action: 'DELETE_PERMANENT',
        entity: 'User',
        entityId: userId,
        description: `Utilisateur supprimé définitivement: ${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.username})`,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        level: 'CRITICAL',
        metadata: {
          targetUserId: userId,
          email: userToDelete.email,
        },
      });

      return NextResponse.json({
        success: true,
        permanent: true,
        message: 'Utilisateur supprime definitivement',
      });
    } else {
      // Soft delete (par défaut)
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });

      // Log soft delete
      await createSystemLog({
        userId: decoded.userId,
        action: 'DELETE',
        entity: 'User',
        entityId: userId,
        description: `Utilisateur supprimé (corbeille): ${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.username})`,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        level: 'WARNING',
        metadata: {
          targetUserId: userId,
          email: userToDelete.email,
        },
      });

      return NextResponse.json({
        success: true,
        permanent: false,
        message: 'Utilisateur supprime temporairement',
      });
    }
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
}
