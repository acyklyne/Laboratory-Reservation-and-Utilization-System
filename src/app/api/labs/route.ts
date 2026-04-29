import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const labs = await prisma.laboratory.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(labs);
  } catch (error) {
    console.error('GET /api/labs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
