import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/AuthService';
import { LoginRequest, SignupRequest, ApiResponse } from '@storyline/shared-types';
import { logger } from '../utils/logger';

const router = Router();
const authService = new AuthService();

// Validation middleware
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
];

const validateSignup = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('acceptTerms').isBoolean().equals('true')
];

// Helper to extract device info
const getDeviceInfo = (req: Request) => ({
  userAgent: req.headers['user-agent'] || '',
  ip: req.ip,
  platform: req.headers['x-platform'] as string || 'web',
  browser: req.headers['x-browser'] as string,
  os: req.headers['x-os'] as string
});

// Signup
router.post('/signup', validateSignup, async (req: Request<{}, {}, SignupRequest>, res: Response<ApiResponse>) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
          timestamp: new Date()
        }
      });
    }

    const { user, tokens } = await authService.signup(req.body);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified
        },
        tokens
      }
    });
  } catch (error: any) {
    logger.error('Signup error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'SIGNUP_ERROR',
        message: error.message,
        timestamp: new Date()
      }
    });
  }
});

// Login
router.post('/login', validateLogin, async (req: Request<{}, {}, LoginRequest>, res: Response<ApiResponse>) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
          timestamp: new Date()
        }
      });
    }

    const deviceInfo = getDeviceInfo(req);
    const { user, tokens } = await authService.login(req.body, deviceInfo);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled
        },
        tokens
      }
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: error.message,
        timestamp: new Date()
      }
    });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await authService.logout(token);
    }

    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: error.message,
        timestamp: new Date()
      }
    });
  }
});

// Forgot password
router.post('/forgot-password', 
  body('email').isEmail().normalizeEmail(),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email address',
            timestamp: new Date()
          }
        });
      }

      await authService.forgotPassword(req.body.email);

      res.json({
        success: true,
        data: { message: 'Password reset email sent if account exists' }
      });
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FORGOT_PASSWORD_ERROR',
          message: 'Failed to process request',
          timestamp: new Date()
        }
      });
    }
  }
);

// Reset password
router.post('/reset-password',
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            timestamp: new Date()
          }
        });
      }

      await authService.resetPassword(req.body.token, req.body.newPassword);

      res.json({
        success: true,
        data: { message: 'Password reset successfully' }
      });
    } catch (error: any) {
      logger.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'RESET_PASSWORD_ERROR',
          message: error.message,
          timestamp: new Date()
        }
      });
    }
  }
);

// Verify email
router.post('/verify-email',
  body('token').notEmpty(),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      await authService.verifyEmail(req.body.token);

      res.json({
        success: true,
        data: { message: 'Email verified successfully' }
      });
    } catch (error: any) {
      logger.error('Verify email error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'VERIFY_EMAIL_ERROR',
          message: error.message,
          timestamp: new Date()
        }
      });
    }
  }
);

// Setup 2FA
router.post('/2fa/setup', async (req: Request, res: Response<ApiResponse>) => {
  try {
    // This would normally use the authenticated user from middleware
    const userId = req.body.userId; // Temporary
    const { qrCode, secret } = await authService.setup2FA(userId);

    res.json({
      success: true,
      data: { qrCode, secret }
    });
  } catch (error: any) {
    logger.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: '2FA_SETUP_ERROR',
        message: error.message,
        timestamp: new Date()
      }
    });
  }
});

// Verify 2FA
router.post('/2fa/verify',
  body('token').notEmpty(),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const userId = req.body.userId; // Temporary
      const verified = await authService.verify2FA(userId, req.body.token);

      res.json({
        success: true,
        data: { verified }
      });
    } catch (error: any) {
      logger.error('2FA verify error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: '2FA_VERIFY_ERROR',
          message: error.message,
          timestamp: new Date()
        }
      });
    }
  }
);

export default router;