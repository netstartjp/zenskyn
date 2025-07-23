'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './user.module.css'; // CSSモジュールは後で作成
import { Timeline } from '@/components/Timeline';

interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
  customId: string | null; // customId を追加
  posts: Post[];
}

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
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const identifier = params.id; // id または customId

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLoggedInUserId, setCurrentLoggedInUserId] = useState<number | null>(null);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    // ログインユーザーのIDを取得
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        setCurrentLoggedInUserId(decoded.userId);
      } catch (e) {
        console.error("トークンのデコードに失敗しました", e);
        setCurrentLoggedInUserId(null);
      }
    }

    try {
      const res = await fetch(`/api/users/${identifier}`); // identifier を使用
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'ユーザープロフィールの取得に失敗しました。');
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [identifier]); // 依存配列に identifier を追加

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleProfileUpdateSuccess = () => {
    setIsEditing(false);
    fetchUserProfile(); // 更新後にプロフィールを再フェッチ
  };

  const handlePostDeleted = () => {
    fetchUserProfile(); // 投稿削除後にプロフィールを再フェッチして投稿リストを更新
  };

  if (loading) {
    return <div className={styles.loadingMessage}>プロフィールを読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  if (!userProfile) {
    return <div className={styles.errorMessage}>ユーザーが見つかりませんでした。</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>ユーザープロフィール</h1>
        <Link href="/">
          <button className={styles.backButton}>ホームに戻る</button>
        </Link>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.profileCard}>
          <div className={styles.profileHeader}>
            {userProfile.profileImageUrl && (
              <img src={userProfile.profileImageUrl} alt="プロフィール画像" className={styles.profileImage} />
            )}
            <h2 className={styles.profileName}>{userProfile.name || '名無しユーザー'}</h2>
            {userProfile.customId && <p className={styles.profileCustomId}>@{userProfile.customId}</p>} {/* customId を表示 */}
            {userProfile.id === currentLoggedInUserId && (
              <button onClick={() => router.push('/settings')} className={styles.editButton}>
                プロフィールを編集
              </button>
            )}
          </div>
          <p className={styles.profileBio}>{userProfile.bio || '自己紹介がありません。'}</p>
          <p className={styles.profileJoined}>参加日: {new Date(userProfile.createdAt).toLocaleDateString()}</p>
        </section>

        <section className={styles.postsSection}>
          <h3 className={styles.sectionTitle}>{userProfile.name || 'このユーザー'}の投稿</h3>
          {userProfile.posts.length > 0 ? (
            <Timeline posts={userProfile.posts} onPostDeleted={handlePostDeleted} />
          ) : (
            <p className={styles.noPostsMessage}>まだ投稿がありません。</p>
          )}
        </section>
      </main>
    </div>
  );
}