import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, hashPassword } from '@/lib/auth';
import { validatePassword } from '@/lib/passwordValidation';
import { createSystemLog, getClientIp, getUserAgent } from '@/lib/logger';

// GET /api/users - Get all users (admin only)
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

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces refuse - Administrateur requis' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null, // Exclure les utilisateurs supprimés
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/users - Create user (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces refuse - Administrateur requis' }, { status: 403 });
    }

    const body = await request.json();
    const { username, email, password, firstName, lastName, role } = body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Valider le mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    // Vérifier si le username existe déjà
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Ce nom d\'utilisateur est déjà utilisé' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Créer l'utilisateur
    const hashedPassword = await hashPassword(password);
    const now = new Date();
    const userRole = role || 'USER';
    
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: userRole,
        updatedAt: now,
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
        createdAt: true,
      },
    });

    // Assigner les catégories par défaut du rôle
    try {
      const defaultCategories = await prisma.roleCategory.findMany({
        where: { roleName: userRole },
        select: { categoryId: true }
      });

      if (defaultCategories.length > 0) {
        await prisma.userCategory.createMany({
          data: defaultCategories.map(rc => ({
            userId: user.id,
            categoryId: rc.categoryId
          })),
          skipDuplicates: true
        });
      }
    } catch (categoryError) {
      console.error('Erreur lors de l\'assignation des catégories par défaut:', categoryError);
      // Continuer même si l'assignation des catégories échoue
    }

    // Log création utilisateur
    await createSystemLog({
      userId: decoded.userId,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      description: `Utilisateur créé: ${user.firstName} ${user.lastName} (${user.username})`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO',
      metadata: {
        newUserId: user.id,
        role: user.role,
        email: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}

// PATCH /api/users - Update user (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // Log mise à jour utilisateur
    const changes = [];
    if (role !== undefined) changes.push(`role: ${role}`);
    if (isActive !== undefined) changes.push(`actif: ${isActive}`);

    await createSystemLog({
      userId: decoded.userId,
      action: 'UPDATE',
      entity: 'User',
      entityId: userId,
      description: `Utilisateur modifié: ${updatedUser.firstName} ${updatedUser.lastName} - ${changes.join(', ')}`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO',
      metadata: {
        targetUserId: userId,
        changes: updateData,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

