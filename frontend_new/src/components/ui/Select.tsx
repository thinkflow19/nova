import React from 'react';
import { Select as HeroUISelect, SelectItem as HeroUISelectItem } from '@heroui/react';
import type { SelectProps as HeroUISelectProps, SelectItemProps as HeroUISelectItemProps } from '@heroui/react';
import { cn } from '@/utils/cn';

// Ensure `value` is part of our SelectItemProps and used correctly.
// Omit `value` from HeroUISelectItemProps if it exists to avoid conflict, as we map it to `key` and `textValue`.
export interface SelectItemProps extends Omit<HeroUISelectItemProps, 'key' | 'textValue' | 'value'> {
  value: string; 
  children: React.ReactNode;
  className?: string;
}

// This component is primarily a data carrier for its props when used as a child of our Select.
// It can also be used standalone if HeroUISelectItem is ever needed directly, but its main role
// is to be processed by our custom Select component.
export const SelectItem: React.FC<SelectItemProps> = ({ children, value, className, ...props }) => {
  // When rendered directly (not common for this pattern), it renders a HeroUISelectItem.
  // However, our Select component below will map these, not render them directly as wrappers.
  return (
    <HeroUISelectItem
      key={value} 
      textValue={typeof children === 'string' ? children : value}
      className={cn("text-sm rounded-md focus:bg-muted", className)}
      {...(props as Omit<HeroUISelectItemProps, 'key' | 'textValue' | 'children' | 'className' | 'value'>)}
    >
      {children}
    </HeroUISelectItem>
  );
};

// Ensure `value` and `onValueChange` are part of SelectProps and map correctly.
// Omit relevant props from HeroUISelectProps to avoid conflicts.
export interface SelectProps extends Omit<HeroUISelectProps, 'selectedKeys' | 'onSelectionChange' | 'children' | 'items' | 'value' | 'placeholder' | 'id'> {
  id?: string; // Allow id to be passed
  value?: string; 
  onValueChange?: (value: string) => void; 
  children: React.ReactNode; // Accept ReactNode, then filter and map to HeroUISelectItems
  className?: string;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  className, 
  children, 
  id, 
  value, 
  onValueChange, 
  placeholder, 
  ...props 
}) => {
  const handleSelectionChange = (keys: any) => { 
    if (onValueChange) {
      const selectedKey = keys instanceof Set ? Array.from(keys)[0] as string : undefined;
      if (selectedKey !== undefined) {
        onValueChange(selectedKey);
      }
    }
  };

  // Map children (our SelectItem components) to HeroUISelectItem components
  const heroUIChildren = React.Children.toArray(children).map(child => {
    if (React.isValidElement(child) && typeof child.type !== 'string' && (child.type as React.FC<unknown>) === (SelectItem as React.FC<unknown>)) {
      const itemProps = child.props as SelectItemProps;
      return (
        <HeroUISelectItem 
          key={itemProps.value} 
          textValue={typeof itemProps.children === 'string' ? itemProps.children : itemProps.value}
          {...(itemProps as Omit<SelectItemProps, 'value' | 'children'>) }
          className={itemProps.className}
        >
          {itemProps.children}
        </HeroUISelectItem>
      );
    }
    return null;
  }).filter(Boolean) as React.ReactElement[];

  return (
    <HeroUISelect
      className={cn(
        "rounded-lg border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary w-full h-10",
        className
      )}
      id={id} // Pass id to HeroUISelect
      selectedKeys={value ? [value] : undefined} 
      onSelectionChange={handleSelectionChange}
      placeholder={placeholder}
      // Spread remaining compatible props
      {...(props as Omit<HeroUISelectProps, 'selectedKeys' | 'onSelectionChange' | 'children' | 'items' | 'className' | 'placeholder' | 'value' | 'id'>)} 
    >
      {heroUIChildren}
    </HeroUISelect>
  );
};

// You might also want to create SelectTrigger, SelectContent, SelectItem, etc.
// for a more Shadcn/Radix-like experience, but this is a simple start. 