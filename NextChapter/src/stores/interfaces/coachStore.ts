import { BaseStore, BaseState, AsyncResult } from '@stores/interfaces/base';

/**
 * Coach tone types
 */
export type CoachTone = 'hype' | 'pragmatist' | 'tough-love';

/**
 * Coach message interface
 */
export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tone?: CoachTone;
  timestamp: Date;
  isError?: boolean;
}

/**
 * Coach session interface
 */
export interface CoachSession {
  id: string;
  messages: CoachMessage[];
  startedAt: Date;
  lastMessageAt: Date;
  tone: CoachTone;
}

/**
 * Coach messaging operations interface
 */
export interface CoachMessagingOperations {
  sendMessage: (content: string) => AsyncResult;
  loadConversationHistory: () => AsyncResult;
  clearConversation: () => void;
  deleteMessage: (messageId: string) => void;
}

/**
 * Coach tone operations interface
 */
export interface CoachToneOperations {
  detectTone: (message: string) => CoachTone;
  setTone: (tone: CoachTone) => void;
  getTonePrompt: (tone: CoachTone) => string;
}

/**
 * Coach session operations interface
 */
export interface CoachSessionOperations {
  startNewSession: () => void;
  endSession: () => void;
  loadSession: (sessionId: string) => AsyncResult;
  getSessions: () => AsyncResult<CoachSession[]>;
}

/**
 * Coach analytics operations interface
 */
export interface CoachAnalyticsOperations {
  trackMessageSent: (tone: CoachTone) => void;
  trackToneSwitch: (fromTone: CoachTone, toTone: CoachTone) => void;
  getUsageStats: () => AsyncResult<{
    totalMessages: number;
    toneDistribution: Record<CoachTone, number>;
    averageSessionLength: number;
  }>;
}

/**
 * Coach store state interface
 */
export interface CoachStoreState extends BaseState {
  // Current conversation
  messages: CoachMessage[];
  currentTone: CoachTone;
  
  // Session management
  currentSession: CoachSession | null;
  sessions: CoachSession[];
  
  // UI state
  isTyping: boolean;
  isSending: boolean;
  
  // Rate limiting
  messageCount: number;
  lastMessageTime: Date | null;
  isRateLimited: boolean;
}

/**
 * Complete coach store interface
 * Combines all coach-related functionality
 */
export interface CoachStore extends 
  BaseStore,
  CoachStoreState,
  CoachMessagingOperations,
  CoachToneOperations,
  CoachSessionOperations,
  CoachAnalyticsOperations {}