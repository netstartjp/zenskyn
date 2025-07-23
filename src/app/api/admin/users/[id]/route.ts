import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getIsAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdminRequesting = getIsAdminFromRequest(request);
    if (!isAdminRequesting) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const targetUserId = parseInt(params.id, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    const { isAdmin } = await request.json();

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: 'Invalid isAdmin value' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isAdmin: isAdmin },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user admin status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
