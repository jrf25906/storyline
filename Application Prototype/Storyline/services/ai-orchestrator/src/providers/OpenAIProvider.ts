import OpenAI from 'openai';
import { encoding_for_model } from 'tiktoken';
import { AIProvider, CompletionOptions, CompletionResponse, StreamChunk } from './types';
import { logger } from '../utils/logger';

export class OpenAIProvider extends AIProvider {
  name = 'openai';
  models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  
  private client: OpenAI;
  private defaultModel = 'gpt-4o';
  
  async initialize(): Promise<void> {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Test connection
    await this.isHealthy();
  }
  
  async complete(options: CompletionOptions): Promise<CompletionResponse> {
    try {
      const model = this.selectModel(options);
      
      const completion = await this.client.chat.completions.create({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
        top_p: options.topP ?? 0.9,
        frequency_penalty: options.frequencyPenalty ?? 0,
        presence_penalty: options.presencePenalty ?? 0,
        stop: options.stopSequences,
        stream: false,
        user: options.userId
      });
      
      const choice = completion.choices[0];
      
      return {
        content: choice.message.content || '',
        model: completion.model,
        provider: this.name,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined,
        finishReason: choice.finish_reason || undefined
      };
    } catch (error) {
      logger.error('OpenAI completion error:', error);
      throw error;
    }
  }
  
  async *stream(options: CompletionOptions): AsyncIterableIterator<StreamChunk> {
    try {
      const model = this.selectModel(options);
      
      const stream = await this.client.chat.completions.create({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
        top_p: options.topP ?? 0.9,
        frequency_penalty: options.frequencyPenalty ?? 0,
        presence_penalty: options.presencePenalty ?? 0,
        stop: options.stopSequences,
        stream: true,
        user: options.userId
      });
      
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield {
            content: delta.content,
            isComplete: false,
            model: chunk.model,
            provider: this.name
          };
        }
        
        if (chunk.choices[0]?.finish_reason) {
          yield {
            content: '',
            isComplete: true,
            model: chunk.model,
            provider: this.name
          };
        }
      }
    } catch (error) {
      logger.error('OpenAI streaming error:', error);
      throw error;
    }
  }
  
  async countTokens(text: string): Promise<number> {
    try {
      const encoding = encoding_for_model('gpt-4');
      const tokens = encoding.encode(text);
      encoding.free();
      return tokens.length;
    } catch (error) {
      // Fallback to approximate count
      return Math.ceil(text.length / 4);
    }
  }
  
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      logger.error('OpenAI health check failed:', error);
      return false;
    }
  }
  
  private selectModel(options: CompletionOptions): string {
    // Use GPT-4o for emotional/complex conversations
    const needsAdvancedModel = 
      options.metadata?.emotional ||
      options.metadata?.complexity === 'high' ||
      options.messages.some(m => m.content.length > 2000);
    
    if (needsAdvancedModel) {
      return 'gpt-4o';
    }
    
    // Use smaller model for simple tasks
    return options.metadata?.preferredModel || this.defaultModel;
  }
}