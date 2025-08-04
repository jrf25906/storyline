import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Error types for structured error handling
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ServiceUnavailableError extends Error {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error('Request error:', error, {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (error instanceof ValidationError) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof UnauthorizedError) {
    res.status(401).json({
      error: 'Unauthorized',
      message: error.message,
    });
    return;
  }

  if (error instanceof ForbiddenError) {
    res.status(403).json({
      error: 'Forbidden',
      message: error.message,
    });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({
      error: 'Not Found',
      message: error.message,
    });
    return;
  }

  if (error instanceof ConflictError) {
    res.status(409).json({
      error: 'Conflict',
      message: error.message,
    });
    return;
  }

  if (error instanceof ServiceUnavailableError) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: error.message,
    });
    return;
  }

  // Handle database connection errors
  if (error.message.includes('connection') || error.message.includes('timeout')) {
    res.status(503).json({
      error: 'Service Temporarily Unavailable',
      message: 'Database connection issue. Please try again later.',
    });
    return;
  }

  // Handle external service errors
  if (error.message.includes('OpenAI') || error.message.includes('API')) {
    res.status(502).json({
      error: 'External Service Error',
      message: 'External service is temporarily unavailable. Please try again later.',
    });
    return;
  }

  // Default to 500 Internal Server Error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};