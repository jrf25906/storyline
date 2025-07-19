/**
 * AI service interfaces for OpenAI integration
 * Following Open/Closed Principle - extensible for different AI providers
 */

import { Result } from '@services/interfaces/common/result';

// Base AI service interface
export interface IAIService {
  // Model configuration
  setModel(model: string): void;
  getModel(): string;
  
  // API key management
  isConfigured(): boolean;
  validateConfiguration(): Promise<Result<boolean>>;
  
  // Usage tracking
  getUsage(): Promise<Result<AIUsageStats>>;
  getRemainingQuota(): Promise<Result<AIQuota>>;
}

export interface AIUsageStats {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface AIQuota {
  tokensUsed: number;
  tokensLimit: number;
  requestsUsed: number;
  requestsLimit: number;
  resetDate: Date;
}

// Chat completion service
export interface IChatCompletionService extends IAIService {
  complete(params: ChatCompletionParams): Promise<Result<ChatCompletionResponse>>;
  stream(params: ChatCompletionParams): AsyncIterator<Result<ChatCompletionChunk>>;
  
  // Token counting
  countTokens(messages: ChatMessage[]): Promise<Result<number>>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface ChatCompletionParams {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  responseFormat?: 'text' | 'json_object';
}

export interface ChatCompletionResponse {
  content: string;
  role: 'assistant';
  tokensUsed: number;
  finishReason: 'stop' | 'length' | 'content_filter' | 'null';
  model: string;
}

export interface ChatCompletionChunk {
  delta: string;
  isComplete: boolean;
}

// Content moderation service
export interface IModerationService {
  moderate(content: string): Promise<Result<ModerationResult>>;
  moderateBatch(contents: string[]): Promise<Result<ModerationResult[]>>;
}

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    hateThreatening: boolean;
    selfHarm: boolean;
    sexual: boolean;
    sexualMinors: boolean;
    violence: boolean;
    violenceGraphic: boolean;
  };
  scores: Record<string, number>;
}

// Embeddings service
export interface IEmbeddingService extends IAIService {
  createEmbedding(text: string): Promise<Result<number[]>>;
  createEmbeddings(texts: string[]): Promise<Result<number[][]>>;
  
  // Similarity operations
  cosineSimilarity(embedding1: number[], embedding2: number[]): number;
  findSimilar(
    embedding: number[],
    candidates: Array<{ id: string; embedding: number[] }>,
    threshold?: number
  ): Array<{ id: string; similarity: number }>;
}