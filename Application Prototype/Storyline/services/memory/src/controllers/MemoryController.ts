import { Request, Response } from 'express';
import Joi from 'joi';
import { MemoryService } from '../services/MemoryService';
import { ContextQuery, MemoryFilter } from '../types';
import { logger } from '../utils/logger';

/**
 * Controller for memory-related HTTP endpoints
 */
export class MemoryController {
  private memoryService: MemoryService;

  constructor(memoryService: MemoryService) {
    this.memoryService = memoryService;
  }

  /**
   * Store a new memory
   * POST /memories
   */
  async storeMemory(req: Request, res: Response): Promise<void> {
    try {
      const schema = Joi.object({
        content: Joi.string().required().min(1).max(10000),
        type: Joi.string().valid('event', 'emotion', 'character', 'theme', 'setting').required(),
        documentIds: Joi.array().items(Joi.string()).default([]),
        privacyLevel: Joi.string().valid('public', 'private', 'sensitive').default('private'),
        emotionalContext: Joi.string().optional(),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const memoryData = {
        ...value,
        userId,
        timestamp: new Date(),
      };

      const memory = await this.memoryService.storeMemory(memoryData);

      res.status(201).json({
        success: true,
        data: {
          id: memory.id,
          content: memory.content,
          type: memory.type,
          contradictions: memory.contradictions,
          versionsCount: memory.versions.length,
          timestamp: memory.timestamp,
        },
      });

    } catch (error) {
      logger.error('Failed to store memory:', error);
      res.status(500).json({
        error: 'Failed to store memory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get a specific memory
   * GET /memories/:id
   */
  async getMemory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const memory = await this.memoryService.getMemory(id);

      if (!memory) {
        res.status(404).json({ error: 'Memory not found' });
        return;
      }

      if (memory.userId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({
        success: true,
        data: memory,
      });

    } catch (error) {
      logger.error('Failed to get memory:', error);
      res.status(500).json({
        error: 'Failed to retrieve memory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update a memory
   * PUT /memories/:id
   */
  async updateMemory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const schema = Joi.object({
        content: Joi.string().min(1).max(10000).optional(),
        type: Joi.string().valid('event', 'emotion', 'character', 'theme', 'setting').optional(),
        documentIds: Joi.array().items(Joi.string()).optional(),
        privacyLevel: Joi.string().valid('public', 'private', 'sensitive').optional(),
        userPreference: Joi.string().valid('latest', 'earliest', 'layer_perspectives').optional(),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const memory = await this.memoryService.updateMemory(id, value);

      if (memory.userId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: memory.id,
          content: memory.content,
          type: memory.type,
          contradictions: memory.contradictions,
          versionsCount: memory.versions.length,
          updatedAt: new Date(),
        },
      });

    } catch (error) {
      logger.error('Failed to update memory:', error);
      res.status(500).json({
        error: 'Failed to update memory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete a memory
   * DELETE /memories/:id
   */
  async deleteMemory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      await this.memoryService.deleteMemory(id, userId);

      res.json({
        success: true,
        message: 'Memory deleted successfully',
      });

    } catch (error) {
      logger.error('Failed to delete memory:', error);
      res.status(500).json({
        error: 'Failed to delete memory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Search memories
   * POST /memories/search
   */
  async searchMemories(req: Request, res: Response): Promise<void> {
    try {
      const schema = Joi.object({
        query: Joi.string().required().min(1).max(1000),
        documentId: Joi.string().optional(),
        maxResults: Joi.number().integer().min(1).max(100).default(20),
        includeGraph: Joi.boolean().default(false),
        includeVector: Joi.boolean().default(true),
        emotionalContext: Joi.string().optional(),
        timeRange: Joi.object({
          start: Joi.date().optional(),
          end: Joi.date().optional(),
        }).optional(),
        filters: Joi.array().items(
          Joi.object({
            field: Joi.string().valid('type', 'emotionalTone', 'documentId', 'privacyLevel', 'theme').required(),
            operator: Joi.string().valid('eq', 'neq', 'in', 'nin', 'contains', 'gt', 'lt').required(),
            value: Joi.any().required(),
          })
        ).default([]),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const contextQuery: ContextQuery = {
        ...value,
        userId,
      };

      const results = await this.memoryService.searchMemories(contextQuery);

      res.json({
        success: true,
        data: {
          memories: results.memories.map(memory => ({
            id: memory.id,
            content: memory.content,
            type: memory.type,
            relevance: memory.relevance,
            timestamp: memory.timestamp,
            contradictions: memory.contradictions,
            narrativeAnalysis: memory.narrativeAnalysis,
          })),
          relationships: results.relationships,
          totalCount: results.totalCount,
          queryTime: results.queryTime,
          source: results.source,
        },
      });

    } catch (error) {
      logger.error('Failed to search memories:', error);
      res.status(500).json({
        error: 'Failed to search memories',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get memory context for conversation
   * GET /memories/context
   */
  async getContext(req: Request, res: Response): Promise<void> {
    try {
      const schema = Joi.object({
        documentId: Joi.string().optional(),
        maxResults: Joi.number().integer().min(1).max(50).default(10),
        recentOnly: Joi.boolean().default(true),
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const contextQuery: ContextQuery = {
        query: 'recent context',
        userId,
        documentId: value.documentId,
        maxResults: value.maxResults,
        includeVector: true,
        includeGraph: false,
      };

      if (value.recentOnly) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        contextQuery.timeRange = {
          start: oneDayAgo,
          end: new Date(),
        };
      }

      const results = await this.memoryService.searchMemories(contextQuery);

      res.json({
        success: true,
        data: {
          memories: results.memories.map(memory => ({
            id: memory.id,
            content: memory.content.substring(0, 200) + '...', // Truncate for context
            type: memory.type,
            timestamp: memory.timestamp,
            relevance: memory.relevance,
          })),
          totalCount: results.totalCount,
          queryTime: results.queryTime,
        },
      });

    } catch (error) {
      logger.error('Failed to get context:', error);
      res.status(500).json({
        error: 'Failed to get context',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get service health and metrics
   * GET /memories/health
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.memoryService.getHealthStatus();
      const metrics = this.memoryService.getMetrics();

      res.json({
        success: true,
        data: {
          ...health,
          metrics,
        },
      });

    } catch (error) {
      logger.error('Failed to get health status:', error);
      res.status(500).json({
        error: 'Failed to get health status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get narrative relationships
   * GET /memories/relationships
   */
  async getRelationships(req: Request, res: Response): Promise<void> {
    try {
      const schema = Joi.object({
        characterName: Joi.string().optional(),
        type: Joi.string().valid('character', 'theme', 'location').default('character'),
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // This would use the graph service to get relationships
      // For now, return placeholder data
      res.json({
        success: true,
        data: {
          relationships: [],
          type: value.type,
          characterName: value.characterName,
        },
      });

    } catch (error) {
      logger.error('Failed to get relationships:', error);
      res.status(500).json({
        error: 'Failed to get relationships',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}