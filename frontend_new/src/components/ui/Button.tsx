import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none ring-offset-background whitespace-nowrap',
  {
    variants: {
      variant: {
        default:  // Primary button style from meta-prompt
          'bg-primary text-primary-foreground hover:bg-primary-hover shadow-md hover:shadow-lg',
        'themed-secondary': // Secondary button style from meta-prompt
          'bg-hover-glass text-primary hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/15', 
        destructive:
          'bg-error-color text-white hover:bg-error-color/90 shadow-sm hover:shadow',
        outline: // Keep outline distinct, make it use themed border and text
          'border border-border-color bg-transparent hover:bg-hover-glass hover:text-primary',
        secondary: // This was 'bg-card', let's make it a softer themed button
          'bg-bg-panel text-text-main hover:bg-bg-panel/70 shadow-sm hover:shadow',
        ghost: // Subtle hover, primary text on hover
          'hover:bg-hover-glass text-text-muted hover:text-primary',
        link: // Primary color for links
          'text-primary underline-offset-4 hover:underline',
        premium: // Based on previous Button component, for specific premium actions
          'bg-gradient-to-r from-primary via-teal-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs rounded-lg', // Slightly smaller rounding for sm
        lg: 'h-12 px-6 text-base rounded-xl', // Larger padding and text for lg
        icon: 'h-10 w-10 rounded-lg', // Consistent with default height
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
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />}
        {!isLoading && leftIcon && <span className={children ? "mr-2" : ""}>{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className={children ? "ml-2" : ""}>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button; 