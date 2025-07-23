import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getUserIdFromRequest, getIsAdminFromRequest } from '@/lib/auth';
import bcrypt from 'bcrypt';

import { sanitizeHtml } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const identifier = params.id; // id または customId

    let user;
    if (!isNaN(parseInt(identifier))) { // 数値IDの場合
      user = await prisma.user.findUnique({
        where: { id: parseInt(identifier, 10) },
      });
    } else { // カスタムIDの場合
      user = await prisma.user.findUnique({
        where: { customId: identifier },
      });
    }

    if (!user) {
      // @カスタムID形式も考慮
      if (identifier.startsWith('@')) {
        user = await prisma.user.findUnique({
          where: { customId: identifier.substring(1) },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUserId = getUserIdFromRequest(request);

    // select 句をユーザーが見つかった後に適用
    const selectedUser = await prisma.user.findUnique({
      where: { id: user.id }, // 取得したユーザーのIDを使用
      select: {
        id: true,
        email: currentUserId === user.id, // ログインユーザーが自身のプロフィールを閲覧している場合のみメールアドレスを返す
        name: true,
        bio: true,
        profileImageUrl: true,
        isAdmin: true, // isAdminも取得できるように変更
        createdAt: true,
        customId: true, // customIdも取得
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, customId: true } }, // author.customIdも取得
            likes: { select: { userId: true } },
            _count: { select: { likes: true } },
            children: { // children も含める
              include: {
                author: { select: { id: true, name: true, customId: true } },
              },
            },
          },
        },
      },
    });

    if (!selectedUser) { // selectedUserがnullになる可能性も考慮
      return NextResponse.json({ error: 'User not found after selection' }, { status: 404 });
    }

    // 各投稿に対して、いいねの状態と数を整形
    const userWithPosts = {
      ...selectedUser,
      posts: selectedUser.posts.map((post: {
        id: number;
        content: string;
        createdAt: Date;
        author: { id: number; name: string | null; customId: string | null; };
        likes: { userId: number; }[];
        _count: { likes: number; };
        children: { id: number; content: string; createdAt: Date; author: { id: number; name: string | null; customId: string | null; }; }[]; // children を追加
        parentId: number | null;
      }) => ({
        ...post,
        id: String(post.id), // idをstringに変換
        author: { ...post.author, id: String(post.author.id) }, // author.idもstringに変換
        parentId: post.parentId ? String(post.parentId) : null, // parentIdもstringに変換
        likedByCurrentUser: false, // プロフィールページではログインユーザーのいいね状態は考慮しない
        likesCount: post._count.likes,
      })),
    };

    return NextResponse.json(userWithPosts);
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = parseInt(params.id, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    const currentUserId = getUserIdFromRequest(request);
    const isAdmin = getIsAdminFromRequest(request);

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 自分のプロフィールを編集するか、管理者である場合にのみ許可
    if (currentUserId !== targetUserId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own profile or be an admin' }, { status: 403 });
    }

    const { name: rawName, bio: rawBio, profileImageUrl: rawProfileImageUrl, password } = await request.json();

    const updateData: {
      name?: string;
      bio?: string;
      profileImageUrl?: string;
      password?: string;
    } = {};

    if (rawName !== undefined) {
      // 名前が変更される場合、一意性をチェック
      if (rawName !== null) { // nullでない場合のみチェック
        const existingUserWithName = await prisma.user.findUnique({
          where: { name: rawName },
        });
        if (existingUserWithName && existingUserWithName.id !== targetUserId) {
          return NextResponse.json({ error: 'このユーザー名はすでに使用されています。' }, { status: 409 });
        }
      }
      updateData.name = sanitizeHtml(rawName);
    }
    if (rawBio !== undefined) updateData.bio = sanitizeHtml(rawBio);
    if (rawProfileImageUrl !== undefined) updateData.profileImageUrl = sanitizeHtml(rawProfileImageUrl);
    if (password !== undefined && password !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 200 });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = parseInt(params.id, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    const currentUserId = getUserIdFromRequest(request);
    const isAdmin = getIsAdminFromRequest(request);

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者のみがユーザーを削除できるようにする
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required to delete users' }, { status: 403 });
    }

    // 削除対象が自分自身の場合、管理者であっても削除を許可しない（システムから管理者がいなくなるのを防ぐため）
    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: 'Forbidden: Cannot delete your own admin account' }, { status: 403 });
    }

    const userToDelete = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: targetUserId } });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
