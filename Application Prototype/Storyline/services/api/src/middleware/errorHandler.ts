import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ApiError } from '@storyline/shared-types';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  let error = err as AppError;

  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: (req as any).user?.id
  });

  // Default error
  let statusCode = 500;
  let errorResponse: ApiError = {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date(),
    path: req.path
  };

  // Handle known errors
  if (error.isOperational) {
    statusCode = error.statusCode;
    errorResponse = {
      code: error.code,
      message: error.message,
      timestamp: new Date(),
      path: req.path
    };
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: error.message,
      timestamp: new Date(),
      path: req.path
    };
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    errorResponse = {
      code: 'INVALID_ID',
      message: 'Invalid ID format',
      timestamp: new Date(),
      path: req.path
    };
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: errorResponse,
    metadata: {
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0',
      requestId: (req as any).id
    }
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};