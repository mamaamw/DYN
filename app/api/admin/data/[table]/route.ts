import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Liste des tables autorisées pour éviter injection SQL
const ALLOWED_TABLES = [
  'User',
  'Client',
  'NewClient',
  'Category',
  'UserCategory',
  'ContactIdentifier',
  'Search',
  'SystemLog'
];

// Colonnes sensibles à masquer
const SENSITIVE_FIELDS: Record<string, string[]> = {
  User: ['password'],
  SystemLog: []
};

export async function GET(
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
        { error: 'Table non autorisée' },
        { status: 400 }
      );
    }

    // Récupérer paramètres de pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Accéder au modèle dynamiquement
    const model = (prisma as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)];

    if (!model) {
      return NextResponse.json(
        { error: 'Modèle Prisma introuvable' },
        { status: 500 }
      );
    }

    // Récupérer le nombre total d'enregistrements
    const total = await model.count();

    // Récupérer les données avec pagination
    let data = await model.findMany({
      skip,
      take: limit,
      orderBy: { id: 'desc' }
    });

    // Masquer les champs sensibles
    const sensitiveFields = SENSITIVE_FIELDS[tableName] || [];
    if (sensitiveFields.length > 0) {
      data = data.map((item: any) => {
        const sanitized = { ...item };
        sensitiveFields.forEach(field => {
          if (sanitized[field]) {
            sanitized[field] = '********';
          }
        });
        return sanitized;
      });
    }

    // Récupérer la structure des colonnes du premier enregistrement
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      columns,
      tableName
    });

  } catch (error: any) {
    console.error('Erreur GET /api/admin/data/[table]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
