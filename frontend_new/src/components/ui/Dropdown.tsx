import React, { createContext, useContext, useState, ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOpen: () => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdown must be used within a DropdownProvider');
  }
  return context;
};

interface DropdownProps {
  children: ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);
  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, toggleOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownContext.Provider>
  );
};

export const DropdownTrigger: React.FC<{ children: ReactNode, asChild?: boolean } & HTMLAttributes<HTMLButtonElement>> = ({ children, asChild, className, ...props }) => {
  const { toggleOpen } = useDropdown();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        toggleOpen();
        children.props.onClick?.(e);
      },
      ...props,
    } as HTMLAttributes<HTMLElement>);
  }
  return (
    <button type="button" onClick={toggleOpen} className={className} {...props}>
      {children}
    </button>
  );
};

export const DropdownMenu: React.FC<{ children: ReactNode, className?: string } & HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  const { isOpen } = useDropdown();
  if (!isOpen) return null;
  return (
    <div
      className={cn(
        'absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1',
        className
      )}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabIndex={-1}
      {...props}
    >
      {children}
    </div>
  );
};

export const DropdownItem: React.FC<{ children: ReactNode, onSelect?: () => void, className?: string } & HTMLAttributes<HTMLButtonElement>> = ({ children, onSelect, className, ...props }) => {
  const { setIsOpen } = useDropdown();
  return (
    <button
      type="button"
      className={cn(
        'block w-full px-4 py-2 text-left text-sm text-card-foreground hover:bg-muted/80 focus:bg-muted/80 focus:outline-none',
        className
      )}
      role="menuitem"
      tabIndex={-1}
      onClick={() => {
        onSelect?.();
        setIsOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export const DropdownSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />;
}; 