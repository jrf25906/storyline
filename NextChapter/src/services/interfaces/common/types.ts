/**
 * Common types used across all service interfaces
 */

// Pagination
export interface PaginationParams {
  limit: number;
  offset: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Query options
export interface QueryOptions {
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filters?: Record<string, any>;
  includes?: string[];
}

// Timestamps
export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

// Soft delete
export interface SoftDeletable {
  deletedAt?: Date | null;
}

// Identifiable
export interface Identifiable {
  id: string;
}

// Base entity type
export type BaseEntity = Identifiable & Timestamped;

// Offline sync
export interface SyncableEntity extends BaseEntity {
  syncedAt?: Date | null;
  isDirty: boolean;
  isDeleted: boolean;
  version: number;
}

// Operation metadata
export interface OperationMetadata {
  userId?: string;
  deviceId?: string;
  timestamp: Date;
  source: 'online' | 'offline';
}

// Batch operations
export interface BatchOperation<T> {
  create?: T[];
  update?: Array<{ id: string; data: Partial<T> }>;
  delete?: string[];
}

// Cache options
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation
  priority?: 'low' | 'normal' | 'high';
}

// Network state
export interface NetworkState {
  isOnline: boolean;
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

// Progress tracking
export interface ProgressCallback {
  (progress: number, message?: string): void;
}

// Cancellation
export interface CancellationToken {
  isCancelled: boolean;
  cancel(): void;
  onCancel(callback: () => void): void;
}