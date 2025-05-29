import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

export interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'neural';
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showIcon?: boolean;
  showCloseButton?: boolean;
  onClose?: (id: string) => void;
  onClick?: () => void;
  className?: string;
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  position?: ToastProps['position'];
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  showIcon = true,
  showCloseButton = true,
  onClose,
  onClick,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 300); // Match exit animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'error':
        return (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'info':
        return (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'neural':
        return (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              fill="url(#neural-gradient)"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-electric)" />
                <stop offset="50%" stopColor="var(--accent-purple)" />
                <stop offset="100%" stopColor="var(--accent-plasma)" />
              </linearGradient>
            </defs>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        ${styles.toast}
        ${styles[type]}
        ${isVisible ? styles.visible : ''}
        ${isExiting ? styles.exiting : ''}
        ${className}
      `}
      onClick={onClick}
      role="alert"
      aria-live="polite"
    >
      {/* Neural glow effect */}
      {type === 'neural' && <div className={styles.neuralGlow} />}
      
      {/* Icon */}
      {showIcon && (
        <div className={styles.icon}>
          {getIcon()}
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {title && (
          <div className={styles.title}>{title}</div>
        )}
        <div className={styles.message}>{message}</div>
      </div>

      {/* Close button */}
      {showCloseButton && (
        <button
          className={styles.closeButton}
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="Close notification"
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Progress bar */}
      {duration > 0 && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progress}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  onRemove,
}) => {
  if (toasts.length === 0) return null;

  const containerContent = (
    <div className={`${styles.container} ${styles[position]}`}>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemove}
          className={`stagger-${Math.min(index + 1, 6)}`}
        />
      ))}
    </div>
  );

  return createPortal(containerContent, document.body);
};

export default Toast; 