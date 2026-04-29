import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: adminId } = await context.params;

    // Prevent deleting yourself
    if (adminId === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin account' },
        { status: 400 }
      );
    }

    // Check if user exists and is an admin
    const targetUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 400 }
      );
    }

    // Count total admins
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });

    // Prevent deleting the last admin
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last admin account' },
        { status: 400 }
      );
    }

    // Delete the admin (or change role to USER - let's change to USER instead of delete)
    await prisma.user.update({
      where: { id: adminId },
      data: { role: Role.USER },
    });

    return NextResponse.json({ message: 'Admin role removed successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/admins/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
