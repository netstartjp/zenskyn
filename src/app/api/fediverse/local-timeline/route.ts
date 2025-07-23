import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const fediverseInstanceUrl = process.env.FEDIVERSE_INSTANCE_URL;

  if (!fediverseInstanceUrl) {
    return NextResponse.json({ error: 'Fediverse instance URL is not configured.' }, { status: 500 });
  }

  try {
    // MisskeyのグローバルタイムラインAPIエンドポイント
    const misskeyApiUrl = `${fediverseInstanceUrl}/api/notes/local-timeline`;

    const response = await fetch(misskeyApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // MisskeyのAPIはPOSTリクエストでボディを要求することが多い
      body: JSON.stringify({
        limit: 40, // 取得する投稿数
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch Misskey global timeline: ${response.status} ${response.statusText} - ${errorText}`);
      return NextResponse.json({ error: `Failed to fetch global timeline from Fediverse instance: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();

    // Misskeyのノート（投稿）データをアプリケーションのPostインターフェースにマッピング
    const mappedPosts = data.map((note: any) => ({
      id: `misskey-${note.id}`, // 衝突を避けるためにプレフィックスを追加
      content: note.text || '', // テキストコンテンツ
      createdAt: note.createdAt, // 投稿日時
      author: {
        id: `misskey-user-${note.user.id}`, // ユーザーIDにもプレフィックス
        name: note.user.name || note.user.username, // ユーザー名
      },
      // Misskeyの投稿にはlikedByCurrentUserやlikesCountが直接含まれない場合があるため、デフォルト値
      likedByCurrentUser: false,
      likesCount: note.reactions ? Object.values(note.reactions).reduce((sum: any, count: any) => sum + count, 0) : 0, // リアクションの合計をいいね数とする
      type: 'ORIGINAL', // Misskeyの投稿タイプを考慮しない
      parentId: null, // Misskeyのリプライや引用は複雑なため、最初の実装では考慮しない
      parent: undefined,
      children: [],
    }));

    return NextResponse.json(mappedPosts);
  } catch (error) {
    console.error('Error fetching Misskey global timeline:', error);
    return NextResponse.json({ error: 'Internal Server Error while fetching global timeline.' }, { status: 500 });
  }
}
