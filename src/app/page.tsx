'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { PostForm } from '@/components/PostForm';
import { Timeline } from '@/components/Timeline';
import { AdminSetupForm } from '@/components/AdminSetupForm';
import styles from './page.module.css';
import Link from 'next/link';

export default function Home() {
  const [authStatus, setAuthStatus] = useState<{ loggedIn: boolean; userId: number | null; isAdmin: boolean } | null>(null);
  const [posts, setPosts] = useState([]);
  const [hasUsers, setHasUsers] = useState<boolean | undefined>(undefined); // undefined: チェック中
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const fetchPosts = useCallback(async () => {
    console.log('fetchPosts called');
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  }, []);

  const checkUsers = useCallback(async () => {
    console.log('checkUsers called');
    try {
      const res = await fetch('/api/admin/check');
      if (res.ok) {
        const data = await res.json();
        console.log('checkUsers API response:', data);
        setHasUsers(data.hasUsers);
      } else {
        console.error('Failed to check users:', await res.json());
        setHasUsers(true); // エラー時は安全側に倒してユーザーがいるとみなす
      }
    } catch (error) {
      console.error('Error checking users:', error);
      setHasUsers(true); // エラー時は安全側に倒してユーザーがいるとみなす
    }
  }, []);

  const fetchAuthStatus = useCallback(async () => {
    console.log('fetchAuthStatus called');
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthStatus({ loggedIn: false, userId: null, isAdmin: false });
      return;
    }
    try {
      const res = await fetch('/api/auth/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Auth Status API response:', data);
        setAuthStatus(data);
      } else {
        console.error('Failed to fetch auth status:', await res.json());
        setAuthStatus({ loggedIn: false, userId: null, isAdmin: false });
        localStorage.removeItem('token'); // 無効なトークンは削除
      }
    } catch (error) {
      console.error('Error fetching auth status:', error);
      setAuthStatus({ loggedIn: false, userId: null, isAdmin: false });
      localStorage.removeItem('token');
    }
  }, []);

  useEffect(() => {
    console.log('Initial useEffect: Calling checkUsers and fetchPosts');
    checkUsers(); 
    fetchPosts();
  }, [checkUsers, fetchPosts]); 

  useEffect(() => {
    console.log('Auth Status useEffect: hasUsers=', hasUsers);
    if (hasUsers !== undefined) { // hasUsersのチェックが完了したら認証ステータスを取得
      fetchAuthStatus();
    }
  }, [hasUsers, fetchAuthStatus]);

  const handleAuthSuccess = () => {
    console.log('handleAuthSuccess called');
    fetchAuthStatus(); // 認証成功後に認証ステータスを再取得
    fetchPosts();
  };

  const handlePostSuccess = () => {
    console.log('handlePostSuccess called');
    fetchPosts();
  };

  const handleLogout = () => {
    console.log('handleLogout called');
    localStorage.removeItem('token');
    setAuthStatus({ loggedIn: false, userId: null, isAdmin: false });
  };

  const handleAdminSetupComplete = async () => {
    console.log('handleAdminSetupComplete called');
    await checkUsers(); // 管理者アカウント作成後、再度ユーザーの存在をチェック
    fetchAuthStatus(); // 認証ステータスを再取得
  };

  console.log('Render: hasUsers=', hasUsers, 'authStatus=', authStatus);

  if (hasUsers === undefined || authStatus === null) {
    return <div className={styles.loadingMessage}>読み込み中...</div>;
  }

  if (!hasUsers) {
    return <AdminSetupForm onSetupComplete={handleAdminSetupComplete} />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>SNS</h1>
      </header>
      
      <main className={styles.mainContent}>
        {authStatus.loggedIn ? (
          <section>
            <h2 className={styles.sectionTitle}>投稿を作成</h2>
            <PostForm onPostSuccess={handlePostSuccess} />
          </section>
        ) : (
          <section>
            <AuthForm onAuthSuccess={handleAuthSuccess} />
          </section>
        )}

        <section>
           <h2 className={styles.sectionTitle}>タイムライン</h2>
          <Timeline posts={posts} onPostDeleted={fetchPosts} />
        </section>
      </main>
    </div>
  );
}