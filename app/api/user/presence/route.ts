import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    // Mettre à jour lastSeen
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { lastSeen: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour présence:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Récupérer le statut d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    if (!userIdParam) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const userId = parseInt(userIdParam);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeen: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Considérer en ligne si lastSeen < 2 minutes
    const isOnline = user.lastSeen && 
      (new Date().getTime() - new Date(user.lastSeen).getTime()) < 120000;

    return NextResponse.json({ 
      isOnline,
      lastSeen: user.lastSeen 
    });
  } catch (error) {
    console.error('Erreur récupération statut:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
