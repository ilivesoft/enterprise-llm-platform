import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  msg: string;
  type: ToastType;
}

interface ToastCtxValue {
  showToast: (msg: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtxValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            minWidth: 260, maxWidth: 380, padding: '12px 16px',
            borderRadius: 10,
            background: t.type === 'success' ? 'var(--success)' : t.type === 'error' ? 'var(--error)' : 'var(--accent)',
            color: '#fff',
            fontSize: 13.5, fontWeight: 500,
            boxShadow: '0 4px 24px rgba(0,0,0,.18)',
            animation: 'toastIn .22s ease',
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 17 }}>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
