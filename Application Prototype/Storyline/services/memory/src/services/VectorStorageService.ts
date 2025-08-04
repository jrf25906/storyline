import { ChromaApi, Collection } from 'chromadb';
import OpenAI from 'openai';
import { DatabaseConfig } from '../config/database';
import { memoryConfig, embeddingConfig, performanceConfig } from '../config/memory';
import { ExtendedMemory, MemorySearchResult, ContextQuery } from '../types';
import { logger } from '../utils/logger';

/**
 * Vector storage service using ChromaDB for semantic similarity search
 */
export class VectorStorageService {
  private chromaClient: ChromaApi;
  private collection: Collection | null = null;
  private openaiClient: OpenAI;

  constructor() {
    this.chromaClient = DatabaseConfig.getChroma();
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Initialize the vector storage service
   */
  async initialize(): Promise<void> {
    try {
      // Get or create collection
      this.collection = await this.chromaClient.getOrCreateCollection({
        name: memoryConfig.vectorStore.collection,
        metadata: {
          'hnsw:space': memoryConfig.vectorStore.distance,
          description: 'Storyline memory vectors for semantic search',
        },
      });

      logger.info('Vector storage service initialized successfully', {
        collection: memoryConfig.vectorStore.collection,
        dimension: memoryConfig.vectorStore.dimension,
      });
    } catch (error) {
      logger.error('Failed to initialize vector storage service:', error);
      throw error;
    }
  }

  /**
   * Store memory with vector embedding
   */
  async storeMemory(memory: ExtendedMemory): Promise<void> {
    if (!this.collection) {
      throw new Error('Vector storage not initialized');
    }

    try {
      const startTime = Date.now();

      // Generate embedding for the memory content
      const embedding = await this.generateEmbedding(memory.content);

      // Prepare metadata
      const metadata = {
        userId: memory.userId,
        type: memory.type,
        documentIds: memory.documentIds.join(','),
        emotionalTone: memory.versions[memory.versions.length - 1]?.emotionalTone || '',
        privacyLevel: memory.privacyLevel,
        activeVersion: memory.activeVersion,
        createdAt: memory.timestamp.toISOString(),
        characterCount: memory.content.length,
        themes: memory.versions[memory.versions.length - 1]?.narrativeElements.theme || '',
        storyBeat: memory.versions[memory.versions.length - 1]?.narrativeElements.story_beat || '',
      };

      // Store in ChromaDB
      await this.collection.add({
        ids: [memory.id],
        embeddings: [embedding],
        documents: [memory.content],
        metadatas: [metadata],
      });

      const duration = Date.now() - startTime;
      logger.debug('Memory stored in vector database', {
        memoryId: memory.id,
        userId: memory.userId,
        contentLength: memory.content.length,
        duration,
      });

    } catch (error) {
      logger.error('Failed to store memory in vector database:', error, {
        memoryId: memory.id,
        userId: memory.userId,
      });
      throw error;
    }
  }

  /**
   * Update existing memory in vector storage
   */
  async updateMemory(memory: ExtendedMemory): Promise<void> {
    if (!this.collection) {
      throw new Error('Vector storage not initialized');
    }

    try {
      // Delete existing entry
      await this.collection.delete({
        ids: [memory.id],
      });

      // Re-add with updated content
      await this.storeMemory(memory);

      logger.debug('Memory updated in vector database', {
        memoryId: memory.id,
        userId: memory.userId,
      });

    } catch (error) {
      logger.error('Failed to update memory in vector database:', error, {
        memoryId: memory.id,
        userId: memory.userId,
      });
      throw error;
    }
  }

  /**
   * Delete memory from vector storage
   */
  async deleteMemory(memoryId: string): Promise<void> {
    if (!this.collection) {
      throw new Error('Vector storage not initialized');
    }

    try {
      await this.collection.delete({
        ids: [memoryId],
      });

      logger.debug('Memory deleted from vector database', {
        memoryId,
      });

    } catch (error) {
      logger.error('Failed to delete memory from vector database:', error, {
        memoryId,
      });
      throw error;
    }
  }

  /**
   * Search memories using vector similarity
   */
  async searchMemories(query: ContextQuery): Promise<MemorySearchResult> {
    if (!this.collection) {
      throw new Error('Vector storage not initialized');
    }

    try {
      const startTime = Date.now();

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query.query);

      // Prepare where clause for filtering
      const whereClause: any = {
        userId: query.userId,
      };

      if (query.documentId) {
        whereClause.documentIds = { $contains: query.documentId };
      }

      // Apply additional filters
      if (query.filters && query.filters.length > 0) {
        query.filters.forEach(filter => {
          switch (filter.operator) {
            case 'eq':
              whereClause[filter.field] = filter.value;
              break;
            case 'neq':
              whereClause[filter.field] = { $ne: filter.value };
              break;
            case 'in':
              whereClause[filter.field] = { $in: filter.value };
              break;
            case 'nin':
              whereClause[filter.field] = { $nin: filter.value };
              break;
            case 'contains':
              whereClause[filter.field] = { $contains: filter.value };
              break;
          }
        });
      }

      // Perform vector search
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: query.maxResults || performanceConfig.vector.maxResults,
        where: whereClause,
        include: ['documents', 'metadatas', 'distances'],
      });

      // Convert results to ExtendedMemory format
      const memories: ExtendedMemory[] = [];
      if (results.ids[0] && results.documents[0] && results.metadatas[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const metadata = results.metadatas[0][i] as any;
          const distance = results.distances?.[0]?.[i] || 0;
          
          // Skip results below similarity threshold
          const similarity = 1 - distance;
          if (similarity < performanceConfig.vector.minSimilarity) {
            continue;
          }

          const memory: ExtendedMemory = {
            id: results.ids[0][i],
            userId: metadata.userId,
            content: results.documents[0][i] || '',
            embedding: [], // Not needed for search results
            type: metadata.type,
            documentIds: metadata.documentIds ? metadata.documentIds.split(',') : [],
            timestamp: new Date(metadata.createdAt),
            relevance: similarity,
            contradictions: [],
            versions: [], // Will be populated from graph if needed
            activeVersion: metadata.activeVersion,
            userPreference: 'latest',
            narrativeAnalysis: {
              character_development_stage: 'development',
              plot_progression: 0.5,
              theme_consistency: 0.8,
              emotional_arc: metadata.emotionalTone || '',
              story_coherence: 0.7,
            },
            privacyLevel: metadata.privacyLevel || 'private',
            encryptionRequired: metadata.privacyLevel === 'sensitive',
          };

          memories.push(memory);
        }
      }

      const queryTime = Date.now() - startTime;
      
      logger.debug('Vector search completed', {
        query: query.query,
        userId: query.userId,
        resultsCount: memories.length,
        queryTime,
      });

      return {
        memories,
        relationships: [], // Vector search doesn't return relationships
        totalCount: memories.length,
        queryTime,
        source: 'vector',
      };

    } catch (error) {
      logger.error('Vector search failed:', error, {
        query: query.query,
        userId: query.userId,
      });
      throw error;
    }
  }

  /**
   * Find similar memories to a given memory
   */
  async findSimilarMemories(
    memory: ExtendedMemory,
    threshold: number = 0.8,
    maxResults: number = 10
  ): Promise<ExtendedMemory[]> {
    if (!this.collection) {
      throw new Error('Vector storage not initialized');
    }

    try {
      const embedding = await this.generateEmbedding(memory.content);

      const results = await this.collection.query({
        queryEmbeddings: [embedding],
        nResults: maxResults + 1, // +1 to account for the original memory
        where: {
          userId: memory.userId,
          id: { $ne: memory.id }, // Exclude the original memory
        },
        include: ['documents', 'metadatas', 'distances'],
      });

      const similarMemories: ExtendedMemory[] = [];
      if (results.ids[0] && results.documents[0] && results.metadatas[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const distance = results.distances?.[0]?.[i] || 0;
          const similarity = 1 - distance;
          
          if (similarity >= threshold) {
            const metadata = results.metadatas[0][i] as any;
            
            const similarMemory: ExtendedMemory = {
              id: results.ids[0][i],
              userId: metadata.userId,
              content: results.documents[0][i] || '',
              embedding: [],
              type: metadata.type,
              documentIds: metadata.documentIds ? metadata.documentIds.split(',') : [],
              timestamp: new Date(metadata.createdAt),
              relevance: similarity,
              contradictions: [],
              versions: [],
              activeVersion: metadata.activeVersion,
              userPreference: 'latest',
              narrativeAnalysis: {
                character_development_stage: 'development',
                plot_progression: 0.5,
                theme_consistency: 0.8,
                emotional_arc: metadata.emotionalTone || '',
                story_coherence: 0.7,
              },
              privacyLevel: metadata.privacyLevel || 'private',
              encryptionRequired: metadata.privacyLevel === 'sensitive',
            };

            similarMemories.push(similarMemory);
          }
        }
      }

      return similarMemories;

    } catch (error) {
      logger.error('Failed to find similar memories:', error, {
        memoryId: memory.id,
        userId: memory.userId,
      });
      throw error;
    }
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openaiClient.embeddings.create({
        model: embeddingConfig.model,
        input: text.substring(0, embeddingConfig.maxTokens * 4), // Rough token limit
      });

      return response.data[0].embedding;

    } catch (error) {
      logger.error('Failed to generate embedding:', error, {
        textLength: text.length,
      });
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<any> {
    if (!this.collection) {
      throw new Error('Vector storage not initialized');
    }

    try {
      const count = await this.collection.count();
      return {
        totalMemories: count,
        collectionName: memoryConfig.vectorStore.collection,
        dimension: memoryConfig.vectorStore.dimension,
      };
    } catch (error) {
      logger.error('Failed to get vector storage stats:', error);
      throw error;
    }
  }
}