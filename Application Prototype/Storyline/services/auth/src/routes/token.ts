import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/AuthService';
import { ApiResponse } from '@storyline/shared-types';
import { logger } from '../utils/logger';

const router = Router();
const authService = new AuthService();

// Refresh token
router.post('/refresh',
  body('refreshToken').notEmpty(),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
            timestamp: new Date()
          }
        });
      }

      const tokens = await authService.refreshTokens(req.body.refreshToken);

      res.json({
        success: true,
        data: tokens
      });
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_ERROR',
          message: error.message,
          timestamp: new Date()
        }
      });
    }
  }
);

export default router;