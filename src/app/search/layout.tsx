'use client';

import React, { Suspense } from 'react';

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>検索結果を読み込み中...</div>}>
      {children}
    </Suspense>
  );
}
