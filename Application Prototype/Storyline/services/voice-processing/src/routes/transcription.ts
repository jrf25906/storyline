import { Router } from 'express';
import { TranscriptionService } from '../services/TranscriptionService';
import { S3Service } from '../services/S3Service';
import { transcriptionQueue } from '../config/queues';
import { logger } from '../utils/logger';

const router = Router();
const transcriptionService = new TranscriptionService();
const s3Service = S3Service.getInstance();

// Start transcription job
router.post('/start', async (req, res) => {
  try {
    const { recordingId, audioUrl, provider, options } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!recordingId || !audioUrl) {
      return res.status(400).json({ error: 'Recording ID and audio URL required' });
    }

    // Add job to queue
    const job = await transcriptionQueue.add('transcribe', {
      recordingId,
      audioUrl,
      userId,
      provider,
      options: options || {}
    });

    logger.info(`Transcription job created: ${job.id}`);

    res.json({
      jobId: job.id,
      status: 'queued',
      recordingId
    });
  } catch (error) {
    logger.error('Transcription start error:', error);
    res.status(500).json({ error: 'Failed to start transcription' });
  }
});

// Get transcription status
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await transcriptionQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress();

    res.json({
      jobId,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason
    });
  } catch (error) {
    logger.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check transcription status' });
  }
});

// Get transcription result
router.get('/result/:recordingId', async (req, res) => {
  try {
    const { recordingId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // In production, this would fetch from database
    // For now, we'll return a mock response
    res.json({
      recordingId,
      status: 'completed',
      transcript: {
        text: 'Transcription would be here',
        words: [],
        language: 'en',
        confidence: 0.95,
        provider: 'assemblyai'
      }
    });
  } catch (error) {
    logger.error('Result fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transcription result' });
  }
});

// Direct transcription (synchronous)
router.post('/direct', async (req, res) => {
  try {
    const { audioUrl, provider, options } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!audioUrl) {
      return res.status(400).json({ error: 'Audio URL required' });
    }

    // For small files, we can transcribe directly
    const transcript = await transcriptionService.transcribeFile(
      audioUrl,
      'direct-' + Date.now(),
      {
        provider,
        ...options
      }
    );

    res.json({
      success: true,
      transcript
    });
  } catch (error) {
    logger.error('Direct transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Cancel transcription job
router.delete('/cancel/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await transcriptionQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.remove();
    logger.info(`Transcription job cancelled: ${jobId}`);

    res.json({
      jobId,
      status: 'cancelled'
    });
  } catch (error) {
    logger.error('Cancel job error:', error);
    res.status(500).json({ error: 'Failed to cancel transcription' });
  }
});

export default router;