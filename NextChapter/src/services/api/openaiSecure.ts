import { EnvironmentService } from '@services/security/environment';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CoachResponse {
  message: string;
  tone: 'hype' | 'pragmatist' | 'tough-love';
  tokenCount: number;
}

interface TokenUsage {
  dailyTokens: number;
  lastReset: Date;
}

/**
 * Secure OpenAI service with content filtering and rate limiting
 * Implements security best practices for AI interactions
 */
export class SecureOpenAIService {
  private baseURL = 'https://api.openai.com/v1';
  private dailyMessageCount = 0;
  private lastMessageTime = 0;
  private tokenUsage: TokenUsage = {
    dailyTokens: 0,
    lastReset: new Date(),
  };

  // Crisis keywords that trigger immediate intervention
  private readonly crisisKeywords = [
    'end it all',
    'kill myself',
    'suicide',
    'want to die',
    'no point in living',
  ];

  // Emotional triggers for tone detection
  private readonly hypeTriggers = ['hopeless', 'lost', 'worthless', 'failure', 'burnt out'];
  private readonly toughLoveTriggers = [
    'lazy',
    'they screwed me',
    'no one will hire me',
    'this is rigged',
  ];

  constructor(private environmentService: EnvironmentService) {}

  /**
   * Send message to OpenAI with security filtering
   */
  async sendMessage(
    messages: ChatMessage[],
    tone: 'hype' | 'pragmatist' | 'tough-love' = 'pragmatist'
  ): Promise<CoachResponse> {
    // Check for crisis keywords first
    const lastMessage = messages[messages.length - 1];
    if (this.containsCrisisKeywords(lastMessage.content)) {
      return this.getCrisisResponse();
    }

    // Check rate limits
    this.checkRateLimit();

    // Ensure environment is initialized
    if (!this.environmentService.isInitialized()) {
      await this.environmentService.initialize();
    }

    const config = await this.environmentService.getOpenAIConfig();

    // Filter sensitive information from messages
    const filteredMessages = messages.map((msg) => ({
      ...msg,
      content: this.filterSensitiveData(msg.content),
    }));

    // Check message length before sending (rough token estimate)
    const totalLength = filteredMessages.reduce((sum, msg) => sum + msg.content.length, 0);
    if (totalLength > 12000) { // ~4000 tokens at roughly 3 chars per token
      throw new Error('Message too long. Please shorten your message.');
    }

    // Add system prompt
    const systemPrompt = this.getSystemPrompt(tone);
    const fullMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...filteredMessages,
    ];

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: fullMessages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();

      // Update token usage
      this.updateTokenUsage(data.usage.total_tokens);

      // Filter response content
      const filteredResponse = this.filterInappropriateContent(
        data.choices[0].message.content
      );

      return {
        message: filteredResponse,
        tone,
        tokenCount: data.usage.total_tokens,
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  /**
   * Detect appropriate tone based on message content
   */
  async detectTone(message: string): Promise<'hype' | 'pragmatist' | 'tough-love'> {
    const lowerMessage = message.toLowerCase();

    // Check for hype triggers
    if (this.hypeTriggers.some((trigger) => lowerMessage.includes(trigger))) {
      return 'hype';
    }

    // Check for tough-love triggers
    if (this.toughLoveTriggers.some((trigger) => lowerMessage.includes(trigger))) {
      return 'tough-love';
    }

    // Default to pragmatist
    return 'pragmatist';
  }

  /**
   * Validate API key format
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const config = await this.environmentService.getOpenAIConfig();
      // Accept both old format (sk-) and new format (sk-proj-)
      return (config.apiKey.startsWith('sk-') || config.apiKey.startsWith('sk-proj-')) && 
             config.apiKey.length > 20;
    } catch {
      return false;
    }
  }

  /**
   * Get current token usage
   */
  async getTokenUsage(): Promise<TokenUsage> {
    // Reset daily usage if needed
    const now = new Date();
    if (now.getDate() !== this.tokenUsage.lastReset.getDate()) {
      this.tokenUsage = {
        dailyTokens: 0,
        lastReset: now,
      };
    }
    return this.tokenUsage;
  }

  /**
   * Set token usage (for testing)
   */
  async setTokenUsage(tokens: number): Promise<void> {
    this.tokenUsage.dailyTokens = tokens;
  }

  /**
   * Reset rate limiting (for testing)
   */
  resetRateLimit(): void {
    this.dailyMessageCount = 0;
    this.lastMessageTime = 0;
  }

  /**
   * Filter sensitive financial and personal data
   */
  private filterSensitiveData(content: string): string {
    // Remove financial data patterns
    let filtered = content.replace(/\$[\d,]+(\.\d{2})?/g, '[REDACTED]');
    
    // Remove SSN patterns
    filtered = filtered.replace(/\d{3}-\d{2}-\d{4}/g, '[REDACTED]');
    
    // Remove credit card patterns
    filtered = filtered.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '[REDACTED]');
    
    // Remove bank account patterns
    filtered = filtered.replace(/\d{9,12}/g, '[REDACTED]');

    return filtered;
  }

  /**
   * Filter inappropriate content from responses
   */
  private filterInappropriateContent(content: string): string {
    // This is a simplified version - in production, use a proper content moderation API
    const inappropriatePatterns = [
      /\[expletive\]/gi,
      /damn/gi,
      /hell/gi,
      // Add more patterns as needed
    ];

    let filtered = content;
    inappropriatePatterns.forEach((pattern) => {
      filtered = filtered.replace(pattern, '***');
    });

    return filtered;
  }

  /**
   * Check if message contains crisis keywords
   */
  private containsCrisisKeywords(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.crisisKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Get crisis intervention response
   */
  private getCrisisResponse(): CoachResponse {
    return {
      message: `I'm concerned about you and want to make sure you get the support you need. Please reach out to crisis support:

🆘 National Suicide Prevention Lifeline: 988
💬 Crisis Text Line: Text HOME to 741741
🌐 Online Chat: suicidepreventionlifeline.org

You don't have to go through this alone. These services are free, confidential, and available 24/7.`,
      tone: 'pragmatist',
      tokenCount: 0,
    };
  }

  /**
   * Check and enforce rate limits
   */
  private checkRateLimit(): void {
    const now = Date.now();
    
    // Reset daily count if it's a new day
    const today = new Date().toDateString();
    const lastMessageDate = new Date(this.lastMessageTime).toDateString();
    
    if (today !== lastMessageDate) {
      this.dailyMessageCount = 0;
    }

    // Check daily limit (10 for free tier)
    if (this.dailyMessageCount >= 10) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Check rapid fire (minimum 2 seconds between messages)
    if (now - this.lastMessageTime < 2000) {
      throw new Error('Please wait a moment before sending another message.');
    }

    this.dailyMessageCount++;
    this.lastMessageTime = now;
  }

  /**
   * Update token usage tracking
   */
  private updateTokenUsage(tokens: number): void {
    this.tokenUsage.dailyTokens += tokens;

    // Check token limit (4000 per conversation)
    if (tokens > 4000) {
      throw new Error('Message too long. Please shorten your message.');
    }
  }

  /**
   * Get appropriate system prompt for tone
   */
  private getSystemPrompt(tone: 'hype' | 'pragmatist' | 'tough-love'): string {
    const basePrompt = 'You are a career coach helping someone who was recently laid off. You provide supportive, actionable advice. Keep responses concise and focused. Never provide financial advice or discuss specific monetary amounts.';

    const tonePrompts = {
      hype: `${basePrompt} Be encouraging and energetic. Use phrases like "You've got this!" and focus on opportunities and potential. Help them see the positive side and build confidence.`,
      pragmatist: `${basePrompt} Be practical and straightforward. Provide step-by-step guidance and realistic timelines. Focus on concrete actions they can take today.`,
      'tough-love': `${basePrompt} Be direct and challenging. Point out what isn't working and push for action. Use firm but caring language to motivate change.`,
    };

    return tonePrompts[tone];
  }
}

// Export factory function
export const createSecureOpenAIService = (
  environmentService: EnvironmentService
): SecureOpenAIService => {
  return new SecureOpenAIService(environmentService);
};