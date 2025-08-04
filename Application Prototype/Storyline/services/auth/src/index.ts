import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import passport from 'passport';

import { logger } from './utils/logger';
import { ormConfig } from './config/database';
import { configurePassport } from './config/passport';
import { redisClient } from './config/redis';

// Routes
import authRoutes from './routes/auth';
import tokenRoutes from './routes/token';
import oauthRoutes from './routes/oauth';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Configure passport strategies
configurePassport(passport);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'auth-service'
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/token', tokenRoutes);
app.use('/oauth', oauthRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await createConnection(ormConfig);
    logger.info('Database connected successfully');

    // Connect to Redis
    await redisClient.connect();
    logger.info('Redis connected successfully');

    // Start server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      logger.info(`Auth Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await redisClient.disconnect();
  process.exit(0);
});

export default app;