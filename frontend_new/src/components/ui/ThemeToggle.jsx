import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';

export default function ThemeToggle({ variant = 'icon' }) {
  const { theme, toggleTheme } = useTheme();
  
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="w-10 h-10 rounded-full"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-yellow-400" />
        ) : (
          <Moon className="h-5 w-5 text-accent" />
        )}
      </Button>
    );
  }
  
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-card-foreground/10 rounded-lg transition-colors"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-5 w-5 text-yellow-400" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5 text-accent" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
} 