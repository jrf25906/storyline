import request from 'supertest';
import express from 'express';
import { MemoryController } from '../../src/controllers/MemoryController';
import { MemoryService } from '../../src/services/MemoryService';
import { authenticate } from '../../src/middleware/auth';
import { ExtendedMemory } from '../../src/types';

// Mock the MemoryService
jest.mock('../../src/services/MemoryService');

// Mock authentication middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

describe('MemoryController', () => {
  let app: express.Application;
  let mockMemoryService: jest.Mocked<MemoryService>;
  let memoryController: MemoryController;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockMemory: ExtendedMemory = {
    id: 'memory-1',
    userId: 'user-123',
    content: 'Test memory content',
    embedding: [],
    type: 'event',
    documentIds: ['doc-1'],
    timestamp: new Date('2025-01-01'),
    relevance: 1.0,
    contradictions: [],
    versions: [{
      id: 'version-1',
      timestamp: new Date('2025-01-01'),
      emotionalTone: 'neutral',
      content: 'Test memory content',
      context: 'test',
      narrativeElements: {
        characters_mentioned: [],
      },
      confidence: 1.0,
    }],
    activeVersion: 'version-1',
    userPreference: 'latest',
    narrativeAnalysis: {
      character_development_stage: 'introduction',
      plot_progression: 0.1,
      theme_consistency: 0.9,
      emotional_arc: 'neutral',
      story_coherence: 0.8,
    },
    privacyLevel: 'private',
    encryptionRequired: false,
  };

  beforeEach(() => {
    mockMemoryService = new MemoryService() as jest.Mocked<MemoryService>;
    memoryController = new MemoryController(mockMemoryService);

    app = express();
    app.use(express.json());
    
    // Mock authentication middleware to add user to request
    (authenticate as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });

    // Setup routes
    app.post('/memories', authenticate, memoryController.storeMemory.bind(memoryController));
    app.get('/memories/:id', authenticate, memoryController.getMemory.bind(memoryController));
    app.put('/memories/:id', authenticate, memoryController.updateMemory.bind(memoryController));
    app.delete('/memories/:id', authenticate, memoryController.deleteMemory.bind(memoryController));
    app.post('/memories/search', authenticate, memoryController.searchMemories.bind(memoryController));
    app.get('/memories/context', authenticate, memoryController.getContext.bind(memoryController));
    app.get('/health', memoryController.getHealth.bind(memoryController));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /memories', () => {
    it('should store memory successfully', async () => {
      mockMemoryService.storeMemory.mockResolvedValue(mockMemory);

      const response = await request(app)
        .post('/memories')
        .send({
          content: 'Test memory content',
          type: 'event',
          documentIds: ['doc-1'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('memory-1');
      expect(response.body.data.content).toBe('Test memory content');
      expect(mockMemoryService.storeMemory).toHaveBeenCalledWith({
        content: 'Test memory content',
        type: 'event',
        documentIds: ['doc-1'],
        privacyLevel: 'private',
        userId: 'user-123',
        timestamp: expect.any(Date),
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/memories')
        .send({
          type: 'event',
          // Missing content
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate memory type', async () => {
      const response = await request(app)
        .post('/memories')
        .send({
          content: 'Test content',
          type: 'invalid_type',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockMemoryService.storeMemory.mockRejectedValue(new Error('Storage failed'));

      const response = await request(app)
        .post('/memories')
        .send({
          content: 'Test content',
          type: 'event',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to store memory');
    });
  });

  describe('GET /memories/:id', () => {
    it('should retrieve memory successfully', async () => {
      mockMemoryService.getMemory.mockResolvedValue(mockMemory);

      const response = await request(app)
        .get('/memories/memory-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('memory-1');
      expect(mockMemoryService.getMemory).toHaveBeenCalledWith('memory-1');
    });

    it('should return 404 for non-existent memory', async () => {
      mockMemoryService.getMemory.mockResolvedValue(null);

      const response = await request(app)
        .get('/memories/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Memory not found');
    });

    it('should return 403 for unauthorized access', async () => {
      const otherUserMemory = { ...mockMemory, userId: 'other-user' };
      mockMemoryService.getMemory.mockResolvedValue(otherUserMemory);

      const response = await request(app)
        .get('/memories/memory-1');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('PUT /memories/:id', () => {
    it('should update memory successfully', async () => {
      const updatedMemory = { ...mockMemory, content: 'Updated content' };
      mockMemoryService.updateMemory.mockResolvedValue(updatedMemory);

      const response = await request(app)
        .put('/memories/memory-1')
        .send({
          content: 'Updated content',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Updated content');
      expect(mockMemoryService.updateMemory).toHaveBeenCalledWith('memory-1', {
        content: 'Updated content',
      });
    });

    it('should validate update fields', async () => {
      const response = await request(app)
        .put('/memories/memory-1')
        .send({
          type: 'invalid_type',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /memories/:id', () => {
    it('should delete memory successfully', async () => {
      mockMemoryService.deleteMemory.mockResolvedValue();

      const response = await request(app)
        .delete('/memories/memory-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Memory deleted successfully');
      expect(mockMemoryService.deleteMemory).toHaveBeenCalledWith('memory-1', 'user-123');
    });
  });

  describe('POST /memories/search', () => {
    it('should search memories successfully', async () => {
      const searchResults = {
        memories: [mockMemory],
        relationships: [],
        totalCount: 1,
        queryTime: 100,
        source: 'vector' as const,
      };

      mockMemoryService.searchMemories.mockResolvedValue(searchResults);

      const response = await request(app)
        .post('/memories/search')
        .send({
          query: 'test query',
          maxResults: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.memories).toHaveLength(1);
      expect(response.body.data.totalCount).toBe(1);
      expect(response.body.data.source).toBe('vector');
    });

    it('should validate search query', async () => {
      const response = await request(app)
        .post('/memories/search')
        .send({
          // Missing query
          maxResults: 10,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle search with filters', async () => {
      const searchResults = {
        memories: [mockMemory],
        relationships: [],
        totalCount: 1,
        queryTime: 100,
        source: 'vector' as const,
      };

      mockMemoryService.searchMemories.mockResolvedValue(searchResults);

      const response = await request(app)
        .post('/memories/search')
        .send({
          query: 'test query',
          filters: [{
            field: 'type',
            operator: 'eq',
            value: 'event',
          }],
        });

      expect(response.status).toBe(200);
      expect(mockMemoryService.searchMemories).toHaveBeenCalledWith({
        query: 'test query',
        userId: 'user-123',
        maxResults: 20, // default
        includeGraph: false, // default
        includeVector: true, // default
        filters: [{
          field: 'type',
          operator: 'eq',
          value: 'event',
        }],
      });
    });
  });

  describe('GET /memories/context', () => {
    it('should get context successfully', async () => {
      const contextResults = {
        memories: [mockMemory],
        relationships: [],
        totalCount: 1,
        queryTime: 50,
        source: 'vector' as const,
      };

      mockMemoryService.searchMemories.mockResolvedValue(contextResults);

      const response = await request(app)
        .get('/memories/context')
        .query({
          documentId: 'doc-1',
          maxResults: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.memories).toHaveLength(1);
      expect(mockMemoryService.searchMemories).toHaveBeenCalledWith({
        query: 'recent context',
        userId: 'user-123',
        documentId: 'doc-1',
        maxResults: 5,
        includeVector: true,
        includeGraph: false,
        timeRange: {
          start: expect.any(Date),
          end: expect.any(Date),
        },
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const healthStatus = {
        status: 'healthy',
        services: {
          vector: { status: 'healthy' },
          graph: { status: 'healthy' },
          cache: { status: 'healthy' },
        },
      };

      const metrics = {
        vectorQueries: { count: 10, averageLatency: 100, accuracy: 0.95 },
        graphQueries: { count: 5, averageLatency: 200, accuracy: 0.9 },
        hybridQueries: { count: 2, averageLatency: 250, synthesisTime: 50 },
        contradictionsDetected: 3,
        contradictionsResolved: 1,
        memoryEvolutions: 5,
      };

      mockMemoryService.getHealthStatus.mockResolvedValue(healthStatus);
      mockMemoryService.getMetrics.mockReturnValue(metrics);

      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.metrics).toEqual(metrics);
    });
  });

  describe('authentication errors', () => {
    beforeEach(() => {
      // Mock authentication to fail
      (authenticate as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'User not authenticated' });
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/memories')
        .send({
          content: 'Test content',
          type: 'event',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('User not authenticated');
    });
  });
});