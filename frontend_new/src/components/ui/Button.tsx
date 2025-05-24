import React from 'react';
import { Button as HeroUIButton } from '@heroui/react';
import type { ButtonProps as HeroUIButtonProps } from '@heroui/react';
import { cn } from '@/utils/cn';

// Define variants and their styles
const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

// Inherit most props from HeroUIButtonProps, only add/override specific ones for our abstraction.
export interface ButtonProps extends Omit<HeroUIButtonProps, 'color' | 'variant' | 'className' | 'size'> {
  variant?: keyof typeof buttonVariants;
  size?: 'default' | 'sm' | 'lg' | 'icon'; // Example sizes
  className?: string;
  children?: React.ReactNode;
  // onClick, type, disabled etc. will be inherited from HeroUIButtonProps.
  // No need to redefine them here if the goal is to pass them through or if HeroUI's types are sufficient.
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'default',
  size = 'default', // Default size, can add styling for it later
  children,
  // onClick, type, disabled are now part of ...props if inherited correctly
  ...props // Spread all other props, including onClick, type, disabled from HeroUIButtonProps
}) => {
  return (
    <HeroUIButton
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        // Add size styles here if you implement them, e.g.:
        // size === 'sm' ? 'h-9 rounded-md px-3' : 'h-10 px-4 py-2',
        // size === 'lg' ? 'h-11 rounded-md px-8' : '',
        // size === 'icon' ? 'h-10 w-10' : '',
        className
      )}
      {...props} // Spread all other props, including onClick, type, disabled from HeroUIButtonProps
    >
      {children}
    </HeroUIButton>
  );
}; 