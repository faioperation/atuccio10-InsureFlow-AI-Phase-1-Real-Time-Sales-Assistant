'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';
import { Signal, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error?: string | null;
  className?: string;
}

export function ConnectionStatus({ isConnected, error, className }: ConnectionStatusProps) {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        isConnected
          ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
          : error
          ? isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-500/10 text-red-600'
          : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-500/10 text-amber-600',
        className
      )}
    >
      {isConnected ? (
        <>
          <Signal className="w-3.5 h-3.5" />
          <span>Connected</span>
        </>
      ) : error ? (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Error</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Connecting...</span>
        </>
      )}
    </div>
  );
}