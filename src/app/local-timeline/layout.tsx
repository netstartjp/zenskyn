'use client';

import React, { Suspense } from 'react';

export default function LocalTimelineLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>ローカルタイムラインを読み込み中...</div>}>
      {children}
    </Suspense>
  );
}
