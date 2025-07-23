
'use client';

import { useState } from 'react';
import styles from './AdminSetupForm.module.css';

export const AdminSetupForm = ({ onSetupComplete }: { onSetupComplete: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      if (res.ok) {
        setSuccess('管理者アカウントが正常に作成されました。ログインしてください。');
        onSetupComplete();
      } else {
        const data = await res.json();
        setError(data.error || '管理者アカウントの作成に失敗しました。');
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました。');
    }
  };

  return (
    <div className={styles.adminSetupContainer}>
      <h2 className={styles.title}>管理者アカウントの作成</h2>
      <p className={styles.description}>最初のユーザーとして管理者アカウントを作成してください。</p>
      {error && <p className={styles.errorMessage}>{error}</p>}
      {success && <p className={styles.successMessage}>{success}</p>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="名前 (任意)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.inputField}
        />
        <input
          type="email"
          placeholder="メールアドレス (管理者)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.inputField}
        />
        <input
          type="password"
          placeholder="パスワード (管理者)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.inputField}
        />
        <button type="submit" className={styles.submitButton}>
          管理者アカウントを作成
        </button>
      </form>
    </div>
  );
};
