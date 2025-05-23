import React from 'react';

interface LoadingSpinnerProps {
  size?: 'icon' | 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'white' | 'danger';
  className?: string;
  fullScreen?: boolean;
}

/**
 * A premium loading spinner component with customizable size, color, and text
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'primary',
  className = '',
  fullScreen = false,
}) => {
  const sizeClasses = {
    icon: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const variantClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    danger: 'text-red-600'
  };
  
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div
        className={`
          animate-spin rounded-full
          border-2 border-current
          border-t-transparent
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export const SkeletonLoader = ({ width = 'w-full', height = 'h-6', rounded = 'rounded-md', className = '' }) => (
  <div className={`bg-gray-200 dark:bg-neutral-700 animate-pulse ${width} ${height} ${rounded} ${className}`}></div>
);

export default LoadingSpinner; 