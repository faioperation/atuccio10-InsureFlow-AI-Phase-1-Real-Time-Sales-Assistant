'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';
import { Entities } from '@/types';
import { User, DollarSign, Calendar, Package, Heart } from 'lucide-react';

interface EntityCardProps {
  label: string;
  values: string[];
  icon: typeof User;
  colorClass: string;
}

function EntityCard({ label, values, icon: Icon, colorClass }: EntityCardProps) {
  const safeValues = Array.isArray(values) ? values : [];
  if (safeValues.length === 0) return null;

  return (
    <div className={cn(
      "flex flex-col gap-1.5 p-3 rounded-lg",
      'bg-slate-100 dark:bg-slate-800/50'
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn('w-3.5 h-3.5', colorClass)} />
        <span className={cn('text-xs font-medium', 'text-slate-600 dark:text-slate-400')}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {safeValues.slice(0, 3).map((value, idx) => (
          <span
            key={idx}
            className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-md border",
              'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            )}
          >
            {value}
          </span>
        ))}
        {safeValues.length > 3 && (
          <span className="px-2 py-0.5 text-xs text-slate-400">+{safeValues.length - 3}</span>
        )}
      </div>
    </div>
  );
}

interface EntityDisplayProps {
  entities: Entities;
  className?: string;
}

export function EntityDisplay({ entities, className }: EntityDisplayProps) {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';

  const entityTypes = [
    { key: 'PERSON', label: 'Person', icon: User, colorClass: 'text-blue-500' },
    { key: 'AMOUNT', label: 'Amount', icon: DollarSign, colorClass: 'text-emerald-500' },
    { key: 'DATE', label: 'Date', icon: Calendar, colorClass: 'text-purple-500' },
    { key: 'PRODUCT', label: 'Product', icon: Package, colorClass: 'text-amber-500' },
    { key: 'SPOUSE_NAME', label: 'Spouse', icon: Heart, colorClass: 'text-rose-500' },
  ];

  const hasEntities = entityTypes.some(({ key }) => {
    const val = entities[key];
    return Array.isArray(val) && val.length > 0;
  });

  if (!hasEntities) {
    return (
      <div className={cn(
        "p-4 text-center text-sm rounded-xl border",
        isDark ? 'text-slate-400 bg-slate-900 border-slate-800' : 'text-slate-500 bg-white border-slate-200',
        className
      )}>
        No entities detected yet
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {entityTypes.map(({ key, label, icon, colorClass }) => (
        <EntityCard key={key} label={label} values={Array.isArray(entities[key]) ? entities[key] : []} icon={icon} colorClass={colorClass} />
      ))}
    </div>
  );
}