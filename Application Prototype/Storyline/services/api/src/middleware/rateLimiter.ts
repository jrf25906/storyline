import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiResponse } from '@storyline/shared-types';

// General rate limiter
export const rateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response<ApiResponse>) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        timestamp: new Date()
      }
    });
  }
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response<ApiResponse>) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again later.',
        timestamp: new Date()
      }
    });
  }
});

// Voice upload rate limiter
export const voiceUploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  handler: (req: Request, res: Response<ApiResponse>) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'VOICE_UPLOAD_RATE_LIMIT',
        message: 'Too many voice uploads. Please wait a moment.',
        timestamp: new Date()
      }
    });
  }
});

// AI conversation rate limiter
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  handler: (req: Request, res: Response<ApiResponse>) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'AI request limit reached. Please slow down.',
        timestamp: new Date()
      }
    });
  }
});