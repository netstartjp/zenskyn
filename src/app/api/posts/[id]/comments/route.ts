import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// 特定の投稿のコメントを取得 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid Post ID' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 新しいコメントを作成 (POST)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid Post ID' }, { status: 400 });
    }

    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        postId,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
