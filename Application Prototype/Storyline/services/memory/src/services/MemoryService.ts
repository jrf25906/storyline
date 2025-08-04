import { v4 as uuidv4 } from 'uuid';
import { VectorStorageService } from './VectorStorageService';
import { GraphStorageService } from './GraphStorageService';
import { CacheService } from './CacheService';
import { ContradictionService } from './ContradictionService';
import { performanceConfig } from '../config/memory';
import {
  ExtendedMemory,
  MemorySearchResult,
  ContextQuery,
  QueryRoutingDecision,
  MemoryMetrics,
  ContradictionDetectionResult
} from '../types';
import { Memory } from '@storyline/shared-types';
import { logger } from '../utils/logger';

/**
 * Main Memory Service that orchestrates dual RAG system with contradiction-aware management
 */
export class MemoryService {
  private vectorService: VectorStorageService;
  private graphService: GraphStorageService;
  private cacheService: CacheService;
  private contradictionService: ContradictionService;
  private metrics: MemoryMetrics;

  constructor() {
    this.vectorService = new VectorStorageService();
    this.graphService = new GraphStorageService();
    this.cacheService = new CacheService();
    this.contradictionService = new ContradictionService(this.vectorService, this.graphService);
    
    this.metrics = {
      vectorQueries: { count: 0, averageLatency: 0, accuracy: 0 },
      graphQueries: { count: 0, averageLatency: 0, accuracy: 0 },
      hybridQueries: { count: 0, averageLatency: 0, synthesisTime: 0 },
      contradictionsDetected: 0,
      contradictionsResolved: 0,
      memoryEvolutions: 0,
    };
  }

  /**
   * Initialize the memory service
   */
  async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.vectorService.initialize(),
        this.graphService.initialize(),
      ]);

      logger.info('Memory service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize memory service:', error);
      throw error;
    }
  }

  /**
   * Store a new memory with contradiction detection
   */
  async storeMemory(memoryData: Partial<Memory>): Promise<ExtendedMemory> {
    try {
      const startTime = Date.now();

      // Create extended memory object
      const memory: ExtendedMemory = {
        ...memoryData,
        id: memoryData.id || uuidv4(),
        userId: memoryData.userId!,
        content: memoryData.content!,
        embedding: memoryData.embedding || [],
        type: memoryData.type!,
        documentIds: memoryData.documentIds || [],
        timestamp: memoryData.timestamp || new Date(),
        relevance: memoryData.relevance || 1.0,
        contradictions: [],
        versions: [{
          id: uuidv4(),
          timestamp: new Date(),
          emotionalTone: 'neutral', // Would be extracted from content
          content: memoryData.content!,
          context: 'initial',
          narrativeElements: {
            characters_mentioned: [],
            story_beat: undefined,
            conflict_type: undefined,
            theme: undefined,
            setting: undefined,
            mood: undefined,
          },
          confidence: 1.0,
        }],
        activeVersion: '',
        userPreference: 'latest',
        narrativeAnalysis: {
          character_development_stage: 'introduction',
          plot_progression: 0.0,
          theme_consistency: 1.0,
          emotional_arc: 'neutral',
          story_coherence: 1.0,
        },
        privacyLevel: 'private',
        encryptionRequired: false,
      };

      memory.activeVersion = memory.versions[0].id;

      // Detect contradictions before storing
      const contradictionResult = await this.contradictionService.detectContradictions(memory);
      memory.contradictions = contradictionResult.contradictions.map(c => ({
        memoryId: c.memoryId,
        type: c.type,
        description: c.description,
        resolution: c.suggestions[0]?.action,
      }));

      if (contradictionResult.contradictions.length > 0) {
        this.metrics.contradictionsDetected += contradictionResult.contradictions.length;
        logger.info('Contradictions detected in new memory', {
          memoryId: memory.id,
          contradictions: contradictionResult.contradictions.length,
          suggestions: contradictionResult.suggestions.length,
        });
      }

      // Store in both vector and graph databases
      await Promise.all([
        this.vectorService.storeMemory(memory),
        this.graphService.storeMemory(memory),
      ]);

      // Cache the memory
      await this.cacheService.cacheMemory(memory);

      const duration = Date.now() - startTime;
      logger.info('Memory stored successfully', {
        memoryId: memory.id,
        userId: memory.userId,
        duration,
        contradictions: memory.contradictions.length,
      });

      return memory;

    } catch (error) {
      logger.error('Failed to store memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve a memory by ID
   */
  async getMemory(memoryId: string): Promise<ExtendedMemory | null> {
    try {
      // Try cache first
      const cached = await this.cacheService.getCachedMemory(memoryId);
      if (cached) {
        return cached;
      }

      // If not in cache, this would typically query the primary database
      // For now, return null as we don't have a primary storage
      return null;

    } catch (error) {
      logger.error('Failed to get memory:', error, { memoryId });
      throw error;
    }
  }

  /**
   * Update an existing memory
   */
  async updateMemory(memoryId: string, updates: Partial<ExtendedMemory>): Promise<ExtendedMemory> {
    try {
      const existing = await this.getMemory(memoryId);
      if (!existing) {
        throw new Error(`Memory not found: ${memoryId}`);
      }

      const updated: ExtendedMemory = {
        ...existing,
        ...updates,
        id: memoryId, // Ensure ID doesn't change
      };

      // If content changed, add new version
      if (updates.content && updates.content !== existing.content) {
        const newVersion = {
          id: uuidv4(),
          timestamp: new Date(),
          emotionalTone: 'neutral', // Would be extracted
          content: updates.content,
          context: 'updated',
          narrativeElements: {
            characters_mentioned: [],
            story_beat: undefined,
            conflict_type: undefined,
            theme: undefined,
            setting: undefined,
            mood: undefined,
          },
          confidence: 1.0,
        };

        updated.versions.push(newVersion);
        updated.activeVersion = newVersion.id;
        this.metrics.memoryEvolutions++;

        // Detect contradictions in the updated memory
        const contradictionResult = await this.contradictionService.detectContradictions(updated);
        if (contradictionResult.contradictions.length > 0) {
          this.metrics.contradictionsDetected += contradictionResult.contradictions.length;
        }
      }

      // Update in storage
      await Promise.all([
        this.vectorService.updateMemory(updated),
        this.graphService.updateMemory(updated),
      ]);

      // Update cache
      await this.cacheService.cacheMemory(updated);

      // Invalidate search cache
      await this.cacheService.invalidateUserSearchCache(updated.userId);

      logger.info('Memory updated successfully', {
        memoryId,
        userId: updated.userId,
        versionsCount: updated.versions.length,
      });

      return updated;

    } catch (error) {
      logger.error('Failed to update memory:', error, { memoryId });
      throw error;
    }
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: string, userId: string): Promise<void> {
    try {
      await Promise.all([
        this.vectorService.deleteMemory(memoryId),
        this.graphService.deleteMemory(memoryId),
        this.cacheService.invalidateMemory(memoryId, userId),
      ]);

      logger.info('Memory deleted successfully', {
        memoryId,
        userId,
      });

    } catch (error) {
      logger.error('Failed to delete memory:', error, { memoryId, userId });
      throw error;
    }
  }

  /**
   * Search memories using hybrid RAG approach
   */
  async searchMemories(query: ContextQuery): Promise<MemorySearchResult> {
    try {
      const startTime = Date.now();

      // Check cache first
      const cached = await this.cacheService.getCachedSearchResults(query);
      if (cached) {
        logger.debug('Search results retrieved from cache', {
          query: query.query,
          userId: query.userId,
          resultsCount: cached.memories.length,
        });
        return cached;
      }

      // Determine query routing strategy
      const routingDecision = await this.determineQueryRouting(query);

      let results: MemorySearchResult;

      switch (routingDecision.strategy) {
        case 'vector_only':
          results = await this.executeVectorSearch(query, startTime);
          break;
        case 'graph_only':
          results = await this.executeGraphSearch(query, startTime);
          break;
        case 'hybrid_parallel':
          results = await this.executeHybridParallelSearch(query, startTime);
          break;
        case 'hybrid_sequential':
          results = await this.executeHybridSequentialSearch(query, startTime);
          break;
        default:
          results = await this.executeVectorSearch(query, startTime);
      }

      // Cache the results
      await this.cacheService.cacheSearchResults(query, results);

      return results;

    } catch (error) {
      logger.error('Memory search failed:', error, {
        query: query.query,
        userId: query.userId,
      });
      throw error;
    }
  }

  /**
   * Determine optimal query routing strategy
   */
  private async determineQueryRouting(query: ContextQuery): Promise<QueryRoutingDecision> {
    const startTime = Date.now();

    // Simple heuristics for query routing
    const hasRelationshipTerms = /\b(character|relationship|friend|family|with|between)\b/i.test(query.query);
    const hasContentTerms = /\b(said|felt|happened|remember|experience|story)\b/i.test(query.query);
    const hasStructureTerms = /\b(theme|plot|story|narrative|chapter|beginning|end)\b/i.test(query.query);

    let strategy: QueryRoutingDecision['strategy'] = 'vector_only';
    let confidence = 0.6;
    let reasoning = 'Default vector search';

    if (query.includeGraph === true && query.includeVector === true) {
      strategy = 'hybrid_parallel';
      confidence = 0.9;
      reasoning = 'Explicit hybrid request';
    } else if (query.includeGraph === true) {
      strategy = 'graph_only';
      confidence = 0.8;
      reasoning = 'Explicit graph request';
    } else if (hasRelationshipTerms && hasStructureTerms) {
      strategy = 'hybrid_parallel';
      confidence = 0.8;
      reasoning = 'Query contains both relationship and structure terms';
    } else if (hasRelationshipTerms || hasStructureTerms) {
      strategy = 'graph_only';
      confidence = 0.7;
      reasoning = 'Query contains relationship or structure terms';
    } else if (hasContentTerms) {
      strategy = 'vector_only';
      confidence = 0.8;
      reasoning = 'Query focuses on content similarity';
    }

    const routingTime = Date.now() - startTime;

    return {
      useVector: strategy.includes('vector') || strategy.includes('hybrid'),
      useGraph: strategy.includes('graph') || strategy.includes('hybrid'),
      strategy,
      confidence,
      reasoning,
    };
  }

  /**
   * Execute vector-only search
   */
  private async executeVectorSearch(query: ContextQuery, startTime: number): Promise<MemorySearchResult> {
    const results = await this.vectorService.searchMemories(query);
    
    this.metrics.vectorQueries.count++;
    this.updateAverageLatency(this.metrics.vectorQueries, Date.now() - startTime);

    return results;
  }

  /**
   * Execute graph-only search
   */
  private async executeGraphSearch(query: ContextQuery, startTime: number): Promise<MemorySearchResult> {
    const results = await this.graphService.searchMemories(query);
    
    this.metrics.graphQueries.count++;
    this.updateAverageLatency(this.metrics.graphQueries, Date.now() - startTime);

    return results;
  }

  /**
   * Execute hybrid parallel search
   */
  private async executeHybridParallelSearch(query: ContextQuery, startTime: number): Promise<MemorySearchResult> {
    const [vectorResults, graphResults] = await Promise.all([
      this.vectorService.searchMemories(query),
      this.graphService.searchMemories(query),
    ]);

    const synthesisStartTime = Date.now();
    const combinedResults = this.synthesizeResults(vectorResults, graphResults, query);
    const synthesisTime = Date.now() - synthesisStartTime;

    this.metrics.hybridQueries.count++;
    this.updateAverageLatency(this.metrics.hybridQueries, Date.now() - startTime);
    this.metrics.hybridQueries.synthesisTime = 
      (this.metrics.hybridQueries.synthesisTime + synthesisTime) / 2;

    return combinedResults;
  }

  /**
   * Execute hybrid sequential search
   */
  private async executeHybridSequentialSearch(query: ContextQuery, startTime: number): Promise<MemorySearchResult> {
    // First try vector search
    const vectorResults = await this.vectorService.searchMemories(query);
    
    // If vector results are insufficient, supplement with graph search
    if (vectorResults.memories.length < (query.maxResults || 10) / 2) {
      const graphResults = await this.graphService.searchMemories(query);
      const synthesisStartTime = Date.now();
      const combinedResults = this.synthesizeResults(vectorResults, graphResults, query);
      const synthesisTime = Date.now() - synthesisStartTime;

      this.metrics.hybridQueries.count++;
      this.updateAverageLatency(this.metrics.hybridQueries, Date.now() - startTime);
      this.metrics.hybridQueries.synthesisTime = 
        (this.metrics.hybridQueries.synthesisTime + synthesisTime) / 2;

      return combinedResults;
    }

    this.metrics.vectorQueries.count++;
    this.updateAverageLatency(this.metrics.vectorQueries, Date.now() - startTime);

    return vectorResults;
  }

  /**
   * Synthesize results from vector and graph searches
   */
  private synthesizeResults(
    vectorResults: MemorySearchResult,
    graphResults: MemorySearchResult,
    query: ContextQuery
  ): MemorySearchResult {
    // Combine and deduplicate memories
    const memoryMap = new Map<string, ExtendedMemory>();
    
    // Add vector results (prioritize by relevance)
    vectorResults.memories.forEach(memory => {
      memoryMap.set(memory.id, memory);
    });

    // Add graph results (merge with existing or add new)
    graphResults.memories.forEach(memory => {
      if (memoryMap.has(memory.id)) {
        // Boost relevance for memories found in both systems
        const existing = memoryMap.get(memory.id)!;
        existing.relevance = Math.min(existing.relevance * 1.2, 1.0);
      } else {
        memoryMap.set(memory.id, memory);
      }
    });

    // Sort by relevance
    const combinedMemories = Array.from(memoryMap.values())
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, query.maxResults || performanceConfig.hybrid.maxCombinedResults);

    // Combine relationships
    const allRelationships = [
      ...vectorResults.relationships,
      ...graphResults.relationships,
    ];

    return {
      memories: combinedMemories,
      relationships: allRelationships,
      totalCount: combinedMemories.length,
      queryTime: Math.max(vectorResults.queryTime, graphResults.queryTime),
      source: 'hybrid',
    };
  }

  /**
   * Get memory service statistics
   */
  getMetrics(): MemoryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<any> {
    try {
      const [vectorStats, graphStats, cacheStats, cacheHealth] = await Promise.all([
        this.vectorService.getStats(),
        this.graphService.getStats(),
        this.cacheService.getStats(),
        this.cacheService.healthCheck(),
      ]);

      return {
        status: 'healthy',
        services: {
          vector: { status: 'healthy', ...vectorStats },
          graph: { status: 'healthy', ...graphStats },
          cache: { status: cacheHealth ? 'healthy' : 'unhealthy', ...cacheStats },
        },
        metrics: this.metrics,
      };

    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update average latency metric
   */
  private updateAverageLatency(metric: { averageLatency: number; count: number }, latency: number): void {
    metric.averageLatency = ((metric.averageLatency * (metric.count - 1)) + latency) / metric.count;
  }
}