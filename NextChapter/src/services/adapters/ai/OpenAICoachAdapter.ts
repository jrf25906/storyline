/**
 * OpenAI Coach adapter implementing ICoachService
 * Handles adaptive tone switching and offline support
 */

import { 
  ICoachService,
  IResumeCoachService,
  CoachContext,
  CoachResponse,
  CoachConversation,
  EmotionalState,
  CoachTone,
  CachedCoachResponse,
  ResumeAnalysis,
  ResumeImprovement,
  ResumeSectionType
} from '@services/interfaces/ai/ICoachService';
import { 
  IChatCompletionService,
  ChatMessage 
} from '@services/interfaces/ai/IAIService';
import { IStorageService } from '@services/interfaces/data/IStorageService';
import { Result, ok, err, tryCatch } from '@services/interfaces/common/result';
import { ExternalServiceError } from '@services/interfaces/common/errors';

export class OpenAICoachAdapter implements IResumeCoachService {
  private readonly CONVERSATION_KEY_PREFIX = '@next_chapter/coach/conversation/';
  private readonly USAGE_KEY_PREFIX = '@next_chapter/coach/usage/';
  private readonly MAX_MESSAGES_FREE = 10;
  private readonly MAX_MESSAGES_PRO = -1; // Unlimited
  
  // Emotional trigger words for tone selection
  private readonly emotionalTriggers = {
    hype: ['hopeless', 'lost', 'worthless', 'failure', 'burnt out', 'depressed', 'anxious', 'scared'],
    toughLove: ['lazy', 'they screwed me', 'no one will hire me', 'this is rigged', 'unfair', 'blame', 'excuses']
  };

  // Crisis keywords that require professional help
  private readonly crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'not worth living', 
    'better off dead', 'no point in living', 'want to die'
  ];

  constructor(
    private chatService: IChatCompletionService,
    private storageService: IStorageService,
    private isPro: boolean = false
  ) {}

  async sendMessage(
    message: string, 
    context: CoachContext
  ): Promise<Result<CoachResponse>> {
    // Check for crisis keywords first
    const requiresHelp = this.checkForCrisis(message);
    if (requiresHelp) {
      return ok(this.createCrisisResponse(context.userId));
    }

    // Check message limits
    const limitCheck = await this.checkMessageLimit(context.userId);
    if (limitCheck.isErr()) return limitCheck;
    if (!limitCheck.value) {
      return err(new ExternalServiceError(
        'Coach',
        'Daily message limit reached. Upgrade to Pro for unlimited coaching.',
        429
      ));
    }

    // Detect emotional state and select tone
    const emotionalStateResult = await this.detectEmotionalState(message);
    if (emotionalStateResult.isErr()) return emotionalStateResult;
    
    const emotionalState = emotionalStateResult.value;
    const tone = context.preferredTone || this.selectTone(emotionalState);

    // Build conversation with appropriate system prompt
    const systemPrompt = this.getSystemPrompt(tone, context);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(context.previousMessages || []),
      { role: 'user', content: message }
    ];

    // Get AI response
    const responseResult = await this.chatService.complete({
      messages,
      temperature: 0.8,
      maxTokens: 500
    });

    if (responseResult.isErr()) {
      // Fall back to cached response if available
      const cachedResponse = await this.getCachedResponseForMessage(message, tone);
      if (cachedResponse) {
        return ok({
          message: cachedResponse.response,
          tone,
          emotionalState,
          conversationId: this.generateConversationId(),
          timestamp: new Date(),
          requiresProfessionalHelp: requiresHelp
        });
      }
      return responseResult;
    }

    const aiResponse = responseResult.value;
    
    // Extract suggested actions if present
    const suggestedActions = this.extractSuggestedActions(aiResponse.content);
    
    // Save conversation
    const conversationId = this.generateConversationId();
    await this.saveConversation(context.userId, conversationId, message, aiResponse.content, tone);
    
    // Update usage
    await this.incrementUsage(context.userId);

    return ok({
      message: aiResponse.content,
      tone,
      emotionalState,
      suggestedActions,
      conversationId,
      timestamp: new Date(),
      requiresProfessionalHelp: requiresHelp
    });
  }

  async getConversationHistory(userId: string): Promise<Result<CoachConversation[]>> {
    const key = `${this.CONVERSATION_KEY_PREFIX}${userId}`;
    const result = await this.storageService.get<CoachConversation[]>(key);
    
    if (result.isErr()) return result;
    return ok(result.value || []);
  }

  async clearConversationHistory(userId: string): Promise<Result<void>> {
    const key = `${this.CONVERSATION_KEY_PREFIX}${userId}`;
    return this.storageService.remove(key);
  }

  async detectEmotionalState(message: string): Promise<Result<EmotionalState>> {
    const lowerMessage = message.toLowerCase();
    const triggers: string[] = [];
    
    // Check for emotional triggers
    for (const [category, words] of Object.entries(this.emotionalTriggers)) {
      for (const word of words) {
        if (lowerMessage.includes(word)) {
          triggers.push(word);
        }
      }
    }

    // Simple emotion detection - in production, use sentiment analysis
    let primary = 'neutral';
    let confidence = 0.5;
    let requiresSupport = false;

    if (triggers.length > 0) {
      if (triggers.some(t => this.emotionalTriggers.hype.includes(t))) {
        primary = 'discouraged';
        confidence = 0.8;
        requiresSupport = true;
      } else if (triggers.some(t => this.emotionalTriggers.toughLove.includes(t))) {
        primary = 'deflecting';
        confidence = 0.7;
        requiresSupport = true;
      }
    }

    return ok({
      primary,
      confidence,
      triggers,
      requiresSupport
    });
  }

  selectTone(emotionalState: EmotionalState): CoachTone {
    if (emotionalState.primary === 'discouraged') {
      return 'hype';
    } else if (emotionalState.primary === 'deflecting') {
      return 'tough-love';
    }
    return 'pragmatist';
  }

  async getCachedResponses(): Promise<Result<CachedCoachResponse[]>> {
    // Return pre-defined offline responses
    return ok([
      {
        trigger: 'feeling lost',
        response: "I hear you. Feeling lost after a layoff is completely normal. Let's take this one step at a time. What's one small thing you can do today to move forward?",
        tone: 'hype',
        category: 'emotional_support'
      },
      {
        trigger: 'no one will hire me',
        response: "That's your fear talking, not reality. You were hired before, you'll be hired again. But sitting in self-pity won't make it happen. What's your next application?",
        tone: 'tough-love',
        category: 'motivation'
      },
      {
        trigger: 'what should I do',
        response: "Here's a practical approach: 1) Update your resume today, 2) Identify 3 target companies, 3) Reach out to one person in your network. Which one can you start with?",
        tone: 'pragmatist',
        category: 'action_planning'
      }
    ]);
  }

  async getMessageCount(userId: string, period: 'day' | 'month'): Promise<Result<number>> {
    const key = `${this.USAGE_KEY_PREFIX}${userId}/${period}`;
    const result = await this.storageService.get<number>(key);
    
    if (result.isErr()) return result;
    return ok(result.value || 0);
  }

  async getRemainingMessages(userId: string): Promise<Result<number>> {
    if (this.isPro) {
      return ok(Number.MAX_SAFE_INTEGER);
    }

    const countResult = await this.getMessageCount(userId, 'day');
    if (countResult.isErr()) return countResult;
    
    return ok(Math.max(0, this.MAX_MESSAGES_FREE - countResult.value));
  }

  // Resume analysis methods
  async analyzeResume(
    resumeText: string, 
    targetRole?: string
  ): Promise<Result<ResumeAnalysis>> {
    const prompt = this.buildResumeAnalysisPrompt(resumeText, targetRole);
    
    const result = await this.chatService.complete({
      messages: [
        { role: 'system', content: 'You are an expert resume analyst and career coach.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      maxTokens: 1000,
      responseFormat: 'json_object'
    });

    if (result.isErr()) return result;

    try {
      const analysis = JSON.parse(result.value.content) as ResumeAnalysis;
      return ok(analysis);
    } catch (e) {
      return err(new ExternalServiceError('Coach', 'Failed to parse resume analysis'));
    }
  }

  async suggestImprovements(
    analysis: ResumeAnalysis,
    jobDescription?: string
  ): Promise<Result<ResumeImprovement[]>> {
    const prompt = this.buildImprovementPrompt(analysis, jobDescription);
    
    const result = await this.chatService.complete({
      messages: [
        { role: 'system', content: 'You are an expert resume writer and career coach.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      maxTokens: 800
    });

    if (result.isErr()) return result;

    // Parse improvements from response
    const improvements = this.parseImprovements(result.value.content);
    return ok(improvements);
  }

  async rewriteSection(
    sectionText: string,
    sectionType: ResumeSectionType,
    targetRole?: string
  ): Promise<Result<string>> {
    const prompt = `Rewrite this ${sectionType} section to be more impactful and ATS-friendly${
      targetRole ? ` for a ${targetRole} role` : ''
    }:\n\n${sectionText}`;
    
    const result = await this.chatService.complete({
      messages: [
        { role: 'system', content: 'You are an expert resume writer. Provide clear, concise, and impactful content.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      maxTokens: 400
    });

    if (result.isErr()) return result;
    return ok(result.value.content);
  }

  // Helper methods
  private getSystemPrompt(tone: CoachTone, context: CoachContext): string {
    const basePrompt = `You are a supportive career coach helping someone who was recently laid off. 
    ${context.daysSinceLayoff ? `They were laid off ${context.daysSinceLayoff} days ago.` : ''}
    ${context.userName ? `Their name is ${context.userName}.` : ''}`;

    const tonePrompts = {
      hype: `${basePrompt} Use an encouraging, uplifting tone. Start with "You've got this." Focus on their strengths and potential. Be their cheerleader.`,
      pragmatist: `${basePrompt} Use a practical, step-by-step approach. Start with "Here's what we'll do." Focus on actionable next steps and clear guidance.`,
      'tough-love': `${basePrompt} Use direct, no-nonsense language. Start with "Let's be real." Challenge excuses while showing you believe in them.`
    };

    return tonePrompts[tone];
  }

  private checkForCrisis(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private createCrisisResponse(userId: string): CoachResponse {
    return {
      message: "I'm concerned about you and want to make sure you get the support you need. Please reach out to:\n\n📞 National Suicide Prevention Lifeline: 988\n💬 Crisis Text Line: Text HOME to 741741\n\nYou don't have to go through this alone.",
      tone: 'pragmatist',
      emotionalState: {
        primary: 'crisis',
        confidence: 1,
        triggers: [],
        requiresSupport: true
      },
      resources: [
        {
          type: 'hotline',
          title: 'National Suicide Prevention Lifeline',
          phoneNumber: '988',
          priority: 'urgent'
        },
        {
          type: 'hotline',
          title: 'Crisis Text Line',
          description: 'Text HOME to 741741',
          priority: 'urgent'
        }
      ],
      requiresProfessionalHelp: true,
      conversationId: this.generateConversationId(),
      timestamp: new Date()
    };
  }

  private async checkMessageLimit(userId: string): Promise<Result<boolean>> {
    if (this.isPro) return ok(true);
    
    const countResult = await this.getMessageCount(userId, 'day');
    if (countResult.isErr()) return countResult;
    
    return ok(countResult.value < this.MAX_MESSAGES_FREE);
  }

  private async incrementUsage(userId: string): Promise<Result<void>> {
    const dayKey = `${this.USAGE_KEY_PREFIX}${userId}/day`;
    const monthKey = `${this.USAGE_KEY_PREFIX}${userId}/month`;
    
    // Get current counts
    const dayCount = await this.storageService.get<number>(dayKey);
    const monthCount = await this.storageService.get<number>(monthKey);
    
    // Increment counts
    await this.storageService.set(dayKey, (dayCount.isOk() ? dayCount.value : 0) + 1);
    await this.storageService.set(monthKey, (monthCount.isOk() ? monthCount.value : 0) + 1);
    
    return ok(undefined);
  }

  private async saveConversation(
    userId: string,
    conversationId: string,
    userMessage: string,
    coachMessage: string,
    tone: CoachTone
  ): Promise<Result<void>> {
    const key = `${this.CONVERSATION_KEY_PREFIX}${userId}`;
    const historyResult = await this.getConversationHistory(userId);
    
    if (historyResult.isErr()) return historyResult;
    
    const history = historyResult.value;
    const conversation = history.find(c => c.id === conversationId) || {
      id: conversationId,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    conversation.messages.push(
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'coach', content: coachMessage, tone, timestamp: new Date() }
    );
    conversation.updatedAt = new Date();
    
    // Keep only last 25 messages for storage limits
    if (conversation.messages.length > 25) {
      conversation.messages = conversation.messages.slice(-25);
    }
    
    // Update history
    const updatedHistory = history.filter(c => c.id !== conversationId);
    updatedHistory.push(conversation);
    
    // Keep only last 90 days of conversations
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const filteredHistory = updatedHistory.filter(c => c.updatedAt > cutoffDate);
    
    return this.storageService.set(key, filteredHistory);
  }

  private async getCachedResponseForMessage(
    message: string, 
    tone: CoachTone
  ): Promise<CachedCoachResponse | null> {
    const cachedResult = await this.getCachedResponses();
    if (cachedResult.isErr()) return null;
    
    const cached = cachedResult.value;
    const lowerMessage = message.toLowerCase();
    
    return cached.find(r => 
      r.tone === tone && lowerMessage.includes(r.trigger)
    ) || null;
  }

  private extractSuggestedActions(content: string): string[] {
    // Simple extraction - look for numbered lists or bullet points
    const lines = content.split('\n');
    const actions: string[] = [];
    
    for (const line of lines) {
      if (/^\d+\.|^[-•*]/.test(line.trim())) {
        actions.push(line.trim().replace(/^\d+\.|^[-•*]\s*/, ''));
      }
    }
    
    return actions.slice(0, 3); // Return top 3 actions
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildResumeAnalysisPrompt(resumeText: string, targetRole?: string): string {
    return `Analyze this resume and provide a detailed assessment in JSON format. ${
      targetRole ? `The candidate is targeting ${targetRole} positions.` : ''
    }

Resume:
${resumeText}

Provide analysis with this structure:
{
  "overallScore": <0-100>,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "keywordMatch": {
    "matched": ["keyword1", "keyword2"],
    "missing": ["keyword1", "keyword2"],
    "score": <0-100>
  },
  "sections": {
    "summary": { "present": true/false, "quality": "poor/fair/good/excellent", "suggestions": [] },
    "experience": { "present": true/false, "quality": "poor/fair/good/excellent", "suggestions": [] },
    "skills": { "present": true/false, "quality": "poor/fair/good/excellent", "suggestions": [] },
    "education": { "present": true/false, "quality": "poor/fair/good/excellent", "suggestions": [] },
    "achievements": { "present": true/false, "quality": "poor/fair/good/excellent", "suggestions": [] }
  },
  "aiInsights": "Overall strategic advice"
}`;
  }

  private buildImprovementPrompt(analysis: ResumeAnalysis, jobDescription?: string): string {
    return `Based on this resume analysis, suggest specific improvements:

Strengths: ${analysis.strengths.join(', ')}
Weaknesses: ${analysis.weaknesses.join(', ')}
${jobDescription ? `Target Job Description: ${jobDescription}` : ''}

Provide 5-7 specific, actionable improvements prioritized by impact.`;
  }

  private parseImprovements(content: string): ResumeImprovement[] {
    // Simple parsing - in production, use structured output
    const improvements: ResumeImprovement[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim() && /^\d+\./.test(line)) {
        improvements.push({
          section: 'experience', // Would be parsed from content
          priority: 'medium',
          suggestion: line.replace(/^\d+\.\s*/, ''),
          impact: 'Improves ATS compatibility and readability'
        });
      }
    }
    
    return improvements;
  }
}