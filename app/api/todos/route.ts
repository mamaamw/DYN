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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      userId: payload.userId,
      deletedAt: null
    };

    if (status) {
      where.status = status;
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ todos });
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
