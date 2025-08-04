import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { AIProvider } from './types';
import { logger } from '../utils/logger';

export const providers: Map<string, AIProvider> = new Map();

export async function initializeProviders() {
  try {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      const openaiProvider = new OpenAIProvider();
      await openaiProvider.initialize();
      providers.set('openai', openaiProvider);
      logger.info('OpenAI provider initialized');
    }

    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropicProvider = new AnthropicProvider();
      await anthropicProvider.initialize();
      providers.set('anthropic', anthropicProvider);
      logger.info('Anthropic provider initialized');
    }

    if (providers.size === 0) {
      throw new Error('No AI providers configured. Please set API keys.');
    }

    logger.info(`Initialized ${providers.size} AI providers`);
  } catch (error) {
    logger.error('Failed to initialize AI providers:', error);
    throw error;
  }
}

export function getProvider(name: string): AIProvider | undefined {
  return providers.get(name);
}

export function getDefaultProvider(): AIProvider | undefined {
  // Prefer Claude for better emotional intelligence
  if (providers.has('anthropic')) {
    return providers.get('anthropic');
  }
  
  // Fallback to OpenAI
  if (providers.has('openai')) {
    return providers.get('openai');
  }
  
  return undefined;
}

export function listProviders(): string[] {
  return Array.from(providers.keys());
}