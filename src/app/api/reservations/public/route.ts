import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Status } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const labId = searchParams.get('labId');

    const where: any = {
      status: Status.APPROVED,
    };

    if (date) where.date = date;
    if (labId) where.labId = labId;

    const reservations = await prisma.reservation.findMany({
      where,
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        lab: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('GET /api/reservations/public error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
