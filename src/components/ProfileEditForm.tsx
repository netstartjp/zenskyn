'use client';

import { useState, useEffect } from 'react';
import styles from './ProfileEditForm.module.css';
import { useRouter } from 'next/navigation';

interface ProfileEditFormProps {
  userId: string;
  onProfileUpdated: () => void;
}

export const ProfileEditForm = ({ userId, onProfileUpdated }: ProfileEditFormProps) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [customId, setCustomId] = useState(''); // customId ステートを追加
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('認証トークンがありません。');
          return;
        }

        const res = await fetch(`/api/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setName(data.name);
          setBio(data.bio || '');
          setProfileImageUrl(data.profileImageUrl || '');
          setCustomId(data.customId || ''); // customId をセット
        } else {
          setError('プロフィールの取得に失敗しました。');
        }
      } catch (err) {
        setError('プロフィールの取得中にエラーが発生しました。');
      }
    };
    fetchProfile();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('認証トークンがありません。');
        return;
      }

      // プロフィール更新
      const profileUpdateRes = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, bio, profileImageUrl }),
      });

      if (!profileUpdateRes.ok) {
        const data = await profileUpdateRes.json();
        setError(data.error || 'プロフィールの更新に失敗しました。');
        return;
      }

      // customId の更新 (customId が変更された場合のみ)
      const currentProfile = await (await fetch(`/api/users/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })).json();
      if (currentProfile.customId !== customId) {
        const customIdUpdateRes = await fetch(`/api/users/${userId}/custom-id`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ customId }),
        });

        if (!customIdUpdateRes.ok) {
          const data = await customIdUpdateRes.json();
          setError(data.error || 'カスタムIDの更新に失敗しました。');
          return;
        }
      }

      setSuccess('プロフィールが更新されました！');
      onProfileUpdated();
      router.push(`/users/${userId}`); // プロフィールページにリダイレクト
    } catch (err) {
      setError('プロフィールの更新中にエラーが発生しました。');
    }
  };

  return (
    <div className={styles.profileEditFormContainer}>
      <h2 className={styles.formTitle}>プロフィール編集</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}
      {success && <p className={styles.successMessage}>{success}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="name" className={styles.label}>名前:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.inputField}
          required
        />

        <label htmlFor="bio" className={styles.label}>自己紹介:</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={styles.textareaField}
          rows={5}
        />

        <label htmlFor="profileImageUrl" className={styles.label}>プロフィール画像URL:</label>
        <input
          type="url"
          id="profileImageUrl"
          value={profileImageUrl}
          onChange={(e) => setProfileImageUrl(e.target.value)}
          className={styles.inputField}
        />

        <label htmlFor="customId" className={styles.label}>カスタムID (@なし):</label>
        <input
          type="text"
          id="customId"
          value={customId}
          onChange={(e) => setCustomId(e.target.value)}
          className={styles.inputField}
          placeholder="例: myusername"
        />

        <button type="submit" className={styles.submitButton}>更新</button>
      </form>
    </div>
  );
};
