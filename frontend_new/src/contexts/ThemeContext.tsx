'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppTheme = 'blue' | 'indigo' | 'purple' | 'teal';
export type AppMode = 'light' | 'dark';

interface ThemeColors {
  [key: string]: {
    primary: string;
    primaryRgb: string;
    accent: string;
  };
}

const themeColors: ThemeColors = {
  blue: {
    primary: '37 99 235', // blue-600
    primaryRgb: '37, 99, 235',
    accent: '59 130 246', // blue-500
  },
  indigo: {
    primary: '79 70 229', // indigo-600
    primaryRgb: '79, 70, 229',
    accent: '99 102 241', // indigo-500
  },
  purple: {
    primary: '147 51 234', // purple-600
    primaryRgb: '147, 51, 234',
    accent: '168 85 247', // purple-500
  },
  teal: {
    primary: '13 148 136', // teal-600
    primaryRgb: '13, 148, 136',
    accent: '20 184 166', // teal-500
  },
};

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
  defaultTheme = 'blue',
  defaultMode = 'light',
}) => {
  const [theme, setThemeState] = useState<AppTheme>(defaultTheme);
  const [mode, setModeState] = useState<AppMode>(defaultMode);
  const [isMounted, setIsMounted] = useState(false);

  // Effect to run once on mount to initialize from localStorage or system preference
  useEffect(() => {
    // Initialize theme
    const storedTheme = localStorage.getItem('app-theme') as AppTheme;
    if (storedTheme && themeColors[storedTheme]) {
      setThemeState(storedTheme);
    } else {
      setThemeState(defaultTheme);
    }

    // Initialize mode
    const storedMode = localStorage.getItem('app-mode') as AppMode;
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedMode) {
      setModeState(storedMode);
    } else if (systemPrefersDark) {
      setModeState('dark');
    } else {
      setModeState(defaultMode);
    }
    
    setIsMounted(true);
  }, [defaultTheme, defaultMode]);

  // Effect to update theme colors and localStorage when theme changes
  useEffect(() => {
    if (isMounted) {
      const colors = themeColors[theme];
      document.documentElement.style.setProperty('--theme-primary', colors.primary);
      document.documentElement.style.setProperty('--theme-primary-rgb', colors.primaryRgb);
      document.documentElement.style.setProperty('--theme-accent', colors.accent);
      localStorage.setItem('app-theme', theme);
    }
  }, [theme, isMounted, defaultTheme, defaultMode]);

  // Effect to update dark mode and localStorage when mode changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('app-mode', mode);
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [mode, isMounted, defaultMode]);

  const setTheme = (newTheme: AppTheme) => {
    if (themeColors[newTheme]) {
    setThemeState(newTheme);
    }
  };

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  if (!isMounted) {
    return null; // Prevent hydration mismatch
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