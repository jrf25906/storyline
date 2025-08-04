import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import voiceRoutes from './routes/voice';
import aiRoutes from './routes/ai';
import userRoutes from './routes/users';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: process.env.npm_package_version 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/voice', authMiddleware, voiceRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/users', authMiddleware, userRoutes);

// WebSocket handling for real-time features
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    // Validate token
    // const user = await validateToken(token);
    // socket.data.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join:document', (documentId) => {
    socket.join(`document:${documentId}`);
    logger.info(`Socket ${socket.id} joined document:${documentId}`);
  });

  socket.on('voice:start', (data) => {
    socket.to(`document:${data.documentId}`).emit('voice:user-speaking', {
      userId: socket.data.user?.id,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`WebSocket server ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export { app, io };