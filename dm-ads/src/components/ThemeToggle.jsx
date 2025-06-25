import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="relative transition-all duration-300 hover:scale-105"
    >
      <div className="relative">
        {theme === 'light' ? (
          <Moon className="h-4 w-4 transition-all duration-300 rotate-0 scale-100" />
        ) : (
          <Sun className="h-4 w-4 transition-all duration-300 rotate-180 scale-100" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle;