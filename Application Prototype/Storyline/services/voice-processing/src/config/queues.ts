import Bull from 'bull';
import { TranscriptionService } from '../services/TranscriptionService';
import { S3Service } from '../services/S3Service';
import { logger } from '../utils/logger';

// Create queue for transcription jobs
export const transcriptionQueue = new Bull('transcription', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Process transcription jobs
transcriptionQueue.process(async (job) => {
  const { recordingId, audioUrl, userId, provider, options } = job.data;
  
  logger.info(`Processing transcription job: ${job.id}`);
  
  try {
    // Update progress
    await job.progress(10);
    
    // Initialize services
    const transcriptionService = new TranscriptionService();
    const s3Service = S3Service.getInstance();
    
    // Download audio if it's an S3 URL
    let processedAudioUrl = audioUrl;
    if (audioUrl.startsWith('s3://')) {
      const key = audioUrl.replace(`s3://${process.env.S3_BUCKET_NAME}/`, '');
      processedAudioUrl = await s3Service.getSignedUrl(key);
    }
    
    await job.progress(30);
    
    // Perform transcription
    const transcript = await transcriptionService.transcribeFile(
      processedAudioUrl,
      recordingId,
      {
        provider,
        ...options
      }
    );
    
    await job.progress(90);
    
    // In production, save transcript to database
    logger.info(`Transcription completed for recording: ${recordingId}`);
    
    await job.progress(100);
    
    return {
      success: true,
      recordingId,
      transcript
    };
  } catch (error) {
    logger.error(`Transcription job failed: ${job.id}`, error);
    throw error;
  }
});

// Handle queue events
transcriptionQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed:`, result);
});

transcriptionQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
});

transcriptionQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

// Create queue for audio processing jobs
export const audioProcessingQueue = new Bull('audio-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

// Process audio conversion jobs
audioProcessingQueue.process(async (job) => {
  const { inputPath, outputPath, format } = job.data;
  
  logger.info(`Processing audio conversion job: ${job.id}`);
  
  // Audio processing logic would go here
  // For now, we'll just simulate the process
  await job.progress(50);
  
  return {
    success: true,
    inputPath,
    outputPath,
    format
  };
});

// Initialize queues
export async function initializeQueues() {
  try {
    // Clean up old jobs on startup
    await transcriptionQueue.clean(24 * 3600 * 1000); // 24 hours
    await audioProcessingQueue.clean(24 * 3600 * 1000);
    
    logger.info('Job queues initialized');
  } catch (error) {
    logger.error('Failed to initialize queues:', error);
    throw error;
  }
}

// Graceful shutdown
export async function shutdownQueues() {
  await transcriptionQueue.close();
  await audioProcessingQueue.close();
  logger.info('Job queues shut down');
}