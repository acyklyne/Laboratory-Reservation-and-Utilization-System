import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '@/lib/auth';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error('GET /api/admin/admins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: Role.ADMIN,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(admin, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/admins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
