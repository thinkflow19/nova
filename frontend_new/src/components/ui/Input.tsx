import React, { forwardRef, InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const inputVariants = cva(
  `flex w-full rounded-xl border border-border-color bg-bg-panel px-3.5 py-2.5 text-sm text-text-main 
  ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
  placeholder:text-text-muted/70 
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:border-primary 
  disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-200 ease-in-out hover:border-border-color/70`,
  {
    variants: {
      variant: {
        default: '', // Base style is now the default
        ghost: 'border-none bg-transparent shadow-none hover:bg-hover-glass',
        error: 'border-error-color/80 focus-visible:ring-error-color/70 focus-visible:border-error-color',
      },
      size: {
        default: 'h-10',
        sm: 'h-9 px-3 text-xs rounded-lg', // Slightly smaller rounding for sm
        lg: 'h-12 px-4 text-base rounded-xl', 
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, label, leftIcon, rightIcon, error, id, wrapperClassName, ...props }, ref) => {
    const effectiveVariant = error ? 'error' : variant;
    return (
      <div className={twMerge('w-full', wrapperClassName)}>
        {label && (
          <label 
            htmlFor={id} 
            className="block text-xs font-medium text-text-muted mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            className={twMerge(
              inputVariants({ variant: effectiveVariant, size }),
              leftIcon ? 'pl-10' : 'pl-3.5', // Adjust padding based on icon
              rightIcon ? 'pr-10' : 'pr-3.5',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-error-color mt-1.5 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
export default Input; 