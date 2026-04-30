import { NextRequest, NextResponse } from 'next/server';
import { Status } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Helper to convert BigInt values to numbers
function toNum(value: unknown): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return Number(value) || 0;
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Total reservations
    const totalRaw = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM Reservation`;
    const total = toNum(totalRaw[0].count);

    // Count by status
    const approvedRaw = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM Reservation WHERE status = 'APPROVED'`;
    const approved = toNum(approvedRaw[0].count);
    const rejectedRaw = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM Reservation WHERE status = 'REJECTED'`;
    const rejected = toNum(rejectedRaw[0].count);
    const pendingRaw = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM Reservation WHERE status = 'PENDING'`;
    const pending = toNum(pendingRaw[0].count);

    // Total users
    const usersRaw = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM User`;
    const totalUsers = toNum(usersRaw[0].count);

    // Most used laboratories with utilization %
    const labUsage = await prisma.$queryRaw<{ labName: string; count: bigint }[]>`
      SELECT l.name as labName, CAST(COUNT(r.id) AS INTEGER) as count
      FROM Laboratory l
      LEFT JOIN Reservation r ON l.id = r.labId
      GROUP BY l.id, l.name
      ORDER BY count DESC
    `;
    const labUsageWithPct = labUsage.map((l) => {
      const totalSlots = 30 * 15;
      const cnt = toNum(l.count);
      const pct = totalSlots > 0 ? Math.round((cnt / totalSlots) * 100) : 0;
      return { name: l.labName, value: cnt, utilization: pct };
    });

    // Peak hours usage (all-time)
    const peakHours = await prisma.$queryRaw<{ hour: number; count: bigint }[]>`
      SELECT CAST(SUBSTR(startTime, 1, 2) AS INTEGER) as hour, COUNT(*) as count
      FROM Reservation
      WHERE status != 'REJECTED'
      GROUP BY hour
      ORDER BY hour
    `;

    const hourLabels: { [key: number]: string } = {
      7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
      12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
      18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM',
    };

    const peakHoursMap = new Map(peakHours.map((h) => [Number(h.hour), toNum(h.count)]));
    const peakHoursData = Object.keys(hourLabels).map((hour) => ({
      hour: hourLabels[Number(hour)],
      usage: peakHoursMap.get(Number(hour)) || 0,
    }));

    // Daily trends (last 30 days)
    const dailyTrends = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT date, CAST(COUNT(*) AS INTEGER) as count
      FROM Reservation
      WHERE date >= date('now', '-30 days')
      GROUP BY date
      ORDER BY date
    `;

    // Weekly trends (last 12 weeks)
    const weeklyTrends = await prisma.$queryRaw<{ week: string; count: bigint }[]>`
      SELECT strftime('%Y-W%W', date) as week, CAST(COUNT(*) AS INTEGER) as count
      FROM Reservation
      WHERE date >= date('now', '-84 days')
      GROUP BY week
      ORDER BY week
    `;
    const formatWeek = (weekStr: string) => {
      const [year, weekNum] = weekStr.split('-W');
      return `Week ${weekNum}`;
    };
    const weeklyData = weeklyTrends.map((w) => ({
      week: formatWeek(w.week),
      count: toNum(w.count),
    }));

    // Monthly trends (last 12 months)
    const monthlyTrends = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT strftime('%Y-%m', date) as month, CAST(COUNT(*) AS INTEGER) as count
      FROM Reservation
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;

    // Approval status distribution for pie chart
    const statusDistribution = [
      { status: 'Approved', value: approved },
      { status: 'Pending', value: pending },
      { status: 'Rejected', value: rejected },
    ];

    // Time slot usage frequency
    const timeSlotUsage = await prisma.$queryRaw<{ slot: string; count: bigint }[]>`
      SELECT SUBSTR(startTime, 1, 5) as slot, CAST(COUNT(*) AS INTEGER) as count
      FROM Reservation
      WHERE status != 'REJECTED'
      GROUP BY slot
      ORDER BY slot
    `;

    // Build response with all values explicitly converted to numbers
    const response = {
      total,
      approved,
      rejected,
      pending,
      totalUsers,
      labUsage: labUsageWithPct,
      peakHoursData,
      dailyTrends: dailyTrends.map((d) => ({ date: d.date, count: toNum(d.count) })),
      weeklyTrends: weeklyData,
      monthlyTrends: monthlyTrends.map((m) => ({ month: m.month, count: toNum(m.count) })),
      statusDistribution,
      timeSlotUsage: timeSlotUsage.map((t) => ({
        slot: t.slot,
        count: toNum(t.count),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
