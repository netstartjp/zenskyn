'use client';

import styles from './terms.module.css';

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>利用規約</h1>
      <iframe
        src="https://s-zensky.com/zensky/terms"
        title="ZenSky Terms of Service"
        style={{ width: '100%', height: '80vh', border: 'none' }}
      ></iframe>
    </div>
  );
}