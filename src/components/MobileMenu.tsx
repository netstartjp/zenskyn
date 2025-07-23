'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react'; // useCallback を追加
import Link from 'next/link';
import { SidebarNav } from '@/components/SidebarNav';
import styles from './MobileMenu.module.css';
import { useRouter } from 'next/navigation'; // useRouter を追加

// MobileMenuProps インターフェースを削除

export const MobileMenu = () => { // プロップを受け取らないように変更
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // 追加

  // メニュー外をクリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className={styles.mobileMenuContainer} ref={menuRef}>
      <button className={styles.hamburgerButton} onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>

      {isOpen && (
        <div className={styles.mobileMenuOverlay}>
          <div className={styles.mobileMenuContent}>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              ✕
            </button>
            <h2 className={styles.menuTitle}>メニュー</h2>
            <SidebarNav />
          </div>
        </div>
      )}
    </div>
  );
};