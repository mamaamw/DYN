import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer la configuration des accès
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'access_control' }
    });

    const accessControl = setting?.value ? JSON.parse(setting.value) : {};

    return NextResponse.json({ accessControl });
  } catch (error) {
    console.error('Erreur lors de la récupération des accès:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Sauvegarder la configuration des accès
export async function POST(request: NextRequest) {
  try {
    const { accessControl } = await request.json();

    await prisma.setting.upsert({
      where: { key: 'access_control' },
      update: { value: JSON.stringify(accessControl) },
      create: {
        key: 'access_control',
        value: JSON.stringify(accessControl)
      }
    });

    return NextResponse.json({ 
      success: true,
      accessControl 
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des accès:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Réinitialiser aux valeurs par défaut
export async function DELETE() {
  try {
    await prisma.setting.deleteMany({
      where: { key: 'access_control' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
