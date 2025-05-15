import React, { forwardRef, CSSProperties } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

// Define the Style type expected by react-textarea-autosize based on error messages
// This specific type allows 'height' to be a number, and omits 'maxHeight'/'minHeight' from CSSProperties
type TextareaAutosizeStyle = Omit<React.CSSProperties, 'maxHeight' | 'minHeight'> & { height?: number };

const textareaVariants = cva(
  `w-full rounded-xl border border-border-color bg-bg-panel px-3.5 py-2.5 text-sm text-text-main 
  placeholder:text-text-muted/70 
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:border-primary 
  disabled:cursor-not-allowed disabled:opacity-60 resize-none overflow-y-auto 
  transition-all duration-200 ease-in-out hover:border-border-color/70`,
  {
    variants: {
      variant: {
        default: '', // Base style is now the default
        error: 'border-error-color/80 focus-visible:ring-error-color/70 focus-visible:border-error-color',
        // Chat variant can be more specific if needed, or use default + className prop for chat-specifics like shadow
        chat: 'rounded-lg shadow-sm', // Example: slightly different rounding for chat, can inherit most from base
      },
      size: {
        default: 'min-h-[80px]',
        sm: 'min-h-[42px] py-2 px-3 text-sm',
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
    style, // Keep style prop for react-textarea-autosize if it needs specific overrides
    ...props 
  }, ref) => {
    const effectiveVariant = error ? 'error' : variant;

    return (
      <div className={twMerge('relative', wrapperClassName)}>
        {label && (
          <label 
            htmlFor={id}
            className="block text-xs font-medium text-text-muted mb-1.5"
          >
            {label}
          </label>
        )}
        <TextareaAutosize
          ref={ref}
          id={id}
          minRows={minRows}
          maxRows={maxRows}
          placeholder={placeholder}
          className={twMerge(textareaVariants({ variant: effectiveVariant, size }), className)}
          style={style as TextareaAutosizeStyle} // Pass style to underlying component
          {...props}
        />
        {error && (
          <p className="text-xs text-error-color mt-1.5 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';

export { AutoResizeTextarea, textareaVariants };
export default AutoResizeTextarea; 