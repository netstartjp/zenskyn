
import { NextResponse, NextRequest } from 'next/server';
import { getIsAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = getIsAdminFromRequest(request);
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
