import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/page-config/[pageId] - Récupérer la configuration d'une page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
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

    const { pageId } = await params;

    const config = await prisma.pageConfig.findUnique({
      where: { pageId },
    });

    if (!config) {
      // Retourner null pour que le frontend crée une config par défaut
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(config.config);
  } catch (error) {
    console.error('Erreur GET /api/admin/page-config/[pageId]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
