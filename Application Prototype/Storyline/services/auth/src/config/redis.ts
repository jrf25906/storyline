import Redis from 'ioredis';
import { logger } from '../utils/logger';

export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

// Helper functions for token blacklisting
export const blacklistToken = async (token: string, expiresIn: number): Promise<void> => {
  await redisClient.set(`blacklist:${token}`, '1', 'EX', expiresIn);
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redisClient.get(`blacklist:${token}`);
  return result === '1';
};

// Helper functions for rate limiting
export const incrementLoginAttempts = async (email: string): Promise<number> => {
  const key = `login_attempts:${email}`;
  const attempts = await redisClient.incr(key);
  await redisClient.expire(key, 900); // 15 minutes
  return attempts;
};

export const getLoginAttempts = async (email: string): Promise<number> => {
  const attempts = await redisClient.get(`login_attempts:${email}`);
  return attempts ? parseInt(attempts, 10) : 0;
};

export const resetLoginAttempts = async (email: string): Promise<void> => {
  await redisClient.del(`login_attempts:${email}`);
};

// Helper functions for session management
export const storeSession = async (sessionId: string, data: any, ttl: number): Promise<void> => {
  await redisClient.set(`session:${sessionId}`, JSON.stringify(data), 'EX', ttl);
};

export const getSession = async (sessionId: string): Promise<any | null> => {
  const data = await redisClient.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await redisClient.del(`session:${sessionId}`);
};