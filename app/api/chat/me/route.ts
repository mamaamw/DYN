import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// GET /api/chat/me - Obtenir l'utilisateur actuel
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

    return NextResponse.json({ userId: payload.userId });

  } catch (error: any) {
    console.error('Erreur GET /api/chat/me:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
