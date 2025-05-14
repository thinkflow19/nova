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
    ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.12)]' 
    : '';
  
  const borderClass = gradient 
    ? 'border-transparent bg-gradient-to-br p-[1px] from-violet-600/20 to-indigo-600/20 dark:from-violet-600/30 dark:to-indigo-600/30' 
    : 'border border-white/10';
  
  const glowClass = glow 
    ? 'shadow-[0_0_15px_rgba(139,92,246,0.2)] dark:shadow-[0_0_20px_rgba(139,92,246,0.25)]' 
    : '';
  
  const darkModeClass = 'dark:bg-gradient-to-b dark:from-card/95 dark:to-card/40';
  
  const cardContent = (
    <div 
      className={`
        rounded-xl bg-white/[0.05] backdrop-blur-lg backdrop-saturate-150 
        overflow-hidden ${hoverClass} ${borderClass} ${glowClass} ${darkModeClass} ${className}
      `}
      {...props}
    >
      {gradient ? (
        <div className="h-full w-full rounded-xl bg-card/95 p-5">
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