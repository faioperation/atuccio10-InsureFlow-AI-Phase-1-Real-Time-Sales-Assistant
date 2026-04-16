'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';
import { Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface AIAdviceProps {
  advice: string;
  timestamp?: number;
  className?: string;
}

export function AIAdvice({ advice, timestamp, className }: AIAdviceProps) {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(advice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border transition-all duration-300',
        isDark ? 'from-violet-950/30 to-indigo-950/30 border-violet-800' : 'from-violet-50 to-indigo-50 border-violet-200',
        isDark ? 'bg-gradient-to-br' : 'bg-gradient-to-br',
        className
      )}
      style={!isDark ? { background: 'linear-gradient(to bottom right, rgb(245 243 255), rgb(238 242 255))' } : undefined}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/10">
              <Sparkles className={cn('w-4 h-4', isDark ? 'text-violet-400' : 'text-violet-600')} />
            </div>
            <span className={cn('text-sm font-semibold', isDark ? 'text-violet-300' : 'text-violet-700')}>
              AI Recommendation
            </span>
          </div>
          {formattedTime && (
            <span className={cn('text-xs', isDark ? 'text-violet-400/50' : 'text-violet-500/70')}>
              {formattedTime}
            </span>
          )}
        </div>

        <p className={cn('text-sm leading-relaxed', isDark ? 'text-slate-200' : 'text-slate-700')}>
          {advice || 'Waiting for AI advice...'}
        </p>

        {advice && (
          <button
            onClick={handleCopy}
            className={cn(
              "mt-3 flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors",
              isDark ? 'text-slate-400 hover:text-slate-200 bg-slate-800/50' : 'text-slate-500 hover:text-slate-700 bg-slate-100/50'
            )}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}