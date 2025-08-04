import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { aiRateLimiter } from '../middleware/rateLimiter';
import * as aiController from '../controllers/aiController';

const router = Router();

// Start new conversation
router.post('/conversations',
  body('documentId').optional().isMongoId(),
  body('initialMessage').optional().trim(),
  body('context').optional().isObject(),
  asyncHandler(aiController.createConversation)
);

// Get conversations
router.get('/conversations',
  query('documentId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  asyncHandler(aiController.getConversations)
);

// Get single conversation
router.get('/conversations/:id',
  param('id').isMongoId(),
  asyncHandler(aiController.getConversation)
);

// Send message to conversation
router.post('/conversations/:id/messages',
  aiRateLimiter,
  param('id').isMongoId(),
  body('content').trim().isLength({ min: 1, max: 10000 }),
  body('voiceRecordingId').optional().isMongoId(),
  asyncHandler(aiController.sendMessage)
);

// Get conversation summary
router.get('/conversations/:id/summary',
  param('id').isMongoId(),
  asyncHandler(aiController.getConversationSummary)
);

// Delete conversation
router.delete('/conversations/:id',
  param('id').isMongoId(),
  asyncHandler(aiController.deleteConversation)
);

// Writing assistance endpoints
router.post('/assist/continue',
  body('documentId').isMongoId(),
  body('context').optional().trim().isLength({ max: 5000 }),
  asyncHandler(aiController.continueWriting)
);

router.post('/assist/improve',
  body('text').trim().isLength({ min: 1, max: 5000 }),
  body('style').optional().isIn(['concise', 'descriptive', 'formal', 'casual']),
  asyncHandler(aiController.improveText)
);

router.post('/assist/summarize',
  body('text').trim().isLength({ min: 100, max: 50000 }),
  body('length').optional().isIn(['brief', 'moderate', 'detailed']),
  asyncHandler(aiController.summarizeText)
);

// Narrative analysis
router.post('/analyze/structure',
  body('documentId').isMongoId(),
  asyncHandler(aiController.analyzeNarrativeStructure)
);

router.post('/analyze/characters',
  body('documentId').isMongoId(),
  asyncHandler(aiController.analyzeCharacters)
);

router.post('/analyze/themes',
  body('documentId').isMongoId(),
  asyncHandler(aiController.analyzeThemes)
);

// Emotional safety check
router.post('/safety/check',
  body('content').trim().isLength({ min: 1 }),
  asyncHandler(aiController.checkEmotionalSafety)
);

// Memory search
router.get('/memory/search',
  query('query').trim().isLength({ min: 1, max: 500 }),
  query('documentId').optional().isMongoId(),
  query('type').optional().isIn(['event', 'emotion', 'character', 'theme', 'setting']),
  asyncHandler(aiController.searchMemories)
);

// Get writing suggestions
router.get('/suggestions',
  query('documentId').isMongoId(),
  query('type').optional().isIn(['plot', 'character', 'dialogue', 'description']),
  asyncHandler(aiController.getWritingSuggestions)
);

export default router;