import { ChromaApi, Configuration } from 'chromadb';
import neo4j, { Driver } from 'neo4j-driver';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

/**
 * Database configuration and connection management
 */
export class DatabaseConfig {
  private static chromaClient: ChromaApi | null = null;
  private static neo4jDriver: Driver | null = null;
  private static redisClient: Redis | null = null;

  /**
   * Initialize ChromaDB client
   */
  static async initializeChroma(): Promise<ChromaApi> {
    if (this.chromaClient) {
      return this.chromaClient;
    }

    try {
      const chromaConfig = new Configuration({
        basePath: process.env.CHROMA_URL || 'http://localhost:8000',
        // Add authentication if needed
        apiKey: process.env.CHROMA_API_KEY,
      });

      this.chromaClient = new ChromaApi(chromaConfig);
      
      // Test connection
      await this.chromaClient.heartbeat();
      logger.info('ChromaDB connection established successfully');
      
      return this.chromaClient;
    } catch (error) {
      logger.error('Failed to initialize ChromaDB:', error);
      throw new Error(`ChromaDB connection failed: ${error}`);
    }
  }

  /**
   * Initialize Neo4j driver
   */
  static async initializeNeo4j(): Promise<Driver> {
    if (this.neo4jDriver) {
      return this.neo4jDriver;
    }

    try {
      const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
      const username = process.env.NEO4J_USERNAME || 'neo4j';
      const password = process.env.NEO4J_PASSWORD || 'password';

      this.neo4jDriver = neo4j.driver(
        uri,
        neo4j.auth.basic(username, password),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
          disableLosslessIntegers: true
        }
      );

      // Test connection
      const session = this.neo4jDriver.session();
      await session.run('RETURN 1');
      await session.close();
      
      logger.info('Neo4j connection established successfully');
      
      return this.neo4jDriver;
    } catch (error) {
      logger.error('Failed to initialize Neo4j:', error);
      throw new Error(`Neo4j connection failed: ${error}`);
    }
  }

  /**
   * Initialize Redis client
   */
  static async initializeRedis(): Promise<Redis> {
    if (this.redisClient) {
      return this.redisClient;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
        // Connection pool settings
        family: 4,
        keepAlive: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      // Test connection
      await this.redisClient.connect();
      await this.redisClient.ping();
      
      logger.info('Redis connection established successfully');
      
      return this.redisClient;
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      throw new Error(`Redis connection failed: ${error}`);
    }
  }

  /**
   * Get ChromaDB client
   */
  static getChroma(): ChromaApi {
    if (!this.chromaClient) {
      throw new Error('ChromaDB not initialized. Call initializeChroma() first.');
    }
    return this.chromaClient;
  }

  /**
   * Get Neo4j driver
   */
  static getNeo4j(): Driver {
    if (!this.neo4jDriver) {
      throw new Error('Neo4j not initialized. Call initializeNeo4j() first.');
    }
    return this.neo4jDriver;
  }

  /**
   * Get Redis client
   */
  static getRedis(): Redis {
    if (!this.redisClient) {
      throw new Error('Redis not initialized. Call initializeRedis() first.');
    }
    return this.rediredisClient;
  }

  /**
   * Close all database connections
   */
  static async closeAll(): Promise<void> {
    try {
      if (this.neo4jDriver) {
        await this.neo4jDriver.close();
        this.neo4jDriver = null;
        logger.info('Neo4j connection closed');
      }

      if (this.redisClient) {
        await this.redisClient.quit();
        this.redisClient = null;
        logger.info('Redis connection closed');
      }

      // ChromaDB client doesn't need explicit closing
      if (this.chromaClient) {
        this.chromaClient = null;
        logger.info('ChromaDB client cleared');
      }
    } catch (error) {
      logger.error('Error closing database connections:', error);
    }
  }

  /**
   * Health check for all databases
   */
  static async healthCheck(): Promise<{
    chroma: boolean;
    neo4j: boolean;
    redis: boolean;
  }> {
    const health = {
      chroma: false,
      neo4j: false,
      redis: false
    };

    // Check ChromaDB
    try {
      if (this.chromaClient) {
        await this.chromaClient.heartbeat();
        health.chroma = true;
      }
    } catch (error) {
      logger.warn('ChromaDB health check failed:', error);
    }

    // Check Neo4j
    try {
      if (this.neo4jDriver) {
        const session = this.neo4jDriver.session();
        await session.run('RETURN 1');
        await session.close();
        health.neo4j = true;
      }
    } catch (error) {
      logger.warn('Neo4j health check failed:', error);
    }

    // Check Redis
    try {
      if (this.redisClient) {
        await this.redisClient.ping();
        health.redis = true;
      }
    } catch (error) {
      logger.warn('Redis health check failed:', error);
    }

    return health;
  }
}