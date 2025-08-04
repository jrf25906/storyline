import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom error class for narrative analysis errors
 */
export class NarrativeAnalysisError extends Error {
  public statusCode: number;
  public type: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, type: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'NarrativeAnalysisError';
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types for narrative analysis
 */
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONTENT_TOO_SHORT: 'CONTENT_TOO_SHORT',
  CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  ANALYSIS_TIMEOUT: 'ANALYSIS_TIMEOUT',
  TRAUMA_INTERVENTION: 'TRAUMA_INTERVENTION',
  CULTURAL_SENSITIVITY: 'CULTURAL_SENSITIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Main error handler middleware
 */
export const errorHandler = (
  error: Error | NarrativeAnalysisError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle known narrative analysis errors
  if (error instanceof NarrativeAnalysisError) {
    logger.error('Narrative analysis error', {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
      userId: req.body?.userId,
      projectId: req.body?.projectId,
      details: error.details,
    });

    res.status(error.statusCode).json({
      success: false,
      error: {
        type: error.type,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  // Handle validation errors (from Joi or similar)
  if (error.name === 'ValidationError') {
    logger.warn('Validation error', {
      message: error.message,
      path: req.path,
      method: req.method,
      body: req.body,
    });

    res.status(400).json({
      success: false,
      error: {
        type: ErrorTypes.VALIDATION_ERROR,
        message: 'Request validation failed',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  // Handle timeout errors
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    logger.error('Analysis timeout', {
      message: error.message,
      path: req.path,
      method: req.method,
      userId: req.body?.userId,
      projectId: req.body?.projectId,
    });

    res.status(408).json({
      success: false,
      error: {
        type: ErrorTypes.ANALYSIS_TIMEOUT,
        message: 'Analysis took too long to complete. Please try with shorter content or try again later.',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  // Handle rate limiting errors
  if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
    logger.warn('Rate limit exceeded', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.body?.userId,
    });

    res.status(429).json({
      success: false,
      error: {
        type: ErrorTypes.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests. Please wait before trying again.',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  // Handle authentication/authorization errors
  if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
    logger.warn('Authentication error', {
      message: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: {
        type: ErrorTypes.AUTHENTICATION_ERROR,
        message: 'Authentication required',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  if (error.message.includes('forbidden') || error.message.includes('authorization')) {
    res.status(403).json({
      success: false,
      error: {
        type: ErrorTypes.AUTHORIZATION_ERROR,
        message: 'Access denied',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  // Handle generic errors
  logger.error('Unhandled error', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.body?.userId,
    projectId: req.body?.projectId,
  });

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: {
      type: ErrorTypes.INTERNAL_ERROR,
      message: 'An internal error occurred while processing your request',
      ...(isDevelopment && { details: error.message, stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.info('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      type: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Content validation middleware
 */
export const validateContent = (req: Request, res: Response, next: NextFunction): void => {
  const { content } = req.body;

  if (!content) {
    throw new NarrativeAnalysisError(
      'Content is required for analysis',
      400,
      ErrorTypes.VALIDATION_ERROR
    );
  }

  if (typeof content !== 'string') {
    throw new NarrativeAnalysisError(
      'Content must be a string',
      400,
      ErrorTypes.VALIDATION_ERROR
    );
  }

  const trimmedContent = content.trim();
  
  if (trimmedContent.length === 0) {
    throw new NarrativeAnalysisError(
      'Content cannot be empty',
      400,
      ErrorTypes.VALIDATION_ERROR
    );
  }

  if (trimmedContent.length < 100) {
    throw new NarrativeAnalysisError(
      'Content too short for meaningful analysis (minimum 100 characters)',
      400,
      ErrorTypes.CONTENT_TOO_SHORT,
      { actualLength: trimmedContent.length, minimumLength: 100 }
    );
  }

  const maxLength = parseInt(process.env.MAX_CONTENT_LENGTH || '500000');
  if (trimmedContent.length > maxLength) {
    throw new NarrativeAnalysisError(
      'Content exceeds maximum length limit',
      413,
      ErrorTypes.CONTENT_TOO_LONG,
      { actualLength: trimmedContent.length, maximumLength: maxLength }
    );
  }

  // Store trimmed content back to request
  req.body.content = trimmedContent;
  next();
};

/**
 * User authentication middleware
 */
export const validateUser = (req: Request, res: Response, next: NextFunction): void => {
  const { userId, projectId } = req.body;

  if (!userId) {
    throw new NarrativeAnalysisError(
      'User ID is required',
      400,
      ErrorTypes.VALIDATION_ERROR
    );
  }

  if (!projectId) {
    throw new NarrativeAnalysisError(
      'Project ID is required',
      400,
      ErrorTypes.VALIDATION_ERROR
    );
  }

  if (typeof userId !== 'string' || typeof projectId !== 'string') {
    throw new NarrativeAnalysisError(
      'User ID and Project ID must be strings',
      400,
      ErrorTypes.VALIDATION_ERROR
    );
  }

  next();
};

/**
 * Trauma-informed response middleware
 * Ensures appropriate handling of sensitive content
 */
export const traumaInformedHandler = (req: Request, res: Response, next: NextFunction): void => {
  // Add trauma-informed headers
  res.setHeader('X-Content-Safety', 'trauma-informed');
  res.setHeader('X-Support-Available', 'true');
  
  // Override the json method to add trauma-informed context
  const originalJson = res.json;
  res.json = function(body: any) {
    // If this is an analysis response with trauma notes
    if (body.analysis?.traumaInformedNotes?.length > 0) {
      body.supportMessage = 'Your wellbeing is important. Professional support is available if needed.';
      body.resources = {
        crisis: 'National Suicide Prevention Lifeline: 988',
        support: 'Crisis Text Line: Text HOME to 741741',
      };
    }
    
    return originalJson.call(this, body);
  };

  next();
};

/**
 * Request timeout middleware
 */
export const timeoutHandler = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        next(new NarrativeAnalysisError(
          'Request timeout',
          408,
          ErrorTypes.ANALYSIS_TIMEOUT
        ));
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Health check error handler
 */
export const healthCheckHandler = (req: Request, res: Response, next: NextFunction): void => {
  // Simple health check logic
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'narrative-analysis',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
    });
  } catch (error) {
    next(error);
  }
};