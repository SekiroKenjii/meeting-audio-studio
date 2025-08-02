import React, { createContext, useCallback, useMemo, useState } from "react";
import { Toast, ToastContextType } from "../types/toast";

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export { ToastContext };

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const newToast: Toast = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove toast if not persistent
      if (!newToast.persistent && newToast.duration) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "success", title, message });
    },
    [addToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "error", title, message, duration: 8000 }); // Longer duration for errors
    },
    [addToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "warning", title, message, duration: 6000 });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "info", title, message });
    },
    [addToast]
  );

  const value: ToastContextType = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }),
    [
      toasts,
      addToast,
      removeToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    ]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};
