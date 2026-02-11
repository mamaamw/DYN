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
    const asset = await prisma.asset.findFirst({
      where: { 
        id: parseInt(id),
        deletedAt: null,
      },
      include: {
        project: true,
        user: { select: { username: true, email: true } },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Matériel non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('Error fetching asset:', error);
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
    const { name, type, description, purchaseDate, purchaseCost, currency, serialNumber, supplier, warranty, projectId, notes, status } = body;

    const asset = await prisma.asset.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        description,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : undefined,
        currency,
        serialNumber,
        supplier,
        warranty: warranty ? new Date(warranty) : null,
        status,
        projectId: projectId ? parseInt(projectId) : null,
        notes,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('Error updating asset:', error);
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
    await prisma.asset.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
