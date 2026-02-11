import { NextResponse, NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      select: { id: true, role: true },
    });

    console.log('User from token:', { userId: payload.userId, user });

    if (!user || (user.role !== 'admin' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Accès non autorisé', details: { hasUser: !!user, role: user?.role } }, { status: 403 });
    }

    const body = await request.json();
    const { pageId, pageName } = body;

    if (!pageId || !pageName) {
      return NextResponse.json({ error: 'pageId et pageName requis' }, { status: 400 });
    }

    // Utiliser un pageId spécial pour les valeurs par défaut
    const defaultPageId = `${pageId}_default`;

    const savedConfig = await prisma.pageConfig.upsert({
      where: { pageId: defaultPageId },
      update: {
        pageName: `${pageName} (Défaut)`,
        config: body,
      },
      create: {
        pageId: defaultPageId,
        pageName: `${pageName} (Défaut)`,
        config: body,
      },
    });

    return NextResponse.json(savedConfig);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la config par défaut:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
