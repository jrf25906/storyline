import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { NarrativeAnalysisError, ErrorTypes } from './errorHandler';
import { AuthenticatedRequest } from './auth';

/**
 * Rate limiter configurations
 */
interface RateLimitConfig {
  points: number; // Number of points
  duration: number; // Per duration in seconds
  blockDuration: number; // Block duration in seconds
}

/**
 * Rate limiting configurations for different endpoints
 */
const rateLimitConfigs = {
  // Analysis endpoints - more restrictive due to AI API costs
  analysis: {
    points: 10, // 10 requests
    duration: 60, // per minute
    blockDuration: 60, // block for 1 minute
  },
  
  // Health check and lightweight endpoints
  health: {
    points: 100, // 100 requests
    duration: 60, // per minute
    blockDuration: 10, // block for 10 seconds
  },
  
  // Default for other endpoints
  default: {
    points: 30, // 30 requests
    duration: 60, // per minute
    blockDuration: 30, // block for 30 seconds
  },
  
  // Premium users get higher limits
  premium: {
    points: 50, // 50 requests
    duration: 60, // per minute
    blockDuration: 30, // block for 30 seconds
  },
} as const;

/**
 * Rate limiter instances
 */
let rateLimiters: Record<string, RateLimiterRedis | RateLimiterMemory> = {};

/**
 * Initialize rate limiters
 */
export const initializeRateLimiters = async (): Promise<void> => {
  try {
    let redisClient: Redis | undefined;

    // Try to connect to Redis if available
    if (process.env.REDIS_URL) {
      try {
        redisClient = new Redis(process.env.REDIS_URL);
        await redisClient.ping();
        logger.info('Redis connected for rate limiting');
      } catch (error) {
        logger.warn('Redis not available, falling back to memory-based rate limiting', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        redisClient = undefined;
      }
    }

    // Create rate limiters for each configuration
    Object.entries(rateLimitConfigs).forEach(([key, config]) => {
      if (redisClient) {
        rateLimiters[key] = new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: `rl_narrative_${key}`,
          points: config.points,
          duration: config.duration,
          blockDuration: config.blockDuration,
          execEvenly: true, // Spread requests evenly across duration
        });
      } else {
        rateLimiters[key] = new RateLimiterMemory({
          keyPrefix: `rl_narrative_${key}`,
          points: config.points,
          duration: config.duration,
          blockDuration: config.blockDuration,
          execEvenly: true,
        });
      }
    });

    logger.info('Rate limiters initialized', {
      backend: redisClient ? 'Redis' : 'Memory',
      configurations: Object.keys(rateLimitConfigs),
    });

  } catch (error) {
    logger.error('Failed to initialize rate limiters', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Get rate limiter key for request
 */
const getRateLimitKey = (req: AuthenticatedRequest): string => {
  // Use authenticated user ID if available
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }

  // Fall back to IP address
  return `ip:${req.ip}`;
};

/**
 * Get rate limiter configuration based on user and endpoint
 */
const getRateLimitConfig = (req: AuthenticatedRequest, endpoint: string): string => {
  // Premium users get higher limits
  if (req.user?.role === 'premium' || req.user?.permissions?.includes('premium_limits')) {
    return 'premium';
  }

  // Use endpoint-specific config if available
  if (endpoint in rateLimitConfigs) {
    return endpoint;
  }

  return 'default';
};

/**
 * Create rate limiting middleware for specific endpoint type
 */
export const createRateLimiter = (endpointType: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = getRateLimitKey(req);
      const configType = getRateLimitConfig(req, endpointType);
      const rateLimiter = rateLimiters[configType];

      if (!rateLimiter) {
        logger.error('Rate limiter not initialized', { configType });
        // Continue without rate limiting rather than fail
        next();
        return;
      }

      // Consume a point
      const result = await rateLimiter.consume(key);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', rateLimitConfigs[configType as keyof typeof rateLimitConfigs].points);
      res.setHeader('X-RateLimit-Remaining', result.remainingPoints);
      res.setHeader('X-RateLimit-Reset', result.msBeforeNext);

      logger.debug('Rate limit check passed', {
        key,
        configType,
        remainingPoints: result.remainingPoints,
        endpointType,
        path: req.path,
      });

      next();

    } catch (rateLimitError: any) {
      if (rateLimitError instanceof Error && rateLimitError.name === 'RateLimiterError') {
        // Rate limit exceeded
        logger.warn('Rate limit exceeded', {
          key: getRateLimitKey(req),
          endpointType,
          path: req.path,
          method: req.method,
          ip: req.ip,
          userId: req.user?.id,
          msBeforeNext: rateLimitError.msBeforeNext,
        });

        // Add rate limit headers for exceeded limit
        const configType = getRateLimitConfig(req, endpointType);
        res.setHeader('X-RateLimit-Limit', rateLimitConfigs[configType as keyof typeof rateLimitConfigs].points);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', rateLimitError.msBeforeNext || 60000);
        res.setHeader('Retry-After', Math.round((rateLimitError.msBeforeNext || 60000) / 1000));

        throw new NarrativeAnalysisError(
          `Rate limit exceeded. Please wait ${Math.round((rateLimitError.msBeforeNext || 60000) / 1000)} seconds before trying again.`,
          429,
          ErrorTypes.RATE_LIMIT_EXCEEDED,
          {
            retryAfter: Math.round((rateLimitError.msBeforeNext || 60000) / 1000),
            limit: rateLimitConfigs[configType as keyof typeof rateLimitConfigs].points,
            window: rateLimitConfigs[configType as keyof typeof rateLimitConfigs].duration,
          }
        );
      }

      // Other error occurred
      logger.error('Rate limiter error', {
        error: rateLimitError instanceof Error ? rateLimitError.message : 'Unknown error',
        key: getRateLimitKey(req),
        endpointType,
      });

      // Continue without rate limiting rather than fail
      next();
    }
  };
};

/**
 * Analysis endpoint rate limiter
 */
export const analysisRateLimit = createRateLimiter('analysis');

/**
 * Health check rate limiter
 */
export const healthRateLimit = createRateLimiter('health');

/**
 * Default rate limiter
 */
export const defaultRateLimit = createRateLimiter('default');

/**
 * Burst protection for expensive operations
 */
export const burstProtection = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = `burst:${getRateLimitKey(req)}`;
    
    // Create a burst limiter - 3 requests per 10 seconds
    const burstLimiter = rateLimiters.burst || (rateLimiters.burst = new (rateLimiters.default.constructor as any)({
      keyPrefix: 'rl_narrative_burst',
      points: 3,
      duration: 10,
      blockDuration: 30,
    }));

    await burstLimiter.consume(key);
    next();

  } catch (rateLimitError: any) {
    if (rateLimitError instanceof Error && rateLimitError.name === 'RateLimiterError') {
      logger.warn('Burst protection triggered', {
        key: getRateLimitKey(req),
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
      });

      throw new NarrativeAnalysisError(
        'Too many requests in a short time. Please wait 30 seconds before trying again.',
        429,
        ErrorTypes.RATE_LIMIT_EXCEEDED,
        {
          retryAfter: 30,
          type: 'burst_protection',
        }
      );
    }

    // Continue on other errors
    next();
  }
};

/**
 * Content-length based rate limiting (for large content analysis)
 */
export const contentSizeRateLimit = (maxSizePerMinute: number = 1000000) => {
  const sizeLimiters = new Map<string, { size: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const key = getRateLimitKey(req);
    const contentLength = req.body?.content?.length || 0;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    // Clean up old entries
    for (const [k, v] of sizeLimiters.entries()) {
      if (now > v.resetTime) {
        sizeLimiters.delete(k);
      }
    }

    // Get current usage
    const current = sizeLimiters.get(key) || { size: 0, resetTime: now + windowMs };

    // Check if adding this content would exceed limit
    if (current.size + contentLength > maxSizePerMinute) {
      logger.warn('Content size rate limit exceeded', {
        key,
        currentSize: current.size,
        requestSize: contentLength,
        limit: maxSizePerMinute,
        path: req.path,
        userId: req.user?.id,
      });

      throw new NarrativeAnalysisError(
        'Content size limit exceeded. Please wait before analyzing more content.',
        429,
        ErrorTypes.RATE_LIMIT_EXCEEDED,
        {
          currentUsage: current.size,
          requestSize: contentLength,
          limit: maxSizePerMinute,
          type: 'content_size_limit',
        }
      );
    }

    // Update usage
    sizeLimiters.set(key, {
      size: current.size + contentLength,
      resetTime: current.resetTime,
    });

    next();
  };
};

/**
 * Reset rate limits for a specific key (admin function)
 */
export const resetRateLimit = async (key: string, configType: string = 'default'): Promise<void> => {
  try {
    const rateLimiter = rateLimiters[configType];
    if (rateLimiter && 'delete' in rateLimiter) {
      await (rateLimiter as any).delete(key);
      logger.info('Rate limit reset', { key, configType });
    }
  } catch (error) {
    logger.error('Failed to reset rate limit', {
      key,
      configType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Get rate limit status for a key
 */
export const getRateLimitStatus = async (key: string, configType: string = 'default'): Promise<{
  points: number;
  remainingPoints: number;
  msBeforeNext: number;
} | null> => {
  try {
    const rateLimiter = rateLimiters[configType];
    if (rateLimiter && 'get' in rateLimiter) {
      const result = await (rateLimiter as any).get(key);
      return result;
    }
    return null;
  } catch (error) {
    logger.error('Failed to get rate limit status', {
      key,
      configType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
};