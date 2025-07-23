'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // useRouter を追加

export const SidebarNav = () => {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<{ loggedIn: boolean; userId: number | null; isAdmin: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthStatus({ loggedIn: false, userId: null, isAdmin: false });
      return;
    }
    try {
      const res = await fetch('/api/auth/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuthStatus(data);
      } else {
        console.error('Failed to fetch auth status:', await res.json());
        setAuthStatus({ loggedIn: false, userId: null, isAdmin: false });
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching auth status:', error);
      setAuthStatus({ loggedIn: false, userId: null, isAdmin: false });
      localStorage.removeItem('token');
    }
  }, []);

  useEffect(() => {
    fetchAuthStatus();
    const handleStorageChange = () => {
      fetchAuthStatus();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchAuthStatus]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthStatus({ loggedIn: false, userId: null, isAdmin: false });
    router.push('/'); // ログアウト後にホームへリダイレクト
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '10px' }}><Link href="/" style={{ textDecoration: 'none', color: '#333' }}>ホーム</Link></li>
        
        <li style={{ marginBottom: '10px' }}><Link href="/settings" style={{ textDecoration: 'none', color: '#333' }}>設定</Link></li>
        <li style={{ marginBottom: '10px' }}><Link href="/local-timeline" style={{ textDecoration: 'none', color: '#333' }}>ZenSky タイムライン</Link></li>
        <li style={{ marginBottom: '10px' }}><Link href="/terms" style={{ textDecoration: 'none', color: '#333' }}>利用規約</Link></li>
      </ul>

      {/* 検索フォーム */}
      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flexGrow: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '5px 0 0 5px' }}
          />
          <button type="submit" style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '0 5px 5px 0', cursor: 'pointer' }}>検索</button>
        </form>
      </div>

      {/* 管理者ダッシュボードとログアウトボタン */}
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        {authStatus?.isAdmin && (
          <Link href="/admin">
            <button style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              管理者ダッシュボード
            </button>
          </Link>
        )}
        {authStatus?.loggedIn && (
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            ログアウト
          </button>
        )}
      </div>
    </nav>
  );
};