'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';

interface PopoverContentProps {
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ClickableToastPopoverContextType {
  showPopover: (props: PopoverContentProps & { anchorElement: HTMLElement; duration?: number }) => void;
}

const ClickableToastPopoverContext = createContext<ClickableToastPopoverContextType | undefined>(undefined);

export function ClickableToastPopoverProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [popoverProps, setPopoverProps] = useState<PopoverContentProps & { anchorElement: HTMLElement | null; duration?: number } | null>(null);
  const timerRef = useRef<number | null>(null);

  const closePopover = useCallback(() => {
    setOpen(false);
    setPopoverProps(null);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showPopover = useCallback(({ anchorElement, duration = 3000, ...contentProps }: PopoverContentProps & { anchorElement: HTMLElement; duration?: number }) => {
    closePopover(); // 既存のポップオーバーを閉じる

    setPopoverProps({ ...contentProps, anchorElement, duration });
    setOpen(true);

    if (duration > 0) { // durationが0の場合は自動で閉じない
      timerRef.current = window.setTimeout(() => {
        closePopover();
      }, duration);
    }
  }, [closePopover]);

  const handleConfirm = useCallback(() => {
    if (popoverProps?.onConfirm) {
      popoverProps.onConfirm();
    }
    closePopover();
  }, [popoverProps, closePopover]);

  const handleCancel = useCallback(() => {
    if (popoverProps?.onCancel) {
      popoverProps.onCancel();
    }
    closePopover();
  }, [popoverProps, closePopover]);

  const getPopoverColors = (variant: PopoverContentProps['variant']) => {
    switch (variant) {
      case 'success':
        return { bg: 'bg-green-500', text: 'text-white' };
      case 'error':
        return { bg: 'bg-red-500', text: 'text-white' };
      case 'warning':
        return { bg: 'bg-yellow-500', text: 'text-gray-900' };
      case 'info':
      default:
        return { bg: 'bg-blue-500', text: 'text-white' };
    }
  };

  const colors = popoverProps ? getPopoverColors(popoverProps.variant || 'info') : { bg: '', text: '' };

  return (
    <ClickableToastPopoverContext.Provider value={{ showPopover }}>
      {children}
      {popoverProps && popoverProps.anchorElement && (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Anchor asChild>
            <div style={{
              position: 'absolute',
              top: popoverProps.anchorElement.getBoundingClientRect().top,
              left: popoverProps.anchorElement.getBoundingClientRect().left,
              width: popoverProps.anchorElement.getBoundingClientRect().width,
              height: popoverProps.anchorElement.getBoundingClientRect().height,
              pointerEvents: 'none',
            }} />
          </Popover.Anchor>
          <Popover.Portal>
            <Popover.Content
              className={`rounded-md shadow-lg p-4 text-sm ${colors.bg} ${colors.text}`}
              sideOffset={5}
              onOpenAutoFocus={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              <h3 className="font-medium">{popoverProps.title}</h3>
              {popoverProps.description && <p>{popoverProps.description}</p>}
              {(popoverProps.onConfirm || popoverProps.onCancel) && (
                <div className="flex justify-end gap-2 mt-2">
                  {popoverProps.onCancel && (
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
                    >
                      キャンセル
                    </button>
                  )}
                  {popoverProps.onConfirm && (
                    <button
                      onClick={handleConfirm}
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      OK
                    </button>
                  )}
                </div>
              )}
              <Popover.Arrow className="fill-current text-white" />
              <button
                className="absolute top-1 right-1 p-1 rounded-full hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                onClick={closePopover}
              >
                ✕
              </button>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </ClickableToastPopoverContext.Provider>
  );
}

export function useClickableToastPopover() {
  const context = useContext(ClickableToastPopoverContext);
  if (context === undefined) {
    throw new Error('useClickableToastPopover must be used within a ClickableToastPopoverProvider');
  }
  return context;
}
