import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { id } = await params;
    const license = await prisma.license.findFirst({
      where: { 
        id: parseInt(id),
        deletedAt: null,
      },
      include: {
        project: true,
        user: { select: { username: true, email: true } },
      },
    });

    if (!license) {
      return NextResponse.json({ error: 'Licence non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ success: true, license });
  } catch (error) {
    console.error('Error fetching license:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, softwareName, licenseKey, startDate, endDate, renewalDate, cost, currency, projectId, notes, status } = body;

    const license = await prisma.license.update({
      where: { id: parseInt(id) },
      data: {
        name,
        softwareName,
        licenseKey,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        cost: parseFloat(cost),
        currency,
        status,
        projectId: projectId ? parseInt(projectId) : null,
        notes,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, license });
  } catch (error) {
    console.error('Error updating license:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.license.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting license:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
