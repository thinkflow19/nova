import React, { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  showCloseButton?: boolean;
  overlayClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  className = '',
  ariaLabel = 'Dialog',
  showCloseButton = true,
  overlayClassName = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (open && dialogRef.current) {
      const previouslyFocused = document.activeElement as HTMLElement;
      dialogRef.current.focus();
      return () => {
        previouslyFocused?.focus();
      };
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all ${overlayClassName}`}
      aria-modal="true"
      role="dialog"
      aria-label={ariaLabel}
      tabIndex={-1}
      onClick={onClose}
    >
      <div
        className={`relative outline-none ${className}`}
        ref={dialogRef}
        tabIndex={0}
        onClick={e => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l8 8M6 14L14 6" /></svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal; 