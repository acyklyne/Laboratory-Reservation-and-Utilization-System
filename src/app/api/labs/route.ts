import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Status } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const labs = await prisma.laboratory.findMany({
      orderBy: { name: 'asc' },
    });

    // Check today's availability for each lab (use local date)
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    const labsWithAvailability = await Promise.all(
      labs.map(async (lab) => {
        // If lab is in Maintenance or static Unavailable, keep that status
        if (lab.status !== 'Available') {
          return { ...lab, availabilityStatus: lab.status };
        }

        // Check active reservations for today
        const reservations = await prisma.reservation.findMany({
          where: {
            labId: lab.id,
            date: todayStr,
            status: { in: [Status.PENDING, Status.APPROVED] },
          },
        });

        // Generate all 30-min slots 7:00-22:00 and check if any are free
        let availableCount = 0;
        for (let hour = 7; hour < 22; hour++) {
          for (const minute of [0, 30]) {
            const startStr = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
            const endH = minute === 30 ? hour + 1 : hour;
            const endM = minute === 30 ? 0 : 30;
            if (endH >= 22) continue;
            const endStr = String(endH).padStart(2, '0') + ':' + String(endM).padStart(2, '0');

            const isBooked = reservations.some(
              (r) => startStr < r.endTime && endStr > r.startTime
            );
            if (!isBooked) availableCount++;
          }
        }

        const availabilityStatus = availableCount > 0 ? 'Available Today' : 'Unavailable Today';
        return { ...lab, availabilityStatus };
      })
    );

    return NextResponse.json(labsWithAvailability);
  } catch (error) {
    console.error('GET /api/labs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
