import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

interface KeycloakTokenPayload {
  sub: string; // Keycloak user ID
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: {
    [key: string]: {
      roles?: string[];
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, idToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 400 }
      );
    }

    // Décoder le token (sans vérification pour l'instant - Keycloak le valide déjà côté client)
    // En production, vous devriez vérifier le token avec la clé publique Keycloak
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString()) as KeycloakTokenPayload;

    if (!payload.sub || !payload.email) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    // Déterminer le rôle depuis Keycloak
    const keycloakRoles = payload.realm_access?.roles || [];
    const isAdmin = keycloakRoles.includes('admin') || keycloakRoles.includes('administrator');

    // Chercher ou créer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (!user) {
      // Créer un nouvel utilisateur
      const username = payload.preferred_username || payload.email.split('@')[0];
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      user = await prisma.user.create({
        data: {
          username: `keycloak_${username}_${Date.now()}`,
          email: payload.email,
          password: randomPassword, // Mot de passe aléatoire (non utilisé pour Keycloak SSO)
          role: isAdmin ? 'ADMIN' : 'USER',
          keycloakId: payload.sub,
        }
      });
    } else {
      // Mettre à jour le keycloakId si nécessaire
      if (!user.keycloakId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            keycloakId: payload.sub,
            // Mettre à jour le rôle si l'utilisateur est admin dans Keycloak
            role: isAdmin ? 'ADMIN' : user.role
          }
        });
      }
    }

    // Générer un JWT comme pour l'authentification normale
    const token = signToken({ userId: user.id });

    // Créer la réponse avec le cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erreur lors de l\'authentification Keycloak:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
