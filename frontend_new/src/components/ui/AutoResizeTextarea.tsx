import React, { forwardRef, CSSProperties } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

// Define the Style type expected by react-textarea-autosize based on error messages
// This specific type allows 'height' to be a number, and omits 'maxHeight'/'minHeight' from CSSProperties
type TextareaAutosizeStyle = Omit<React.CSSProperties, 'maxHeight' | 'minHeight'> & { height?: number };

const textareaVariants = cva(
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background ' +
  'placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ' +
  'focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-auto ' +
  'transition-all duration-200 ease-in-out hover:border-accent/30',
  {
    variants: {
      variant: {
        default: 'border-border shadow-sm',
        error: 'border-destructive focus-visible:ring-destructive shadow-sm',
      },
      size: {
        default: 'min-h-[80px]',
        sm: 'min-h-[44px] py-1.5 text-base',
        lg: 'min-h-[100px] text-base px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface AutoResizeTextareaProps
  extends React.ComponentPropsWithoutRef<'textarea'>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  maxRows?: number;
  minRows?: number;
  wrapperClassName?: string;
  placeholder?: string;
}

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ 
    className, 
    variant, 
    size, 
    label, 
    error, 
    maxRows = 5,
    minRows = 1,
    wrapperClassName,
    id,
    placeholder,
    style,
    ...props 
  }, ref) => {
    return (
      <div className={twMerge('relative space-y-1', wrapperClassName)}>
        {label && (
          <label 
            htmlFor={id} 
            className="text-sm font-medium text-foreground mb-1 block"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <TextareaAutosize
            ref={ref}
            id={id}
            minRows={minRows}
            maxRows={maxRows}
            placeholder={placeholder}
            className={twMerge(textareaVariants({ variant: error ? 'error' : variant, size }), className)}
            style={style as TextareaAutosizeStyle}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-destructive mt-1 animate-fadeIn">{error}</p>
        )}
      </div>
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';

export { AutoResizeTextarea, textareaVariants };
export default AutoResizeTextarea; 