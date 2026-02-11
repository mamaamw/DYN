import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Récupérer la visibilité des pages
export async function GET() {
  try {
    // Récupérer ou créer les paramètres de visibilité
    let pageSettings = await prisma.setting.findFirst({
      where: { key: 'page_visibility' }
    });

    if (!pageSettings) {
      // Créer les paramètres par défaut (toutes les pages visibles)
      const defaultVisibility = JSON.stringify({
        '/dashboard': true,
        '/analytics': true,
        '/clients': true,
        '/searches': true,
        '/prio': true,
        '/panda': true,
        '/tasks': true,
        '/planning': true,
        '/todo': true,
        '/todo-kanban': true,
        '/projects': true,
        '/invoices': true,
        '/proposals': true,
        '/apps/chat': true,
        '/apps/email': true,
        '/apps/tasks': true,
        '/apps/notes': true,
        '/apps/storage': true,
        '/apps/calendar': true
      });

      pageSettings = await prisma.setting.create({
        data: {
          key: 'page_visibility',
          value: defaultVisibility
        }
      });
    }

    const visibility = JSON.parse(pageSettings.value);
    return NextResponse.json({ visibility });
  } catch (error) {
    console.error('Erreur lors de la récupération de la visibilité:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la visibilité' },
      { status: 500 }
    );
  }
}

// Mettre à jour la visibilité d'une page
export async function PATCH(request: Request) {
  try {
    const { path, visible } = await request.json();

    if (!path || typeof visible !== 'boolean') {
      return NextResponse.json(
        { error: 'Chemin et visibilité requis' },
        { status: 400 }
      );
    }

    // Récupérer les paramètres actuels
    let pageSettings = await prisma.setting.findFirst({
      where: { key: 'page_visibility' }
    });

    let currentVisibility: Record<string, boolean> = {};
    if (pageSettings) {
      currentVisibility = JSON.parse(pageSettings.value);
    }

    // Mettre à jour la visibilité pour cette page
    currentVisibility[path] = visible;

    // Sauvegarder
    if (pageSettings) {
      await prisma.setting.update({
        where: { id: pageSettings.id },
        data: { value: JSON.stringify(currentVisibility) }
      });
    } else {
      await prisma.setting.create({
        data: {
          key: 'page_visibility',
          value: JSON.stringify(currentVisibility)
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      visibility: currentVisibility 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la visibilité:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la visibilité' },
      { status: 500 }
    );
  }
}