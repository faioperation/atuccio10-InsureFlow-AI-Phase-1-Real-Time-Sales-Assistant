'use client';

import { useTheme } from '@/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-slate-800" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
        theme === 'dark' 
          ? 'bg-slate-800 hover:bg-slate-700' 
          : 'bg-slate-100 hover:bg-slate-200'
      }`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-500" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600" />
      )}
    </button>
  );
}