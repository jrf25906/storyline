import { EMOTIONAL_TRIGGERS, TONE_PROMPTS, CoachTone } from '../../types/coach';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CoachResponse {
  message: string;
  tone: CoachTone;
  tokenCount: number;
  isCrisis: boolean;
}

export class OpenAIService {
  private baseURL = 'https://api.openai.com/v1';
  
  async sendMessage(
    messages: ChatMessage[],
    userMessage: string
  ): Promise<CoachResponse> {
    try {
      // Detect crisis keywords first
      const isCrisis = this.detectCrisis(userMessage);
      if (isCrisis) {
        return {
          message: "I'm concerned about what you're sharing. Please reach out to a mental health professional who can provide the support you need.\n\n**Crisis Resources:**\n• Call or text 988 (Suicide & Crisis Lifeline)\n• Text HOME to 741741 (Crisis Text Line)\n• Visit 988lifeline.org for chat support\n\nYou don't have to go through this alone.",
          tone: 'pragmatist',
          tokenCount: 0,
          isCrisis: true,
        };
      }

      // Detect appropriate tone based on emotional triggers
      const tone = this.detectTone(userMessage);
      const systemPrompt = this.getSystemPrompt(tone);
      
      const fullMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(-10) // Only send last 10 messages for context
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
      
      // Apply content moderation
      const moderatedMessage = await this.moderateContent(data.choices[0].message.content);
      
      return {
        message: moderatedMessage,
        tone,
        tokenCount: data.usage.total_tokens,
        isCrisis: false,
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  private detectTone(message: string): CoachTone {
    const lowerMessage = message.toLowerCase();
    
    // Check for hype triggers
    for (const trigger of EMOTIONAL_TRIGGERS.hype) {
      if (lowerMessage.includes(trigger)) {
        return 'hype';
      }
    }
    
    // Check for tough-love triggers
    for (const trigger of EMOTIONAL_TRIGGERS['tough-love']) {
      if (lowerMessage.includes(trigger)) {
        return 'tough-love';
      }
    }
    
    // Default to pragmatist
    return 'pragmatist';
  }

  private detectCrisis(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    for (const trigger of EMOTIONAL_TRIGGERS.crisis) {
      if (lowerMessage.includes(trigger)) {
        return true;
      }
    }
    
    return false;
  }

  private getSystemPrompt(tone: CoachTone): string {
    const basePrompt = TONE_PROMPTS[tone];
    const boundaries = "\n\nImportant: Never provide personal relationship advice, medical advice, or financial investment advice. Stay focused on career recovery and job search support. If asked about these topics, politely redirect to career-related matters.";
    
    return basePrompt + boundaries;
  }

  private async moderateContent(content: string): Promise<string> {
    // Basic content moderation - in production, use OpenAI's moderation API
    // For now, just ensure no personal data is exposed
    return content.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REMOVED]')
                  .replace(/\b\d{16}\b/g, '[CARD NUMBER REMOVED]');
  }

  async analyzeChatContent<T>(
    prompt: string, 
    options?: { systemPrompt?: string }
  ): Promise<{ analysis: T; tone: string }> {
    try {
      const systemPrompt = options?.systemPrompt || 'You are a professional resume analysis expert.';
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);
      
      return { analysis: analysis as T, tone: 'pragmatist' };
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw error;
    }
  }

  async generateResumeContent(params: {
    resume: string;
    targetKeywords: string[];
    jobDescription?: string;
    tone?: string;
    focusAreas?: string[];
  }): Promise<any> {
    try {
      const systemPrompt = `You are a professional resume writer. Generate improved resume content based on the provided parameters. Return JSON with sections array and suggestions array.`;
      
      const userPrompt = `
        Current Resume: ${params.resume}
        Target Keywords: ${params.targetKeywords.join(', ')}
        Job Description: ${params.jobDescription || 'General improvement'}
        Tone: ${params.tone || 'professional'}
        Focus Areas: ${params.focusAreas?.join(', ') || 'General improvement'}
        
        Please provide rewritten sections and specific suggestions for improvement.
      `;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 1500,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating resume content:', error);
      throw error;
    }
  }
}

export const openAIService = new OpenAIService();