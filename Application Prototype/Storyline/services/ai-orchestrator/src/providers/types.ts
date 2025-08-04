export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface CompletionOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface CompletionResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  model?: string;
  provider?: string;
}

export abstract class AIProvider {
  abstract name: string;
  abstract models: string[];
  
  abstract initialize(): Promise<void>;
  abstract complete(options: CompletionOptions): Promise<CompletionResponse>;
  abstract stream(options: CompletionOptions): AsyncIterableIterator<StreamChunk>;
  abstract countTokens(text: string): Promise<number>;
  abstract isHealthy(): Promise<boolean>;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
}