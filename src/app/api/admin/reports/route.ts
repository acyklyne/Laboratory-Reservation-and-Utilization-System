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

    // Most used laboratories with utilization %
    const labUsage = await prisma.$queryRaw<
      { labName: string; count: number; totalSlots: number }[]
    >`
      SELECT
        l.name as labName,
        COUNT(r.id) as count,
        (SELECT COUNT(*) FROM Reservation WHERE labId = l.id AND date >= date('now', '-30 days')) as totalSlots
      FROM Laboratory l
      LEFT JOIN Reservation r ON l.id = r.labId AND r.date >= date('now', '-30 days')
      GROUP BY l.id, l.name
      ORDER BY count DESC
    `;
    const labUsageWithPct = labUsage.map((l) => {
      const totalSlots = (30 * 15); // ~15 slots per day * 30 days = 450 possible slots
      const pct = totalSlots > 0 ? Math.round((Number(l.count) / totalSlots) * 100) : 0;
      return { name: l.labName, value: Number(l.count), utilization: pct };
    });

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

    // Weekly trends (last 8 weeks)
    const weeklyTrends = await prisma.$queryRaw<
      { week: string; count: number }[]
    >`
      SELECT strftime('%Y-W%W', date) as week, COUNT(*) as count
      FROM Reservation
      WHERE date >= date('now', '-56 days')
      GROUP BY week
      ORDER BY week
    `;
    // Format week labels for display
    const formatWeek = (weekStr: string) => {
      const [year, weekNum] = weekStr.split('-W');
      return `Week ${weekNum}`;
    };
    const weeklyData = weeklyTrends.map((w) => ({
      week: formatWeek(w.week),
      count: Number(w.count),
    }));

    // Monthly trends (last 6 months)
    const monthlyTrends = await prisma.$queryRaw<
      { month: string; count: number }[]
    >`
      SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
      FROM Reservation
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `;

    // Approval status distribution for pie chart
    const statusDistribution = [
      { status: 'Approved', value: approved },
      { status: 'Pending', value: pending },
      { status: 'Rejected', value: rejected },
    ];

    // Time slot usage frequency
    const timeSlotUsage = await prisma.$queryRaw<
      { slot: string; count: number }[]
    >`
      SELECT SUBSTR(startTime, 1, 5) as slot, COUNT(*) as count
      FROM Reservation
      WHERE status != 'REJECTED'
      GROUP BY slot
      ORDER BY slot
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
      weeklyTrends,
      monthlyTrends,
      statusDistribution,
      timeSlotUsage: timeSlotUsage.map((t) => ({
        slot: `${t.slot}`,
        count: Number(t.count),
      })),
    });
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
