import Queue from 'bull';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Create Redis instances for Bull
const redis = new Redis(redisConfig);

// Export queue for processing export jobs
export const exportQueue = new Queue('document-export', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 50, // Keep last 50 completed jobs
    removeOnFail: 100,    // Keep last 100 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Batch export queue for processing batch jobs
export const batchExportQueue = new Queue('batch-export', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 50,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// Webhook notification queue
export const webhookQueue = new Queue('webhook-notification', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Cleanup queue for removing expired exports
export const cleanupQueue = new Queue('export-cleanup', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    delay: 60000, // 1 minute delay
  },
});

// Queue event handlers
const setupQueueEvents = (queue: Queue, queueName: string) => {
  queue.on('completed', (job) => {
    logger.info(`${queueName} job completed`, { 
      jobId: job.id, 
      duration: Date.now() - job.processedOn 
    });
  });

  queue.on('failed', (job, err) => {
    logger.error(`${queueName} job failed`, {
      jobId: job.id,
      error: err.message,
      attempts: job.attemptsMade,
      data: job.data
    });
  });

  queue.on('stalled', (job) => {
    logger.warn(`${queueName} job stalled`, { jobId: job.id });
  });

  queue.on('error', (error) => {
    logger.error(`${queueName} queue error`, { error: error.message });
  });
};

// Initialize queue event handlers
export const initializeQueues = async () => {
  try {
    // Test Redis connection
    await redis.ping();
    logger.info('Redis connection established');

    // Setup event handlers
    setupQueueEvents(exportQueue, 'Export');
    setupQueueEvents(batchExportQueue, 'Batch Export');
    setupQueueEvents(webhookQueue, 'Webhook');
    setupQueueEvents(cleanupQueue, 'Cleanup');

    // Add recurring cleanup job
    await cleanupQueue.add(
      'cleanup-expired-exports',
      {},
      {
        repeat: { cron: '0 */6 * * *' }, // Every 6 hours
        removeOnComplete: 1,
        removeOnFail: 1,
      }
    );

    logger.info('Export queues initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize export queues', { error });
    throw error;
  }
};

// Graceful shutdown
export const closeQueues = async () => {
  try {
    await Promise.all([
      exportQueue.close(),
      batchExportQueue.close(),
      webhookQueue.close(),
      cleanupQueue.close(),
    ]);
    await redis.disconnect();
    logger.info('Export queues closed successfully');
  } catch (error) {
    logger.error('Error closing export queues', { error });
  }
};