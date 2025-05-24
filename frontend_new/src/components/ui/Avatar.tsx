import React from 'react';
import { cn } from '@/utils/cn';

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg'; // Example sizes
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  fallback,
  className,
  size = 'md',
  children,
  ...props
}) => {
  const content = src ? (
    <img src={src} alt={alt || 'avatar'} className="h-full w-full object-cover rounded-full" />
  ) : fallback ? (
    fallback
  ) : (
    children // Expect initials or an icon as children if no src/fallback
  );

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {content}
    </span>
  );
};

// Optional: AvatarImage and AvatarFallback components like Shadcn/ui for more composition
// For now, the combined Avatar component should suffice for AgentCard. 