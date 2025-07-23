'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './Timeline.module.css'; // Post.module.css がないため、Timeline.module.css を仮に使用
import { useToast } from '@/hooks/useToast.tsx';
import { useClickableToastPopover } from '@/hooks/useClickableToastPopover';
import { CommentForm } from '@/components/CommentForm';

interface PostType {
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
  type: string;
  parentId: string | null;
  children?: PostType[]; // children を追加
}

interface PostProps {
  post: PostType;
  onPostDeleted?: () => void;
  currentUserId: string | null; // 追加
}

export const Post = ({ post, onPostDeleted, currentUserId }: PostProps) => {
  const { showToast } = useToast();
  const { showPopover } = useClickableToastPopover();
  const [liked, setLiked] = useState(post.likedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostType[]>(post.children || []);

  useEffect(() => {
    setComments(post.children || []);
  }, [post.children]);

  const handleDeleteComment = async (commentId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast({ title: "エラー", description: "コメントを削除するにはログインが必要です。", variant: "error" });
      return;
    }

    showPopover({
      anchorElement: event.currentTarget,
      title: "確認",
      description: "このコメントを削除してもよろしいですか？",
      variant: "warning",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (res.ok) {
            showToast({ title: "成功", description: "コメントが削除されました！", variant: "success" });
            if (onPostDeleted) { // コメント削除後もタイムラインを更新
              onPostDeleted();
            }
          } else {
            const data = await res.json();
            showToast({ title: "エラー", description: data.error || 'コメントの削除に失敗しました。', variant: "error" });
          }
        } catch (err) {
          showToast({ title: "エラー", description: '予期せぬエラーが発生しました。', variant: "error" });
        }
      },
      onCancel: () => {
        showToast({ title: "キャンセル", description: "コメントの削除をキャンセルしました。", variant: "info" });
      },
    });
  };

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast({ title: 'エラー', description: 'ログインしてください。', variant: 'error' });
      return;
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      } else {
        const errorData = await res.json();
        showToast({ title: 'エラー', description: errorData.error || 'いいねに失敗しました。', variant: 'error' });
      }
    } catch (error) {
      showToast({ title: 'エラー', description: 'ネットワークエラーが発生しました。', variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('本当にこの投稿を削除しますか？')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showToast({ title: 'エラー', description: 'ログインしてください。', variant: 'error' });
      return;
    }

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        showToast({ title: '成功', description: '投稿を削除しました。', variant: 'success' });
        if (onPostDeleted) {
          onPostDeleted();
        }
      } else {
        const errorData = await res.json();
        showToast({ title: 'エラー', description: errorData.error || '投稿の削除に失敗しました。', variant: 'error' });
      }
    } catch (error) {
      showToast({ title: 'エラー', description: 'ネットワークエラーが発生しました。', variant: 'error' });
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`; // 投稿のURLを生成
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        showPopover({ title: '成功', description: '投稿URLをコピーしました！', variant: 'success', anchorElement: shareButtonRef.current! });
      })
      .catch(() => {
        showPopover({ title: 'エラー', description: 'URLのコピーに失敗しました。', variant: 'error', anchorElement: shareButtonRef.current! });
      });
  };

  const renderContentWithMentions = (content: string) => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    content.replace(mentionRegex, (match, customId, index) => {
      // メンション前のテキストを追加
      if (index > lastIndex) {
        parts.push(content.substring(lastIndex, index));
      }
      // メンション部分を強調表示
      parts.push(
        <Link key={index} href={`/users/@${customId}`} className={styles.mentionLink}>
          {match}
        </Link>
      );
      lastIndex = index + match.length;
      return match; // replace の戻り値として必要
    });

    // メンション後の残りのテキストを追加
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    return parts;
  };

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <Link href={`/users/${post.author.id}`} className={styles.postAuthor}>
          {post.author.name || '名無しユーザー'}
          {post.author.customId && <span className={styles.postAuthorCustomId}> @{post.author.customId}</span>} {/* customId を表示 */}
        </Link>
        <span className={styles.postDate}>{new Date(post.createdAt).toLocaleString()}</span>
      </div>
      <p className={styles.postContent}>{renderContentWithMentions(post.content)}</p>
      <div className={styles.postActions}>
        <button onClick={handleLike} className={`${styles.likeButton} ${liked ? styles.liked : ''}`}>
          いいね ({likesCount})
        </button>
        <button onClick={() => setShowComments(!showComments)} className={styles.commentButton}>コメント</button>
        <button ref={shareButtonRef} onClick={handleShare} className={styles.shareButton}>共有</button>
        {currentUserId && post.author.id === currentUserId && (
          <button onClick={handleDelete} className={styles.deleteButton}>削除</button>
        )}
      </div>

      {showComments && (
        <div className={styles.commentsSection}>
          <h4 className={styles.commentsTitle}>リプライ ({(post.children ?? []).filter(child => child.type === 'REPLY').length || 0})</h4>
          {(comments ?? []).filter(child => child.type === 'REPLY').length > 0 ? (
            <div className={styles.commentList}>
              {(comments ?? []).filter(child => child.type === 'REPLY').map((reply) => (
                <div key={reply.id} className={styles.commentItem}>
                  <Link href={`/users/${reply.author.id}`} className={styles.commentAuthor}>
                    {reply.author.name || `ユーザー ${reply.author.id}`}
                  </Link>
                  <span className={styles.commentDate}>
                    {new Date(reply.createdAt).toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className={styles.commentContent}>{reply.content}</p>
                  {currentUserId === reply.author.id && (
                    <button 
                      onClick={(event) => handleDeleteComment(reply.id, event)}
                      className={styles.deleteCommentButton}
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noCommentsMessage}>まだリプライがありません。</p>
          )}
          <CommentForm postId={post.id} onCommentSuccess={() => {
            // コメント投稿後にコメントリストを再フェッチまたは追加
            // ここではシンプルに再フェッチをトリガー
            // 理想的には、APIから新しいコメントを取得して comments ステートに追加する
            // ただし、Post.tsx は PostType をプロップとして受け取るため、
            // 親コンポーネント (Timeline.tsx) がコメントを再フェッチして Post に渡すのが自然
            // ここでは onPostDeleted を呼び出すことで、親が再フェッチするように促す
            // onPostDeleted(); // 親の再フェッチは不要
            // 新しいコメントをAPIから取得して comments ステートに追加するロジックをここに実装
            // 例: fetch(`/api/posts/${post.id}`).then(res => res.json()).then(data => setComments(data.children));
            // または、CommentForm から新しいコメントが返されるようにする
            // 今回はシンプルに onPostDeleted を呼び出すことで、親コンポーネントに更新を促す
            if (onPostDeleted) {
              onPostDeleted();
            }
          }} />
        </div>
      )}
    </div>
  );
};