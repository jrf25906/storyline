import { Result, ServiceLifecycle, ServiceObserver } from '@services/interfaces/common';

/**
 * Coach tone types based on emotional state
 */
export enum CoachTone {
  HYPE = 'HYPE',
  PRAGMATIST = 'PRAGMATIST',
  TOUGH_LOVE = 'TOUGH_LOVE',
}

/**
 * Detected emotion from user message
 */
export interface DetectedEmotion {
  primary: string;
  confidence: number;
  suggestedTone: CoachTone;
  triggers: string[];
}

/**
 * Coach message
 */
export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tone?: CoachTone;
  detectedEmotion?: DetectedEmotion;
  tokenCount?: number;
}

/**
 * Coach conversation
 */
export interface CoachConversation {
  id: string;
  messages: CoachMessage[];
  startedAt: Date;
  lastMessageAt: Date;
  totalTokens: number;
}

/**
 * Coach chat options
 */
export interface CoachChatOptions {
  forceTone?: CoachTone;
  contextMessages?: number;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Resume analysis result
 */
export interface ResumeAnalysis {
  id: string;
  fileName: string;
  analyzedAt: Date;
  keywords: Array<{
    keyword: string;
    category: string;
    relevance: number;
  }>;
  suggestions: Array<{
    type: 'missing_keyword' | 'improvement' | 'formatting';
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    section?: string;
  }>;
  score: {
    overall: number;
    categories: {
      keywords: number;
      formatting: number;
      content: number;
      impact: number;
    };
  };
  extractedText: string;
}

/**
 * Resume rewrite suggestion
 */
export interface ResumeRewriteSuggestion {
  original: string;
  suggested: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Job description analysis
 */
export interface JobDescriptionAnalysis {
  requiredKeywords: string[];
  preferredKeywords: string[];
  skills: string[];
  experience: string[];
  matchScore: number;
}

/**
 * Content moderation result
 */
export interface ModerationResult {
  flagged: boolean;
  categories: {
    harassment: boolean;
    selfHarm: boolean;
    sexual: boolean;
    violence: boolean;
  };
  reason?: string;
}

/**
 * AI usage statistics
 */
export interface AIUsageStats {
  dailyMessages: number;
  dailyTokens: number;
  remainingMessages: number;
  remainingTokens: number;
  resetAt: Date;
  tier: 'free' | 'pro';
}

/**
 * AI service events
 */
export enum AIEventType {
  MESSAGE_SENT = 'MESSAGE_SENT',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  RATE_LIMIT_WARNING = 'RATE_LIMIT_WARNING',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  MODERATION_TRIGGERED = 'MODERATION_TRIGGERED',
  CRISIS_DETECTED = 'CRISIS_DETECTED',
}

/**
 * AI event data
 */
export interface AIEvent {
  type: AIEventType;
  timestamp: Date;
  data?: any;
}

/**
 * Crisis keywords configuration
 */
export interface CrisisKeywords {
  keywords: string[];
  resources: Array<{
    name: string;
    description: string;
    phone?: string;
    url?: string;
    available247: boolean;
  }>;
}

/**
 * AI Service interface for coach chat and resume analysis
 */
export interface IAIService extends ServiceLifecycle {
  /**
   * Send a message to the AI coach
   */
  sendCoachMessage(
    message: string,
    options?: CoachChatOptions
  ): Promise<Result<CoachMessage>>;

  /**
   * Get coach conversation history
   */
  getConversationHistory(
    conversationId?: string,
    limit?: number
  ): Promise<Result<CoachConversation>>;

  /**
   * Get all conversations
   */
  getAllConversations(): Promise<Result<CoachConversation[]>>;

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): Promise<Result<void>>;

  /**
   * Detect emotion from text
   */
  detectEmotion(text: string): Promise<Result<DetectedEmotion>>;

  /**
   * Get suggested tone based on emotion
   */
  getSuggestedTone(emotion: DetectedEmotion): CoachTone;

  /**
   * Analyze resume file
   */
  analyzeResume(
    fileUri: string,
    targetJobDescription?: string
  ): Promise<Result<ResumeAnalysis>>;

  /**
   * Get resume rewrite suggestions
   */
  getRewriteSuggestions(
    resumeText: string,
    targetJobDescription: string
  ): Promise<Result<ResumeRewriteSuggestion[]>>;

  /**
   * Analyze job description
   */
  analyzeJobDescription(
    jobDescription: string
  ): Promise<Result<JobDescriptionAnalysis>>;

  /**
   * Compare resume to job description
   */
  compareResumeToJob(
    resumeAnalysis: ResumeAnalysis,
    jobAnalysis: JobDescriptionAnalysis
  ): Promise<Result<{
    matchScore: number;
    missingKeywords: string[];
    suggestions: string[];
  }>>;

  /**
   * Moderate content before sending
   */
  moderateContent(content: string): Promise<Result<ModerationResult>>;

  /**
   * Check for crisis keywords
   */
  checkCrisisKeywords(content: string): Promise<Result<{
    detected: boolean;
    resources?: CrisisKeywords['resources'];
  }>>;

  /**
   * Get AI usage statistics
   */
  getUsageStats(): Promise<Result<AIUsageStats>>;

  /**
   * Check if rate limited
   */
  isRateLimited(): Promise<Result<boolean>>;

  /**
   * Get offline fallback responses
   */
  getOfflineFallbackResponse(
    messageType: string,
    context?: any
  ): Promise<Result<string>>;

  /**
   * Generate daily motivation message
   */
  generateDailyMotivation(
    mood?: string,
    progress?: number
  ): Promise<Result<string>>;

  /**
   * Subscribe to AI events
   */
  subscribeAIEvents(observer: ServiceObserver<AIEvent>): () => void;

  /**
   * Export conversation as text
   */
  exportConversation(
    conversationId: string,
    format: 'text' | 'json'
  ): Promise<Result<string>>;

  /**
   * Get coach prompt templates (for testing/debugging)
   */
  getPromptTemplates(): Promise<Result<{
    [key in CoachTone]: string;
  }>>;

  /**
   * Test coach response (for development)
   */
  testCoachResponse(
    message: string,
    tone: CoachTone
  ): Promise<Result<string>>;

  /**
   * Clear all AI data (for privacy)
   */
  clearAllAIData(): Promise<Result<void>>;
}