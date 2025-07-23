'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast.tsx';
import styles from './UserSettings.module.css';

interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  customId: string | null; // customId を追加
  isAdmin: boolean;
  createdAt: string;
}

export const UserSettings = () => {
  const { showToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [customId, setCustomId] = useState(''); // customId ステートを追加
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('認証が必要です。');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const userId = data.userId;

        const userRes = await fetch(`/api/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          setName(userData.name || '');
          setBio(userData.bio || '');
          setProfileImageUrl(userData.profileImageUrl || '');
          setCustomId(userData.customId || ''); // customId をセット
        } else {
          const errData = await userRes.json();
          setError(errData.error || 'ユーザープロフィールの取得に失敗しました。');
        }
      } else {
        const errData = await res.json();
        setError(errData.error || '認証情報の取得に失敗しました。');
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      showToast({ title: "エラー", description: "ユーザー情報が読み込まれていません。", variant: "error" });
      return;
    }

    if (password !== confirmPassword) {
      showToast({ title: "エラー", description: 'パスワードが一致しません。', variant: "error" });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showToast({ title: "エラー", description: '認証が必要です。', variant: "error" });
      return;
    }

    const updateData: {
      name?: string;
      bio?: string;
      profileImageUrl?: string;
      password?: string;
    } = {};

    if (name !== user.name) {
      // 名前が変更される場合、一意性をチェック
      if (name !== null) { // nullでない場合のみチェック
        const checkNameRes = await fetch(`/api/users/check-name?name=${encodeURIComponent(name)}`);
        if (!checkNameRes.ok) {
          const errorData = await checkNameRes.json();
          showToast({ title: "エラー", description: errorData.error || 'ユーザー名の重複チェックに失敗しました。', variant: "error" });
          return;
        }
        const checkNameData = await checkNameRes.json();
        if (checkNameData.exists && checkNameData.userId !== user.id) {
          showToast({ title: "エラー", description: 'このユーザー名はすでに使用されています。別の名前をお試しください。', variant: "error" });
          return;
        }
      }
      updateData.name = name;
    }
    if (bio !== user.bio) updateData.bio = bio;
    if (profileImageUrl !== user.profileImageUrl) updateData.profileImageUrl = profileImageUrl;
    if (password !== '') updateData.password = password;

    // customId の更新 (customId が変更された場合のみ)
    let customIdUpdated = false;
    if (customId !== (user.customId || '')) {
      try {
        const customIdRes = await fetch(`/api/users/${user.id}/custom-id`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ customId }),
        });

        if (!customIdRes.ok) {
          const data = await customIdRes.json();
          showToast({ title: "エラー", description: data.error || 'カスタムIDの更新に失敗しました。', variant: "error" });
          return;
        }
        customIdUpdated = true;
      } catch (err) {
        showToast({ title: "エラー", description: 'カスタムIDの更新中にエラーが発生しました。', variant: "error" });
        console.error(err);
        return;
      }
    }

    if (Object.keys(updateData).length === 0 && !customIdUpdated) {
      showToast({ title: "情報", description: '変更がありません。', variant: "info" });
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        showToast({ title: "成功", description: "プロフィールが正常に更新されました。", variant: "success" });
        fetchUserProfile(); // 更新後にプロフィールを再フェッチ
      } else {
        const data = await res.json();
        showToast({ title: "エラー", description: data.error || 'プロフィールの更新に失敗しました。', variant: "error" });
      }
    } catch (err) {
      showToast({ title: "エラー", description: '予期せぬエラーが発生しました。', variant: "error" });
      console.error(err);
    }
  };

  if (loading) {
    return <div className={styles.loadingMessage}>設定を読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div className={styles.settingsContainer}>
      <h2 className={styles.sectionTitle}>プロフィール設定</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.formLabel}>名前:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.inputField}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="bio" className={styles.formLabel}>自己紹介:</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={styles.textareaField}
            rows={3}
          ></textarea>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="profileImageUrl" className={styles.formLabel}>プロフィール画像URL:</label>
          <input
            type="text"
            id="profileImageUrl"
            value={profileImageUrl}
            onChange={(e) => setProfileImageUrl(e.target.value)}
            className={styles.inputField}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="customId" className={styles.formLabel}>カスタムID (@なし):</label>
          <input
            type="text"
            id="customId"
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            className={styles.inputField}
            placeholder="例: myusername"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.formLabel}>新しいパスワード (変更する場合のみ):</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.inputField}
            placeholder="新しいパスワード"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.formLabel}>新しいパスワード (確認):</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.inputField}
            placeholder="新しいパスワードを再入力"
          />
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.saveButton}>
            設定を保存
          </button>
        </div>
      </form>
    </div>
  );
};