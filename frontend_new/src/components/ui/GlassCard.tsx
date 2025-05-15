import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  animate?: boolean;
  gradient?: boolean;
  glow?: boolean;
  variant?: 'default' | 'agent' | 'premium';
  color?: string;
}

/**
 * A premium glass card component with gradient border and hover effects
 */
const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverable = true,
  animate = true,
  gradient = false,
  glow = false,
  variant = 'default',
  color,
  ...props 
}) => {
  const hoverClass = hoverable 
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)]' 
    : '';
  
  // Define variant-specific classes
  const variantClasses = {
    default: 'border-transparent bg-gradient-to-br p-[1px] from-violet-600/20 to-indigo-600/20 dark:from-violet-600/30 dark:to-indigo-600/30',
    agent: `border-transparent p-[1px] ${color 
      ? `bg-gradient-to-br from-${color}/20 via-accent/20 to-indigo-600/20 dark:from-${color}/30 dark:via-accent/30 dark:to-indigo-600/30` 
      : 'bg-gradient-to-br from-sky-400/20 via-accent/20 to-indigo-600/20 dark:from-sky-400/30 dark:via-accent/30 dark:to-indigo-600/30'
    }`,
    premium: 'border-transparent bg-gradient-to-br p-[1px] from-amber-500/30 via-fuchsia-600/30 to-indigo-600/30 dark:from-amber-500/40 dark:via-fuchsia-600/40 dark:to-indigo-600/40'
  };
  
  const borderClass = gradient 
    ? variantClasses[variant]
    : 'border border-white/10';
  
  const glowClass = glow 
    ? variant === 'premium' 
      ? 'shadow-[0_0_25px_rgba(139,92,246,0.3)] dark:shadow-[0_0_35px_rgba(139,92,246,0.35)]'
      : variant === 'agent'
        ? 'shadow-[0_0_20px_rgba(79,142,246,0.25)] dark:shadow-[0_0_30px_rgba(79,142,246,0.3)]'
        : 'shadow-[0_0_15px_rgba(139,92,246,0.2)] dark:shadow-[0_0_20px_rgba(139,92,246,0.25)]'
    : '';
  
  const darkModeClass = 'dark:bg-gradient-to-b dark:from-card/95 dark:to-card/40';
  
  const cardContent = (
    <div 
      className={`
        rounded-xl bg-white/[0.05] backdrop-blur-lg backdrop-saturate-150 
        overflow-hidden ${hoverClass} ${borderClass} ${glowClass} ${darkModeClass} ${className}
        ${variant === 'agent' ? 'bg-gradient-to-br from-white/50 to-white/30 dark:from-card/95 dark:to-card/70' : ''}
        ${variant === 'premium' ? 'bg-gradient-to-br from-white/60 to-white/40 dark:from-card/90 dark:to-card/60' : ''}
      `}
      {...props}
    >
      {gradient ? (
        <div className={`h-full w-full rounded-xl ${variant === 'default' ? 'bg-card/95' : 'bg-card/90'} p-5`}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
  
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {cardContent}
      </motion.div>
    );
  }
  
  return cardContent;
};

export default GlassCard; 