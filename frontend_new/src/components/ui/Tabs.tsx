import React, { ReactNode } from 'react';
import { cn } from '@/utils/cn';

// Basic Tabs container
export const Tabs: React.FC<{ children: ReactNode, className?: string }> = ({ children, className }) => {
  return <div className={cn(className)}>{children}</div>;
};

// Tab List (row of tab buttons)
export const TabsList: React.FC<{ children: ReactNode, className?: string }> = ({ children, className }) => {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} role="tablist">
      {children}
    </div>
  );
};

// Individual Tab button
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  isActive?: boolean;
}
export const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, value, isActive, className, ...props }) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50 hover:text-foreground/80',
        className
      )}
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      {...props}
    >
      {children}
    </button>
  );
};

// Tab Content panel
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  // Typically, you'd conditionally render this based on an activeTabValue state
}
export const TabsContent: React.FC<TabsContentProps> = ({ children, value, className, ...props }) => {
  return (
    <div
      className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}
      role="tabpanel"
      aria-labelledby={`tab-trigger-${value}`}
      {...props}
    >
      {children}
    </div>
  );
}; 