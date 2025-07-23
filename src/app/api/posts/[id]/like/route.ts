import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// いいねを追加 (POST)
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

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json({ message: 'Already liked' }, { status: 200 });
    }

    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    return NextResponse.json({ message: 'Post liked successfully' }, { status: 201 });
  } catch (error) {
    console.error('Like post error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// いいねを削除 (DELETE)
export async function DELETE(
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

    const deletedLike = await prisma.like.deleteMany({
      where: {
        userId,
        postId,
      },
    });

    if (deletedLike.count === 0) {
      return NextResponse.json({ message: 'Like not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Like removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Unlike post error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}