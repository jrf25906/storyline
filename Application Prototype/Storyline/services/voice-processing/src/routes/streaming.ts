import { Router } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Initialize streaming session
router.post('/session/start', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { provider, language, options } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const sessionId = uuidv4();
    
    // In production, we'd store session details in Redis
    // For now, we'll return the session info
    res.json({
      sessionId,
      websocketUrl: `ws://localhost:${process.env.PORT || 3003}`,
      provider: provider || 'deepgram',
      language: language || 'en',
      options: options || {},
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Session start error:', error);
    res.status(500).json({ error: 'Failed to start streaming session' });
  }
});

// End streaming session
router.post('/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // In production, we'd clean up session data from Redis
    logger.info(`Streaming session ended: ${sessionId}`);

    res.json({
      sessionId,
      status: 'ended',
      endedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Session end error:', error);
    res.status(500).json({ error: 'Failed to end streaming session' });
  }
});

// Get session status
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // In production, this would fetch from Redis
    res.json({
      sessionId,
      status: 'active',
      startedAt: new Date().toISOString(),
      duration: 0,
      bytesProcessed: 0
    });
  } catch (error) {
    logger.error('Session status error:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

export default router;