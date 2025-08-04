import { Router } from 'express';
import { streamingService } from '../services/StreamingService';
import { logger } from '../utils/logger';

const router = Router();

// Get streaming session info
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = streamingService.getSessionInfo(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      sessionId: session.sessionId,
      userId: session.userId,
      conversationId: session.conversationId,
      personaId: session.personaId,
      provider: session.provider,
      startTime: session.startTime,
      duration: Date.now() - session.startTime.getTime()
    });
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session info' });
  }
});

// Get active sessions count
router.get('/sessions/count', (req, res) => {
  const count = streamingService.getActiveSessionsCount();
  res.json({ activeSessionsCount: count });
});

// WebSocket connection info
router.get('/info', (req, res) => {
  const protocol = req.secure ? 'wss' : 'ws';
  const host = req.get('host');
  
  res.json({
    websocketUrl: `${protocol}://${host}`,
    protocol: 'storyline-ai-v1',
    messageTypes: [
      {
        type: 'start',
        description: 'Initialize streaming session',
        fields: ['userId', 'conversationId?', 'personaId?', 'provider?', 'context?']
      },
      {
        type: 'message',
        description: 'Send user message',
        fields: ['content']
      },
      {
        type: 'stop',
        description: 'End streaming session'
      }
    ],
    responseTypes: [
      {
        type: 'session_started',
        description: 'Session initialized'
      },
      {
        type: 'chunk',
        description: 'Response chunk',
        fields: ['content', 'isComplete', 'model?', 'provider?']
      },
      {
        type: 'session_ended',
        description: 'Session terminated'
      },
      {
        type: 'error',
        description: 'Error occurred',
        fields: ['error']
      }
    ]
  });
});

export default router;