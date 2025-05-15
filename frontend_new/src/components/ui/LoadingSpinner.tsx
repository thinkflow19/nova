import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullPage?: boolean;
  className?: string;
}

/**
 * A premium loading spinner component with customizable size, color, and text
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  fullPage = false,
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  
  const spinnerSize = sizes[size] || sizes.md;
  
  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <Loader2 className={`${spinnerSize} text-accent animate-spin`} />
        <div className="absolute inset-0 rounded-full blur-sm bg-accent/20 animate-pulse-slow" style={{ transform: 'scale(0.7)' }}></div>
      </div>
      {text && (
        <p className="mt-3 text-sm text-muted-foreground animate-pulse-slow">{text}</p>
      )}
    </div>
  );
  
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }
  
  return spinner;
};

export default LoadingSpinner; 