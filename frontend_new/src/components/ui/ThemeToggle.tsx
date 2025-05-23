import React from 'react';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { mode, toggleMode } = useTheme();

  return (
    <button
      onClick={toggleMode}
      className={`p-2 rounded-lg hover:bg-[rgb(var(--bg-panel))] transition-colors ${className}`}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      {mode === 'light' ? (
        <IconMoon size={20} className="text-[rgb(var(--text-primary))]" />
      ) : (
        <IconSun size={20} className="text-[rgb(var(--text-primary))]" />
      )}
              </button>
  );
} 

export default ThemeToggle; 