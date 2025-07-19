import {
  Result,
  QueryOptions,
  PaginatedResponse,
  BatchResult,
  ServiceLifecycle,
  Syncable,
  NetworkState,
  ServiceObserver,
} from '@services/interfaces/common';

/**
 * Base entity interface for all data models
 */
export interface BaseEntity extends Syncable {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Transaction support for complex operations
 */
export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Sync event types
 */
export enum SyncEventType {
  SYNC_STARTED = 'SYNC_STARTED',
  SYNC_PROGRESS = 'SYNC_PROGRESS',
  SYNC_COMPLETED = 'SYNC_COMPLETED',
  SYNC_FAILED = 'SYNC_FAILED',
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
}

/**
 * Sync event data
 */
export interface SyncEvent {
  type: SyncEventType;
  entityType: string;
  entityId?: string;
  progress?: number;
  error?: Error;
  conflictData?: {
    local: BaseEntity;
    remote: BaseEntity;
  };
}

/**
 * Sync conflict resolution strategies
 */
export enum ConflictResolution {
  LOCAL_WINS = 'LOCAL_WINS',
  REMOTE_WINS = 'REMOTE_WINS',
  MERGE = 'MERGE',
  ASK_USER = 'ASK_USER',
}

/**
 * Sync options
 */
export interface SyncOptions {
  entityTypes?: string[];
  conflictResolution?: ConflictResolution;
  force?: boolean;
}

/**
 * Data service interface for offline-first data operations
 * Implements repository pattern with sync support
 */
export interface IDataService<T extends BaseEntity> extends ServiceLifecycle {
  /**
   * Create a new entity
   */
  create(data: Omit<T, keyof BaseEntity>): Promise<Result<T>>;

  /**
   * Create multiple entities in a batch
   */
  createBatch(items: Array<Omit<T, keyof BaseEntity>>): Promise<Result<BatchResult<T>>>;

  /**
   * Get entity by ID
   */
  getById(id: string): Promise<Result<T | null>>;

  /**
   * Get multiple entities by IDs
   */
  getByIds(ids: string[]): Promise<Result<T[]>>;

  /**
   * Query entities with filters, sorting, and pagination
   */
  query(options?: QueryOptions<T>): Promise<Result<PaginatedResponse<T>>>;

  /**
   * Get all entities (use with caution for large datasets)
   */
  getAll(): Promise<Result<T[]>>;

  /**
   * Update an entity
   */
  update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<Result<T>>;

  /**
   * Update multiple entities in a batch
   */
  updateBatch(
    updates: Array<{ id: string; data: Partial<Omit<T, keyof BaseEntity>> }>
  ): Promise<Result<BatchResult<T>>>;

  /**
   * Soft delete an entity
   */
  delete(id: string): Promise<Result<void>>;

  /**
   * Soft delete multiple entities
   */
  deleteBatch(ids: string[]): Promise<Result<BatchResult<string>>>;

  /**
   * Permanently delete an entity
   */
  hardDelete(id: string): Promise<Result<void>>;

  /**
   * Count entities matching query
   */
  count(filters?: Partial<T>): Promise<Result<number>>;

  /**
   * Check if entity exists
   */
  exists(id: string): Promise<Result<boolean>>;

  /**
   * Start a transaction for multiple operations
   */
  beginTransaction(): Promise<Result<Transaction>>;

  /**
   * Execute operations within a transaction
   */
  withTransaction<R>(
    operation: (transaction: Transaction) => Promise<R>
  ): Promise<Result<R>>;

  /**
   * Sync local data with remote
   */
  sync(options?: SyncOptions): Promise<Result<void>>;

  /**
   * Get pending sync items
   */
  getPendingSync(): Promise<Result<T[]>>;

  /**
   * Get sync status
   */
  getSyncStatus(): Promise<Result<{
    lastSyncedAt?: Date;
    pendingCount: number;
    failedCount: number;
  }>>;

  /**
   * Clear all local data
   */
  clearLocal(): Promise<Result<void>>;

  /**
   * Get storage usage
   */
  getStorageUsage(): Promise<Result<{
    used: number;
    limit: number;
    percentage: number;
  }>>;

  /**
   * Subscribe to sync events
   */
  subscribeSyncEvents(observer: ServiceObserver<SyncEvent>): () => void;

  /**
   * Get current network state
   */
  getNetworkState(): NetworkState;

  /**
   * Subscribe to network state changes
   */
  subscribeNetworkState(observer: ServiceObserver<NetworkState>): () => void;
}

/**
 * Factory interface for creating model-specific data services
 */
export interface IDataServiceFactory {
  /**
   * Create a data service for a specific entity type
   */
  createService<T extends BaseEntity>(
    entityName: string,
    schema?: any
  ): IDataService<T>;

  /**
   * Get or create a cached service instance
   */
  getService<T extends BaseEntity>(entityName: string): IDataService<T>;

  /**
   * Initialize all registered services
   */
  initializeAll(): Promise<Result<void>>;

  /**
   * Dispose all services
   */
  disposeAll(): Promise<void>;
}