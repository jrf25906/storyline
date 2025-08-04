import { Router } from 'express';
import { ConversationManager } from '../services/ConversationManager';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const conversationManager = ConversationManager.getInstance();

// Validation schemas
const createConversationSchema = z.object({
  personaId: z.string(),
  metadata: z.record(z.any()).optional()
});

const addTurnSchema = z.object({
  message: z.string().min(1),
  provider: z.string().optional()
});

// Create new conversation
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const { personaId, metadata } = createConversationSchema.parse(req.body);
    
    const conversation = await conversationManager.createConversation(
      userId,
      personaId,
      metadata
    );
    
    res.json(conversation);
  } catch (error) {
    logger.error('Create conversation error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get conversation by ID
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const conversation = await conversationManager.getConversation(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Verify user owns this conversation
    if (conversation.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(conversation);
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Get user's conversations
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const conversations = await conversationManager.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Add turn to conversation
router.post('/:conversationId/turn', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const { message, provider } = addTurnSchema.parse(req.body);
    
    // Verify conversation ownership
    const conversation = await conversationManager.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const turn = await conversationManager.addTurn(
      conversationId,
      message,
      provider
    );
    
    res.json(turn);
  } catch (error) {
    logger.error('Add turn error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to add turn' });
  }
});

// Summarize conversation
router.post('/:conversationId/summarize', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    // Verify conversation ownership
    const conversation = await conversationManager.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const summary = await conversationManager.summarizeConversation(conversationId);
    
    res.json({ summary });
  } catch (error) {
    logger.error('Summarize conversation error:', error);
    res.status(500).json({ error: 'Failed to summarize conversation' });
  }
});

// Delete conversation
router.delete('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    // Verify conversation ownership
    const conversation = await conversationManager.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await conversationManager.deleteConversation(conversationId);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;