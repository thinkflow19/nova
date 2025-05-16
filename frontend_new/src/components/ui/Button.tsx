import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main disabled:opacity-60 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-theme-primary text-white hover:bg-theme-accent shadow-md hover:shadow-lg hover:ring-1 hover:ring-theme-primary/30',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg focus-visible:ring-red-500',
        outline: 'border border-border-color bg-transparent hover:bg-theme-primary/10 hover:text-theme-primary text-text-primary shadow-sm hover:shadow-md',
        secondary: 'bg-bg-panel text-text-primary border border-border-color hover:bg-hover-glass shadow-sm hover:shadow-md',
        ghost: 'hover:bg-theme-primary/10 text-text-muted hover:text-theme-primary rounded-lg',
        link: 'text-theme-primary hover:text-theme-accent underline-offset-4 hover:underline focus-visible:ring-transparent',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const isActuallyLoading = isLoading || (loading === true);
    
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={isActuallyLoading || disabled}
        {...props}
      >
        {isActuallyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isActuallyLoading && leftIcon && <span className={children ? "mr-2" : ""}>{leftIcon}</span>}
        {children}
        {!isActuallyLoading && rightIcon && <span className={children ? "ml-2" : ""}>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button; 