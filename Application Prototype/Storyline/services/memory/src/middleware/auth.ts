import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface JWTPayload {
  id: string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization token required' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    req.user = decoded;
    
    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }

    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware (for public endpoints that can benefit from user context)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    req.user = decoded;
    
    next();

  } catch (error) {
    // For optional auth, we don't return errors, just proceed without user context
    next();
  }
};