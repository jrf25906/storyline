import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '@storyline/shared-types';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
          timestamp: new Date()
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      name: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
          timestamp: new Date()
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        timestamp: new Date()
      }
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        name: string;
      };
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};