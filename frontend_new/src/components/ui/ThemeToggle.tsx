import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from './Button';
import { useState } from 'react';

interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
}

export default function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => setShowMenu(!showMenu);
  const closeMenu = () => setShowMenu(false);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    closeMenu();
  };

  // Simple click handler that directly toggles between light and dark
  const handleQuickToggle = () => {
    if (variant === 'icon') {
      toggleMenu(); // For icon variant, we'll still show the menu for all options
    } else {
      toggleTheme(); // For other variants, directly toggle between light/dark
    }
  };

  return (
    <div className="relative">
      {variant === 'icon' ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleQuickToggle}
          aria-label="Toggle theme"
          className="transition-transform hover:scale-110"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          )}
        </Button>
      ) : (
        <Button
          variant={variant}
          size="sm"
          onClick={handleQuickToggle}
          leftIcon={
            resolvedTheme === 'dark' ? (
              <Moon className="h-4 w-4 mr-2" />
            ) : (
              <Sun className="h-4 w-4 mr-2" />
            )
          }
        >
          {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
        </Button>
      )}

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-30 mt-2 w-36 rounded-md border border-border bg-card shadow-lg animate-fadeIn">
            <div className="py-1">
              <button
                className={`flex w-full items-center px-4 py-2 text-sm ${
                  theme === 'light'
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground hover:bg-accent/10'
                } transition-colors`}
                onClick={() => handleThemeChange('light')}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </button>
              <button
                className={`flex w-full items-center px-4 py-2 text-sm ${
                  theme === 'dark'
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground hover:bg-accent/10'
                } transition-colors`}
                onClick={() => handleThemeChange('dark')}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </button>
              <button
                className={`flex w-full items-center px-4 py-2 text-sm ${
                  theme === 'system'
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground hover:bg-accent/10'
                } transition-colors`}
                onClick={() => handleThemeChange('system')}
              >
                <Laptop className="mr-2 h-4 w-4" />
                System
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 