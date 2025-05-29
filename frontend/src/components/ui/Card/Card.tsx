import React from 'react';
import { BaseComponentProps } from '@/types';

interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'glass' | 'intense' | 'neural';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  glow = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
}) => {
  const baseClasses = `
    relative rounded-2xl transition-all duration-300 ease-out
    gpu-accelerated will-change-transform
  `;

  const variantClasses = {
    default: `
      bg-white dark:bg-gray-800 
      border border-gray-200 dark:border-gray-700
      shadow-md hover:shadow-lg
    `,
    glass: `
      glass-morphism
      hover:backdrop-blur-3xl hover:bg-opacity-20
    `,
    intense: `
      glass-morphism-intense
      hover:backdrop-blur-4xl
    `,
    neural: `
      bg-gradient-to-br from-purple-500/10 via-cyan-500/10 to-emerald-500/10
      border border-white/10 backdrop-blur-xl
      hover:from-purple-500/20 hover:via-cyan-500/20 hover:to-emerald-500/20
    `,
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const hoverClasses = hover ? `
    hover:scale-[1.02] hover:-translate-y-1
    cursor-pointer
  ` : '';

  const glowClasses = glow ? `
    hover:shadow-[0_0_30px_rgba(0,245,255,0.3)]
    animate-neural-pulse
  ` : '';

  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${hoverClasses}
    ${glowClasses}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      className={combinedClasses}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      type={onClick ? 'button' : undefined}
      style={style}
    >
      {children}
    </CardComponent>
  );
};

export default Card; 