import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div 
      className={`inline-block rounded-full border-gray-300 border-t-[var(--primary)] ${sizeClasses[size]} ${className}`} 
      style={{ animation: 'spin 2s linear infinite' }}
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}; 