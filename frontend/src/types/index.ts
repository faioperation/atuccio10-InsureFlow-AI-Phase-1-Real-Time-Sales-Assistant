export type Phase = 'Hook' | 'Discovery' | 'Objection' | 'Closing';

export type SentimentLabel = 'Interested' | 'Frustrated' | 'Neutral';

export interface Entities {
  PERSON?: string[];
  AMOUNT?: string[];
  DATE?: string[];
  PRODUCT?: string[];
  SPOUSE_NAME?: string[];
  [key: string]: string[] | undefined;
}

export interface AIInsight {
  type: 'ai_insight';
  phase: Phase;
  mood: SentimentLabel;
  entities: Entities;
  advice: string;
  raw_text: string;
  timestamp?: number;
}

export interface CallSession {
  id: string;
  startTime: Date;
  insights: AIInsight[];
  currentPhase: Phase;
  currentMood: SentimentLabel;
  currentAdvice: string;
  transcript: string[];
  entities: Entities;
}

export interface DashboardStats {
  totalCalls: number;
  activeCalls: number;
  avgSentiment: number;
  commonPhases: Record<Phase, number>;
  topEntities: Record<string, number>;
}