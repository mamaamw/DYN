import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/panda/[id]/tasks - Mettre à jour les tâches d'un contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { id } = await params;
    const contactId = parseInt(id);
    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { tasks } = body;

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Format des tâches invalide' }, { status: 400 });
    }

    // Mettre à jour les tâches
    const updatedContact = await prisma.contactIdentifier.update({
      where: { id: contactId },
      data: {
        tasks: JSON.stringify(tasks)
      }
    });

    return NextResponse.json({ success: true, contact: updatedContact });
  } catch (error: any) {
    console.error('Erreur PUT /api/panda/[id]/tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
