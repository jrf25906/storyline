import { jest } from '@jest/globals';

// Mock database connections
jest.mock('../src/database/connections', () => ({
  DatabaseConnections: {
    getInstance: jest.fn(() => ({
      initializeChroma: jest.fn().mockResolvedValue({}),
      initializeNeo4j: jest.fn().mockResolvedValue({}),
      initializeRedis: jest.fn().mockResolvedValue({}),
      getChromaClient: jest.fn(),
      getNeo4jDriver: jest.fn(),
      getRedisClient: jest.fn(),
      closeAll: jest.fn().mockResolvedValue(undefined),
      healthCheck: jest.fn().mockResolvedValue({
        chroma: true,
        neo4j: true,
        redis: true,
      }),
    })),
  },
}));

// Mock Winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
