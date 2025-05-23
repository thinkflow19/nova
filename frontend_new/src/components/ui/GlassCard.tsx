// DEPRECATED: Use Card from './Card' instead for all usages. This file will be removed soon.
export { Card } from './Card';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
  hover?: boolean;
  blur?: 'sm' | 'md' | 'lg';
  border?: boolean;
  glow?: boolean;
  gradient?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  variant = 'light',
  hover = false,
  blur = 'md',
  border = true,
  glow = false,
  gradient = false,
}) => {
  const baseStyles = 'rounded-xl backdrop-blur transition-all duration-300 ease-in-out';
  
  const variantStyles = {
    light: 'bg-white/10 dark:bg-white/5',
    dark: 'bg-gray-900/10 dark:bg-gray-900/30'
  };

  const blurStyles = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg'
  };

  const hoverStyles = hover
    ? 'hover:bg-white/20 dark:hover:bg-white/10 hover:scale-[1.02] hover:shadow-xl'
    : '';
  
  const borderStyles = border
    ? 'border border-white/20 dark:border-white/10'
    : '';
  
  const glowStyles = glow
    ? 'before:absolute before:inset-0 before:-z-10 before:rounded-xl before:bg-gradient-to-r before:from-primary-500/20 before:to-secondary-500/20 before:blur-xl before:transition-all before:duration-300 hover:before:blur-2xl'
    : '';

  const gradientStyles = gradient
    ? 'bg-gradient-to-br from-accent/10 to-primary/10'
    : '';

  return (
    <div className="relative">
      <div 
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${blurStyles[blur]}
          ${hoverStyles}
          ${borderStyles}
          ${glowStyles}
          ${gradientStyles}
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
};

export default GlassCard; 