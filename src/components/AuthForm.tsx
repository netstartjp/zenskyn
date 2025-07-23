
'use client';

import { useState } from 'react';
import styles from './AuthForm.module.css';

export const AuthForm = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { email, name, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (isLogin) {
          const data = await res.json();
          localStorage.setItem('token', data.token);
        } else {
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await loginRes.json();
          localStorage.setItem('token', data.token);
        }
        onAuthSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'エラーが発生しました。');
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました。');
    }
  };

  return (
    <div className={styles.authFormContainer}>
      <div className={styles.tabs}>
        <button 
          onClick={() => setIsLogin(true)} 
          className={`${styles.tabButton} ${isLogin ? styles.activeTab : ''}`}
        >
          ログイン
        </button>
        <button 
          onClick={() => setIsLogin(false)} 
          className={`${styles.tabButton} ${!isLogin ? styles.activeTab : ''}`}
        >
          新規登録
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.formTitle}>{isLogin ? 'ログイン' : '新規登録'}</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        
        {!isLogin && (
          <input
            type="text"
            placeholder="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.inputField}
          />
        )}
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.inputField}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.inputField}
        />
        <button type="submit" className={styles.submitButton}>
          {isLogin ? 'ログイン' : '登録'}
        </button>
      </form>
    </div>
  );
};
