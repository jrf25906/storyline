import { MemoryStorageConfig } from '../types';

/**
 * Memory service configuration
 */
export const memoryConfig: MemoryStorageConfig = {
  vectorStore: {
    collection: 'storyline_memories',
    dimension: 1536, // OpenAI ada-002 embedding dimension
    distance: 'cosine',
  },
  graphStore: {
    database: 'storyline',
    labels: ['Memory', 'Character', 'Theme', 'Event', 'Location', 'Conflict'],
  },
  cache: {
    ttl: 3600, // 1 hour in seconds
    maxSize: 1000, // Maximum number of cached items
  },
};

/**
 * Performance thresholds and targets
 */
export const performanceConfig = {
  vector: {
    queryTimeout: 100, // milliseconds
    maxResults: 50,
    minSimilarity: 0.7,
  },
  graph: {
    queryTimeout: 300, // milliseconds
    maxDepth: 3,
    maxResults: 100,
  },
  hybrid: {
    routingTimeout: 10, // milliseconds
    synthesisTimeout: 500, // milliseconds
    maxCombinedResults: 25,
  },
  cache: {
    queryTimeout: 10, // milliseconds
  },
};

/**
 * Contradiction detection configuration
 */
export const contradictionConfig = {
  similarityThreshold: 0.85, // Threshold for detecting similar memories
  emotionalShiftThreshold: 0.5, // Threshold for detecting emotional tone changes
  timeWindowDays: 30, // Days to look back for contradictions
  confidenceThreshold: 0.6, // Minimum confidence for contradiction detection
  autoResolveThreshold: 0.9, // Auto-resolve contradictions above this confidence
};

/**
 * Privacy and security configuration
 */
export const privacyConfig = {
  encryptionRequired: ['sensitive'],
  retentionPeriodDays: 365 * 7, // 7 years
  anonymizationFields: ['userId', 'email', 'name'],
  auditLogRetentionDays: 90,
};

/**
 * Embedding service configuration
 */
export const embeddingConfig = {
  provider: 'openai',
  model: 'text-embedding-ada-002',
  maxTokens: 8192,
  batchSize: 100,
  timeout: 30000, // 30 seconds
};

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  window: 60 * 1000, // 1 minute
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

/**
 * Monitoring and metrics configuration
 */
export const metricsConfig = {
  collectInterval: 60000, // 1 minute
  retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
  alertThresholds: {
    vectorQueryLatency: 150, // milliseconds
    graphQueryLatency: 400, // milliseconds
    errorRate: 0.05, // 5%
    memoryUsage: 0.85, // 85% of available memory
  },
};