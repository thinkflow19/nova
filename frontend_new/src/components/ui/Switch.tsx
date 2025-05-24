import React from 'react';
import { Switch as HeroUISwitch } from '@heroui/react';
import type { SwitchProps as HeroUISwitchProps } from '@heroui/react'; // Import props type directly
import { cn } from '@/utils/cn';

// Ensure standard HTML attributes like id can be passed through, along with our custom mappings.
export interface SwitchProps extends Omit<HeroUISwitchProps, 'className' | 'isSelected' | 'onValueChange' | 'id'> { 
  className?: string;
  id?: string; // Ensure id is part of our props
  checked?: boolean; // Our preferred prop name for checked state
  onCheckedChange?: (checked: boolean) => void; // Our preferred callback name
  'aria-label'?: string; // Standard accessibility attribute
}

export const Switch: React.FC<SwitchProps> = ({ 
  className, 
  id, 
  checked, 
  onCheckedChange, 
  'aria-label': ariaLabel, 
  ...props 
}) => {
  
  const heroUIProps: HeroUISwitchProps = {
    ...(props as Omit<SwitchProps, 'className' | 'id' | 'checked' | 'onCheckedChange' | 'aria-label'>),
    isSelected: checked, 
    onValueChange: onCheckedChange,
    id: id, // Explicitly pass id
  };
  // If aria-label is a direct prop on HeroUISwitch, pass it. Otherwise, it's for the wrapper.
  if (ariaLabel) {
    (heroUIProps as any)['aria-label'] = ariaLabel;
  }

  return (
    <HeroUISwitch
      className={cn(
        // Base styling for the switch from the UI guide (conceptual)
        // HeroUI Switch might have its own way of styling, these are Tailwind classes
        "group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "data-[selected=true]:bg-primary data-[selected=false]:bg-muted", // Colors for on/off state
        className
      )}
      {...heroUIProps} // Pass the (potentially casted) props to HeroUISwitch
    >
      {/* The HeroUI Switch might render its own handle, or expect children. 
          The previous span elements were more akin to a custom-built switch. 
          If HeroUISwitch handles its own appearance, these spans might conflict or be unnecessary.
          For now, I'll keep them as they were in the previous attempt, assuming HeroUISwitch is a basic unstyled primitive or needs these for styling.
          If HeroUISwitch is fully styled, these should be removed.
      */}
      <span className="sr-only">{ariaLabel || 'Use setting'}</span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          "group-data-[selected=true]:translate-x-5 group-data-[selected=false]:translate-x-0"
        )}
      />
    </HeroUISwitch>
  );
}; 