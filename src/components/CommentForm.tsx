'use client';

import { useState } from 'react';
import styles from './CommentForm.module.css';

interface CommentFormProps {
  postId: string;
  onCommentSuccess: () => void;
  type?: string; // 'REPLY', 'QUOTE'
}

export const CommentForm = ({ postId, onCommentSuccess, type = 'REPLY' }: CommentFormProps) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('投稿するにはログインが必要です。');
      return;
    }

    if (!content.trim() && type !== 'REPOST') {
      setError('内容を入力してください。');
      return;
    }

    try {
      const res = await fetch(`/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content, type, parentId: postId }),
      });

      if (res.ok) {
        setContent('');
        onCommentSuccess();
      } else {
        const data = await res.json();
        setError(data.error || '投稿に失敗しました。');
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました。');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.commentForm}>
      {type !== 'REPOST' && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={type === 'REPLY' ? "コメントを追加..." : "引用コメントを追加..."}
          className={styles.textareaField}
          rows={2}
          required={type !== 'REPOST'}
        ></textarea>
      )}
      {error && <p className={styles.errorMessage}>{error}</p>}
      <button type="submit" className={styles.submitButton}>
        {type === 'REPLY' ? 'コメント' : type === 'QUOTE' ? '引用投稿' : 'リポスト'}
      </button>
    </form>
  );
};