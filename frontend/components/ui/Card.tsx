import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
}) => {
  const baseClasses = 'card bg-white rounded-lg shadow-sm border border-gray-100 p-6';
  const hoverClasses = hoverable ? 'transition-all duration-250 hover:shadow-md' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}; 