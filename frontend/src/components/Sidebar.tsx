'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';
import { 
  LayoutDashboard, 
  Activity, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Zap,
  Sun,
  Moon
} from 'lucide-react';

export type NavItem = 'dashboard' | 'live-monitor' | 'analytics' | 'settings' | 'help';

interface SidebarProps {
  activeItem?: NavItem;
  onNavigate?: (item: NavItem) => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const navItems: { id: NavItem; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'live-monitor', icon: Activity, label: 'Live Monitor' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'help', icon: HelpCircle, label: 'Help' },
];

export function Sidebar({ activeItem = 'dashboard', onNavigate, isOpen = false, onClose, className }: SidebarProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!mounted || !isMounted) {
    return (
      <aside className={cn('w-56 flex-shrink-0 hidden lg:flex flex-col h-full border-r bg-slate-900 border-slate-800', className)}>
        <Logo theme="dark" />
        <NavItems items={navItems} activeItem={activeItem} onNavigate={onNavigate} isDark />
      </aside>
    );
  }

  const isDark = theme === 'dark';

  return (
    <>
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r transition-transform duration-300 lg:transition-none',
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden',
        className
      )}>
        <Logo theme={theme} />
        <NavItems items={navItems} activeItem={activeItem} onNavigate={onNavigate} isDark={isDark} />
        
        <div className={cn("px-3 py-4 border-t", isDark ? 'border-slate-800' : 'border-slate-200')}>
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            )}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className={cn("px-4 py-4 border-t", isDark ? 'border-slate-800' : 'border-slate-200')}>
          <div className={cn("p-3 rounded-lg", isDark ? 'bg-slate-800/50' : 'bg-slate-100')}>
            <p className={cn("text-xs", isDark ? 'text-slate-400' : 'text-slate-500')}>AI Agent v1.0</p>
            <p className={cn("text-xs mt-0.5", isDark ? 'text-slate-500' : 'text-slate-400')}>Port 5051</p>
          </div>
        </div>
      </aside>

      <aside className={cn('hidden lg:flex w-56 flex-shrink-0 flex-col h-full border-r', isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200', className)}>
        <Logo theme={theme} />
        <NavItems items={navItems} activeItem={activeItem} onNavigate={onNavigate} isDark={isDark} />
        
        <div className={cn("px-3 py-4 border-t mt-auto", isDark ? 'border-slate-800' : 'border-slate-200')}>
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            )}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className={cn("px-4 py-4 border-t", isDark ? 'border-slate-800' : 'border-slate-200')}>
          <div className={cn("p-3 rounded-lg", isDark ? 'bg-slate-800/50' : 'bg-slate-100')}>
            <p className={cn("text-xs", isDark ? 'text-slate-400' : 'text-slate-500')}>AI Agent v1.0</p>
            <p className={cn("text-xs mt-0.5", isDark ? 'text-slate-500' : 'text-slate-400')}>Port 5051</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItems({ items, activeItem, onNavigate, isDark }: { 
  items: typeof navItems; 
  activeItem: NavItem; 
  onNavigate?: (item: NavItem) => void;
  isDark: boolean;
}) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const isActive = activeItem === item.id;
        const Icon = item.icon;
        
        return (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive ? 'bg-violet-500/10 text-violet-400' : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function Logo({ theme }: { theme: string }) {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-5 border-b", theme === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500">
        <Zap className="w-4 h-4 text-white" />
      </div>
      <span className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-slate-900')}>InsureFlow</span>
    </div>
  );
}