import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const ROLES_JSON_PATH = path.join(process.cwd(), 'lib', 'roles.json');

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { order } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: 'order doit être un tableau' },
        { status: 400 }
      );
    }

    // Lire le fichier roles.json
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rolesData: any = { roles: [] };
    if (fs.existsSync(ROLES_JSON_PATH)) {
      const fileContent = fs.readFileSync(ROLES_JSON_PATH, 'utf-8');
      rolesData = JSON.parse(fileContent);
    }

    // Créer une map des rôles par nom
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rolesMap: Record<string, any> = {};
    for (const role of rolesData.roles) {
      rolesMap[role.name] = role;
    }

    // Réorganiser les rôles selon l'ordre fourni
    const orderedRoles = [];
    for (const roleName of order) {
      if (rolesMap[roleName]) {
        orderedRoles.push(rolesMap[roleName]);
      }
    }

    // Ajouter les rôles qui ne sont pas dans l'ordre (ne devrait pas arriver)
    for (const roleName in rolesMap) {
      if (!order.includes(roleName)) {
        orderedRoles.push(rolesMap[roleName]);
      }
    }

    // Sauvegarder le nouvel ordre
    rolesData.roles = orderedRoles;
    fs.writeFileSync(ROLES_JSON_PATH, JSON.stringify(rolesData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'ordre des rôles:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
