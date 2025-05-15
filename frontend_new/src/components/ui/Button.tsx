import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white hover:bg-accent/90 shadow-sm hover:shadow',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow',
        outline: 'border border-border bg-transparent hover:bg-accent/5 hover:text-accent hover:border-accent/30',
        secondary: 'bg-card text-card-foreground hover:bg-card-foreground/5 shadow-sm',
        ghost: 'hover:bg-accent/5 hover:text-accent',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-8',
        icon: 'h-9 w-9',
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
        {isActuallyLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        {!isActuallyLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isActuallyLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button; 