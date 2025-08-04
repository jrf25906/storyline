import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, CompletionOptions, CompletionResponse, StreamChunk } from './types';
import { logger } from '../utils/logger';

export class AnthropicProvider extends AIProvider {
  name = 'anthropic';
  models = ['claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-haiku-latest'];
  
  private client: Anthropic;
  private defaultModel = 'claude-3-5-sonnet-latest';
  
  async initialize(): Promise<void> {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    // Test connection
    await this.isHealthy();
  }
  
  async complete(options: CompletionOptions): Promise<CompletionResponse> {
    try {
      const model = this.selectModel(options);
      
      // Convert messages to Anthropic format
      const systemMessage = options.messages.find(m => m.role === 'system')?.content || '';
      const messages = options.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));
      
      const completion = await this.client.messages.create({
        model,
        messages,
        system: systemMessage,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.9,
        stop_sequences: options.stopSequences,
        stream: false,
        metadata: {
          user_id: options.userId
        }
      });
      
      const content = completion.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
      
      return {
        content,
        model: completion.model,
        provider: this.name,
        usage: {
          promptTokens: completion.usage.input_tokens,
          completionTokens: completion.usage.output_tokens,
          totalTokens: completion.usage.input_tokens + completion.usage.output_tokens
        },
        finishReason: completion.stop_reason || undefined
      };
    } catch (error) {
      logger.error('Anthropic completion error:', error);
      throw error;
    }
  }
  
  async *stream(options: CompletionOptions): AsyncIterableIterator<StreamChunk> {
    try {
      const model = this.selectModel(options);
      
      // Convert messages to Anthropic format
      const systemMessage = options.messages.find(m => m.role === 'system')?.content || '';
      const messages = options.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));
      
      const stream = await this.client.messages.create({
        model,
        messages,
        system: systemMessage,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.9,
        stop_sequences: options.stopSequences,
        stream: true,
        metadata: {
          user_id: options.userId
        }
      });
      
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield {
            content: event.delta.text,
            isComplete: false,
            model,
            provider: this.name
          };
        } else if (event.type === 'message_stop') {
          yield {
            content: '',
            isComplete: true,
            model,
            provider: this.name
          };
        }
      }
    } catch (error) {
      logger.error('Anthropic streaming error:', error);
      throw error;
    }
  }
  
  async countTokens(text: string): Promise<number> {
    try {
      const result = await this.client.messages.count_tokens({
        messages: [{ role: 'user', content: text }],
        model: this.defaultModel
      });
      return result.input_tokens;
    } catch (error) {
      // Fallback to approximate count
      return Math.ceil(text.length / 3.5);
    }
  }
  
  async isHealthy(): Promise<boolean> {
    try {
      // Simple test message
      await this.client.messages.create({
        model: 'claude-3-haiku-latest',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      });
      return true;
    } catch (error) {
      logger.error('Anthropic health check failed:', error);
      return false;
    }
  }
  
  private selectModel(options: CompletionOptions): string {
    // Use Sonnet for emotional/creative conversations
    const needsSonnet = 
      options.metadata?.emotional ||
      options.metadata?.creative ||
      options.metadata?.complexity === 'high';
    
    if (needsSonnet) {
      return 'claude-3-5-sonnet-latest';
    }
    
    // Use Haiku for simple/fast responses
    if (options.metadata?.speed === 'fast') {
      return 'claude-3-haiku-latest';
    }
    
    // Use Opus for complex reasoning
    if (options.metadata?.reasoning === 'complex') {
      return 'claude-3-opus-latest';
    }
    
    return options.metadata?.preferredModel || this.defaultModel;
  }
}