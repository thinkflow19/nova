import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  animate?: boolean;
  gradient?: boolean;
  glow?: boolean;
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
  ...props 
}) => {
  const hoverClass = hoverable 
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.18)]' 
    : '';
  
  const borderClass = gradient 
    ? 'border-transparent bg-gradient-to-br p-[1px] from-violet-600/30 to-indigo-600/30 dark:from-violet-600/50 dark:to-indigo-600/40' 
    : 'border border-white/10';
  
  const glowClass = glow 
    ? 'shadow-[0_0_15px_rgba(139,92,246,0.3)] dark:shadow-[0_0_20px_rgba(139,92,246,0.4)]' 
    : '';
  
  const darkModeClass = 'dark:bg-gradient-to-b dark:from-card/90 dark:to-card/40';
  
  const cardContent = (
    <div 
      className={`
        rounded-xl bg-white/[0.03] backdrop-blur-xl backdrop-saturate-150 
        overflow-hidden ${hoverClass} ${borderClass} ${glowClass} ${darkModeClass} ${className}
      `}
      {...props}
    >
      {gradient ? (
        <div className="h-full w-full rounded-xl bg-card p-6">
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {cardContent}
      </motion.div>
    );
  }
  
  return cardContent;
};

export default GlassCard; 