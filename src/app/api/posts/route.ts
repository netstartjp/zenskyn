import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth';
import { sanitizeHtml } from '@/lib/utils';
import rateLimit from 'next-rate-limit';

import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 requests per minute per IP
});

const prisma = new PrismaClient();

// 全ての投稿を取得 (GET)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request); // ログインユーザーのIDを取得

    const posts = await prisma.post.findMany({
      include: {
        author: { select: { id: true, name: true, customId: true } }, // customId を追加
        likes: {
          select: { userId: true }, // いいねしたユーザーのIDのみ取得
        },
        _count: {
          select: { likes: true }, // いいねの数をカウント
        },
        children: {
          include: {
            author: { select: { id: true, name: true, customId: true } }, // customId を追加
          },
          orderBy: { createdAt: 'asc' },
        },
        parent: {
          include: {
            author: { select: { id: true, name: true, customId: true } }, // customId を追加
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 各投稿に対して、ログインユーザーがいいねしているかどうかのフラグを追加
    const postsWithLikeStatus = posts.map((post: {
      id: number;
      content: string;
      createdAt: Date;
      author: { id: number; name: string | null; customId: string | null; };
      likes: { userId: number; }[];
      _count: { likes: number; };
      children: { id: number; content: string; createdAt: Date; author: { id: number; name: string | null; customId: string | null; }; }[];
      parent: { id: number; content: string; createdAt: Date; author: { id: number; name: string | null; customId: string | null; }; } | null;
    }) => ({
      ...post,
      likedByCurrentUser: userId ? post.likes.some(like => like.userId === userId) : false,
      likesCount: post._count.likes,
    }));

    return NextResponse.json(postsWithLikeStatus);
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 新しい投稿を作成 (POST)
export async function POST(request: NextRequest) {
  try {
    await limiter.checkNext(request, 20); // 20 requests per minute per IP

    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content: rawContent, type, parentId } = await request.json();
    const content = sanitizeHtml(rawContent);

    if (!content && type !== 'REPOST') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        content,
        authorId: userId,
        type: type || 'ORIGINAL',
        parentId: parentId || null,
      },
      include: { author: { select: { id: true, name: true, customId: true } } }, // customId を追加
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}