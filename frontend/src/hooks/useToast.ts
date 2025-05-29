import { useState, useCallback } from 'react';
import { ToastProps } from '@/components/ui/Toast';

interface UseToastReturn {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (message: string, options?: Partial<ToastProps>) => string;
  error: (message: string, options?: Partial<ToastProps>) => string;
  warning: (message: string, options?: Partial<ToastProps>) => string;
  info: (message: string, options?: Partial<ToastProps>) => string;
  neural: (message: string, options?: Partial<ToastProps>) => string;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = generateId();
    const newToast: ToastProps = {
      id,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, [generateId]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((message: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'success',
      message,
      ...options,
    });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'error',
      message,
      duration: 7000, // Longer duration for errors
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'warning',
      message,
      duration: 6000,
      ...options,
    });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'info',
      message,
      ...options,
    });
  }, [addToast]);

  const neural = useCallback((message: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'neural',
      message,
      duration: 4000,
      ...options,
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
    neural,
  };
}; 