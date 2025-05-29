import React from 'react';
import { ButtonProps } from '@/types';

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseClasses = `
    relative inline-flex items-center justify-center
    font-medium rounded-xl transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transform hover:scale-[1.02] active:scale-[0.98]
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-accent-primary to-accent-secondary
      text-white shadow-neural hover:shadow-neural-lg
      focus:ring-accent-primary/50
      hover:from-accent-primary/90 hover:to-accent-secondary/90
    `,
    secondary: `
      bg-neural-100 dark:bg-neural-800 text-neural-900 dark:text-neural-100
      border border-neural-200 dark:border-neural-700
      hover:bg-neural-200 dark:hover:bg-neural-700
      focus:ring-neural-500/50
    `,
    ghost: `
      text-neural-700 dark:text-neural-300
      hover:bg-neural-100 dark:hover:bg-neural-800
      focus:ring-neural-500/50
    `,
    danger: `
      bg-accent-error text-white shadow-neural
      hover:bg-accent-error/90 hover:shadow-neural-lg
      focus:ring-accent-error/50
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

export default Button; 