import { useState, useCallback } from 'react';
import { ToastProps, ToastType } from '../components/ui/Toast';

interface ToastOptions {
  message?: string;
  duration?: number;
}

interface UseToastReturn {
  toasts: ToastProps[];
  addToast: (type: ToastType, title: string, options?: ToastOptions) => void;
  removeToast: (id: string) => void;
  success: (title: string, options?: ToastOptions) => void;
  error: (title: string, options?: ToastOptions) => void;
  warning: (title: string, options?: ToastOptions) => void;
  info: (title: string, options?: ToastOptions) => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((
    type: ToastType, 
    title: string, 
    options: ToastOptions = {}
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      id,
      type,
      title,
      message: options.message,
      duration: options.duration,
      onRemove: removeToast
    };

    setToasts(prev => [newToast, ...prev]);
  }, [removeToast]);

  const success = useCallback((title: string, options?: ToastOptions) => {
    addToast('success', title, options);
  }, [addToast]);

  const error = useCallback((title: string, options?: ToastOptions) => {
    addToast('error', title, options);
  }, [addToast]);

  const warning = useCallback((title: string, options?: ToastOptions) => {
    addToast('warning', title, options);
  }, [addToast]);

  const info = useCallback((title: string, options?: ToastOptions) => {
    addToast('info', title, options);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};