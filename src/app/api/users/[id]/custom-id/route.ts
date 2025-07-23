import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const targetUserId = parseInt(params.id);
    const currentUserId = getUserIdFromRequest(request);

    // 認証チェックと認可チェック
    if (!currentUserId || currentUserId !== targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customId } = await request.json();

    // customId のバリデーション
    if (!customId || typeof customId !== 'string') {
      return NextResponse.json({ error: 'customId is required and must be a string' }, { status: 400 });
    }

    // 形式のバリデーション (英数字とアンダースコアのみ、3文字以上20文字以下)
    const customIdRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!customIdRegex.test(customId)) {
      return NextResponse.json({ error: 'Invalid customId format. Use 3-20 alphanumeric characters or underscores.' }, { status: 400 });
    }

    // ユニーク性チェック
    const existingUserWithCustomId = await prisma.user.findUnique({ where: { customId } });
    if (existingUserWithCustomId && existingUserWithCustomId.id !== targetUserId) {
      return NextResponse.json({ error: 'This customId is already taken' }, { status: 409 });
    }

    // ユーザーの customId を更新
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { customId },
      select: { id: true, name: true, customId: true }, // 更新後の情報を返す
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating customId:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
