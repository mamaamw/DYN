import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Liste des tables autorisées
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

// Champs non modifiables
const READ_ONLY_FIELDS = ['id', 'createdAt', 'updatedAt', 'password'];

// Tables en lecture seule (pas de modification/suppression)
const READ_ONLY_TABLES = ['SystemLog'];

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ table: string; id: string }> }
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
    const recordId = parseInt(params.id);

    // Vérifier que la table est autorisée
    if (!ALLOWED_TABLES.includes(tableName)) {
      return NextResponse.json(
        { error: 'Table non autorisée' },
        { status: 400 }
      );
    }

    // Vérifier que la table n'est pas en lecture seule
    if (READ_ONLY_TABLES.includes(tableName)) {
      return NextResponse.json(
        { error: 'Cette table ne peut pas être modifiée' },
        { status: 403 }
      );
    }

    if (isNaN(recordId)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Retirer les champs non modifiables
    const updateData = { ...body };
    READ_ONLY_FIELDS.forEach(field => delete updateData[field]);

    // Convertir les dates ISO en objets Date
    Object.keys(updateData).forEach(key => {
      if (typeof updateData[key] === 'string' && updateData[key].match(/^\d{4}-\d{2}-\d{2}T/)) {
        updateData[key] = new Date(updateData[key]);
      }
    });

    // Accéder au modèle dynamiquement
    const model = (prisma as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)];

    if (!model) {
      return NextResponse.json(
        { error: 'Modèle Prisma introuvable' },
        { status: 500 }
      );
    }

    // Mettre à jour l'enregistrement
    const updated = await model.update({
      where: { id: recordId },
      data: updateData
    });

    // Logger l'action
    await prisma.systemLog.create({
      data: {
        action: `UPDATE_${tableName.toUpperCase()}`,
        userId: payload.userId,
        entity: tableName,
        entityId: recordId,
        description: `Modification ${tableName} ID ${recordId}`
      }
    });

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error: any) {
    console.error('Erreur PUT /api/admin/data/[table]/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ table: string; id: string }> }
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
    const recordId = parseInt(params.id);

    // Vérifier que la table est autorisée
    if (!ALLOWED_TABLES.includes(tableName)) {
      return NextResponse.json(
        { error: 'Table non autorisée' },
        { status: 400 }
      );
    }

    // Vérifier que la table n'est pas en lecture seule
    if (READ_ONLY_TABLES.includes(tableName)) {
      return NextResponse.json(
        { error: 'Cette table ne peut pas être modifiée' },
        { status: 403 }
      );
    }

    if (isNaN(recordId)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    // Accéder au modèle dynamiquement
    const model = (prisma as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)];

    if (!model) {
      return NextResponse.json(
        { error: 'Modèle Prisma introuvable' },
        { status: 500 }
      );
    }

    // Vérifier si l'enregistrement a un champ 'deleted' (soft delete)
    const record = await model.findUnique({
      where: { id: recordId }
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Enregistrement introuvable' },
        { status: 404 }
      );
    }

    let deleted;

    // Si la table supporte le soft delete, utiliser deleted = true
    if ('deleted' in record) {
      deleted = await model.update({
        where: { id: recordId },
        data: { deleted: true }
      });
    } else {
      // Sinon, suppression physique
      deleted = await model.delete({
        where: { id: recordId }
      });
    }

    // Logger l'action
    await prisma.systemLog.create({
      data: {
        action: `DELETE_${tableName.toUpperCase()}`,
        userId: payload.userId,
        entity: tableName,
        entityId: recordId,
        description: `Suppression ${tableName} ID ${recordId}`
      }
    });

    return NextResponse.json({
      success: true,
      data: deleted
    });

  } catch (error: any) {
    console.error('Erreur DELETE /api/admin/data/[table]/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
