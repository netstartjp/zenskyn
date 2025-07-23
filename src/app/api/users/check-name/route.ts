import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const userId = searchParams.get('userId'); // オプション：自分自身の名前を除外するため

  if (!name) {
    return NextResponse.json({ error: '名前が指定されていません。' }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { name: name },
      select: { id: true },
    });

    if (existingUser) {
      // 自分自身のユーザー名であれば重複とみなさない
      if (userId && existingUser.id === parseInt(userId, 10)) {
        return NextResponse.json({ exists: false });
      }
      return NextResponse.json({ exists: true, userId: existingUser.id });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('ユーザー名チェックエラー:', error);
    return NextResponse.json({ error: 'ユーザー名のチェック中にエラーが発生しました。' }, { status: 500 });
  }
}
