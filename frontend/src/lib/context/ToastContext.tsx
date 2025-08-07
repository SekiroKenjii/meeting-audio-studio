import React, { createContext, useCallback, useMemo, useState } from "react";
import { Toast } from "../types/toast";

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

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

  const value: ToastContextType = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
    }),
    [toasts, addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};
