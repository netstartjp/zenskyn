'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Timeline } from '@/components/Timeline';
import styles from './search.module.css';

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

interface User {
  id: number;
  email: string;
  name: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');

  const fetchSearchResults = useCallback(async () => {
    if (!searchQuery) {
      setLoading(false);
      setError('検索クエリがありません。');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 投稿の検索
      const postsRes = await fetch(`/api/search/posts?q=${encodeURIComponent(searchQuery)}`);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      } else {
        const errData = await postsRes.json();
        setError(errData.error || '投稿検索結果の取得に失敗しました。');
      }

      // ユーザーの検索
      const usersRes = await fetch(`/api/search/users?q=${encodeURIComponent(searchQuery)}`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      } else {
        const errData = await usersRes.json();
        setError(errData.error || 'ユーザー検索結果の取得に失敗しました。');
      }

    } catch (err) {
      setError('予期せぬエラーが発生しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  if (loading) {
    return <div className={styles.loadingMessage}>検索中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>検索結果: "{searchQuery}"</h1>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'posts' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          投稿 ({posts.length})
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'users' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('users')}
        >
          ユーザー ({users.length})
        </button>
      </div>

      {activeTab === 'posts' && (
        posts.length === 0 ? (
          <p className={styles.noResults}>該当する投稿は見つかりませんでした。</p>
        ) : (
          <Timeline posts={posts} onPostDeleted={fetchSearchResults} />
        )
      )}

      {activeTab === 'users' && (
        users.length === 0 ? (
          <p className={styles.noResults}>該当するユーザーは見つかりませんでした。</p>
        ) : (
          <div className={styles.userList}>
            {users.map((user) => (
              <div key={user.id} className={styles.userCard}>
                <Link href={`/users/${user.id}`} className={styles.userLink}>
                  {user.profileImageUrl && (
                    <img src={user.profileImageUrl} alt="プロフィール画像" className={styles.userProfileImage} />
                  )}
                  <div className={styles.userInfo}>
                    <h3 className={styles.userName}>{user.name || `ユーザー ${user.id}`}</h3>
                    {user.bio && <p className={styles.userBio}>{user.bio}</p>}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
