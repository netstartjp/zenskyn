import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ hasUsers: userCount > 0 });
  } catch (error) {
    console.error('Error checking user count:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}