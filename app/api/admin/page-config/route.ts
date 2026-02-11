import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/page-config - Récupérer toutes les configurations
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const configs = await prisma.pageConfig.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Erreur GET /api/admin/page-config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/page-config - Créer ou mettre à jour une configuration
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!user || (user.role !== 'admin' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const config = await request.json();

    // Upsert la configuration
    const savedConfig = await prisma.pageConfig.upsert({
      where: { pageId: config.pageId },
      update: {
        pageName: config.pageName,
        config: config,
        updatedAt: new Date(),
      },
      create: {
        pageId: config.pageId,
        pageName: config.pageName,
        config: config,
      },
    });

    return NextResponse.json(savedConfig);
  } catch (error) {
    console.error('Erreur POST /api/admin/page-config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

