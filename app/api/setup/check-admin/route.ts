import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Vérifier s'il existe au moins un utilisateur admin
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    return NextResponse.json({
      hasAdmin: adminCount > 0
    });

  } catch (error) {
    console.error('Erreur lors de la vérification admin:', error);
    return NextResponse.json({
      hasAdmin: false // En cas d'erreur, on assume qu'il n'y a pas d'admin
    });
  }
}