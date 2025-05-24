import React from 'react';
import { cn } from '@/utils/cn';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // Percentage, 0 to 100
}

export const Progress: React.FC<ProgressProps> = ({ className, value = 0, ...props }) => {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-muted',
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out"
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </div>
  );
}; 