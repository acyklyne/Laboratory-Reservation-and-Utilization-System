import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Status } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Total reservations
    const total = await prisma.reservation.count();

    // Count by status
    const approved = await prisma.reservation.count({ where: { status: Status.APPROVED } });
    const rejected = await prisma.reservation.count({ where: { status: Status.REJECTED } });
    const pending = await prisma.reservation.count({ where: { status: Status.PENDING } });

    // Total users
    const totalUsers = await prisma.user.count();

    // Most used laboratories
    const labUsage = await prisma.$queryRaw<
      { labName: string; count: number }[]
    >`
      SELECT l.name as labName, COUNT(r.id) as count
      FROM Laboratory l
      LEFT JOIN Reservation r ON l.id = r.labId
      GROUP BY l.id, l.name
      ORDER BY count DESC
    `;

    // Peak hours usage
    const peakHours = await prisma.$queryRaw<
      { hour: number; count: number }[]
    >`
      SELECT CAST(SUBSTR(startTime, 1, 2) AS INTEGER) as hour, COUNT(*) as count
      FROM Reservation
      WHERE status != 'REJECTED'
      GROUP BY hour
      ORDER BY hour
    `;

    // Format peak hours data
    const hourLabels: { [key: number]: string } = {
      7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
      12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
      18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM',
    };

    const peakHoursData = Object.keys(hourLabels).map((hour) => ({
      hour: hourLabels[Number(hour)],
      usage: peakHours.find((h) => h.hour === Number(hour))?.count || 0,
    }));

    // Daily trends (last 7 days)
    const dailyTrends = await prisma.$queryRaw<
      { date: string; count: number }[]
    >`
      SELECT date, COUNT(*) as count
      FROM Reservation
      WHERE date >= date('now', '-7 days')
      GROUP BY date
      ORDER BY date
    `;

    return NextResponse.json({
      total,
      approved,
      rejected,
      pending,
      totalUsers,
      labUsage: labUsage.map((l) => ({ name: l.labName, value: Number(l.count) })),
      peakHoursData,
      dailyTrends,
    });
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
