/**
 * Domain-specific chat service for the coach feature
 */

import { Result } from '@services/interfaces/common/result';
import { ChatMessage } from '@services/interfaces/ai/IAIService';

export type CoachTone = 'hype' | 'pragmatist' | 'tough-love';

export interface ICoachService {
  // Send message with automatic tone detection
  sendMessage(
    message: string,
    conversationHistory: ChatMessage[]
  ): Promise<Result<CoachResponse>>;
  
  // Send with specific tone
  sendMessageWithTone(
    message: string,
    tone: CoachTone,
    conversationHistory: ChatMessage[]
  ): Promise<Result<CoachResponse>>;
  
  // Tone detection
  detectTone(message: string): CoachTone;
  detectCrisis(message: string): boolean;
  
  // System prompts
  getSystemPrompt(tone: CoachTone): string;
  updateSystemPrompt(tone: CoachTone, prompt: string): void;
  
  // Conversation management
  summarizeConversation(messages: ChatMessage[]): Promise<Result<string>>;
  extractActionItems(messages: ChatMessage[]): Promise<Result<string[]>>;
  
  // Rate limiting
  canSendMessage(userId: string): Promise<Result<boolean>>;
  getRemainingMessages(userId: string): Promise<Result<number>>;
}

export interface CoachResponse {
  message: string;
  tone: CoachTone;
  tokenCount: number;
  isCrisis: boolean;
  suggestedActions?: string[];
  resources?: CrisisResource[];
}

export interface CrisisResource {
  name: string;
  description: string;
  contactInfo: string;
  available24x7: boolean;
  type: 'hotline' | 'text' | 'chat' | 'website';
}

// Conversation storage
export interface IConversationService {
  saveMessage(
    userId: string,
    message: ChatMessage,
    metadata?: ConversationMetadata
  ): Promise<Result<string>>;
  
  getConversation(
    userId: string,
    conversationId: string
  ): Promise<Result<Conversation>>;
  
  listConversations(
    userId: string,
    options?: ConversationListOptions
  ): Promise<Result<ConversationSummary[]>>;
  
  deleteConversation(
    userId: string,
    conversationId: string
  ): Promise<Result<void>>;
  
  searchConversations(
    userId: string,
    query: string
  ): Promise<Result<ConversationSearchResult[]>>;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  metadata: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMetadata {
  tone?: CoachTone;
  mood?: string;
  topics?: string[];
  actionItems?: string[];
}

export interface ConversationSummary {
  id: string;
  lastMessage: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationListOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ConversationSearchResult {
  conversationId: string;
  messageId: string;
  snippet: string;
  relevanceScore: number;
}