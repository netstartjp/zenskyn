import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest, getIsAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const isAdmin = getIsAdminFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = parseInt(params.id, 10);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid Comment ID' }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // 自分のコメントを削除するか、管理者である場合にのみ許可
    if (comment.authorId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own comments or be an admin' }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: 'Comment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
