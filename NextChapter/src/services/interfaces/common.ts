/**
 * Common types and interfaces for all services
 */

/**
 * Result type for explicit error handling
 * Forces consumers to handle both success and error cases
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Standard error types across the application
 */
export enum ErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Auth errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  BIOMETRIC_NOT_AVAILABLE = 'BIOMETRIC_NOT_AVAILABLE',
  BIOMETRIC_FAILED = 'BIOMETRIC_FAILED',
  
  // Data errors
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  STORAGE_FULL = 'STORAGE_FULL',
  
  // AI/Coach errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONTENT_MODERATION_FAILED = 'CONTENT_MODERATION_FAILED',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
}

/**
 * Standard error class for consistent error handling
 */
export class AppError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }

  static from(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError(
        ErrorType.UNKNOWN_ERROR,
        error.message,
        { originalError: error.name }
      );
    }
    
    return new AppError(
      ErrorType.UNKNOWN_ERROR,
      'An unknown error occurred',
      { error: String(error) }
    );
  }
}

/**
 * Common timestamp interface for all entities
 */
export interface Timestamp {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync status for offline-first functionality
 */
export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
}

/**
 * Base interface for syncable entities
 */
export interface Syncable {
  syncStatus: SyncStatus;
  lastSyncedAt?: Date;
  syncError?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Sort options
 */
export interface SortOptions<T> {
  field: keyof T;
  order: 'asc' | 'desc';
}

/**
 * Query options for data operations
 */
export interface QueryOptions<T> {
  filters?: Partial<T>;
  sort?: SortOptions<T>;
  pagination?: PaginationParams;
  includeDeleted?: boolean;
}

/**
 * Batch operation result
 */
export interface BatchResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: AppError;
  }>;
}

/**
 * Observer pattern for service events
 */
export interface ServiceObserver<T> {
  onEvent(event: T): void;
}

/**
 * Disposable pattern for cleanup
 */
export interface Disposable {
  dispose(): Promise<void>;
}

/**
 * Service lifecycle interface
 */
export interface ServiceLifecycle extends Disposable {
  initialize(): Promise<Result<void>>;
  isInitialized(): boolean;
}

/**
 * Network state for offline-first features
 */
export enum NetworkState {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Storage limits
 */
export interface StorageLimits {
  softLimit: number; // 20MB - warning
  hardLimit: number; // 25MB - disable new entries
}

export const DEFAULT_STORAGE_LIMITS: StorageLimits = {
  softLimit: 20 * 1024 * 1024, // 20MB
  hardLimit: 25 * 1024 * 1024, // 25MB
};

/**
 * Encryption requirements for sensitive data
 */
export interface Encryptable {
  encrypted: boolean;
  encryptedFields?: string[];
}