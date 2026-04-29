import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Status } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const labId = searchParams.get('labId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    const where: any = {};

    if (user.role !== 'ADMIN') {
      where.userId = user.id;
    }

    if (labId) where.labId = labId;
    if (date) where.date = date;
    if (status) where.status = status as Status;

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        lab: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('GET /api/reservations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { labId, date, startTime, endTime, purpose } = body;

    if (!labId || !date || !startTime || !endTime || !purpose) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json({ error: 'Invalid time format. Use HH:mm (24-hour)' }, { status: 400 });
    }

    const startParts = startTime.split(':');
    const endParts = endTime.split(':');
    const startHour = parseInt(startParts[0]);
    const endHour = parseInt(endParts[0]);
    const endMinute = parseInt(endParts[1]);

    if (startHour < 7 || startHour >= 22) {
      return NextResponse.json(
        { error: 'Reservations are only allowed between 7:00 AM and 10:00 PM.' },
        { status: 400 }
      );
    }

    if (endHour > 22 || (endHour === 22 && endMinute > 0)) {
      return NextResponse.json(
        { error: 'Reservations must end by 10:00 PM.' },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time.' },
        { status: 400 }
      );
    }

    const lab = await prisma.laboratory.findUnique({ where: { id: labId } });
    if (!lab) {
      return NextResponse.json({ error: 'Laboratory not found' }, { status: 404 });
    }

    const existingReservations = await prisma.reservation.findMany({
      where: {
        labId,
        date,
        status: { in: [Status.PENDING, Status.APPROVED] },
      },
    });

    const hasConflict = existingReservations.some((res) => {
      return startTime < res.endTime && endTime > res.startTime;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: 'This time slot conflicts with an existing reservation.' },
        { status: 409 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: user.id,
        labId,
        date,
        startTime,
        endTime,
        purpose,
        status: Status.PENDING,
      },
      include: {
        lab: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error('POST /api/reservations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
