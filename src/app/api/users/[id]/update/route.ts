
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest, getIsAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const isAdmin = getIsAdminFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = parseInt(params.id, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    // 自分のプロフィールを更新するか、管理者である場合にのみ許可
    if (userId !== targetUserId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own profile or be an admin' }, { status: 403 });
    }

    const { name, bio, profileImageUrl, isAdmin: newIsAdmin } = await request.json();

    const updateData: { name?: string; bio?: string; profileImageUrl?: string; isAdmin?: boolean } = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
    
    // 管理者のみがisAdminフィールドを更新できる
    if (isAdmin && newIsAdmin !== undefined) {
      updateData.isAdmin = newIsAdmin;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profileImageUrl: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
