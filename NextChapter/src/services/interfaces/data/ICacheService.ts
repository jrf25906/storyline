/**
 * Cache service interface for performance optimization
 */

import { Result } from '@services/interfaces/common/result';
import { CacheOptions } from '@services/interfaces/common/types';

export interface ICacheService {
  // Basic operations
  get<T>(key: string): Promise<Result<T | null>>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<Result<void>>;
  delete(key: string): Promise<Result<void>>;
  has(key: string): Promise<Result<boolean>>;
  
  // Batch operations
  getMany<T>(keys: string[]): Promise<Result<Map<string, T>>>;
  setMany<T>(entries: Array<[string, T]>, options?: CacheOptions): Promise<Result<void>>;
  deleteMany(keys: string[]): Promise<Result<void>>;
  
  // Cache management
  clear(): Promise<Result<void>>;
  clearByTag(tag: string): Promise<Result<number>>; // Returns number of items cleared
  clearExpired(): Promise<Result<number>>;
  
  // Cache statistics
  getSize(): Promise<Result<number>>;
  getKeys(): Promise<Result<string[]>>;
  getStats(): Promise<Result<CacheStats>>;
  
  // Advanced features
  getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<Result<T>>;
  
  wrap<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T>; // Throws on error for easier integration
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  avgResponseTime: number;
}

// Memory cache with size limits
export interface IMemoryCache extends ICacheService {
  setMaxSize(bytes: number): void;
  getCurrentSize(): number;
}

// Persistent cache (disk-based)
export interface IPersistentCache extends ICacheService {
  getStoragePath(): string;
  compact(): Promise<Result<void>>;
}