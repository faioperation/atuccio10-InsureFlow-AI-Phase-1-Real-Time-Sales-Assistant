'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';
import { CallSession, Phase } from '@/types';
import { Phone, Clock, TrendingUp, Users, Target } from 'lucide-react';

interface StatsPanelProps {
  session: CallSession | null;
  className?: string;
}

export function StatsPanel({ session, className }: StatsPanelProps) {
  const { theme, mounted } = useTheme();
  
  const duration = session
    ? Math.floor((Date.now() - session.startTime.getTime()) / 1000)
    : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const phaseCounts = session
    ? session.insights.reduce(
        (acc, insight) => {
          acc[insight.phase] = (acc[insight.phase] || 0) + 1;
          return acc;
        },
        {} as Record<Phase, number>
      )
    : {};

  const dominantPhase = (Object.entries(phaseCounts) as [Phase, number][]).sort(([, a], [, b]) => b - a)[0]?.[0];

  const sentimentCounts = session
    ? session.insights.reduce(
        (acc, insight) => {
          acc[insight.mood] = (acc[insight.mood] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    : {};

  const totalInsights = session?.insights.length || 0;
  const positiveRatio = totalInsights > 0
    ? Math.round(((sentimentCounts['Interested'] || 0) / totalInsights) * 100)
    : 0;

  const isDark = mounted && theme === 'dark';

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3', className)}>
      <StatCard
        icon={Phone}
        label="Session ID"
        value={session?.id ? session.id.slice(-6) : '---'}
        sublabel={session ? 'Active' : 'No session'}
        accentColor="blue"
        isDark={isDark}
      />
      <StatCard
        icon={Clock}
        label="Duration"
        value={formatDuration(duration)}
        sublabel="mm:ss"
        accentColor="purple"
        isDark={isDark}
      />
      <StatCard
        icon={Target}
        label="Current Phase"
        value={session?.currentPhase || '---'}
        sublabel={dominantPhase ? `Most: ${dominantPhase}` : ''}
        accentColor="amber"
        isDark={isDark}
      />
      <StatCard
        icon={TrendingUp}
        label="Sentiment"
        value={positiveRatio > 0 ? `${positiveRatio}%` : '---'}
        sublabel="Positive ratio"
        accentColor="emerald"
        isDark={isDark}
      />
    </div>
  );
}

interface StatCardProps {
  icon: typeof Phone;
  label: string;
  value: string;
  sublabel: string;
  accentColor: 'blue' | 'purple' | 'amber' | 'emerald';
  isDark: boolean;
  className?: string;
}

const accentColors = {
  blue: 'text-blue-500 bg-blue-500/10',
  purple: 'text-purple-500 bg-purple-500/10',
  amber: 'text-amber-500 bg-amber-500/10',
  emerald: 'text-emerald-500 bg-emerald-500/10',
};

function StatCard({ icon: Icon, label, value, sublabel, accentColor, isDark, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border',
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200',
        className
      )}
    >
      <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg', accentColors[accentColor])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>{label}</p>
        <p className={cn('text-sm font-semibold', isDark ? 'text-slate-200' : 'text-slate-900')}>{value}</p>
        {sublabel && (
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>{sublabel}</p>
        )}
      </div>
    </div>
  );
}