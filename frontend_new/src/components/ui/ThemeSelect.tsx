import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import type { AppTheme } from '@/contexts/ThemeContext';

interface ThemeSelectProps {
  className?: string;
}

const themes: { value: AppTheme; label: string; color: string }[] = [
  { value: 'blue', label: 'Blue', color: 'rgb(37 99 235)' },
  { value: 'indigo', label: 'Indigo', color: 'rgb(79 70 229)' },
  { value: 'purple', label: 'Purple', color: 'rgb(147 51 234)' },
  { value: 'teal', label: 'Teal', color: 'rgb(13 148 136)' },
];

export function ThemeSelect({ className = '' }: ThemeSelectProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {themes.map(({ value, label, color }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            w-8 h-8 rounded-full transition-all
            ${theme === value ? 'ring-2 ring-offset-2 ring-[rgb(var(--theme-primary))]' : 'hover:scale-110'}
            dark:ring-offset-[rgb(var(--bg-main))]
          `}
          style={{ backgroundColor: color }}
          aria-label={`Switch to ${label} theme`}
        />
      ))}
    </div>
  );
}

export default ThemeSelect; 