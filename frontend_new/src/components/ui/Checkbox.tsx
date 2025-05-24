import React from 'react';
import { cn } from '@/utils/cn';
import { Check as CheckIcon } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <label className={cn("inline-flex items-center group", props.disabled && "cursor-not-allowed opacity-50")}>
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          className="sr-only peer" // Hide actual checkbox, style the span instead
          {...props}
        />
        <span
          className={cn(
            'h-5 w-5 rounded border border-input flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
            checked ? 'bg-primary border-primary text-primary-foreground' : 'bg-card hover:border-muted-foreground/70',
            className
          )}
          aria-hidden="true"
        >
          {checked && <CheckIcon size={14} strokeWidth={3} />}
        </span>
        {/* Optional: add a label text here if needed, or expect it to be provided externally */}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox }; 