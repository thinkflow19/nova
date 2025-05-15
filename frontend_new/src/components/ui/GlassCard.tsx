import React from 'react';
import { motion, MotionProps } from 'framer-motion';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  animate?: boolean;
  // gradient, glow, color, and specific variants might be simplified or removed 
  // in favor of a consistent theme application based on meta-prompt.
  // For now, let's keep variant to allow some flexibility but style it with theme colors.
  variant?: 'default' | 'accented'; // Simplified variants
}

/**
 * A themed glass card component adhering to the Ocean Teal Theme.
 * Features consistent styling, optional hover effects, and animation.
 */
const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverable = true,
  animate = true,
  variant = 'default',
  ...props 
}) => {

  const baseClasses = `
    bg-bg-panel/80 dark:bg-bg-panel/70 
    backdrop-blur-xl backdrop-saturate-150 
    border border-border-color 
    rounded-2xl 
    shadow-xl 
    transition-all duration-300 ease-in-out
  `;

  const hoverClasses = hoverable 
    ? `hover:ring-2 hover:ring-primary/40 hover:-translate-y-1 hover:shadow-2xl`
    : '';

  // Variant specific styling, using theme colors
  let variantSpecificClasses = '';
  if (variant === 'accented') {
    // Example: Add a top border accent or a subtle internal shadow with primary color
    variantSpecificClasses = 'border-t-2 border-t-primary';
  }

  const combinedClasses = `
    ${baseClasses}
    ${hoverClasses}
    ${variantSpecificClasses}
    ${className} 
  `;

  const cardContent = (
    <div 
      className={combinedClasses.trim().replace(/\s+/g, ' ' )} // Normalize whitespace
      {...props}
    >
      {children}
    </div>
  );
  
  if (animate) {
    const animationProps: MotionProps = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3, ease: "circOut" }
    };
    return (
      <motion.div {...animationProps}>
        {cardContent}
      </motion.div>
    );
  }
  
  return cardContent;
};

export default GlassCard; 