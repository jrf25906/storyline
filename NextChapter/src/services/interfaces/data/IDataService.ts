/**
 * Core data service interface for CRUD operations
 * Following Interface Segregation Principle - split into smaller interfaces
 */

import { Result } from '@services/interfaces/common/result';
import { 
  BaseEntity, 
  PaginationParams, 
  PaginatedResult, 
  QueryOptions,
  BatchOperation,
  OperationMetadata 
} from '@services/interfaces/common/types';

// Read operations
export interface IReadableDataService<T extends BaseEntity> {
  findById(id: string, options?: QueryOptions): Promise<Result<T | null>>;
  findOne(filter: Partial<T>, options?: QueryOptions): Promise<Result<T | null>>;
  findMany(filter: Partial<T>, options?: QueryOptions): Promise<Result<T[]>>;
  findPaginated(
    filter: Partial<T>,
    pagination: PaginationParams,
    options?: QueryOptions
  ): Promise<Result<PaginatedResult<T>>>;
  count(filter: Partial<T>): Promise<Result<number>>;
  exists(id: string): Promise<Result<boolean>>;
}

// Write operations
export interface IWritableDataService<T extends BaseEntity> {
  create(data: Omit<T, keyof BaseEntity>, metadata?: OperationMetadata): Promise<Result<T>>;
  update(id: string, data: Partial<T>, metadata?: OperationMetadata): Promise<Result<T>>;
  delete(id: string, metadata?: OperationMetadata): Promise<Result<void>>;
}

// Batch operations
export interface IBatchDataService<T extends BaseEntity> {
  createMany(data: Array<Omit<T, keyof BaseEntity>>, metadata?: OperationMetadata): Promise<Result<T[]>>;
  updateMany(updates: Array<{ id: string; data: Partial<T> }>, metadata?: OperationMetadata): Promise<Result<T[]>>;
  deleteMany(ids: string[], metadata?: OperationMetadata): Promise<Result<void>>;
  batch(operations: BatchOperation<T>, metadata?: OperationMetadata): Promise<Result<{
    created: T[];
    updated: T[];
    deleted: string[];
  }>>;
}

// Transaction support
export interface ITransactionalDataService {
  transaction<T>(fn: (tx: ITransaction) => Promise<T>): Promise<Result<T>>;
}

export interface ITransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

// Complete data service interface
export interface IDataService<T extends BaseEntity> extends 
  IReadableDataService<T>,
  IWritableDataService<T>,
  IBatchDataService<T>,
  ITransactionalDataService {
  
  // Additional utility methods
  clear(): Promise<Result<void>>;
  
  // Hook for extending functionality
  beforeCreate?(data: Omit<T, keyof BaseEntity>): Promise<Omit<T, keyof BaseEntity>>;
  afterCreate?(entity: T): Promise<void>;
  beforeUpdate?(id: string, data: Partial<T>): Promise<Partial<T>>;
  afterUpdate?(entity: T): Promise<void>;
  beforeDelete?(id: string): Promise<void>;
  afterDelete?(id: string): Promise<void>;
}

// Specialized interfaces for specific entity types
export interface IUserDataService extends IDataService<any> {
  findByEmail(email: string): Promise<Result<any | null>>;
  updateLastActive(userId: string): Promise<Result<void>>;
}

export interface IJobApplicationDataService extends IDataService<any> {
  findByStatus(status: string, userId: string): Promise<Result<any[]>>;
  updateStatus(id: string, status: string): Promise<Result<any>>;
  getStatusCounts(userId: string): Promise<Result<Record<string, number>>>;
}

export interface IMoodEntryDataService extends IDataService<any> {
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Result<any[]>>;
  getAverageMood(userId: string, days: number): Promise<Result<number>>;
  getMoodTrends(userId: string, days: number): Promise<Result<any>>;
}