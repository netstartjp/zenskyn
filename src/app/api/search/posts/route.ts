import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: '検索クエリが指定されていません。' }, { status: 400 });
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        content: {
          contains: query,
        },
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
        parent: {
          include: {
            author: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('投稿検索エラー:', error);
    return NextResponse.json({ error: '投稿の検索中にエラーが発生しました。' }, { status: 500 });
  }
}
