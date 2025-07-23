import { NextResponse, NextRequest } from 'next/server';
import { getUserIdFromRequest, getIsAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const isAdmin = getIsAdminFromRequest(request);

    return NextResponse.json({
      loggedIn: !!userId,
      userId: userId || null,
      isAdmin: isAdmin,
    });
  } catch (error) {
    console.error('Error fetching auth status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}