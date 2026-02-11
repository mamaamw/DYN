import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Tables protégées contre la suppression complète
const PROTECTED_TABLES = ['User', 'SystemLog'];

// Tables autorisées
const ALLOWED_TABLES = [
  'Client',
  'NewClient',
  'Category',
  'UserCategory',
  'ContactIdentifier',
  'Search'
];

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ table: string }> }
) {
  try {
    // Vérifier authentification admin
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const tableName = params.table;

    // Vérifier que la table est autorisée
    if (!ALLOWED_TABLES.includes(tableName)) {
      return NextResponse.json(
        { error: 'Table non autorisée pour suppression complète' },
        { status: 400 }
      );
    }

    // Vérifier que la table n'est pas protégée
    if (PROTECTED_TABLES.includes(tableName)) {
      return NextResponse.json(
        { error: 'Cette table est protégée et ne peut pas être vidée' },
        { status: 403 }
      );
    }

    // Accéder au modèle dynamiquement
    const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    const model = (prisma as any)[modelName];

    if (!model) {
      return NextResponse.json(
        { error: 'Modèle Prisma introuvable' },
        { status: 500 }
      );
    }

    // Compter les enregistrements avant suppression
    const countBefore = await model.count();

    // Supprimer tous les enregistrements
    const result = await model.deleteMany({});

    // Logger l'action
    await prisma.systemLog.create({
      data: {
        action: `TRUNCATE_${tableName.toUpperCase()}`,
        userId: payload.userId,
        entity: tableName,
        description: `Suppression complète de la table ${tableName} (${countBefore} enregistrements supprimés)`,
        level: 'WARNING'
      }
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} enregistrement(s) supprimé(s)`,
      count: result.count
    });

  } catch (error: any) {
    console.error('Erreur POST /api/admin/data/[table]/truncate:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
