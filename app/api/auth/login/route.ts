import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { createSystemLog, getClientIp, getUserAgent } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur et mot de passe requis' },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur par username
    const user = await prisma.user.findUnique({
      where: { username },
    });
    // Log debug
    console.log('LOGIN DEBUG:', { username, user, password });

    if (!user) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Verifier si le compte est actif
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Votre compte a ete desactive' },
        { status: 403 }
      );
    }

    // Verifier le mot de passe
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      // Log tentative de connexion échouée
      await createSystemLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entity: 'Auth',
        entityId: user.id,
        description: `Tentative de connexion échouée pour ${username}`,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        level: 'WARNING',
      });

      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Mettre a jour la date de derniere connexion
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
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

    // Generer un token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Creer la reponse avec le cookie
    const response = NextResponse.json({
      success: true,
      user: updatedUser,
      token,
    });

    // Definir le cookie cote serveur pour que le middleware puisse le lire
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false, // DEBUG: toujours false en local
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 jours
      path: '/',
    });

    // Log connexion réussie
    await createSystemLog({
      userId: updatedUser.id,
      action: 'LOGIN',
      entity: 'Auth',
      entityId: updatedUser.id,
      description: `${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.username}) s'est connecté`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);

    // Extra diagnostics for missing column errors (P2022)
    if ((error as any)?.code === 'P2022') {
      try {
        const dbInfo = await prisma.$queryRaw`select current_database() as db, current_schema() as schema`;
        console.error('P2022 meta:', { meta: (error as any).meta, dbInfo });
      } catch (infoError) {
        console.error('Failed to fetch DB info for diagnostics:', infoError);
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}
