import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('=== DEBUG LOGIN ===');
    console.log('Email:', email);
    console.log('Password length:', password?.length);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log('User found:', !!user);
    console.log('User active:', user?.isActive);
    console.log('Password hash exists:', !!user?.password);

    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        email,
      }, { status: 404 });
    }

    const passwordMatch = await verifyPassword(password, user.password);
    console.log('Password match:', passwordMatch);

    return NextResponse.json({
      userExists: true,
      isActive: user.isActive,
      passwordMatch,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
