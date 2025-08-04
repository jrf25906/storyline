import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const router = Router();

// Google OAuth
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user as any;
      
      // Generate tokens
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      // Redirect to frontend with tokens
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }
);

// Apple OAuth (placeholder)
router.post('/apple', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Apple OAuth not implemented yet',
      timestamp: new Date()
    }
  });
});

export default router;