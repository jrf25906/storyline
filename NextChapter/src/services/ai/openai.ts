import OpenAI from 'openai';
import { getSecureValue } from '@services/security/keychain';

let openaiInstance: OpenAI | null = null;

/**
 * Initialize and return OpenAI client instance
 * Uses secure storage for API key management
 */
export async function getOpenAIClient(): Promise<OpenAI> {
  if (openaiInstance) {
    return openaiInstance;
  }

  try {
    // Retrieve API key from secure storage
    const apiKey = await getSecureValue('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please configure in settings.');
    }

    openaiInstance = new OpenAI({
      apiKey,
      // React Native doesn't have process.env, so we explicitly set the key
      dangerouslyAllowBrowser: true, // Required for React Native
    });

    return openaiInstance;
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    throw error;
  }
}

/**
 * Reset the OpenAI client instance
 * Useful when API key is updated
 */
export function resetOpenAIClient(): void {
  openaiInstance = null;
}