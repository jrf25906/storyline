import OpenAI from 'openai';
import axios from 'axios';
import { logger, logAIInteraction } from '../utils/logger';

/**
 * Service for managing AI provider interactions
 * Supports OpenAI and Anthropic with fallback capabilities
 */
export class AIProviderService {
  private openai?: OpenAI;
  private anthropicApiKey?: string;
  private defaultProvider: string;
  private fallbackEnabled: boolean;

  constructor(config: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    defaultProvider?: string;
    fallbackEnabled?: boolean;
  } = {}) {
    // Initialize OpenAI
    if (config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey,
      });
    }

    // Store Anthropic API key
    this.anthropicApiKey = config.anthropicApiKey;

    this.defaultProvider = config.defaultProvider || 'openai';
    this.fallbackEnabled = config.fallbackEnabled !== false;

    logger.info('AI Provider Service initialized', {
      defaultProvider: this.defaultProvider,
      fallbackEnabled: this.fallbackEnabled,
      openaiEnabled: !!this.openai,
      anthropicEnabled: !!this.anthropicApiKey,
    });
  }

  /**
   * Generate completion using specified or default provider
   */
  async generateCompletion(
    prompt: string,
    options: {
      provider?: string;
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    const provider = options.provider || this.defaultProvider;
    const startTime = Date.now();

    try {
      let response: string;
      let tokens = 0;
      let model = '';

      if (provider === 'openai' && this.openai) {
        const result = await this.generateOpenAICompletion(prompt, options);
        response = result.content;
        tokens = result.tokens;
        model = result.model;
      } else if (provider === 'anthropic' && this.anthropicApiKey) {
        const result = await this.generateAnthropicCompletion(prompt, options);
        response = result.content;
        tokens = result.tokens;
        model = result.model;
      } else {
        throw new Error(`Provider ${provider} not available or configured`);
      }

      // Log successful interaction
      logAIInteraction({
        provider,
        model,
        tokens,
        latency: Date.now() - startTime,
        success: true,
      });

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('AI completion failed', {
        provider,
        error: errorMessage,
        promptLength: prompt.length,
      });

      // Log failed interaction
      logAIInteraction({
        provider,
        model: options.model || 'unknown',
        tokens: 0,
        latency: Date.now() - startTime,
        success: false,
        error: errorMessage,
      });

      // Try fallback if enabled and original provider failed
      if (this.fallbackEnabled && provider !== 'fallback') {
        logger.info('Attempting fallback provider', {
          originalProvider: provider,
        });

        const fallbackProvider = provider === 'openai' ? 'anthropic' : 'openai';
        return this.generateCompletion(prompt, {
          ...options,
          provider: fallbackProvider,
        });
      }

      throw error;
    }
  }

  /**
   * Generate completion using OpenAI
   */
  private async generateOpenAICompletion(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<{ content: string; tokens: number; model: string }> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const model = options.model || 'gpt-4';
    const maxTokens = options.maxTokens || 1000;
    const temperature = options.temperature || 0.1;

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert literary analyst and writing coach specializing in narrative structure, character development, and storytelling craft. Provide detailed, actionable analysis and recommendations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokens = completion.usage?.total_tokens || 0;

      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      return { content, tokens, model };

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown OpenAI API error');
    }
  }

  /**
   * Generate completion using Anthropic Claude
   */
  private async generateAnthropicCompletion(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<{ content: string; tokens: number; model: string }> {
    if (!this.anthropicApiKey) {
      throw new Error('Anthropic not configured');
    }

    const model = options.model || 'claude-3-sonnet-20240229';
    const maxTokens = options.maxTokens || 1000;
    const temperature = options.temperature || 0.1;

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model,
          max_tokens: maxTokens,
          temperature,
          system: 'You are an expert literary analyst and writing coach specializing in narrative structure, character development, and storytelling craft. Provide detailed, actionable analysis and recommendations.',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.anthropicApiKey,
            'anthropic-version': '2023-06-01',
          },
        }
      );

      const content = response.data.content[0]?.text || '';
      const tokens = response.data.usage?.input_tokens + response.data.usage?.output_tokens || 0;

      if (!content) {
        throw new Error('No content returned from Anthropic');
      }

      return { content, tokens, model };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Anthropic API error: ${message}`);
      }
      throw new Error('Unknown Anthropic API error');
    }
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: string): boolean {
    switch (provider) {
      case 'openai':
        return !!this.openai;
      case 'anthropic':
        return !!this.anthropicApiKey;
      default:
        return false;
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    const providers: string[] = [];
    
    if (this.openai) {
      providers.push('openai');
    }
    
    if (this.anthropicApiKey) {
      providers.push('anthropic');
    }

    return providers;
  }

  /**
   * Test provider connectivity
   */
  async testProvider(provider: string): Promise<boolean> {
    try {
      const testPrompt = 'Respond with "OK" if you can understand this message.';
      const response = await this.generateCompletion(testPrompt, {
        provider,
        maxTokens: 10,
        temperature: 0,
      });

      return response.toLowerCase().includes('ok');

    } catch (error) {
      logger.error('Provider test failed', {
        provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Generate multiple completions for comparison
   */
  async generateMultipleCompletions(
    prompt: string,
    providers: string[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<Array<{ provider: string; content: string; error?: string }>> {
    const results = await Promise.allSettled(
      providers.map(async (provider) => {
        const content = await this.generateCompletion(prompt, {
          ...options,
          provider,
        });
        return { provider, content };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          provider: providers[index] || 'unknown',
          content: '',
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        };
      }
    });
  }

  /**
   * Estimate token count for prompt
   */
  estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate cost for completion
   */
  estimateCost(
    inputTokens: number,
    outputTokens: number,
    provider: string,
    model: string
  ): number {
    // Rough cost estimates (as of 2024) - should be updated regularly
    const costPerToken = {
      'openai-gpt-4': { input: 0.00003, output: 0.00006 },
      'openai-gpt-3.5-turbo': { input: 0.0000015, output: 0.000002 },
      'anthropic-claude-3-sonnet': { input: 0.000003, output: 0.000015 },
      'anthropic-claude-3-haiku': { input: 0.00000025, output: 0.00000125 },
    };

    const key = `${provider}-${model}`;
    const costs = costPerToken[key as keyof typeof costPerToken];
    
    if (!costs) {
      return 0; // Unknown model
    }

    return (inputTokens * costs.input) + (outputTokens * costs.output);
  }
}