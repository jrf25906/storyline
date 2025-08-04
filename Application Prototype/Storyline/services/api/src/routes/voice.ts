import { Router } from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import { asyncHandler } from '../middleware/errorHandler';
import { voiceUploadRateLimiter } from '../middleware/rateLimiter';
import * as voiceController from '../controllers/voiceController';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Upload voice recording
router.post('/upload',
  voiceUploadRateLimiter,
  upload.single('audio'),
  body('documentId').optional().isMongoId(),
  body('duration').isFloat({ min: 0 }),
  asyncHandler(voiceController.uploadRecording)
);

// Start real-time voice session
router.post('/session/start',
  body('documentId').optional().isMongoId(),
  body('provider').optional().isIn(['openai-realtime', 'assemblyai-streaming', 'deepgram-streaming']),
  asyncHandler(voiceController.startVoiceSession)
);

// End voice session
router.post('/session/:sessionId/end',
  param('sessionId').isUUID(),
  asyncHandler(voiceController.endVoiceSession)
);

// Get voice sessions
router.get('/sessions',
  asyncHandler(voiceController.getVoiceSessions)
);

// Get specific recording
router.get('/recordings/:id',
  param('id').isMongoId(),
  asyncHandler(voiceController.getRecording)
);

// Get transcript
router.get('/recordings/:id/transcript',
  param('id').isMongoId(),
  asyncHandler(voiceController.getTranscript)
);

// Request re-transcription
router.post('/recordings/:id/retranscribe',
  param('id').isMongoId(),
  body('provider').optional().isIn(['assemblyai', 'deepgram', 'whisper']),
  asyncHandler(voiceController.retranscribeRecording)
);

// Delete recording
router.delete('/recordings/:id',
  param('id').isMongoId(),
  asyncHandler(voiceController.deleteRecording)
);

// Voice analytics
router.get('/analytics',
  asyncHandler(voiceController.getVoiceAnalytics)
);

// Text-to-speech
router.post('/tts',
  body('text').trim().isLength({ min: 1, max: 5000 }),
  body('voice').optional().isIn(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']),
  body('speed').optional().isFloat({ min: 0.25, max: 4.0 }),
  asyncHandler(voiceController.textToSpeech)
);

export default router;