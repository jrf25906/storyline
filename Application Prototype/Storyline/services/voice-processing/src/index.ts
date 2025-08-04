import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { logger } from './utils/logger';
import { initializeQueues } from './config/queues';
import { S3Service } from './services/S3Service';

// Routes
import uploadRoutes from './routes/upload';
import transcriptionRoutes from './routes/transcription';
import streamingRoutes from './routes/streaming';
import ttsRoutes from './routes/tts';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'voice-processing'
  });
});

// Routes
app.use('/upload', uploadRoutes);
app.use('/transcription', transcriptionRoutes);
app.use('/streaming', streamingRoutes);
app.use('/tts', ttsRoutes);

// WebSocket handling for real-time voice streaming
wss.on('connection', (ws, req) => {
  logger.info('WebSocket client connected');
  
  // Import streaming handler
  const { handleStreamingConnection } = require('./services/StreamingService');
  handleStreamingConnection(ws, req);
});

// Initialize services
const startServer = async () => {
  try {
    // Initialize S3
    await S3Service.getInstance();
    logger.info('S3 service initialized');

    // Initialize job queues
    await initializeQueues();
    logger.info('Job queues initialized');

    // Start server
    const PORT = process.env.PORT || 3003;
    httpServer.listen(PORT, () => {
      logger.info(`Voice Processing Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info('WebSocket server ready for streaming');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    wss.close(() => {
      logger.info('WebSocket server closed');
      process.exit(0);
    });
  });
});

export { app, wss };