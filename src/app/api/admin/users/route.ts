import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getIsAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const isAdmin = getIsAdminFromRequest(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profileImageUrl: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}