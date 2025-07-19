/**
 * OpenAI adapter implementing IChatCompletionService
 * Example of proper API abstraction and error handling
 */

import { 
  IChatCompletionService, 
  ChatMessage, 
  ChatCompletionParams, 
  ChatCompletionResponse,
  ChatCompletionChunk,
  AIUsageStats,
  AIQuota
} from '@services/interfaces/ai/IAIService';
import { Result, ok, err, tryCatch } from '@services/interfaces/common/result';
import { ExternalServiceError, RateLimitError, QuotaExceededError } from '@services/interfaces/common/errors';

export class OpenAIAdapter implements IChatCompletionService {
  private model: string = 'gpt-4o-mini';
  private baseURL: string = 'https://api.openai.com/v1';
  private apiKey: string;
  private totalTokensUsed: number = 0;
  private requestCount: number = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setModel(model: string): void {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async validateConfiguration(): Promise<Result<boolean>> {
    if (!this.isConfigured()) {
      return ok(false);
    }

    return tryCatch(
      async () => {
        const response = await fetch(`${this.baseURL}/models`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        if (response.status === 401) {
          return false;
        }

        if (!response.ok) {
          throw new ExternalServiceError(
            'OpenAI',
            `API validation failed: ${response.statusText}`,
            response.status
          );
        }

        return true;
      },
      (error) => error instanceof ExternalServiceError ? error : 
        new ExternalServiceError('OpenAI', String(error))
    );
  }

  async complete(params: ChatCompletionParams): Promise<Result<ChatCompletionResponse>> {
    return tryCatch(
      async () => {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages: params.messages,
            temperature: params.temperature ?? 0.7,
            max_tokens: params.maxTokens ?? 500,
            top_p: params.topP,
            frequency_penalty: params.frequencyPenalty,
            presence_penalty: params.presencePenalty,
            stop: params.stopSequences,
            response_format: params.responseFormat ? { type: params.responseFormat } : undefined
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            throw new RateLimitError(
              'OpenAI',
              retryAfter ? parseInt(retryAfter) : undefined,
              error
            );
          }

          if (response.status === 403 && error.error?.code === 'quota_exceeded') {
            throw new QuotaExceededError('OpenAI', 'API quota', error);
          }

          throw new ExternalServiceError(
            'OpenAI',
            error.error?.message || `API error: ${response.statusText}`,
            response.status,
            error
          );
        }

        const data = await response.json();
        
        // Update usage stats
        this.totalTokensUsed += data.usage.total_tokens;
        this.requestCount++;

        return {
          content: data.choices[0].message.content,
          role: 'assistant',
          tokensUsed: data.usage.total_tokens,
          finishReason: data.choices[0].finish_reason,
          model: data.model
        };
      },
      (error) => error instanceof ExternalServiceError ? error : 
        new ExternalServiceError('OpenAI', String(error))
    );
  }

  async *stream(params: ChatCompletionParams): AsyncIterator<Result<ChatCompletionChunk>> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 500,
          stream: true
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ExternalServiceError(
          'OpenAI',
          error.error?.message || `API error: ${response.statusText}`,
          response.status,
          error
        );
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          yield ok({ delta: '', isComplete: true });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              yield ok({ delta: '', isComplete: true });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta?.content || '';
              yield ok({ delta, isComplete: false });
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      yield err(
        error instanceof ExternalServiceError ? error : 
          new ExternalServiceError('OpenAI', String(error))
      );
    }
  }

  async countTokens(messages: ChatMessage[]): Promise<Result<number>> {
    // Simplified token counting - in production, use tiktoken
    return ok(
      messages.reduce((total, msg) => {
        return total + Math.ceil(msg.content.length / 4);
      }, 0)
    );
  }

  async getUsage(): Promise<Result<AIUsageStats>> {
    // In a real implementation, this would fetch from a usage API
    return ok({
      totalTokens: this.totalTokensUsed,
      totalCost: this.totalTokensUsed * 0.000002, // Example pricing
      requestCount: this.requestCount,
      periodStart: new Date(new Date().setDate(1)), // First day of month
      periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) // Last day of month
    });
  }

  async getRemainingQuota(): Promise<Result<AIQuota>> {
    // In a real implementation, this would fetch from a quota API
    const monthlyTokenLimit = 1000000; // Example limit
    const monthlyRequestLimit = 10000;
    
    return ok({
      tokensUsed: this.totalTokensUsed,
      tokensLimit: monthlyTokenLimit,
      requestsUsed: this.requestCount,
      requestsLimit: monthlyRequestLimit,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) // First day of next month
    });
  }
}