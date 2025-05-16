'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppTheme = 'teal' | 'amber' | 'indigo' | 'coral';
export type AppMode = 'light' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: AppTheme;
  defaultMode?: AppMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'teal',
  defaultMode = 'light',
}) => {
  const [theme, setThemeState] = useState<AppTheme>(defaultTheme);
  const [mode, setModeState] = useState<AppMode>(defaultMode);
  const [isMounted, setIsMounted] = useState(false);

  // Effect to run once on mount to initialize from localStorage or system preference
  useEffect(() => {
    // Initialize theme
    const storedTheme = localStorage.getItem('app-theme') as AppTheme;
    if (storedTheme) {
      setThemeState(storedTheme);
    } else {
      setThemeState(defaultTheme); // Fallback to default if nothing in localStorage
    }
    document.documentElement.setAttribute('data-theme', storedTheme || defaultTheme);

    // Initialize mode
    const storedMode = localStorage.getItem('app-mode') as AppMode;
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedMode) {
      setModeState(storedMode);
    } else if (systemPrefersDark) {
      setModeState('dark');
    } else {
      setModeState(defaultMode); // Fallback to default
    }
    
    if ((storedMode === 'dark') || (!storedMode && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Effect to update localStorage and HTML attributes when theme changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('app-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, isMounted]);

  // Effect to update localStorage and HTML attributes when mode changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('app-mode', mode);
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [mode, isMounted]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  if (!isMounted) {
    // To prevent hydration mismatch, render nothing or a loader until mounted
    return null; 
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 