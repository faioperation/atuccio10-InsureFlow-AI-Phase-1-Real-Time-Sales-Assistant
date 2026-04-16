'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';
import { MessageSquare, Bot } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface LiveTranscriptProps {
  transcript: string[];
  rawText?: string;
  className?: string;
}

export function LiveTranscript({ transcript, rawText, className }: LiveTranscriptProps) {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-xl border overflow-hidden',
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200',
        className
      )}
    >
      <div className={cn(
        "flex items-center gap-2 px-4 py-3 border-b",
        isDark ? 'border-slate-800' : 'border-slate-200'
      )}>
        <MessageSquare className="w-4 h-4 text-slate-500" />
        <span className={cn("text-sm font-semibold", isDark ? 'text-slate-300' : 'text-slate-700')}>
          Live Transcript
        </span>
        <span className="ml-auto text-xs text-slate-400">{transcript.length} segments</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-3",
              isDark ? 'bg-slate-800' : 'bg-slate-100'
            )}>
              <Bot className="w-6 h-6 text-slate-400" />
            </div>
            <p className={cn("text-sm", isDark ? 'text-slate-400' : 'text-slate-500')}>
              Waiting for transcript...
            </p>
            <p className={cn("text-xs mt-1", isDark ? 'text-slate-500' : 'text-slate-400')}>
              Connect to receive real-time updates
            </p>
          </div>
        ) : (
          transcript.map((text, idx) => (
            <div
              key={idx}
              className={cn(
                'flex gap-3 p-3 rounded-lg transition-all duration-300',
                isDark ? 'bg-slate-800/50' : 'bg-slate-100',
                idx === transcript.length - 1 && rawText && 'ring-1 ring-violet-500/30'
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                isDark ? 'bg-slate-700' : 'bg-slate-200'
              )}>
                <Bot className={cn("w-3 h-3", isDark ? 'text-slate-400' : 'text-slate-500')} />
              </div>
              <p className={cn("text-sm leading-relaxed", isDark ? 'text-slate-300' : 'text-slate-700')}>
                {text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}