'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AIInsight, CallSession, Phase, SentimentLabel } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5051/transcript-stream';
const MAX_TRANSCRIPT_LENGTH = 100;

export function useAIWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);
  const [session, setSession] = useState<CallSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log('[WS] Connected to AI Agent');
        
        // Start heartbeat to keep connection alive
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          // Ignore ping/pong messages
          if (event.data === 'pong' || event.data === 'ping') return;
          
          const data: AIInsight = JSON.parse(event.data);
          
          // Ignore non-insight messages
          if (data.type !== 'ai_insight') return;
          
          const insight: AIInsight = {
            ...data,
            timestamp: Date.now(),
          };

          console.log('[WS] Received insight:', insight.raw_text?.substring(0, 30));
          
          setCurrentInsight(insight);
          setSession((prev) => {
            if (!prev) {
              return {
                id: `session_${Date.now()}`,
                startTime: new Date(),
                insights: [insight],
                currentPhase: insight.phase,
                currentMood: insight.mood as SentimentLabel,
                currentAdvice: insight.advice,
                transcript: insight.raw_text ? [insight.raw_text] : [],
                entities: insight.entities || {},
              };
            }

            const newTranscript = insight.raw_text 
              ? [...prev.transcript, insight.raw_text].slice(-MAX_TRANSCRIPT_LENGTH)
              : prev.transcript;

            return {
              ...prev,
              insights: [...prev.insights, insight].slice(-MAX_TRANSCRIPT_LENGTH),
              currentPhase: (insight.phase as Phase) || prev.currentPhase,
              currentMood: (insight.mood as SentimentLabel) || prev.currentMood,
              currentAdvice: insight.advice || prev.currentAdvice,
              transcript: newTranscript,
              entities: mergeEntities(prev.entities, insight.entities || {}),
            };
          });
        } catch (err) {
          console.warn('[WS] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[WS] Disconnected, reconnecting in 3s...');
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        setError('Connection error');
      };

      wsRef.current = ws;
    } catch (err) {
      setError('Failed to connect to WebSocket');
      console.warn('[WS] Connection failed:', err);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const resetSession = useCallback(() => {
    setSession(null);
    setCurrentInsight(null);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    currentInsight,
    session,
    error,
    connect,
    disconnect,
    resetSession,
  };
}

function mergeEntities(prev: Record<string, string[] | undefined>, current: Record<string, string[] | undefined>): Record<string, string[]> {
  const merged: Record<string, string[]> = {};
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(current)]);

  for (const key of allKeys) {
    const prevValues = Array.isArray(prev[key]) ? prev[key] : [];
    const currValues = Array.isArray(current[key]) ? current[key] : [];
    const uniqueValues = [...new Set([...prevValues, ...currValues])];
    if (uniqueValues.length > 0) {
      merged[key] = uniqueValues;
    }
  }

  return merged;
}