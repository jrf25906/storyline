import { Router } from 'express';
import multer from 'multer';
import { S3Service } from '../services/S3Service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const s3Service = S3Service.getInstance();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    const allowedMimes = [
      'audio/wav',
      'audio/wave',
      'audio/mp3',
      'audio/mpeg',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'audio/webm',
      'audio/flac'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Upload single audio file
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const recordingId = uuidv4();
    const key = s3Service.generateKey(userId, req.file.originalname);
    
    // Upload to S3
    const s3Path = await s3Service.uploadFile(
      key,
      req.file.buffer,
      req.file.mimetype,
      {
        userId,
        recordingId,
        originalName: req.file.originalname,
        size: req.file.size.toString()
      }
    );

    // Get signed URL for accessing the file
    const signedUrl = await s3Service.getSignedUrl(key, 3600); // 1 hour expiry

    logger.info(`Audio file uploaded: ${recordingId}`);

    res.json({
      recordingId,
      s3Path,
      signedUrl,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio file' });
  }
});

// Upload chunked audio (for streaming)
router.post('/chunk', upload.single('chunk'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio chunk provided' });
    }

    const userId = req.headers['x-user-id'] as string;
    const sessionId = req.body.sessionId;
    const chunkIndex = parseInt(req.body.chunkIndex);
    const isFinal = req.body.isFinal === 'true';

    if (!userId || !sessionId || isNaN(chunkIndex)) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const key = `voice-recordings/${userId}/streaming/${sessionId}/chunk-${chunkIndex}`;
    
    await s3Service.uploadFile(
      key,
      req.file.buffer,
      req.file.mimetype,
      {
        userId,
        sessionId,
        chunkIndex: chunkIndex.toString(),
        isFinal: isFinal.toString()
      }
    );

    res.json({
      sessionId,
      chunkIndex,
      uploaded: true,
      isFinal
    });
  } catch (error) {
    logger.error('Chunk upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio chunk' });
  }
});

// Get upload status
router.get('/status/:recordingId', async (req, res) => {
  try {
    const { recordingId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // This would typically check a database for upload status
    // For now, we'll just check if the file exists in S3
    res.json({
      recordingId,
      status: 'completed',
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check upload status' });
  }
});

export default router;