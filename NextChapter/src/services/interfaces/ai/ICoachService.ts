/**
 * Coach service interface for AI-powered coaching with adaptive tone
 * Specific to NextChapter app's coaching functionality
 */

import { Result } from '@services/interfaces/common/result';
import { ChatMessage } from '@services/interfaces/ai/IAIService';

export interface ICoachService {
  // Core coaching functionality
  sendMessage(
    message: string, 
    context: CoachContext
  ): Promise<Result<CoachResponse>>;
  
  // Conversation management
  getConversationHistory(userId: string): Promise<Result<CoachConversation[]>>;
  clearConversationHistory(userId: string): Promise<Result<void>>;
  
  // Tone management
  detectEmotionalState(message: string): Promise<Result<EmotionalState>>;
  selectTone(emotionalState: EmotionalState): CoachTone;
  
  // Offline support
  getCachedResponses(): Promise<Result<CachedCoachResponse[]>>;
  
  // Usage tracking
  getMessageCount(userId: string, period: 'day' | 'month'): Promise<Result<number>>;
  getRemainingMessages(userId: string): Promise<Result<number>>;
}

export interface CoachContext {
  userId: string;
  userName?: string;
  daysSinceLayoff?: number;
  currentTaskDay?: number;
  previousMessages?: ChatMessage[];
  preferredTone?: CoachTone;
  userProfile?: {
    industry?: string;
    role?: string;
    experienceLevel?: string;
  };
}

export interface CoachResponse {
  message: string;
  tone: CoachTone;
  emotionalState: EmotionalState;
  suggestedActions?: string[];
  resources?: CoachResource[];
  requiresProfessionalHelp?: boolean;
  conversationId: string;
  timestamp: Date;
}

export interface CoachConversation {
  id: string;
  userId: string;
  messages: Array<{
    role: 'user' | 'coach';
    content: string;
    tone?: CoachTone;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export type CoachTone = 'hype' | 'pragmatist' | 'tough-love';

export interface EmotionalState {
  primary: string;
  confidence: number;
  triggers: string[];
  requiresSupport: boolean;
}

export interface CoachResource {
  type: 'article' | 'video' | 'exercise' | 'hotline';
  title: string;
  description?: string;
  url?: string;
  phoneNumber?: string;
  priority: 'normal' | 'urgent';
}

export interface CachedCoachResponse {
  trigger: string;
  response: string;
  tone: CoachTone;
  category: string;
}

// Resume analysis extension for coach
export interface IResumeCoachService extends ICoachService {
  analyzeResume(
    resumeText: string, 
    targetRole?: string
  ): Promise<Result<ResumeAnalysis>>;
  
  suggestImprovements(
    analysis: ResumeAnalysis,
    jobDescription?: string
  ): Promise<Result<ResumeImprovement[]>>;
  
  rewriteSection(
    sectionText: string,
    sectionType: ResumeSectionType,
    targetRole?: string
  ): Promise<Result<string>>;
}

export interface ResumeAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  keywordMatch?: {
    matched: string[];
    missing: string[];
    score: number;
  };
  sections: Record<ResumeSectionType, SectionAnalysis>;
  aiInsights: string;
}

export interface SectionAnalysis {
  present: boolean;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  suggestions: string[];
}

export type ResumeSectionType = 
  | 'summary'
  | 'experience'
  | 'skills'
  | 'education'
  | 'achievements';

export interface ResumeImprovement {
  section: ResumeSectionType;
  priority: 'low' | 'medium' | 'high';
  suggestion: string;
  example?: string;
  impact: string;
}