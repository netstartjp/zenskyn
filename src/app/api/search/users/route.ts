import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: '検索クエリが指定されていません。' }, { status: 400 });
  }

  // @ プレフィックスがあれば除去
  if (query.startsWith('@')) {
    query = query.substring(1);
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
            },
          },
          {
            customId: {
              contains: query,
            },
          },
        ],
      },
      select: { // パスワードなどの機密情報を返さないようにする
        id: true,
        name: true,
        bio: true,
        profileImageUrl: true,
        isAdmin: true,
        createdAt: true,
        customId: true, // customId も返す
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('ユーザー検索エラー:', error);
    return NextResponse.json({ error: 'ユーザーの検索中にエラーが発生しました。' }, { status: 500 });
  }
}