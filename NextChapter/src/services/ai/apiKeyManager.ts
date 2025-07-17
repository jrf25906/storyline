import { setSecureValue, getSecureValue, deleteSecureValue } from '@services/security/keychain';
import { resetOpenAIClient } from './openai';

const API_KEY_STORAGE_KEY = 'OPENAI_API_KEY';

/**
 * Manages OpenAI API key storage and validation
 */
export class APIKeyManager {
  /**
   * Store the OpenAI API key securely
   */
  static async setAPIKey(apiKey: string): Promise<void> {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }

    // Basic validation - OpenAI keys start with 'sk-'
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    await setSecureValue(API_KEY_STORAGE_KEY, apiKey);
    
    // Reset the client to use the new key
    resetOpenAIClient();
  }

  /**
   * Retrieve the stored API key
   */
  static async getAPIKey(): Promise<string | null> {
    return await getSecureValue(API_KEY_STORAGE_KEY);
  }

  /**
   * Check if an API key is configured
   */
  static async hasAPIKey(): Promise<boolean> {
    const key = await this.getAPIKey();
    return !!key;
  }

  /**
   * Remove the stored API key
   */
  static async removeAPIKey(): Promise<void> {
    await deleteSecureValue(API_KEY_STORAGE_KEY);
    resetOpenAIClient();
  }

  /**
   * Validate API key format (basic check)
   */
  static validateKeyFormat(apiKey: string): boolean {
    return apiKey.startsWith('sk-') && apiKey.length > 10;
  }

  /**
   * Test the API key by making a simple API call
   */
  static async testAPIKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Store temporarily
      await this.setAPIKey(apiKey);
      
      // Try to get the client and make a simple call
      const { getOpenAIClient } = await import('./openai');
      const openai = await getOpenAIClient();
      
      // Make a minimal API call to test the key
      await openai.models.list();
      
      return { valid: true };
    } catch (error: any) {
      // Remove the invalid key
      await this.removeAPIKey();
      
      return {
        valid: false,
        error: error.message || 'Invalid API key',
      };
    }
  }
}