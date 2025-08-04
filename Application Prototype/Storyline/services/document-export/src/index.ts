import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';

import { logger } from './utils/logger';
import { initializeQueues, closeQueues } from './config/queues';
import { ExportService } from './services/ExportService';
import { ExportProcessor } from './jobs/ExportProcessor';
import { WebhookProcessor } from './jobs/WebhookProcessor';
import { exportQueue, batchExportQueue, webhookQueue, cleanupQueue } from './config/queues';

// Routes
import exportRoutes from './routes/export';
import { exportLimits } from './config/storage';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize services
const exportService = ExportService.getInstance();
const exportProcessor = new ExportProcessor();
const webhookProcessor = new WebhookProcessor();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthStatus = await exportService.healthCheck();
    
    const response = {
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      service: 'document-export',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: healthStatus.services,
      exporters: healthStatus.exporters,
      queues: {
        export: await exportQueue.getWaiting().then(jobs => jobs.length),
        batchExport: await batchExportQueue.getWaiting().then(jobs => jobs.length),
        webhook: await webhookQueue.getWaiting().then(jobs => jobs.length)
      },
      limits: exportLimits
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'document-export',
      error: 'Health check failed'
    });
  }
});

// Queue monitoring endpoints
app.get('/queues/stats', async (req, res) => {
  try {
    const [exportStats, batchStats, webhookStats] = await Promise.all([
      Promise.all([
        exportQueue.getWaiting(),
        exportQueue.getActive(),
        exportQueue.getCompleted(),
        exportQueue.getFailed()
      ]),
      Promise.all([
        batchExportQueue.getWaiting(),
        batchExportQueue.getActive(),
        batchExportQueue.getCompleted(),
        batchExportQueue.getFailed()
      ]),
      Promise.all([
        webhookQueue.getWaiting(),
        webhookQueue.getActive(),
        webhookQueue.getCompleted(),
        webhookQueue.getFailed()
      ])
    ]);

    res.json({
      queues: {
        export: {
          waiting: exportStats[0].length,
          active: exportStats[1].length,
          completed: exportStats[2].length,
          failed: exportStats[3].length
        },
        batchExport: {
          waiting: batchStats[0].length,
          active: batchStats[1].length,
          completed: batchStats[2].length,
          failed: batchStats[3].length
        },
        webhook: {
          waiting: webhookStats[0].length,
          active: webhookStats[1].length,
          completed: webhookStats[2].length,
          failed: webhookStats[3].length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Queue stats request failed', { error });
    res.status(500).json({
      error: 'Failed to get queue statistics'
    });
  }
});

// Rate limiting middleware for export endpoints
const rateLimit = require('express-rate-limit');
const exportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 export requests per windowMs
  message: {
    error: 'Too many export requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to export routes
app.use('/export', exportRateLimit);

// Routes
app.use('/export', exportRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method
  });

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Job processors
const setupJobProcessors = () => {
  // Export job processor
  exportQueue.process('export-document', exportLimits.maxConcurrentExports, async (job) => {
    return await exportProcessor.process(job);
  });

  // Batch export job processor
  batchExportQueue.process('export-batch', Math.floor(exportLimits.maxConcurrentExports / 2), async (job) => {
    return await exportProcessor.process(job);
  });

  // Webhook processor
  webhookQueue.process('send-webhook', 5, async (job) => {
    return await webhookProcessor.process(job);
  });

  // Cleanup processor
  cleanupQueue.process('cleanup-expired-exports', 1, async (job) => {
    const result = await exportService.cleanup();
    logger.info('Cleanup completed', result);
    return result;
  });

  // Event handlers
  exportQueue.on('completed', (job, result) => {
    exportProcessor.onCompleted(job, result);
  });

  exportQueue.on('failed', (job, err) => {
    exportProcessor.onFailed(job, err);
  });

  exportQueue.on('stalled', (job) => {
    exportProcessor.onStalled(job);
  });

  batchExportQueue.on('completed', (job, result) => {
    exportProcessor.onCompleted(job, result);
  });

  batchExportQueue.on('failed', (job, err) => {
    exportProcessor.onFailed(job, err);
  });

  webhookQueue.on('completed', (job, result) => {
    webhookProcessor.onCompleted(job, result);
  });

  webhookQueue.on('failed', (job, err) => {
    webhookProcessor.onFailed(job, err);
  });

  logger.info('Job processors initialized successfully');
};

// Server startup
const startServer = async () => {
  try {
    // Initialize services
    await exportService.initialize();
    logger.info('Export service initialized');

    // Initialize job queues
    await initializeQueues();
    logger.info('Job queues initialized');

    // Setup job processors
    setupJobProcessors();

    // Start HTTP server
    const PORT = process.env.PORT || 3004;
    httpServer.listen(PORT, () => {
      logger.info(`Document Export Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('Service endpoints:');
      logger.info('  - POST /export/document/:documentId - Export single document');
      logger.info('  - POST /export/batch - Export multiple documents');
      logger.info('  - GET /export/status/:exportId - Check export status');
      logger.info('  - GET /export/formats - List available formats');
      logger.info('  - GET /export/templates - List available templates');
      logger.info('  - GET /health - Health check');
      logger.info('  - GET /queues/stats - Queue statistics');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  try {
    // Stop accepting new connections
    httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    // Close job queues and wait for active jobs to complete
    await closeQueues();
    logger.info('Job queues closed');

    // Close export service
    await exportService.close();
    logger.info('Export service closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();

export { app, httpServer };