'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';
import { SentimentLabel } from '@/types';
import { Smile, Frown, Meh, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const sentimentConfig: Record<SentimentLabel, { icon: typeof Smile; color: string; bgColor: string; label: string }> = {
  Interested: {
    icon: Smile,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500',
    label: 'Positive',
  },
  Frustrated: {
    icon: Frown,
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    label: 'Negative',
  },
  Neutral: {
    icon: Meh,
    color: 'text-slate-600',
    bgColor: 'bg-slate-500',
    label: 'Neutral',
  },
};

interface SentimentDisplayProps {
  label: SentimentLabel;
  score?: number;
  className?: string;
}

export function SentimentDisplay({ label, score, className }: SentimentDisplayProps) {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  
  // Add fallback for undefined or unexpected labels
  const safeLabel = label && typeof label === 'string' ? label.trim() : 'Neutral';
  const config = sentimentConfig[safeLabel as SentimentLabel] || sentimentConfig.Neutral;
  const displayLabel = safeLabel;
  
  const Icon = config.icon;
  const scoreValue = score !== undefined ? parseFloat(String(score)) / 100 : undefined;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border',
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200',
        className
      )}
    >
      <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', config.bgColor + '/10')}>
        <Icon className={cn('w-5 h-5', config.color)} />
      </div>
      <div className="flex-1">
        <p className={cn('text-sm font-semibold', config.color)}>{displayLabel}</p>
        <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>{config.label}</p>
      </div>
      {scoreValue !== undefined && (
        <div className="flex items-center gap-1">
          {scoreValue > 0.6 ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : scoreValue < 0.4 ? (
            <TrendingDown className="w-4 h-4 text-red-500" />
          ) : (
            <Minus className="w-4 h-4 text-slate-400" />
          )}
          <span className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
            {Math.round(scoreValue * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

interface SentimentHistoryProps {
  sentiments: SentimentLabel[];
  className?: string;
}

export function SentimentHistory({ sentiments, className }: SentimentHistoryProps) {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  
  const counts = sentiments.reduce(
    (acc, label) => {
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    },
    {} as Record<SentimentLabel, number>
  );

  const total = sentiments.length || 1;

  return (
    <div className={cn('space-y-2', className)}>
      {(['Interested', 'Frustrated', 'Neutral'] as SentimentLabel[]).map((label) => {
        const config = sentimentConfig[label];
        const Icon = config.icon;
        const count = counts[label] || 0;
        const percentage = Math.round((count / total) * 100);

        return (
          <div key={label} className="flex items-center gap-2">
            <Icon className={cn('w-3.5 h-3.5', config.color)} />
            <div className={cn('flex-1 h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-800' : 'bg-slate-200')}>
              <div className={cn('h-full rounded-full transition-all duration-500', config.bgColor)} style={{ width: `${percentage}%` }} />
            </div>
            <span className={cn('text-xs w-8', isDark ? 'text-slate-400' : 'text-slate-500')}>{percentage}%</span>
          </div>
        );
      })}
    </div>
  );
}