export interface AIConversation {
  id: string;
  userId: string;
  documentId?: string;
  messages: ConversationMessage[];
  context: ConversationContext;
  metadata: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  voiceRecordingId?: string;
  emotionalTone?: EmotionalTone;
  safetyFlags?: SafetyFlag[];
  model?: string;
  tokenCount?: number;
}

export interface EmotionalTone {
  primary: string;
  confidence: number;
  detected: string[];
}

export interface SafetyFlag {
  type: 'crisis' | 'trauma' | 'sensitive' | 'boundary';
  severity: 'low' | 'medium' | 'high';
  action: 'none' | 'gentle-redirect' | 'resources' | 'professional-help';
  message?: string;
}

export interface ConversationContext {
  documentContext?: string;
  recentMemories?: Memory[];
  currentMood?: string;
  narrativePhase?: string;
  characterContext?: string[];
}

export interface ConversationMetadata {
  totalMessages: number;
  totalTokens: number;
  averageResponseTime: number;
  primaryProvider: AIProvider;
  fallbacksUsed: number;
}

export type AIProvider = 
  | 'openai-gpt4' 
  | 'openai-realtime' 
  | 'anthropic-claude' 
  | 'local-llm';

export interface Memory {
  id: string;
  userId: string;
  content: string;
  embedding: number[];
  type: 'event' | 'emotion' | 'character' | 'theme' | 'setting';
  documentIds: string[];
  timestamp: Date;
  relevance: number;
  contradictions?: Contradiction[];
}

export interface Contradiction {
  memoryId: string;
  type: 'timeline' | 'fact' | 'emotion' | 'character';
  description: string;
  resolution?: string;
}