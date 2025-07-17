/**
 * AI Service Configuration
 */

export const OPENAI_CONFIG = {
  organization: undefined,
  basePath: 'https://api.openai.com/v1',
};

export const MODEL_CONFIG = {
  model: 'gpt-4o',
  maxTokens: 4000,
  temperature: 0.7,
  presencePenalty: 0.6,
  frequencyPenalty: 0.3,
};

export const RATE_LIMITS = {
  FREE_TIER_DAILY_LIMIT: 10,
  PRO_TIER_DAILY_LIMIT: -1, // Unlimited
  RESPONSE_TIME_TARGET_MS: 5000,
};

export const MODERATION_CONFIG = {
  enabled: true,
  flagThreshold: 0.8,
  blockThreshold: 0.95,
};