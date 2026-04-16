'use client';

import { useState, useEffect } from 'react';
import { useAIWebSocket } from '@/hooks/useAIWebSocket';
import { useTheme } from '@/providers/ThemeProvider';
import { Sidebar, NavItem } from '@/components/Sidebar';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { PhaseIndicator } from '@/components/PhaseIndicator';
import { SentimentDisplay } from '@/components/SentimentDisplay';
import { EntityDisplay } from '@/components/EntityDisplay';
import { AIAdvice } from '@/components/AIAdvice';
import { LiveTranscript } from '@/components/LiveTranscript';
import { StatsPanel } from '@/components/StatsPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RefreshCw, WifiOff, Activity, BarChart3, Settings, HelpCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { isConnected, currentInsight, session, error, resetSession } = useAIWebSocket();
  const { theme, mounted } = useTheme();
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [clientMounted, setClientMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setClientMounted(true);
  }, []);

  useEffect(() => {
    if (clientMounted) {
      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          setSidebarOpen(false);
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [clientMounted]);

  if (!mounted || !clientMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  const renderContent = () => {
    switch (activeNav) {
      case 'live-monitor':
        return <LiveMonitorView session={session} currentInsight={currentInsight} isDark={isDark} />;
      case 'analytics':
        return <AnalyticsView isDark={isDark} />;
      case 'settings':
        return <SettingsView isDark={isDark} />;
      case 'help':
        return <HelpView isDark={isDark} />;
      default:
        return <DashboardView 
          isConnected={isConnected} 
          currentInsight={currentInsight} 
          session={session} 
          error={error}
          resetSession={resetSession}
          isDark={isDark}
        />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        activeItem={activeNav} 
        onNavigate={(item) => {
          setActiveNav(item);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={cn("flex-1 flex flex-col overflow-hidden", isDark ? 'bg-slate-950' : 'bg-slate-50')}>
        <header className={cn(
          "flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b",
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                "p-2 rounded-lg lg:hidden",
                isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className={cn("text-lg md:text-xl font-bold", isDark ? 'text-slate-200' : 'text-slate-900')}>Real-Time Dashboard</h1>
            {session && <PhaseIndicator currentPhase={session.currentPhase} />}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <ConnectionStatus isConnected={isConnected} error={error} />
            {session && (
              <button onClick={resetSession} className={cn("flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg", isDark ? 'text-slate-400 bg-slate-800' : 'text-slate-600 bg-slate-100')}>
                <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </header>

        {renderContent()}
      </div>
    </div>
  );
}

function DashboardView({ isConnected, currentInsight, session, error, resetSession, isDark }: {
  isConnected: boolean;
  currentInsight: any;
  session: any;
  error: string | null;
  resetSession: () => void;
  isDark: boolean;
}) {
  return (
    <>
      {!isConnected && !session ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={cn("flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4", isDark ? 'bg-slate-800' : 'bg-slate-100')}>
              <WifiOff className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className={cn("text-lg font-semibold", isDark ? 'text-slate-300' : 'text-slate-700')}>Waiting for Connection</h2>
            <p className={cn("text-sm mt-1", isDark ? 'text-slate-400' : 'text-slate-500')}>Make sure the AI Agent is running on port 5051</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="space-y-6">
            <StatsPanel session={session} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-[350px] md:h-[400px]"><LiveTranscript transcript={session?.transcript || []} rawText={currentInsight?.raw_text} /></div>
                {currentInsight && <AIAdvice advice={currentInsight.advice} timestamp={currentInsight.timestamp} />}
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className={cn("text-sm font-semibold mb-3", isDark ? 'text-slate-300' : 'text-slate-700')}>Sentiment Analysis</h3>
                  {session ? (
                    <SentimentDisplay label={session.currentMood} score={currentInsight ? parseFloat(currentInsight.mood.split('|')[1] || '50') : undefined} />
                  ) : (
                    <div className={cn("p-4 text-center text-sm rounded-xl border", isDark ? 'text-slate-400 bg-slate-900 border-slate-800' : 'text-slate-500 bg-white border-slate-200')}>Waiting for data...</div>
                  )}
                </div>
                <div>
                  <h3 className={cn("text-sm font-semibold mb-3", isDark ? 'text-slate-300' : 'text-slate-700')}>Extracted Entities</h3>
                  <EntityDisplay entities={session?.entities || {}} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LiveMonitorView({ session, currentInsight, isDark }: { session: any; currentInsight: any; isDark: boolean }) {
  return (
    <>
      <div className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[350px] md:h-[500px]">
            <LiveTranscript transcript={session?.transcript || []} rawText={currentInsight?.raw_text} />
          </div>
          <div className="space-y-4">
            <div className={cn("p-4 rounded-xl border", isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')}>
              <h3 className={cn("text-sm font-semibold mb-2", isDark ? 'text-slate-300' : 'text-slate-700')}>Current Phase</h3>
              <p className={cn("text-2xl font-bold", isDark ? 'text-violet-400' : 'text-violet-600')}>{session?.currentPhase || '---'}</p>
            </div>
            <div className={cn("p-4 rounded-xl border", isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')}>
              <h3 className={cn("text-sm font-semibold mb-2", isDark ? 'text-slate-300' : 'text-slate-700')}>Sentiment</h3>
              {session && <SentimentDisplay label={session.currentMood} />}
            </div>
            <div className={cn("p-4 rounded-xl border", isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')}>
              <h3 className={cn("text-sm font-semibold mb-2", isDark ? 'text-slate-300' : 'text-slate-700')}>Live Advice</h3>
              <p className={cn("text-sm", isDark ? 'text-slate-300' : 'text-slate-700')}>{currentInsight?.advice || 'Waiting for input...'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AnalyticsView({ isDark }: { isDark: boolean }) {
  return (
    <>
      <div className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Calls', value: '0', icon: Phone },
            { label: 'Avg Sentiment', value: 'N/A', icon: Activity },
            { label: 'Active Sessions', value: '0', icon: BarChart3 },
          ].map((stat) => (
            <div key={stat.label} className={cn("p-4 rounded-xl border", isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn("w-4 h-4", isDark ? 'text-slate-400' : 'text-slate-500')} />
                <span className={cn("text-xs", isDark ? 'text-slate-400' : 'text-slate-500')}>{stat.label}</span>
              </div>
              <p className={cn("text-2xl font-bold", isDark ? 'text-slate-200' : 'text-slate-900')}>{stat.value}</p>
            </div>
          ))}
        </div>
        <div className={cn("p-6 rounded-xl border text-center", isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')}>
          <p className={cn("text-sm", isDark ? 'text-slate-400' : 'text-slate-500')}>Analytics data will appear here as calls are processed.</p>
        </div>
      </div>
    </>
  );
}

function SettingsView({ isDark }: { isDark: boolean }) {
  return (
    <>
      <div className="flex-1 p-4 md:p-6">
        <div className={cn("max-w-md mx-auto p-6 rounded-xl border", isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')}>
          <h3 className={cn("text-sm font-semibold mb-4", isDark ? 'text-slate-300' : 'text-slate-700')}>Configuration</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className={cn("text-sm", isDark ? 'text-slate-400' : 'text-slate-600')}>AI Model</span>
              <span className={cn("text-sm", isDark ? 'text-slate-300' : 'text-slate-900')}>gpt-4o-mini</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className={cn("text-sm", isDark ? 'text-slate-400' : 'text-slate-600')}>Buffer Window</span>
              <span className={cn("text-sm", isDark ? 'text-slate-300' : 'text-slate-900')}>3 seconds</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function HelpView({ isDark }: { isDark: boolean }) {
  return (
    <>
      <div className="flex-1 p-4 md:p-6">
        <div className={cn("max-w-2xl mx-auto space-y-6", isDark ? 'text-slate-300' : 'text-slate-700')}>
          <div className={cn("p-6 rounded-xl border", isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')}>
            <h3 className="text-lg font-semibold mb-3">Features</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Real-time sentiment analysis</li>
              <li>Entity extraction (Person, Amount, Date, Product)</li>
              <li>Sales phase detection (Hook → Discovery → Objection → Closing)</li>
              <li>AI-powered recommendations</li>
              <li>Light/Dark theme toggle</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}