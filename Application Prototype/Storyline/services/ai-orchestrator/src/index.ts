import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { logger } from './utils/logger';
import { initializeProviders } from './providers';
import { ConversationManager } from './services/ConversationManager';
import { PersonaManager } from './services/PersonaManager';

// Routes
import conversationRoutes from './routes/conversation';
import personaRoutes from './routes/persona';
import completionRoutes from './routes/completion';
import streamingRoutes from './routes/streaming';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ai-orchestrator',
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY
    }
  });
});

// Routes
app.use('/conversation', conversationRoutes);
app.use('/persona', personaRoutes);
app.use('/completion', completionRoutes);
app.use('/streaming', streamingRoutes);

// WebSocket handling for real-time AI interactions
wss.on('connection', (ws, req) => {
  logger.info('WebSocket client connected');
  
  // Import streaming handler
  const { handleStreamingConnection } = require('./services/StreamingService');
  handleStreamingConnection(ws, req);
});

// Initialize services
const startServer = async () => {
  try {
    // Initialize AI providers
    await initializeProviders();
    logger.info('AI providers initialized');

    // Initialize conversation manager
    await ConversationManager.getInstance().initialize();
    logger.info('Conversation manager initialized');

    // Initialize persona manager
    await PersonaManager.getInstance().initialize();
    logger.info('Persona manager initialized');

    // Start server
    const PORT = process.env.PORT || 3004;
    httpServer.listen(PORT, () => {
      logger.info(`AI Orchestrator Service running on port ${PORT}`);
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