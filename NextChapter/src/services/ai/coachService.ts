import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOpenAIClient } from './openai';
import { 
  COACH_PROMPTS, 
  EMOTIONAL_TRIGGERS, 
  CRISIS_KEYWORDS,
  BOUNDARY_KEYWORDS 
} from './coachPrompts';
import { MODEL_CONFIG, RATE_LIMITS, MODERATION_CONFIG } from './config';
import { CoachMessage, CoachTone } from '@types/coach';

/**
 * Coach Service - Manages AI coaching interactions
 */
export class CoachService {
  private static instance: CoachService;
  
  public static getInstance(): CoachService {
    if (!CoachService.instance) {
      CoachService.instance = new CoachService();
    }
    return CoachService.instance;
  }

  /**
   * Generate a coach response based on user message
   */
  async generateResponse(
    userMessage: string,
    conversationHistory: CoachMessage[] = [],
    userId: string
  ): Promise<{ response: string; tone: CoachTone; flags?: string[] }> {
    try {
      // Check rate limits
      const canSendMessage = await this.checkRateLimit(userId);
      if (!canSendMessage) {
        return {
          response: "You've reached your daily message limit. Upgrade to Pro for unlimited coaching!",
          tone: 'pragmatist',
          flags: ['rate_limit'],
        };
      }

      // Check for crisis keywords
      const crisisCheck = this.checkForCrisis(userMessage);
      if (crisisCheck.detected) {
        return {
          response: this.getCrisisResponse(),
          tone: 'pragmatist',
          flags: ['crisis_intervention'],
        };
      }

      // Check for professional boundaries
      const boundaryCheck = this.checkBoundaries(userMessage);
      if (boundaryCheck.detected) {
        return {
          response: this.getBoundaryResponse(boundaryCheck.topic),
          tone: 'pragmatist',
          flags: ['boundary_redirect'],
        };
      }

      // Detect emotional tone
      const detectedTone = this.detectTone(userMessage);
      
      // Moderate content
      const moderationResult = await this.moderateContent(userMessage);
      if (moderationResult.blocked) {
        return {
          response: "I'm here to help with your job search journey. Let's keep our conversation professional and focused on getting you back on track.",
          tone: 'pragmatist',
          flags: ['content_moderated'],
        };
      }

      // Generate AI response
      const response = await this.callOpenAI(
        userMessage,
        conversationHistory,
        detectedTone
      );

      // Record usage
      await this.recordUsage(userId);

      return {
        response,
        tone: detectedTone,
      };
    } catch (error) {
      console.error('Coach service error:', error);
      return {
        response: this.getFallbackResponse(),
        tone: 'pragmatist',
        flags: ['error_fallback'],
      };
    }
  }

  /**
   * Detect the appropriate tone based on message content
   */
  private detectTone(message: string): CoachTone {
    const lowerMessage = message.toLowerCase();

    // Check for hype triggers
    for (const trigger of EMOTIONAL_TRIGGERS.hype) {
      if (lowerMessage.includes(trigger)) {
        return 'hype';
      }
    }

    // Check for tough-love triggers
    for (const trigger of EMOTIONAL_TRIGGERS.toughLove) {
      if (lowerMessage.includes(trigger)) {
        return 'toughLove';
      }
    }

    // Default to pragmatist
    return 'pragmatist';
  }

  /**
   * Check for crisis keywords that require intervention
   */
  private checkForCrisis(message: string): { detected: boolean; keyword?: string } {
    const lowerMessage = message.toLowerCase();
    
    for (const keyword of CRISIS_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        return { detected: true, keyword };
      }
    }
    
    return { detected: false };
  }

  /**
   * Check for professional boundary violations
   */
  private checkBoundaries(message: string): { detected: boolean; topic?: string } {
    const lowerMessage = message.toLowerCase();
    
    for (const keyword of BOUNDARY_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        return { detected: true, topic: keyword };
      }
    }
    
    return { detected: false };
  }

  /**
   * Call OpenAI API with appropriate prompt
   */
  private async callOpenAI(
    userMessage: string,
    conversationHistory: CoachMessage[],
    tone: CoachTone
  ): Promise<string> {
    const openai = await getOpenAIClient();
    const prompt = COACH_PROMPTS[tone];

    // Build message history
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: prompt.systemPrompt,
      },
    ];

    // Add conversation history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const completion = await openai.chat.completions.create({
        model: MODEL_CONFIG.model,
        messages,
        max_tokens: MODEL_CONFIG.maxTokens,
        temperature: MODEL_CONFIG.temperature,
        presence_penalty: MODEL_CONFIG.presencePenalty,
        frequency_penalty: MODEL_CONFIG.frequencyPenalty,
      });

      return completion.choices[0]?.message?.content || this.getFallbackResponse();
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Moderate content using OpenAI moderation API
   */
  private async moderateContent(content: string): Promise<{ blocked: boolean; flags?: string[] }> {
    if (!MODERATION_CONFIG.enabled) {
      return { blocked: false };
    }

    try {
      const openai = await getOpenAIClient();
      const moderation = await openai.moderations.create({
        input: content,
      });

      const results = moderation.results[0];
      const flags: string[] = [];
      let shouldBlock = false;

      // Check each category
      for (const [category, flagged] of Object.entries(results.categories)) {
        if (flagged) {
          flags.push(category);
          const score = results.category_scores[category as keyof typeof results.category_scores];
          if (score >= MODERATION_CONFIG.blockThreshold) {
            shouldBlock = true;
          }
        }
      }

      return { blocked: shouldBlock, flags };
    } catch (error) {
      console.error('Moderation error:', error);
      // Fail open - don't block on error
      return { blocked: false };
    }
  }

  /**
   * Check and enforce rate limits
   */
  private async checkRateLimit(userId: string): Promise<boolean> {
    const key = `@next_chapter/coach_usage/${userId}/${new Date().toDateString()}`;
    
    try {
      const usage = await AsyncStorage.getItem(key);
      const count = usage ? parseInt(usage, 10) : 0;
      
      // TODO: Check if user is Pro tier
      const limit = RATE_LIMITS.FREE_TIER_DAILY_LIMIT;
      
      return count < limit;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Fail open
    }
  }

  /**
   * Record usage for rate limiting
   */
  private async recordUsage(userId: string): Promise<void> {
    const key = `@next_chapter/coach_usage/${userId}/${new Date().toDateString()}`;
    
    try {
      const usage = await AsyncStorage.getItem(key);
      const count = usage ? parseInt(usage, 10) : 0;
      await AsyncStorage.setItem(key, (count + 1).toString());
    } catch (error) {
      console.error('Usage recording error:', error);
    }
  }

  /**
   * Get crisis intervention response
   */
  private getCrisisResponse(): string {
    return `I'm concerned about you and want you to know you're not alone. Please reach out for support:

**National Suicide Prevention Lifeline**: 988 (call or text)
**Crisis Text Line**: Text HOME to 741741

You matter, and there are people who want to help. Would you like to talk about what's making this job search feel so overwhelming? I'm here to listen and help you find a path forward.`;
  }

  /**
   * Get boundary redirect response
   */
  private getBoundaryResponse(topic?: string): string {
    return `I understand you might be dealing with ${topic || 'personal'} challenges, and those are important. However, I'm specifically trained to help with your career transition and job search. 

For ${topic || 'that concern'}, I'd recommend speaking with a qualified professional who specializes in that area. 

Let's refocus on your career goals - what's the biggest job search challenge you're facing today?`;
  }

  /**
   * Get fallback response for errors or offline mode
   */
  private getFallbackResponse(): string {
    return `I'm having trouble connecting right now, but I'm still here to help! Here are three things you can do today to move your job search forward:

1. **Update your LinkedIn headline** - Make it clear what role you're seeking
2. **Reach out to one person** in your network - A simple "catching up" message works
3. **Apply to one well-matched role** - Quality over quantity

Which of these feels most manageable to start with?`;
  }

  /**
   * Get available coach responses for offline mode
   */
  getOfflineResponses(): { [key: string]: string } {
    return {
      greeting: "Welcome back! Ready to make progress on your job search today?",
      encouragement: "Every application, every connection, every update moves you closer to your next role. You're doing great!",
      taskReminder: "Have you completed today's Bounce Plan task? Small daily actions create big momentum.",
      networkingTip: "Today's tip: Reach out to one former colleague. A simple 'How are you?' can open doors.",
      applicationTip: "Quality beats quantity. One well-tailored application is worth ten generic ones.",
      interviewPrep: "Preparing for an interview? Use the STAR method to structure your answers: Situation, Task, Action, Result.",
      rejectionSupport: "Rejections are redirections. Each 'no' gets you closer to your 'yes'. What did you learn from this one?",
      motivationBoost: "You've overcome challenges before. You have the skills. You have the experience. You've got this!",
    };
  }
}