import { Router } from 'express';
import { body, param } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import * as userController from '../controllers/userController';

const router = Router();

// Get current user profile
router.get('/me',
  asyncHandler(userController.getCurrentUser)
);

// Update user profile
router.put('/me',
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('avatar').optional().isURL(),
  asyncHandler(userController.updateProfile)
);

// Update preferences
router.put('/me/preferences',
  body('theme').optional().isIn(['light', 'dark', 'system']),
  body('fontSize').optional().isIn(['small', 'medium', 'large']),
  body('voicePersona').optional().isObject(),
  body('notifications').optional().isObject(),
  body('privacy').optional().isObject(),
  asyncHandler(userController.updatePreferences)
);

// Change password
router.put('/me/password',
  body('currentPassword').isLength({ min: 8 }),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  asyncHandler(userController.changePassword)
);

// Delete account
router.delete('/me',
  body('password').isLength({ min: 8 }),
  body('confirmation').equals('DELETE'),
  asyncHandler(userController.deleteAccount)
);

// Subscription management
router.get('/me/subscription',
  asyncHandler(userController.getSubscription)
);

router.post('/me/subscription',
  body('plan').isIn(['pro', 'enterprise']),
  body('paymentMethodId').notEmpty(),
  asyncHandler(userController.createSubscription)
);

router.put('/me/subscription',
  body('plan').isIn(['free', 'pro', 'enterprise']),
  asyncHandler(userController.updateSubscription)
);

router.delete('/me/subscription',
  asyncHandler(userController.cancelSubscription)
);

// Usage statistics
router.get('/me/stats',
  asyncHandler(userController.getUserStats)
);

// Export user data (GDPR compliance)
router.post('/me/export',
  asyncHandler(userController.exportUserData)
);

// Biometric auth setup (mobile)
router.post('/me/biometric',
  body('biometricData').notEmpty(),
  body('deviceId').notEmpty(),
  body('platform').isIn(['ios', 'android']),
  asyncHandler(userController.setupBiometric)
);

router.delete('/me/biometric/:deviceId',
  param('deviceId').notEmpty(),
  asyncHandler(userController.removeBiometric)
);

export default router;