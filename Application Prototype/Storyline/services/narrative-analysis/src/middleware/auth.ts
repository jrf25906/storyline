import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { NarrativeAnalysisError, ErrorTypes } from './errorHandler';

/**
 * Extended Request interface to include user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

/**
 * JWT Authentication middleware
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new NarrativeAnalysisError(
        'Authorization header is required',
        401,
        ErrorTypes.AUTHENTICATION_ERROR
      );
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      throw new NarrativeAnalysisError(
        'JWT token is required',
        401,
        ErrorTypes.AUTHENTICATION_ERROR
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable not set');
      throw new NarrativeAnalysisError(
        'Authentication configuration error',
        500,
        ErrorTypes.INTERNAL_ERROR
      );
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (!decoded.userId) {
      throw new NarrativeAnalysisError(
        'Invalid token: missing user ID',
        401,
        ErrorTypes.AUTHENTICATION_ERROR
      );
    }

    // Attach user information to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
    };

    logger.info('User authenticated', {
      userId: req.user.id,
      role: req.user.role,
      path: req.path,
      method: req.method,
    });

    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT verification failed', {
        error: error.message,
        path: req.path,
        ip: req.ip,
      });

      throw new NarrativeAnalysisError(
        'Invalid or expired token',
        401,
        ErrorTypes.AUTHENTICATION_ERROR
      );
    }

    throw error;
  }
};

/**
 * Optional authentication middleware (for endpoints that work with or without auth)
 */
export const optionalAuthenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No auth provided, continue without user context
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      // Invalid auth format, continue without user context
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // Configuration issue, continue without user context
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      if (decoded.userId) {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role || 'user',
          permissions: decoded.permissions || [],
        };
      }
    } catch (jwtError) {
      // Invalid token, continue without user context
      logger.debug('Optional auth failed, continuing without user context', {
        error: jwtError instanceof Error ? jwtError.message : 'Unknown error',
      });
    }

    next();

  } catch (error) {
    // Don't throw errors in optional auth, just continue
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new NarrativeAnalysisError(
        'Authentication required for this resource',
        401,
        ErrorTypes.AUTHENTICATION_ERROR
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles,
        path: req.path,
        method: req.method,
      });

      throw new NarrativeAnalysisError(
        'Insufficient permissions to access this resource',
        403,
        ErrorTypes.AUTHORIZATION_ERROR
      );
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new NarrativeAnalysisError(
        'Authentication required for this resource',
        401,
        ErrorTypes.AUTHENTICATION_ERROR
      );
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      logger.warn('Permission denied', {
        userId: req.user.id,
        userPermissions: req.user.permissions,
        requiredPermission,
        path: req.path,
        method: req.method,
      });

      throw new NarrativeAnalysisError(
        `Permission '${requiredPermission}' required`,
        403,
        ErrorTypes.AUTHORIZATION_ERROR
      );
    }

    next();
  };
};

/**
 * Project ownership validation middleware
 */
export const validateProjectOwnership = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new NarrativeAnalysisError(
      'Authentication required',
      401,
      ErrorTypes.AUTHENTICATION_ERROR
    );
  }

  const { projectId } = req.body || req.params;
  const { userId } = req.body;

  if (!projectId) {
    throw new NarrativeAnalysisError(
      'Project ID is required',
      400,
      ErrorTypes.VALIDATION_ERROR
    );
  }

  // For admin users, allow access to any project
  if (req.user.role === 'admin' || req.user.permissions.includes('access_all_projects')) {
    next();
    return;
  }

  // Ensure the authenticated user matches the user ID in the request
  if (userId && userId !== req.user.id) {
    logger.warn('User ID mismatch in project access', {
      authenticatedUserId: req.user.id,
      requestedUserId: userId,
      projectId,
      path: req.path,
    });

    throw new NarrativeAnalysisError(
      'Cannot access another user\'s project',
      403,
      ErrorTypes.AUTHORIZATION_ERROR
    );
  }

  // TODO: Add actual project ownership validation against database
  // For now, we'll trust the JWT-authenticated user ID
  next();
};

/**
 * API key authentication middleware (for service-to-service communication)
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    throw new NarrativeAnalysisError(
      'API key is required',
      401,
      ErrorTypes.AUTHENTICATION_ERROR
    );
  }

  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key used', {
      providedKey: apiKey.substring(0, 8) + '...',
      path: req.path,
      ip: req.ip,
    });

    throw new NarrativeAnalysisError(
      'Invalid API key',
      401,
      ErrorTypes.AUTHENTICATION_ERROR
    );
  }

  logger.info('API key authenticated', {
    keyPrefix: apiKey.substring(0, 8) + '...',
    path: req.path,
    method: req.method,
  });

  next();
};

/**
 * Development-only bypass middleware
 */
export const developmentBypass = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    logger.warn('Authentication bypassed in development mode');
    
    req.user = {
      id: 'dev-user',
      email: 'dev@storyline.app',
      role: 'admin',
      permissions: ['access_all_projects', 'admin_access'],
    };
  }

  next();
};

/**
 * Extract user context from request (handles both JWT and API key auth)
 */
export const extractUserContext = (req: AuthenticatedRequest): {
  userId: string;
  userRole: string;
  isAuthenticated: boolean;
} => {
  if (req.user) {
    return {
      userId: req.user.id,
      userRole: req.user.role,
      isAuthenticated: true,
    };
  }

  // Fallback to request body for API key authentication
  const { userId } = req.body;
  return {
    userId: userId || 'anonymous',
    userRole: 'user',
    isAuthenticated: false,
  };
};