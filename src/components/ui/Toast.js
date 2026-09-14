import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS = { success: FiCheckCircle, error: FiAlertCircle, info: FiInfo };

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, type = 'info', duration = 4500) => {
      const id = ++counter.current;
      setToasts((t) => [...t.slice(-3), { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      push,
      dismiss,
      success: (m, d) => push(m, 'success', d),
      error: (m, d) => push(m, 'error', d ?? 7000),
      info: (m, d) => push(m, 'info', d),
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || FiInfo;
          return (
            <div key={t.id} className={`toast toast--${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
              <Icon size={18} aria-hidden="true" />
              <span>{t.message}</span>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <FiX size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
