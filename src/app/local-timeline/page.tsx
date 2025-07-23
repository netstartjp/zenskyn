'use client';

import { useEffect, useState, useCallback } from 'react';
import { Timeline } from '@/components/Timeline';
import styles from './local-timeline.module.css';

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
  };
  likedByCurrentUser: boolean;
  likesCount: number;
  type: string;
  parentId: string | null;
  parent?: Post;
  children?: Post[];
}

export default function LocalTimelinePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocalTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fediverse/local-timeline');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'ローカルタイムラインの取得に失敗しました。');
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocalTimeline(); // 初回ロード時

    const intervalId = setInterval(() => {
      fetchLocalTimeline(); // 10秒ごとに更新
    }, 10000); // 10秒

    return () => clearInterval(intervalId); // クリーンアップ
  }, [fetchLocalTimeline]);

  if (loading) {
    return <div className={styles.loadingMessage}>ローカルタイムラインを読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ZenSky タイムライン</h1>
      {posts.length === 0 ? (
        <p className={styles.noPosts}>まだ投稿がありません。</p>
      ) : (
        <Timeline posts={posts} onPostDeleted={fetchLocalTimeline} />
      )}
    </div>
  );
}
