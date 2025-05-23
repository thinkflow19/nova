import React from 'react';
import { Loader } from './Loader';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantStyles = {
  primary: 'bg-theme-primary text-white hover:bg-theme-accent shadow-md hover:shadow-lg',
  secondary: 'bg-bg-panel text-text-primary hover:bg-hover-glass border border-border',
  outline: 'border border-border text-text-primary hover:bg-hover-glass',
  ghost: 'text-text-primary hover:bg-hover-glass',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg',
  destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 rounded-lg',
  lg: 'px-6 py-3 text-lg rounded-xl',
  icon: 'p-2 rounded-lg',
};

export const buttonVariants = { variantStyles, sizeStyles };

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  return (
    <button
    className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    disabled={disabled || isLoading}
      {...props}
    >
    {isLoading ? (
      <>
        <Loader size="sm" className="mr-2" />
        {children}
      </>
    ) : (
      <>
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      </>
    )}
    </button>
  );
};

export default Button; 