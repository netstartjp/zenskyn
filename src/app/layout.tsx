'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "../hooks/useToast.tsx";
import { ClickableToastPopoverProvider } from "../hooks/useClickableToastPopover";
import { SidebarNav } from "../components/SidebarNav";
import { MobileMenu } from "../components/MobileMenu"; // 追加
import { useState, useEffect } from 'react'; // 追加

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // 768px をモバイルのブレークポイントとする
    };

    handleResize(); // 初期ロード時に一度実行
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <title>ZenSky N</title>
      </head>
      <body className={inter.className}>
          <ToastProvider>
            <ClickableToastPopoverProvider>
              <div style={{ display: 'flex' }}>
                {isMobile ? ( // モバイルの場合
                  <MobileMenu /> // MobileMenu を表示
                ) : ( // デスクトップの場合
                  <aside className="sidebar">
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>メニュー</h2>
                    <SidebarNav />
                  </aside>
                )}
                <div className={isMobile ? "main-content-no-sidebar" : "main-content-with-sidebar"}> {/* CSSクラスを条件分岐 */}
                  <div>
                    {children}
                  </div>
                </div>
              </div>
            </ClickableToastPopoverProvider>
          </ToastProvider>
      </body>
    </html>
  );
}