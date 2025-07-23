'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';
import { useToast } from '@/hooks/useToast.tsx';
import { useClickableToastPopover } from '@/hooks/useClickableToastPopover';

interface User {
  id: number;
  email: string;
  name: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
}

interface Post {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string | null;
  };
  likesCount: number;
}

export default function AdminDashboard() {
  const { showToast } = useToast();
  const { showPopover } = useClickableToastPopover();
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLoggedInUserId, setCurrentLoggedInUserId] = useState<number | null>(null);
  const router = useRouter();

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    if (!token) {
      setError('認証が必要です。');
      setLoading(false);
      router.push('/'); // ログインページへリダイレクト
      return;
    }

    try {
      // ログインユーザーのIDと管理者権限を取得
      const adminCheckRes = await fetch('/api/auth/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const adminCheckData = await adminCheckRes.json();

      if (!adminCheckRes.ok || !adminCheckData.isAdmin) {
        setError('管理者権限がありません。');
        setLoading(false);
        router.push('/');
        return;
      }
      setCurrentLoggedInUserId(adminCheckData.userId);

      // ユーザーデータの取得
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      } else {
        const errData = await usersRes.json();
        setError(errData.error || 'ユーザーデータの取得に失敗しました。');
      }

      // 投稿データの取得
      const postsRes = await fetch('/api/posts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      } else {
        const errData = await postsRes.json();
        setError(errData.error || '投稿データの取得に失敗しました。');
      }

    } catch (err) {
      setError('データの取得中に予期せぬエラーが発生しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleDeleteUser = async (userId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast({ title: "エラー", description: "ユーザーを削除するにはログインが必要です。", variant: "error" });
      return;
    }

    showPopover({
      anchorElement: event.currentTarget,
      title: "確認",
      description: "このユーザーを削除してもよろしいですか？この操作は元に戻せません。",
      variant: "warning",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            showToast({ title: "成功", description: 'ユーザーが削除されました。', variant: "success" });
            fetchAdminData();
          } else {
            const errData = await res.json();
            showToast({ title: "エラー", description: errData.error || 'ユーザーの削除に失敗しました。', variant: "error" });
          }
        } catch (err) {
          showToast({ title: "エラー", description: 'ユーザー削除中にエラーが発生しました。', variant: "error" });
        }
      },
      onCancel: () => {
        showToast({ title: "キャンセル", description: "ユーザーの削除をキャンセルしました。", variant: "info" });
      },
    });
  };

  const handleToggleAdmin = async (userId: number, currentIsAdmin: boolean, event: React.MouseEvent<HTMLButtonElement>) => {

    showPopover({
      anchorElement: event.currentTarget,
      title: "確認",
      description: `このユーザーの管理者権限を${currentIsAdmin ? '解除' : '付与'}してもよろしいですか？`,
      variant: "info",
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        // ログイン中の管理者自身のisAdmin権限を解除しようとした場合、警告を出す
        if (userId === currentLoggedInUserId && currentIsAdmin) {
          showToast({ title: "警告", description: "自分自身の管理者権限を解除することはできません。システムに管理者がいなくなります。", variant: "warning" });
          return;
        }

        try {
          const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ isAdmin: !currentIsAdmin }),
          });
          if (res.ok) {
            showToast({ title: "成功", description: `ユーザーの管理者権限を${currentIsAdmin ? '解除' : '付与'}しました。`, variant: "success" });
            fetchAdminData();
          } else {
            const errData = await res.json();
            showToast({ title: "エラー", description: errData.error || '管理者権限の変更に失敗しました。', variant: "error" });
          }
        } catch (err) {
          showToast({ title: "エラー", description: '管理者権限の変更中にエラーが発生しました。', variant: "error" });
        }
      },
      onCancel: () => {
        showToast({ title: "キャンセル", description: "管理者権限の変更をキャンセルしました。", variant: "info" });
      },
    });
  };

  const handleDeletePost = async (postId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast({ title: "エラー", description: "投稿を削除するにはログインが必要です。", variant: "error" });
      return;
    }

    showPopover({
      anchorElement: event.currentTarget,
      title: "確認",
      description: "この投稿を削除してもよろしいですか？この操作は元に戻せません。",
      variant: "warning",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            showToast({ title: "成功", description: '投稿が削除されました。', variant: "success" });
            fetchAdminData();
          } else {
            const errData = await res.json();
            showToast({ title: "エラー", description: errData.error || '投稿の削除に失敗しました。', variant: "error" });
          }
        } catch (err) {
          showToast({ title: "エラー", description: '投稿削除中にエラーが発生しました。', variant: "error" });
        }
      },
      onCancel: () => {
        showToast({ title: "キャンセル", description: "投稿の削除をキャンセルしました。", variant: "info" });
      },
    });
  };

  if (loading) {
    return <div className={styles.loadingMessage}>管理者ダッシュボードを読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>管理者ダッシュボード</h1>
        <Link href="/">
          <button className={styles.backButton}>ホームに戻る</button>
        </Link>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>ユーザー管理</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名前</th>
                  <th>メール</th>
                  <th>管理者</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email}</td>
                    <td>{user.isAdmin ? 'はい' : 'いいえ'}</td>
                    <td>
                      <button onClick={() => router.push(`/users/${user.id}`)} className={styles.actionButton}>表示</button>
                      <button 
                        onClick={(event) => handleDeleteUser(user.id, event)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        disabled={user.id === currentLoggedInUserId} // ログイン中の管理者は削除不可
                      >
                        削除
                      </button>
                      <button 
                        onClick={(event) => handleToggleAdmin(user.id, user.isAdmin, event)}
                        className={`${styles.actionButton} ${user.isAdmin ? styles.revokeAdmin : styles.grantAdmin}`}
                        disabled={user.id === currentLoggedInUserId} // ログイン中の管理者は権限変更不可
                      >
                        {user.isAdmin ? '管理者解除' : '管理者付与'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>投稿管理</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>内容</th>
                  <th>投稿者</th>
                  <th>いいね数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>{post.id}</td>
                    <td>{post.content.substring(0, 50)}...</td>
                    <td>{post.author.name || `ユーザー ${post.author.id}`}</td>
                    <td>{post.likesCount}</td>
                    <td>
                      <button onClick={(event) => handleDeletePost(post.id, event)} className={`${styles.actionButton} ${styles.deleteButton}`}>削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}