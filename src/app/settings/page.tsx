'use client';

import { UserSettings } from '@/components/UserSettings';
import styles from './settings.module.css'; // 後で作成

export default function SettingsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ユーザー設定</h1>
      <UserSettings />
    </div>
  );
}
