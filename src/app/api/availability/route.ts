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

    if (!labId || !date) {
      return NextResponse.json({ error: 'labId and date are required' }, { status: 400 });
    }

    // Get lab info
    const lab = await prisma.laboratory.findUnique({ where: { id: labId } });
    if (!lab) {
      return NextResponse.json({ error: 'Laboratory not found' }, { status: 404 });
    }

    // Get all reservations for this lab on this date
    const reservations = await prisma.reservation.findMany({
      where: {
        labId,
        date,
        status: { in: [Status.PENDING, Status.APPROVED] },
      },
      orderBy: { startTime: 'asc' },
    });

    // Generate available slots (7:00 - 22:00, 30-min intervals)
    const availableSlots = [];
    for (let hour = 7; hour < 22; hour++) {
      for (const minute of [0, 30]) {
        const slotStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const nextHour = minute === 30 ? hour + 1 : hour;
        const nextMinute = minute === 30 ? 0 : 30;
        if (nextHour >= 22) continue;
        const slotEnd = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;

        const isBooked = reservations.some(
          (res) => slotStart < res.endTime && slotEnd > res.startTime
        );

        if (!isBooked) {
          availableSlots.push({ start: slotStart, end: slotEnd, available: true });
        } else {
          availableSlots.push({ start: slotStart, end: slotEnd, available: false });
        }
      }
    }

    return NextResponse.json({
      lab: { id: lab.id, name: lab.name, status: lab.status },
      date,
      reservations: reservations.map((r) => ({
        id: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        status: r.status,
      })),
      availableSlots,
    });
  } catch (error) {
    console.error('GET /api/availability error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
