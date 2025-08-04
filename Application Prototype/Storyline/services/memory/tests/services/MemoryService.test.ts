import { MemoryService } from '../../src/services/MemoryService';
import { VectorStorageService } from '../../src/services/VectorStorageService';
import { GraphStorageService } from '../../src/services/GraphStorageService';
import { CacheService } from '../../src/services/CacheService';
import { ContradictionService } from '../../src/services/ContradictionService';
import { ExtendedMemory, ContextQuery } from '../../src/types';

// Mock all dependencies
jest.mock('../../src/services/VectorStorageService');
jest.mock('../../src/services/GraphStorageService');
jest.mock('../../src/services/CacheService');
jest.mock('../../src/services/ContradictionService');

describe('MemoryService', () => {
  let memoryService: MemoryService;
  let mockVectorService: jest.Mocked<VectorStorageService>;
  let mockGraphService: jest.Mocked<GraphStorageService>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockContradictionService: jest.Mocked<ContradictionService>;

  const mockMemory: ExtendedMemory = {
    id: 'test-memory-1',
    userId: 'user-123',
    content: 'This is a test memory about my childhood.',
    embedding: [0.1, 0.2, 0.3],
    type: 'event',
    documentIds: ['doc-1'],
    timestamp: new Date('2025-01-01'),
    relevance: 0.9,
    contradictions: [],
    versions: [{
      id: 'version-1',
      timestamp: new Date('2025-01-01'),
      emotionalTone: 'nostalgic',
      content: 'This is a test memory about my childhood.',
      context: 'initial',
      narrativeElements: {
        characters_mentioned: ['mother', 'father'],
        story_beat: 'exposition',
        conflict_type: 'internal',
        theme: 'family',
        setting: 'home',
        mood: 'warm',
      },
      confidence: 1.0,
    }],
    activeVersion: 'version-1',
    userPreference: 'latest',
    narrativeAnalysis: {
      character_development_stage: 'introduction',
      plot_progression: 0.1,
      theme_consistency: 0.9,
      emotional_arc: 'nostalgic',
      story_coherence: 0.8,
    },
    privacyLevel: 'private',
    encryptionRequired: false,
  };

  beforeEach(() => {
    // Create mocked instances
    mockVectorService = new VectorStorageService() as jest.Mocked<VectorStorageService>;
    mockGraphService = new GraphStorageService() as jest.Mocked<GraphStorageService>;
    mockCacheService = new CacheService() as jest.Mocked<CacheService>;
    mockContradictionService = new ContradictionService(mockVectorService, mockGraphService) as jest.Mocked<ContradictionService>;

    // Create memory service instance
    memoryService = new MemoryService();

    // Replace the services with mocked versions
    (memoryService as any).vectorService = mockVectorService;
    (memoryService as any).graphService = mockGraphService;
    (memoryService as any).cacheService = mockCacheService;
    (memoryService as any).contradictionService = mockContradictionService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize all services successfully', async () => {
      mockVectorService.initialize.mockResolvedValue();
      mockGraphService.initialize.mockResolvedValue();

      await memoryService.initialize();

      expect(mockVectorService.initialize).toHaveBeenCalledTimes(1);
      expect(mockGraphService.initialize).toHaveBeenCalledTimes(1);
    });

    it('should throw error if initialization fails', async () => {
      const error = new Error('Initialization failed');
      mockVectorService.initialize.mockRejectedValue(error);

      await expect(memoryService.initialize()).rejects.toThrow('Initialization failed');
    });
  });

  describe('storeMemory', () => {
    it('should store memory successfully with no contradictions', async () => {
      const memoryData = {
        userId: 'user-123',
        content: 'New memory content',
        type: 'event' as const,
      };

      mockContradictionService.detectContradictions.mockResolvedValue({
        contradictions: [],
        confidence: 1.0,
        suggestions: [],
      });

      mockVectorService.storeMemory.mockResolvedValue();
      mockGraphService.storeMemory.mockResolvedValue();
      mockCacheService.cacheMemory.mockResolvedValue();

      const result = await memoryService.storeMemory(memoryData);

      expect(result).toBeDefined();
      expect(result.userId).toBe(memoryData.userId);
      expect(result.content).toBe(memoryData.content);
      expect(result.type).toBe(memoryData.type);
      expect(result.contradictions).toHaveLength(0);
      expect(result.versions).toHaveLength(1);

      expect(mockContradictionService.detectContradictions).toHaveBeenCalledTimes(1);
      expect(mockVectorService.storeMemory).toHaveBeenCalledTimes(1);
      expect(mockGraphService.storeMemory).toHaveBeenCalledTimes(1);
      expect(mockCacheService.cacheMemory).toHaveBeenCalledTimes(1);
    });

    it('should store memory with detected contradictions', async () => {
      const memoryData = {
        userId: 'user-123',
        content: 'Contradictory memory content',
        type: 'event' as const,
      };

      const contradictions = [{
        memoryId: 'existing-memory',
        type: 'emotion' as const,
        description: 'Emotional tone contradiction',
        severity: 'medium' as const,
        confidence: 0.8,
        affectedMemories: ['test-memory-1', 'existing-memory'],
        narrativeImpact: 'positive' as const,
        suggestions: [{
          action: 'layer' as const,
          reason: 'Both perspectives add depth',
          confidence: 0.7,
          narrativeImprovement: 'Shows emotional growth',
        }],
      }];

      mockContradictionService.detectContradictions.mockResolvedValue({
        contradictions,
        confidence: 0.8,
        suggestions: contradictions[0].suggestions,
      });

      mockVectorService.storeMemory.mockResolvedValue();
      mockGraphService.storeMemory.mockResolvedValue();
      mockCacheService.cacheMemory.mockResolvedValue();

      const result = await memoryService.storeMemory(memoryData);

      expect(result.contradictions).toHaveLength(1);
      expect(result.contradictions[0].type).toBe('emotion');
      expect(result.contradictions[0].resolution).toBe('layer');
    });

    it('should handle storage errors', async () => {
      const memoryData = {
        userId: 'user-123',
        content: 'Memory content',
        type: 'event' as const,
      };

      mockContradictionService.detectContradictions.mockResolvedValue({
        contradictions: [],
        confidence: 1.0,
        suggestions: [],
      });

      const error = new Error('Storage failed');
      mockVectorService.storeMemory.mockRejectedValue(error);

      await expect(memoryService.storeMemory(memoryData)).rejects.toThrow('Storage failed');
    });
  });

  describe('getMemory', () => {
    it('should retrieve memory from cache', async () => {
      mockCacheService.getCachedMemory.mockResolvedValue(mockMemory);

      const result = await memoryService.getMemory('test-memory-1');

      expect(result).toEqual(mockMemory);
      expect(mockCacheService.getCachedMemory).toHaveBeenCalledWith('test-memory-1');
    });

    it('should return null if memory not found', async () => {
      mockCacheService.getCachedMemory.mockResolvedValue(null);

      const result = await memoryService.getMemory('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateMemory', () => {
    it('should update memory successfully', async () => {
      const updates = {
        content: 'Updated memory content',
      };

      mockCacheService.getCachedMemory.mockResolvedValue(mockMemory);
      mockContradictionService.detectContradictions.mockResolvedValue({
        contradictions: [],
        confidence: 1.0,
        suggestions: [],
      });
      mockVectorService.updateMemory.mockResolvedValue();
      mockGraphService.updateMemory.mockResolvedValue();
      mockCacheService.cacheMemory.mockResolvedValue();
      mockCacheService.invalidateUserSearchCache.mockResolvedValue();

      const result = await memoryService.updateMemory('test-memory-1', updates);

      expect(result.content).toBe(updates.content);
      expect(result.versions).toHaveLength(2); // Original + new version
      expect(mockVectorService.updateMemory).toHaveBeenCalledTimes(1);
      expect(mockGraphService.updateMemory).toHaveBeenCalledTimes(1);
      expect(mockCacheService.invalidateUserSearchCache).toHaveBeenCalledWith(mockMemory.userId);
    });

    it('should throw error if memory not found', async () => {
      mockCacheService.getCachedMemory.mockResolvedValue(null);

      await expect(memoryService.updateMemory('non-existent', {}))
        .rejects.toThrow('Memory not found: non-existent');
    });
  });

  describe('deleteMemory', () => {
    it('should delete memory successfully', async () => {
      mockVectorService.deleteMemory.mockResolvedValue();
      mockGraphService.deleteMemory.mockResolvedValue();
      mockCacheService.invalidateMemory.mockResolvedValue();

      await memoryService.deleteMemory('test-memory-1', 'user-123');

      expect(mockVectorService.deleteMemory).toHaveBeenCalledWith('test-memory-1');
      expect(mockGraphService.deleteMemory).toHaveBeenCalledWith('test-memory-1');
      expect(mockCacheService.invalidateMemory).toHaveBeenCalledWith('test-memory-1', 'user-123');
    });
  });

  describe('searchMemories', () => {
    const mockQuery: ContextQuery = {
      query: 'childhood memories',
      userId: 'user-123',
      maxResults: 10,
      includeVector: true,
      includeGraph: false,
    };

    const mockSearchResults = {
      memories: [mockMemory],
      relationships: [],
      totalCount: 1,
      queryTime: 150,
      source: 'vector' as const,
    };

    it('should return cached results if available', async () => {
      mockCacheService.getCachedSearchResults.mockResolvedValue(mockSearchResults);

      const result = await memoryService.searchMemories(mockQuery);

      expect(result).toEqual(mockSearchResults);
      expect(mockCacheService.getCachedSearchResults).toHaveBeenCalledWith(mockQuery);
      expect(mockVectorService.searchMemories).not.toHaveBeenCalled();
    });

    it('should perform vector search when cache miss', async () => {
      mockCacheService.getCachedSearchResults.mockResolvedValue(null);
      mockVectorService.searchMemories.mockResolvedValue(mockSearchResults);
      mockCacheService.cacheSearchResults.mockResolvedValue();

      const result = await memoryService.searchMemories(mockQuery);

      expect(result).toEqual(mockSearchResults);
      expect(mockVectorService.searchMemories).toHaveBeenCalledWith(mockQuery);
      expect(mockCacheService.cacheSearchResults).toHaveBeenCalledWith(mockQuery, mockSearchResults);
    });

    it('should perform graph search when requested', async () => {
      const graphQuery = {
        ...mockQuery,
        includeVector: false,
        includeGraph: true,
      };

      mockCacheService.getCachedSearchResults.mockResolvedValue(null);
      mockGraphService.searchMemories.mockResolvedValue(mockSearchResults);
      mockCacheService.cacheSearchResults.mockResolvedValue();

      const result = await memoryService.searchMemories(graphQuery);

      expect(result).toEqual(mockSearchResults);
      expect(mockGraphService.searchMemories).toHaveBeenCalledWith(graphQuery);
    });

    it('should perform hybrid search when both vector and graph requested', async () => {
      const hybridQuery = {
        ...mockQuery,
        includeVector: true,
        includeGraph: true,
      };

      const vectorResults = { ...mockSearchResults, source: 'vector' as const };
      const graphResults = { ...mockSearchResults, source: 'graph' as const };

      mockCacheService.getCachedSearchResults.mockResolvedValue(null);
      mockVectorService.searchMemories.mockResolvedValue(vectorResults);
      mockGraphService.searchMemories.mockResolvedValue(graphResults);
      mockCacheService.cacheSearchResults.mockResolvedValue();

      const result = await memoryService.searchMemories(hybridQuery);

      expect(result.source).toBe('hybrid');
      expect(mockVectorService.searchMemories).toHaveBeenCalledWith(hybridQuery);
      expect(mockGraphService.searchMemories).toHaveBeenCalledWith(hybridQuery);
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status', async () => {
      const mockVectorStats = { totalMemories: 100 };
      const mockGraphStats = { memories: 100, relationships: 200 };
      const mockCacheStats = { totalKeys: 50 };

      mockVectorService.getStats.mockResolvedValue(mockVectorStats);
      mockGraphService.getStats.mockResolvedValue(mockGraphStats);
      mockCacheService.getStats.mockResolvedValue(mockCacheStats);
      mockCacheService.healthCheck.mockResolvedValue(true);

      const result = await memoryService.getHealthStatus();

      expect(result.status).toBe('healthy');
      expect(result.services.vector.status).toBe('healthy');
      expect(result.services.graph.status).toBe('healthy');
      expect(result.services.cache.status).toBe('healthy');
      expect(result.metrics).toBeDefined();
    });

    it('should return unhealthy status on error', async () => {
      const error = new Error('Service unavailable');
      mockVectorService.getStats.mockRejectedValue(error);

      const result = await memoryService.getHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Service unavailable');
    });
  });

  describe('metrics tracking', () => {
    it('should track vector query metrics', async () => {
      const mockQuery: ContextQuery = {
        query: 'test query',
        userId: 'user-123',
        includeVector: true,
        includeGraph: false,
      };

      mockCacheService.getCachedSearchResults.mockResolvedValue(null);
      mockVectorService.searchMemories.mockResolvedValue({
        memories: [],
        relationships: [],
        totalCount: 0,
        queryTime: 100,
        source: 'vector',
      });
      mockCacheService.cacheSearchResults.mockResolvedValue();

      await memoryService.searchMemories(mockQuery);

      const metrics = memoryService.getMetrics();
      expect(metrics.vectorQueries.count).toBe(1);
      expect(metrics.vectorQueries.averageLatency).toBeGreaterThan(0);
    });

    it('should track hybrid query metrics', async () => {
      const mockQuery: ContextQuery = {
        query: 'test query',
        userId: 'user-123',
        includeVector: true,
        includeGraph: true,
      };

      mockCacheService.getCachedSearchResults.mockResolvedValue(null);
      mockVectorService.searchMemories.mockResolvedValue({
        memories: [],
        relationships: [],
        totalCount: 0,
        queryTime: 100,
        source: 'vector',
      });
      mockGraphService.searchMemories.mockResolvedValue({
        memories: [],
        relationships: [],
        totalCount: 0,
        queryTime: 150,
        source: 'graph',
      });
      mockCacheService.cacheSearchResults.mockResolvedValue();

      await memoryService.searchMemories(mockQuery);

      const metrics = memoryService.getMetrics();
      expect(metrics.hybridQueries.count).toBe(1);
      expect(metrics.hybridQueries.averageLatency).toBeGreaterThan(0);
      expect(metrics.hybridQueries.synthesisTime).toBeGreaterThan(0);
    });
  });
});