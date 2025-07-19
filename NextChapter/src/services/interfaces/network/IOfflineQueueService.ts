/**
 * Offline queue service for managing operations when offline
 */

import { Result } from '@services/interfaces/common/result';

export interface IOfflineQueueService {
  // Queue management
  enqueue<T = any>(operation: QueuedOperation<T>): Promise<Result<string>>;
  dequeue(operationId: string): Promise<Result<void>>;
  peek(): Promise<Result<QueuedOperation | null>>;
  
  // Batch operations
  enqueueMany<T = any>(operations: QueuedOperation<T>[]): Promise<Result<string[]>>;
  dequeueMany(operationIds: string[]): Promise<Result<void>>;
  
  // Queue info
  getQueueSize(): Promise<Result<number>>;
  getQueuedOperations(): Promise<Result<QueuedOperation[]>>;
  isQueued(operationId: string): Promise<Result<boolean>>;
  
  // Processing
  processQueue(): Promise<Result<ProcessingResult>>;
  processOperation(operationId: string): Promise<Result<OperationResult>>;
  retryFailedOperations(): Promise<Result<ProcessingResult>>;
  
  // Queue control
  pauseProcessing(): void;
  resumeProcessing(): void;
  isProcessing(): boolean;
  
  // Cleanup
  clearQueue(): Promise<Result<void>>;
  clearFailedOperations(): Promise<Result<void>>;
  pruneOldOperations(olderThan: Date): Promise<Result<number>>;
  
  // Events
  onOperationQueued(callback: (operation: QueuedOperation) => void): () => void;
  onOperationProcessed(callback: (result: OperationResult) => void): () => void;
  onOperationFailed(callback: (error: OperationError) => void): () => void;
  onQueueEmpty(callback: () => void): () => void;
}

export interface QueuedOperation<T = any> {
  id?: string;
  type: string;
  payload: T;
  metadata?: OperationMetadata;
  priority?: 'low' | 'normal' | 'high';
  maxRetries?: number;
  ttl?: number; // time to live in seconds
  requiresNetwork?: boolean;
  createdAt?: Date;
}

export interface OperationMetadata {
  userId?: string;
  deviceId?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface ProcessingResult {
  processed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: OperationError[];
}

export interface OperationResult {
  operationId: string;
  success: boolean;
  result?: any;
  error?: Error;
  retries: number;
  duration: number;
}

export interface OperationError {
  operationId: string;
  error: Error;
  retries: number;
  willRetry: boolean;
  nextRetryAt?: Date;
}

// Strategy for conflict resolution
export interface IConflictResolver<T = any> {
  resolve(
    local: T,
    remote: T,
    metadata: ConflictMetadata
  ): Promise<Result<ConflictResolution<T>>>;
}

export interface ConflictMetadata {
  localTimestamp: Date;
  remoteTimestamp: Date;
  operationType: string;
  userId?: string;
}

export interface ConflictResolution<T> {
  winner: 'local' | 'remote' | 'merged';
  result: T;
  requiresUserIntervention?: boolean;
}