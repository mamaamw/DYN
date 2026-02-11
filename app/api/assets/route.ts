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

    const assets = await prisma.asset.findMany({
      where: { deletedAt: null },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { username: true } },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    return NextResponse.json({ success: true, assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
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
    const { name, type, description, purchaseDate, purchaseCost, currency, serialNumber, supplier, warranty, projectId, notes, status } = body;

    if (!name || !type || !purchaseDate || !purchaseCost) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        type,
        description,
        purchaseDate: new Date(purchaseDate),
        purchaseCost: parseFloat(purchaseCost),
        currency: currency || 'EUR',
        serialNumber,
        supplier,
        warranty: warranty ? new Date(warranty) : null,
        status: status || 'active',
        projectId: projectId ? parseInt(projectId) : null,
        notes,
        userId: decoded.userId,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
