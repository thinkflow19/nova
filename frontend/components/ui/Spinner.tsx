import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  color = 'primary' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
  };

  const colorClasses = {
    primary: 'border-gray-200 border-t-indigo-600',
    white: 'border-gray-400/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-600',
  };

  return (
    <div 
      className={`inline-block rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`} 
      style={{ animation: 'spin 1.2s cubic-bezier(0.5, 0.1, 0.5, 1) infinite' }}
      aria-label="Loading"
      data-testid="spinner"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}; 