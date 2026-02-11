import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer la configuration de navigation personnalisée
export async function GET() {
  try {
    const navConfig = await prisma.setting.findFirst({
      where: { key: 'navigation_config' }
    });

    if (navConfig) {
      return NextResponse.json({
        success: true,
        config: JSON.parse(navConfig.value)
      });
    }

    return NextResponse.json({
      success: true,
      config: null
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la navigation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Sauvegarder la configuration de navigation
export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json();

    await prisma.setting.upsert({
      where: { key: 'navigation_config' },
      update: { 
        value: JSON.stringify(config),
        updatedAt: new Date()
      },
      create: { 
        key: 'navigation_config',
        value: JSON.stringify(config)
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Configuration de navigation sauvegardée'
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la navigation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Réinitialiser la configuration par défaut
export async function DELETE() {
  try {
    await prisma.setting.deleteMany({
      where: { key: 'navigation_config' }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Configuration réinitialisée'
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}