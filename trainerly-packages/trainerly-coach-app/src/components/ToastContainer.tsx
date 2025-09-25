import React, { useState, useCallback, useEffect } from 'react';
import Toast, { ToastMessage } from './Toast';

interface ToastContainerProps {
  children: React.ReactNode;
}

// Global toast management
let toastId = 0;
let addToastFn: ((toast: Omit<ToastMessage, 'id'>) => void) | null = null;

export const showToast = (toast: Omit<ToastMessage, 'id'>) => {
  if (addToastFn) {
    addToastFn(toast);
  }
};

export const showError = (message: string, duration?: number) => {
  showToast({ message, type: 'error', duration });
};

export const showSuccess = (message: string, duration?: number) => {
  showToast({ message, type: 'success', duration });
};

export const showWarning = (message: string, duration?: number) => {
  showToast({ message, type: 'warning', duration });
};

export const showInfo = (message: string, duration?: number) => {
  showToast({ message, type: 'info', duration });
};

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const newToast: ToastMessage = {
      ...toast,
      id: `toast-${++toastId}`,
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Register global add function
  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  return (
    <>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </>
  );
};

export default ToastContainer;
