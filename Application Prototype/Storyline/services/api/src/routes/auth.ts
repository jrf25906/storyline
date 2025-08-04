import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import * as authController from '../controllers/authController';

const router = Router();

// Validation middleware
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).trim()
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

// Routes
router.post('/login', 
  authRateLimiter,
  validateLogin,
  asyncHandler(authController.login)
);

router.post('/signup',
  authRateLimiter,
  validateSignup,
  asyncHandler(authController.signup)
);

router.post('/refresh',
  asyncHandler(authController.refreshToken)
);

router.post('/logout',
  asyncHandler(authController.logout)
);

router.post('/forgot-password',
  authRateLimiter,
  body('email').isEmail().normalizeEmail(),
  asyncHandler(authController.forgotPassword)
);

router.post('/reset-password',
  authRateLimiter,
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  asyncHandler(authController.resetPassword)
);

router.post('/verify-email',
  body('token').notEmpty(),
  asyncHandler(authController.verifyEmail)
);

// OAuth routes
router.get('/google', asyncHandler(authController.googleAuth));
router.get('/google/callback', asyncHandler(authController.googleCallback));

router.get('/apple', asyncHandler(authController.appleAuth));
router.post('/apple/callback', asyncHandler(authController.appleCallback));

export default router;