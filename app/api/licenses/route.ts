import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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

    const licenses = await prisma.license.findMany({
      where: { deletedAt: null },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { username: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    return NextResponse.json({ success: true, licenses });
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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
    const { name, softwareName, licenseKey, cost, currency, status, startDate, endDate, renewalDate, projectId, notes } = body;

    if (!name || !softwareName || !cost || !startDate || !endDate) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const license = await prisma.license.create({
      data: {
        name,
        softwareName,
        licenseKey,
        cost: parseFloat(cost),
        currency: currency || 'EUR',
        status: status || 'active',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        projectId: projectId ? parseInt(projectId) : null,
        notes,
        userId: decoded.userId,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, license });
  } catch (error) {
    console.error('Error creating license:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
