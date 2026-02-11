import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      deletedAt: null
    };

    // Si l'utilisateur n'est pas admin, filtrer par userId
    if (user?.role !== 'ADMIN') {
      where.userId = payload.userId;
    }

    if (status) {
      where.status = status;
    }

    try {
      const todos = await prisma.todo.findMany({
        where,
        include: {
          client: {
            select: {
              priority: true,
              firstName: true,
              nickname: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({ todos });
    } catch (dbError) {
      console.error('Erreur Prisma lors du chargement des todos:', dbError);
      // En cas d'erreur avec la relation, charger sans inclure le client
      const todos = await prisma.todo.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({ todos });
    }
  } catch (error) {
    console.error('Erreur lors du chargement des todos:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const todo = await prisma.todo.create({
      data: {
        contactId: body.contactId,
        customId: body.customId,
        taskName: body.taskName,
        demandeur: body.demandeur,
        generalReference: body.generalReference,
        detailedReference: body.detailedReference,
        searchStartDate: body.searchStartDate,
        searchEndDate: body.searchEndDate,
        codename: body.codename,
        accountType: body.accountType,
        accountNumber: body.accountNumber,
        tool: body.tool,
        actionType: body.actionType,
        executionDate: body.executionDate,
        result: body.result,
        log: body.log,
        status: body.status || 'todo',
        userId: payload.userId
      }
    });

    return NextResponse.json({ todo });
  } catch (error) {
    console.error('Erreur lors de la création du todo:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
