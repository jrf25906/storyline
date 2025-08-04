import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { DatabaseConfig } from '../config/database';
import { rateLimitConfig } from '../config/memory';
import { logger } from '../utils/logger';

/**
 * Rate limiting middleware using Redis
 */
export class RateLimiter {
  private rateLimiter: RateLimiterRedis;

  constructor() {
    const redis = DatabaseConfig.getRedis();
    
    this.rateLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'storyline_memory_rl',
      points: rateLimitConfig.maxRequests,
      duration: rateLimitConfig.window / 1000, // Convert to seconds
      blockDuration: 60, // Block for 1 minute if limit exceeded
      execEvenly: true, // Distribute requests evenly across duration
    });
  }

  /**
   * Rate limiting middleware function
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Use user ID if authenticated, otherwise use IP address
        const key = req.user?.id || req.ip;
        
        await this.rateLimiter.consume(key);
        next();

      } catch (rateLimiterRes: any) {
        if (rateLimiterRes instanceof Error) {
          logger.error('Rate limiter error:', rateLimiterRes);
          next(); // Allow request to proceed on rate limiter errors
          return;
        }

        const remainingPoints = rateLimiterRes.remainingPoints;
        const msBeforeNext = rateLimiterRes.msBeforeNext;
        const totalHits = rateLimiterRes.totalHits;

        res.set({
          'Retry-After': Math.round(msBeforeNext / 1000) || 1,
          'X-RateLimit-Limit': rateLimitConfig.maxRequests,
          'X-RateLimit-Remaining': remainingPoints,
          'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
        });

        logger.warn('Rate limit exceeded', {
          key: req.user?.id || req.ip,
          totalHits,
          remainingPoints,
          msBeforeNext,
          path: req.path,
          method: req.method,
        });

        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.round(msBeforeNext / 1000)} seconds.`,
          retryAfter: Math.round(msBeforeNext / 1000),
        });
      }
    };
  }

  /**
   * Create a custom rate limiter for specific endpoints
   */
  createCustomLimiter(points: number, duration: number, blockDuration: number = 60) {
    const redis = DatabaseConfig.getRedis();
    
    const customLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'storyline_memory_custom_rl',
      points,
      duration,
      blockDuration,
      execEvenly: true,
    });

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const key = req.user?.id || req.ip;
        await customLimiter.consume(key);
        next();

      } catch (rateLimiterRes: any) {
        if (rateLimiterRes instanceof Error) {
          logger.error('Custom rate limiter error:', rateLimiterRes);
          next();
          return;
        }

        const msBeforeNext = rateLimiterRes.msBeforeNext;

        res.set({
          'Retry-After': Math.round(msBeforeNext / 1000) || 1,
          'X-RateLimit-Limit': points,
          'X-RateLimit-Remaining': rateLimiterRes.remainingPoints,
          'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
        });

        res.status(429).json({
          error: 'Too Many Requests',
          message: `Custom rate limit exceeded. Try again in ${Math.round(msBeforeNext / 1000)} seconds.`,
          retryAfter: Math.round(msBeforeNext / 1000),
        });
      }
    };
  }
}

// Export instance
export const rateLimiter = new RateLimiter();