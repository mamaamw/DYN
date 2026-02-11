import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET all currencies
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const currencies = await prisma.currency.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { code: 'asc' }
      ]
    });

    return NextResponse.json(currencies);
  } catch (error: any) {
    console.error('GET /api/admin/currencies error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new currency
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, symbol, isDefault, isActive } = body;

    if (!code || !name || !symbol) {
      return NextResponse.json(
        { error: 'Code, name, and symbol are required' },
        { status: 400 }
      );
    }

    // If this currency should be default, unset other defaults
    if (isDefault) {
      await prisma.currency.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const currency = await prisma.currency.create({
      data: {
        code: code.toUpperCase(),
        name,
        symbol,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(currency);
  } catch (error: any) {
    console.error('POST /api/admin/currencies error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update currency
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, code, name, symbol, isDefault, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Currency ID is required' }, { status: 400 });
    }

    // If this currency should be default, unset other defaults
    if (isDefault) {
      await prisma.currency.updateMany({
        where: { 
          isDefault: true,
          NOT: { id }
        },
        data: { isDefault: false }
      });
    }

    const currency = await prisma.currency.update({
      where: { id },
      data: {
        code: code?.toUpperCase(),
        name,
        symbol,
        isDefault,
        isActive
      }
    });

    return NextResponse.json(currency);
  } catch (error: any) {
    console.error('PUT /api/admin/currencies error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE currency
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Currency ID is required' }, { status: 400 });
    }

    // Check if currency is in use
    const walletsCount = await prisma.wallet.count({
      where: { currency: (await prisma.currency.findUnique({ where: { id: parseInt(id) } }))?.code }
    });

    if (walletsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete currency that is in use by wallets' },
        { status: 400 }
      );
    }

    await prisma.currency.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/currencies error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
