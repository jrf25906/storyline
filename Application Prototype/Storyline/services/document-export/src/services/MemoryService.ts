import axios, { AxiosInstance } from 'axios';
import { Document } from '@storyline/shared-types';
import { logger } from '../utils/logger';

export interface MemoryServiceDocument extends Document {
  revisionHistory?: DocumentRevision[];
  comments?: DocumentComment[];
}

export interface DocumentRevision {
  id: string;
  documentId: string;
  version: number;
  content: string;
  changes: string;
  author: string;
  createdAt: Date;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  position: number;
  text: string;
  author: string;
  resolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface DocumentContent {
  document: MemoryServiceDocument;
  chapters?: DocumentChapter[];
  images?: DocumentImage[];
}

export interface DocumentChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
}

export interface DocumentImage {
  id: string;
  filename: string;
  url: string;
  caption?: string;
  position: number;
  width?: number;
  height?: number;
}

export class MemoryService {
  private static instance: MemoryService;
  private client: AxiosInstance;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.MEMORY_SERVICE_URL || 'http://localhost:3002';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'document-export-service/1.0.0'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config) => {
      logger.debug('Memory service request', {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params
      });
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Memory service response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('Memory service error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  /**
   * Get document with full content and metadata
   */
  public async getDocument(documentId: string, userId: string): Promise<DocumentContent> {
    try {
      logger.info('Retrieving document from memory service', { documentId, userId });

      const response = await this.client.get(`/documents/${documentId}`, {
        params: { userId, includeContent: true }
      });

      const document = response.data;

      // Get additional content (chapters, images, etc.)
      const [chaptersResponse, imagesResponse] = await Promise.allSettled([
        this.getDocumentChapters(documentId, userId),
        this.getDocumentImages(documentId, userId)
      ]);

      const chapters = chaptersResponse.status === 'fulfilled' ? chaptersResponse.value : [];
      const images = imagesResponse.status === 'fulfilled' ? imagesResponse.value : [];

      logger.info('Document retrieved successfully', {
        documentId,
        wordCount: document.metadata?.wordCount || 0,
        chaptersCount: chapters.length,
        imagesCount: images.length
      });

      return {
        document,
        chapters,
        images
      };
    } catch (error: any) {
      logger.error('Failed to retrieve document', {
        documentId,
        userId,
        error: error.message
      });
      throw new Error(`Failed to retrieve document: ${error.message}`);
    }
  }

  /**
   * Get document chapters in order
   */
  private async getDocumentChapters(documentId: string, userId: string): Promise<DocumentChapter[]> {
    try {
      const response = await this.client.get(`/documents/${documentId}/chapters`, {
        params: { userId }
      });

      return response.data.sort((a: DocumentChapter, b: DocumentChapter) => a.order - b.order);
    } catch (error) {
      logger.warn('Failed to retrieve document chapters', { documentId, error });
      return [];
    }
  }

  /**
   * Get document images
   */
  private async getDocumentImages(documentId: string, userId: string): Promise<DocumentImage[]> {
    try {
      const response = await this.client.get(`/documents/${documentId}/images`, {
        params: { userId }
      });

      return response.data.sort((a: DocumentImage, b: DocumentImage) => a.position - b.position);
    } catch (error) {
      logger.warn('Failed to retrieve document images', { documentId, error });
      return [];
    }
  }

  /**
   * Get document revision history
   */
  public async getDocumentRevisions(documentId: string, userId: string): Promise<DocumentRevision[]> {
    try {
      const response = await this.client.get(`/documents/${documentId}/revisions`, {
        params: { userId }
      });

      return response.data.sort((a: DocumentRevision, b: DocumentRevision) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      logger.warn('Failed to retrieve document revisions', { documentId, error });
      return [];
    }
  }

  /**
   * Get document comments
   */
  public async getDocumentComments(documentId: string, userId: string): Promise<DocumentComment[]> {
    try {
      const response = await this.client.get(`/documents/${documentId}/comments`, {
        params: { userId, includeResolved: true }
      });

      return response.data.sort((a: DocumentComment, b: DocumentComment) => a.position - b.position);
    } catch (error) {
      logger.warn('Failed to retrieve document comments', { documentId, error });
      return [];
    }
  }

  /**
   * Get multiple documents for batch export
   */
  public async getDocuments(documentIds: string[], userId: string): Promise<DocumentContent[]> {
    try {
      logger.info('Retrieving multiple documents from memory service', {
        documentIds,
        userId,
        count: documentIds.length
      });

      // Process documents in parallel with concurrency limit
      const concurrency = 5;
      const results: DocumentContent[] = [];
      
      for (let i = 0; i < documentIds.length; i += concurrency) {
        const batch = documentIds.slice(i, i + concurrency);
        const batchPromises = batch.map(id => this.getDocument(id, userId));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            logger.error('Failed to retrieve document in batch', {
              documentId: batch[index],
              error: result.reason
            });
          }
        });
      }

      logger.info('Batch document retrieval completed', {
        requested: documentIds.length,
        retrieved: results.length,
        failed: documentIds.length - results.length
      });

      return results;
    } catch (error: any) {
      logger.error('Failed to retrieve documents batch', {
        documentIds,
        userId,
        error: error.message
      });
      throw new Error(`Failed to retrieve documents: ${error.message}`);
    }
  }

  /**
   * Check if memory service is healthy
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      logger.warn('Memory service health check failed', { error });
      return false;
    }
  }
}