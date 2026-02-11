import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getRoles, addRole, updateRole, deleteRole, type Role } from '@/lib/roles';
import { prisma } from '@/lib/prisma';

// GET /api/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const roles = getRoles();
    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/roles - Create a new role
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

    // Verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Administrateur requis' }, { status: 403 });
    }

    const body = await request.json();
    const { name, label, description, color } = body;

    if (!name || !label) {
      return NextResponse.json({ error: 'Nom et label requis' }, { status: 400 });
    }

    const success = addRole({
      name: name.toUpperCase().replace(/\s+/g, '_'),
      label,
      description: description || '',
      color: color || 'blue',
    });

    if (!success) {
      return NextResponse.json({ error: 'Ce rôle existe déjà' }, { status: 400 });
    }

    return NextResponse.json({ success: true, roles: getRoles() });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/roles - Update a role
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Administrateur requis' }, { status: 403 });
    }

    const body = await request.json();
    const { name, label, description, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }

    const success = updateRole(name, { label, description, color });

    if (!success) {
      return NextResponse.json({ error: 'Impossible de mettre à jour ce rôle' }, { status: 400 });
    }

    return NextResponse.json({ success: true, roles: getRoles() });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/roles?name=ROLE_NAME
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Administrateur requis' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Nom du rôle requis' }, { status: 400 });
    }

    // Check if any users have this role
    const usersWithRole = await prisma.user.count({
      where: { role: name },
    });

    if (usersWithRole > 0) {
      const message = usersWithRole === 1
        ? `Impossible de supprimer ce rôle: 1 utilisateur l'utilise`
        : `Impossible de supprimer ce rôle: ${usersWithRole} utilisateurs l'utilisent`;
      
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    const success = deleteRole(name);

    if (!success) {
      return NextResponse.json({ error: 'Impossible de supprimer ce rôle système' }, { status: 400 });
    }

    return NextResponse.json({ success: true, roles: getRoles() });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
