'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Get stored theme or default to system
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = storedTheme || 'system';
    setTheme(initialTheme);

    // Apply the theme
    updateTheme(initialTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update theme when it changes
  useEffect(() => {
    updateTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Helper to update the theme
  const updateTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    const isDark = 
      newTheme === 'dark' || 
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.remove('dark', 'light');
    root.classList.add(isDark ? 'dark' : 'light');
    setResolvedTheme(isDark ? 'dark' : 'light');
  };

  const value = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 