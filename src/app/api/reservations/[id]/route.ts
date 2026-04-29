import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Status } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update reservation status
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    if (!status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Valid status required (PENDING, APPROVED, REJECTED)' }, { status: 400 });
    }

    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: status as Status,
        adminNotes: adminNotes || null,
      },
      include: { lab: { select: { name: true } }, user: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ reservation: updated });
  } catch (error) {
    console.error(`PATCH /api/reservations/[id] error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
