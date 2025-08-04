import Redis from 'ioredis';
import { DatabaseConfig } from '../config/database';
import { memoryConfig, performanceConfig } from '../config/memory';
import { ExtendedMemory, MemorySearchResult, ContextQuery } from '../types';
import { logger } from '../utils/logger';

/**
 * Cache service using Redis for fast memory retrieval
 */
export class CacheService {
  private redis: Redis;
  private readonly keyPrefix = 'storyline:memory:';
  private readonly searchKeyPrefix = 'storyline:search:';

  constructor() {
    this.redis = DatabaseConfig.getRedis();
  }

  /**
   * Generate cache key for memory
   */
  private getMemoryKey(memoryId: string): string {
    return `${this.keyPrefix}memory:${memoryId}`;
  }

  /**
   * Generate cache key for search results
   */
  private getSearchKey(query: ContextQuery): string {
    const queryHash = this.hashQuery(query);
    return `${this.searchKeyPrefix}${queryHash}`;
  }

  /**
   * Generate cache key for user memories list
   */
  private getUserMemoriesKey(userId: string, documentId?: string): string {
    const suffix = documentId ? `:${documentId}` : '';
    return `${this.keyPrefix}user:${userId}${suffix}`;
  }

  /**
   * Cache a memory
   */
  async cacheMemory(memory: ExtendedMemory): Promise<void> {
    try {
      const key = this.getMemoryKey(memory.id);
      const serialized = JSON.stringify(memory);
      
      await this.redis.setex(key, memoryConfig.cache.ttl, serialized);
      
      // Add to user's memory list
      const userKey = this.getUserMemoriesKey(memory.userId);
      await this.redis.sadd(userKey, memory.id);
      await this.redis.expire(userKey, memoryConfig.cache.ttl);

      // Add to document-specific memory list if applicable
      for (const documentId of memory.documentIds) {
        const docKey = this.getUserMemoriesKey(memory.userId, documentId);
        await this.redis.sadd(docKey, memory.id);
        await this.redis.expire(docKey, memoryConfig.cache.ttl);
      }

      logger.debug('Memory cached successfully', {
        memoryId: memory.id,
        userId: memory.userId,
      });

    } catch (error) {
      logger.warn('Failed to cache memory:', error, {
        memoryId: memory.id,
        userId: memory.userId,
      });
      // Don't throw - caching failures shouldn't break the application
    }
  }

  /**
   * Get cached memory
   */
  async getCachedMemory(memoryId: string): Promise<ExtendedMemory | null> {
    try {
      const key = this.getMemoryKey(memoryId);
      const cached = await this.redis.get(key);
      
      if (cached) {
        const memory = JSON.parse(cached) as ExtendedMemory;
        // Convert timestamp strings back to Date objects
        memory.timestamp = new Date(memory.timestamp);
        memory.versions = memory.versions.map(v => ({
          ...v,
          timestamp: new Date(v.timestamp),
        }));
        
        logger.debug('Memory retrieved from cache', {
          memoryId,
        });
        
        return memory;
      }

      return null;

    } catch (error) {
      logger.warn('Failed to get cached memory:', error, {
        memoryId,
      });
      return null;
    }
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(query: ContextQuery, results: MemorySearchResult): Promise<void> {
    try {
      const key = this.getSearchKey(query);
      const serialized = JSON.stringify(results);
      
      // Use shorter TTL for search results as they can become stale quickly
      const searchTtl = Math.min(memoryConfig.cache.ttl, 900); // Max 15 minutes
      await this.redis.setex(key, searchTtl, serialized);

      logger.debug('Search results cached successfully', {
        query: query.query,
        userId: query.userId,
        resultsCount: results.memories.length,
      });

    } catch (error) {
      logger.warn('Failed to cache search results:', error, {
        query: query.query,
        userId: query.userId,
      });
    }
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(query: ContextQuery): Promise<MemorySearchResult | null> {
    try {
      const key = this.getSearchKey(query);
      const cached = await this.redis.get(key);
      
      if (cached) {
        const results = JSON.parse(cached) as MemorySearchResult;
        
        // Convert timestamp strings back to Date objects
        results.memories = results.memories.map(memory => ({
          ...memory,
          timestamp: new Date(memory.timestamp),
          versions: memory.versions.map(v => ({
            ...v,
            timestamp: new Date(v.timestamp),
          })),
        }));

        logger.debug('Search results retrieved from cache', {
          query: query.query,
          userId: query.userId,
          resultsCount: results.memories.length,
        });
        
        return results;
      }

      return null;

    } catch (error) {
      logger.warn('Failed to get cached search results:', error, {
        query: query.query,
        userId: query.userId,
      });
      return null;
    }
  }

  /**
   * Invalidate memory cache
   */
  async invalidateMemory(memoryId: string, userId: string): Promise<void> {
    try {
      const key = this.getMemoryKey(memoryId);
      await this.redis.del(key);

      // Remove from user's memory lists
      const userKey = this.getUserMemoriesKey(userId);
      await this.redis.srem(userKey, memoryId);

      // Invalidate related search caches
      await this.invalidateUserSearchCache(userId);

      logger.debug('Memory cache invalidated', {
        memoryId,
        userId,
      });

    } catch (error) {
      logger.warn('Failed to invalidate memory cache:', error, {
        memoryId,
        userId,
      });
    }
  }

  /**
   * Invalidate user's search cache
   */
  async invalidateUserSearchCache(userId: string): Promise<void> {
    try {
      const pattern = `${this.searchKeyPrefix}*${userId}*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug('User search cache invalidated', {
          userId,
          keysDeleted: keys.length,
        });
      }

    } catch (error) {
      logger.warn('Failed to invalidate user search cache:', error, {
        userId,
      });
    }
  }

  /**
   * Get cached memory IDs for a user
   */
  async getCachedMemoryIds(userId: string, documentId?: string): Promise<string[]> {
    try {
      const key = this.getUserMemoriesKey(userId, documentId);
      const ids = await this.redis.smembers(key);
      
      return ids;

    } catch (error) {
      logger.warn('Failed to get cached memory IDs:', error, {
        userId,
        documentId,
      });
      return [];
    }
  }

  /**
   * Batch cache multiple memories
   */
  async batchCacheMemories(memories: ExtendedMemory[]): Promise<void> {
    if (memories.length === 0) return;

    try {
      const pipeline = this.redis.pipeline();

      for (const memory of memories) {
        const key = this.getMemoryKey(memory.id);
        const serialized = JSON.stringify(memory);
        pipeline.setex(key, memoryConfig.cache.ttl, serialized);

        // Add to user's memory list
        const userKey = this.getUserMemoriesKey(memory.userId);
        pipeline.sadd(userKey, memory.id);
        pipeline.expire(userKey, memoryConfig.cache.ttl);
      }

      await pipeline.exec();

      logger.debug('Batch cached memories successfully', {
        count: memories.length,
      });

    } catch (error) {
      logger.warn('Failed to batch cache memories:', error, {
        count: memories.length,
      });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const memoryKeys = await this.redis.keys(`${this.keyPrefix}memory:*`);
      const searchKeys = await this.redis.keys(`${this.searchKeyPrefix}*`);
      const userKeys = await this.redis.keys(`${this.keyPrefix}user:*`);

      const memoryUsage = await this.redis.memory('usage');
      
      return {
        memoryKeys: memoryKeys.length,
        searchKeys: searchKeys.length,
        userKeys: userKeys.length,
        totalKeys: memoryKeys.length + searchKeys.length + userKeys.length,
        memoryUsage: memoryUsage || 0,
      };

    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return {
        memoryKeys: 0,
        searchKeys: 0,
        userKeys: 0,
        totalKeys: 0,
        memoryUsage: 0,
      };
    }
  }

  /**
   * Clear all cache for a user
   */
  async clearUserCache(userId: string): Promise<void> {
    try {
      const patterns = [
        `${this.keyPrefix}memory:*${userId}*`,
        `${this.keyPrefix}user:${userId}*`,
        `${this.searchKeyPrefix}*${userId}*`,
      ];

      let totalDeleted = 0;
      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          totalDeleted += keys.length;
        }
      }

      logger.info('User cache cleared', {
        userId,
        keysDeleted: totalDeleted,
      });

    } catch (error) {
      logger.error('Failed to clear user cache:', error, {
        userId,
      });
    }
  }

  /**
   * Hash query for cache key generation
   */
  private hashQuery(query: ContextQuery): string {
    const queryStr = JSON.stringify({
      query: query.query,
      userId: query.userId,
      documentId: query.documentId,
      maxResults: query.maxResults,
      includeGraph: query.includeGraph,
      includeVector: query.includeVector,
      emotionalContext: query.emotionalContext,
      filters: query.filters,
    });

    // Simple hash function - in production, consider using a proper hash library
    let hash = 0;
    for (let i = 0; i < queryStr.length; i++) {
      const char = queryStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }
}