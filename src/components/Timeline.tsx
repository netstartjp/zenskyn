
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './Timeline.module.css';
import { CommentForm } from './CommentForm';
import { Post } from '@/components/Post.tsx';
import { useToast } from '@/hooks/useToast.tsx';
import { useClickableToastPopover } from '@/hooks/useClickableToastPopover';

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    customId?: string | null; // customId を追加
  };
  likedByCurrentUser: boolean;
  likesCount: number;
  type: string; // PostTypeをStringに変更
  parentId: string | null;
  parent?: Post; // 親投稿のデータ
  children?: Post[]; // リプライや引用のPost
}

export const Timeline = ({ posts, onPostDeleted }: { posts: Post[], onPostDeleted: () => void }) => {
  const { showToast } = useToast();
  const { showPopover } = useClickableToastPopover();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState<string | null>(null);
  const [showRepostForm, setShowRepostForm] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        setCurrentUserId(decoded.userId);
      } catch (e) {
        console.error("トークンのデコードに失敗しました", e);
        setCurrentUserId(null);
      }
    }
  }, [posts]);

  const handleDelete = async (postId: string, event: React.MouseEvent<HTMLButtonElement>) => {
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
        // Misskeyの投稿は削除できないため、ローカルの投稿のみ削除
        if (postId.startsWith('misskey-')) {
          showToast({ title: "情報", description: "Misskeyの投稿は削除できません。", variant: "info" });
          return;
        }

        try {
          const res = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (res.ok) {
            showToast({ title: "成功", description: "投稿が正常に削除されました！", variant: "success" });
            onPostDeleted(); 
          } else {
            const data = await res.json();
            showToast({ title: "エラー", description: data.error || '投稿の削除に失敗しました。', variant: "error" });
          }
        } catch (err) {
          showToast({ title: "エラー", description: '予期せぬエラーが発生しました。', variant: "error" });
        }
      },
      onCancel: () => {
        showToast({ title: "キャンセル", description: "投稿の削除をキャンセルしました。", variant: "info" });
      },
    });
  };

  const handleLike = async (postId: string, liked: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast({ title: "エラー", description: "いいねするにはログインが必要です。", variant: "error" });
      return;
    }

    // Misskeyの投稿にはいいねできないため、ローカルの投稿のみいいね
    if (postId.startsWith('misskey-')) {
      showToast({ title: "情報", description: "Misskeyの投稿にはいいねできません。", variant: "info" });
      return;
    }

    try {
      const method = liked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        showToast({ title: "成功", description: liked ? "いいねを取り消しました。" : "投稿にいいねしました！", variant: "success" });
        onPostDeleted(); 
      } else {
        const data = await res.json();
        showToast({ title: "エラー", description: data.error || 'いいね/いいね解除に失敗しました。', variant: "error" });
      }
    } catch (err) {
      showToast({ title: "エラー", description: '予期せぬエラーが発生しました。', variant: "error" });
    }
  };

  const handleQuote = async (postId: string) => {
    // Misskeyの投稿は引用できないため、ローカルの投稿のみ引用
    if (postId.startsWith('misskey-')) {
      showToast({ title: "情報", description: "Misskeyの投稿は引用できません。", variant: "info" });
      return;
    }
    setShowQuoteForm(postId);
    setShowRepostForm(null);
  };

  const handleRepost = async (postId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast({ title: "エラー", description: "リポストするにはログインが必要です。", variant: "error" });
      return;
    }

    // Misskeyの投稿はリポストできないため、ローカルの投稿のみリポスト
    if (postId.startsWith('misskey-')) {
      showToast({ title: "情報", description: "Misskeyの投稿はリポストできません。", variant: "info" });
      return;
    }

    showPopover({
      anchorElement: event.currentTarget,
      title: "確認",
      description: "この投稿をリポストしてもよろしいですか？",
      variant: "info",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/posts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ content: "", type: 'REPOST', parentId: postId }),
          });

          if (res.ok) {
            showToast({ title: "成功", description: "投稿をリポストしました！", variant: "success" });
            onPostDeleted(); // タイムラインを再フェッチ
          } else {
            const data = await res.json();
            showToast({ title: "エラー", description: data.error || 'リポストに失敗しました。', variant: "error" });
          }
        } catch (err) {
          showToast({ title: "エラー", description: '予期せぬエラーが発生しました。', variant: "error" });
        }
      },
      onCancel: () => {
        showToast({ title: "キャンセル", description: "リポストをキャンセルしました。", variant: "info" });
      },
    });
  };

  if (!posts || posts.length === 0) {
    return (
      <div className={styles.noPostsMessage}>
        <p>まだ投稿がありません。最初の投稿をしてみましょう！</p>
      </div>
    );
  }

  return (
    <div className={styles.timelineContainer}>
      {posts.map((post) => (
        <Post key={post.id} post={post} onPostDeleted={onPostDeleted} currentUserId={currentUserId} />
      ))}
    </div>
  );
};
