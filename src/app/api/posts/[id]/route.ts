import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest, getIsAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid Post ID' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, name: true, customId: true } },
        likes: { select: { userId: true } },
        _count: { select: { likes: true } },
        children: {
          include: {
            author: { select: { id: true, name: true, customId: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        parent: {
          include: {
            author: { select: { id: true, name: true, customId: true } },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const userId = getUserIdFromRequest(request);

    const postWithStatus = {
      ...post,
      likedByCurrentUser: userId ? post.likes.some((like: { userId: number }) => like.userId === userId) : false,
      likesCount: post._count.likes,
    };

    return NextResponse.json(postWithStatus);
  } catch (error) {
    console.error('Get single post error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid Post ID' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 自分の投稿を削除するか、管理者である場合にのみ許可
    if (post.authorId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own posts or be an admin' }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}