import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      database: {
        url: process.env.DATABASE_URL ? '✅ Configuré' : '❌ Manquant',
        connection: false,
        userTableStructure: null,
        columnPhoneExists: false,
        errorDetails: null
      },
      users: {
        total: 0,
        admins: 0,
        adminList: []
      },
      recommendations: []
    };

    // Test de connexion à la base de données
    try {
      await prisma.$queryRaw`SELECT 1`;
      diagnostics.database.connection = true;

      // Vérifier la structure de la table User
      try {
        const userColumns = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'User'
          ORDER BY ordinal_position
        ` as any[];

        diagnostics.database.userTableStructure = userColumns;
        diagnostics.database.columnPhoneExists = userColumns.some(
          col => col.column_name === 'phone'
        );

        if (!diagnostics.database.columnPhoneExists) {
          diagnostics.recommendations.push(
            '❌ La colonne "phone" n\'existe pas dans la table User. Exécutez : npx prisma db push'
          );
        }

        // Compter les utilisateurs
        const userCount = await prisma.user.count();
        diagnostics.users.total = userCount;

        const adminUsers = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true, username: true, email: true, role: true, isActive: true }
        });

        diagnostics.users.admins = adminUsers.length;
        diagnostics.users.adminList = adminUsers;

        if (adminUsers.length === 0) {
          diagnostics.recommendations.push(
            '⚠️  Aucun utilisateur Admin trouvé. Créez un admin via /setup/initial-admin'
          );
        }

      } catch (tableError: any) {
        diagnostics.database.errorDetails = {
          message: tableError.message,
          code: tableError.code,
          suggestion: 'Problème avec la structure de la table User'
        };

        if (tableError.code === 'P2022') {
          diagnostics.recommendations.push(
            '🔧 Erreur P2022 détectée : Colonne manquante. Exécutez le script de correction sur le serveur.'
          );
        }
      }

    } catch (connectionError: any) {
      diagnostics.database.errorDetails = {
        message: connectionError.message,
        code: connectionError.code,
        suggestion: 'Impossible de se connecter à la base de données'
      };
      diagnostics.recommendations.push(
        '❌ Problème de connexion à la base de données. Vérifiez DATABASE_URL'
      );
    }

    // Recommandations générales
    if (diagnostics.database.connection && diagnostics.database.columnPhoneExists) {
      diagnostics.recommendations.push('✅ Structure de base de données OK');
    }

    if (diagnostics.users.admins > 0) {
      diagnostics.recommendations.push(`✅ ${diagnostics.users.admins} utilisateur(s) admin trouvé(s)`);
    }

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erreur lors du diagnostic',
        message: error.message,
        code: error.code || 'UNKNOWN',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}