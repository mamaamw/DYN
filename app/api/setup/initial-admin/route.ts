import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Vérifier s'il y a déjà un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      return NextResponse.json({
        error: 'Un administrateur existe déjà'
      }, { status: 400 });
    }

    const body = await request.json();
    const { username, email, password, confirmPassword } = body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json({
        error: 'Tous les champs sont requis'
      }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({
        error: 'Les mots de passe ne correspondent pas'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      }, { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'administrateur
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'System',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        updatedAt: new Date(),
      },
    });

    // Log système
    await prisma.systemLog.create({
      data: {
        userId: admin.id,
        action: 'CREATE_ADMIN',
        entity: 'User',
        entityId: admin.id,
        description: `Premier administrateur créé: ${admin.username}`,
        level: 'INFO'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Administrateur créé avec succès',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'admin:', error);
    return NextResponse.json({
      error: 'Erreur serveur lors de la création de l\'administrateur',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}