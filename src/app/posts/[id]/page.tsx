'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../post.module.css';
import { Post as PostComponent } from '@/components/Post'; // Post コンポーネントをインポート
import { useToast } from '@/hooks/useToast.tsx';

interface PostData {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    customId?: string | null;
  };
  likedByCurrentUser: boolean;
  likesCount: number;
  type: string;
  parentId: string | null;
  children?: PostData[]; // コメントや引用
}

export default function SinglePostPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const router = useRouter();
  const postId = params.id;

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLoggedInUserId, setCurrentLoggedInUserId] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);

    // ログインユーザーのIDを取得
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        setCurrentLoggedInUserId(String(decoded.userId));
      } catch (e) {
        console.error("トークンのデコードに失敗しました", e);
        setCurrentLoggedInUserId(null);
      }
    }

    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        const errData = await res.json();
        setError(errData.error || '投稿の取得に失敗しました。');
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handlePostUpdated = () => {
    fetchPost(); // 投稿が更新されたら再フェッチ
  };

  if (loading) {
    return <div className={styles.loadingMessage}>投稿を読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  if (!post) {
    return <div className={styles.errorMessage}>投稿が見つかりませんでした。</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>投稿詳細</h1>
        <Link href="/">
          <button className={styles.backButton}>ホームに戻る</button>
        </Link>
      </header>

      <main className={styles.mainContent}>
        <PostComponent 
          post={post} 
          onPostDeleted={() => { router.push('/'); showToast({ title: '成功', description: '投稿が削除されました。', variant: 'success' }); }} 
          currentUserId={currentLoggedInUserId} 
        />
      </main>
    </div>
  );
}
