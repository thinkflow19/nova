import React, { ReactNode, useState } from 'react';
import { cn } from '@/utils/cn';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
  tooltipClassName?: string;
  delay?: number; // Optional delay before showing
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  className,
  tooltipClassName,
  delay = 100, // ms
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  let timeoutId: NodeJS.Timeout;

  const handleMouseEnter = () => {
    timeoutId = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter} // For accessibility with keyboard navigation
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && content && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-3 py-1.5 text-sm font-medium text-background bg-foreground rounded-md shadow-lg whitespace-nowrap',
            'transition-opacity duration-150',
            isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
            positionClasses[position],
            tooltipClassName
          )}
        >
          {content}
          {/* Optional: Add a small arrow/caret here depending on position */}
        </div>
      )}
    </div>
  );
}; 