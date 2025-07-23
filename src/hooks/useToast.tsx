'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Provider as ToastProviderPrimitive,
  Root as ToastRoot,
  Title as ToastTitle,
  Description as ToastDescription,
  Viewport as ToastViewport,
} from '@radix-ui/react-toast';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toastOptions, setToastOptions] = useState<ToastOptions>({
    title: '',
    description: '',
    variant: 'info',
  });
  const timerRef = React.useRef<number | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    setToastOptions(options);
    setOpen(true);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 3000); // 3 seconds
  }, []);

  return (
    <ToastProviderPrimitive swipeDirection="right">
      <ToastContext.Provider value={{ showToast }}>
        {children}
      </ToastContext.Provider>

      <ToastRoot open={open} onOpenChange={setOpen} className={`toast ${toastOptions.variant}`}>
        <ToastTitle>{toastOptions.title}</ToastTitle>
        {toastOptions.description && <ToastDescription>{toastOptions.description}</ToastDescription>}
      </ToastRoot>
      <ToastViewport />
    </ToastProviderPrimitive>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}