'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';
import { Phase } from '@/types';
import { Target, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

const phaseConfig: Record<Phase, { label: string; icon: typeof Target; color: string; bgColor: string }> = {
  Hook: { label: 'Hook', icon: Target, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500' },
  Discovery: { label: 'Discovery', icon: Search, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500' },
  Objection: { label: 'Objection', icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500' },
  Closing: { label: 'Closing', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500' },
};

const phaseOrder: Phase[] = ['Hook', 'Discovery', 'Objection', 'Closing'];

interface PhaseIndicatorProps {
  currentPhase: Phase;
  className?: string;
}

export function PhaseIndicator({ currentPhase, className }: PhaseIndicatorProps) {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  const currentIndex = phaseOrder.indexOf(currentPhase);

  return (
    <div className={cn('hidden md:flex items-center gap-2', className)}>
      {phaseOrder.map((phase, index) => {
        const config = phaseConfig[phase];
        const Icon = config.icon;
        const isActive = index === currentIndex;
        const isPast = index < currentIndex;

        return (
          <div key={phase} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300',
                isActive ? `${config.color} ${config.bgColor}/10 ring-1 ring-blue-500/30` : isPast ? (isDark ? 'text-slate-400 bg-slate-800/50' : 'text-slate-600 bg-slate-200') : (isDark ? 'text-slate-500 bg-slate-900/50' : 'text-slate-400 bg-slate-100')
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', isActive && 'animate-pulse')} />
              <span>{config.label}</span>
            </div>
            {index < phaseOrder.length - 1 && (
              <div className={cn('w-4 h-0.5 rounded-full', isPast ? (isDark ? 'bg-slate-600' : 'bg-slate-400') : (isDark ? 'bg-slate-700' : 'bg-slate-300'))} />
            )}
          </div>
        );
      })}
    </div>
  );
}