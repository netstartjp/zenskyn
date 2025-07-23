
'use client';

import { useState } from 'react';
import styles from './PostForm.module.css';
import { useToast } from '@/hooks/useToast.tsx';

export const PostForm = ({ onPostSuccess }: { onPostSuccess: () => void }) => {
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('投稿するにはログインが必要です。');
      showToast({ title: "エラー", description: "投稿するにはログインが必要です。", variant: "error" });
      return;
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setContent('');
        showToast({ title: "成功", description: '投稿が成功しました！', variant: "success" });
        onPostSuccess();
      } else {
        const data = await res.json();
        setError(data.error || '投稿に失敗しました。');
        showToast({ title: "エラー", description: data.error || '投稿に失敗しました。', variant: "error" });
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました。');
      showToast({ title: "エラー", description: '予期せぬエラーが発生しました。', variant: "error" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.postForm}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="今、何を考えていますか？"
        className={styles.textareaField}
        rows={5}
        required
      ></textarea>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <button type="submit" className={styles.submitButton}>
        投稿
      </button>
    </form>
  );
};
