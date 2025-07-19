/**
 * Data synchronization service interface
 */

import { Result } from '@services/interfaces/common/result';
import { SyncableEntity, ProgressCallback } from '@services/interfaces/common/types';

export interface ISyncService {
  // Sync operations
  syncAll(options?: SyncOptions): Promise<Result<SyncResult>>;
  syncEntity<T extends SyncableEntity>(
    entityType: string,
    options?: SyncOptions
  ): Promise<Result<EntitySyncResult<T>>>;
  
  // Selective sync
  syncChanges(since: Date): Promise<Result<SyncResult>>;
  syncUser(userId: string): Promise<Result<SyncResult>>;
  
  // Sync status
  getLastSyncTime(): Promise<Result<Date | null>>;
  getSyncStatus(): Promise<Result<SyncStatus>>;
  getPendingChanges(): Promise<Result<PendingChanges>>;
  
  // Conflict handling
  getConflicts(): Promise<Result<SyncConflict[]>>;
  resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<Result<void>>;
  setConflictStrategy(strategy: ConflictStrategy): void;
  
  // Manual control
  pauseSync(): void;
  resumeSync(): void;
  forceSync(): Promise<Result<SyncResult>>;
  resetSync(): Promise<Result<void>>;
  
  // Configuration
  setSyncInterval(minutes: number): void;
  setSyncOnChange(enabled: boolean): void;
  setSyncOnConnect(enabled: boolean): void;
  
  // Events
  onSyncStart(callback: () => void): () => void;
  onSyncComplete(callback: (result: SyncResult) => void): () => void;
  onSyncError(callback: (error: SyncError) => void): () => void;
  onSyncProgress(callback: ProgressCallback): () => void;
  onConflict(callback: (conflict: SyncConflict) => void): () => void;
}

export interface SyncOptions {
  entities?: string[];
  force?: boolean;
  resolveConflicts?: boolean;
  batchSize?: number;
  progressCallback?: ProgressCallback;
}

export interface SyncResult {
  success: boolean;
  timestamp: Date;
  duration: number;
  entities: Record<string, EntitySyncResult<any>>;
  errors: SyncError[];
}

export interface EntitySyncResult<T> {
  entityType: string;
  pulled: {
    created: T[];
    updated: T[];
    deleted: string[];
    count: number;
  };
  pushed: {
    created: T[];
    updated: T[];
    deleted: string[];
    count: number;
  };
  conflicts: SyncConflict[];
  errors: Error[];
}

export interface SyncStatus {
  isRunning: boolean;
  isPaused: boolean;
  lastSync?: {
    timestamp: Date;
    duration: number;
    success: boolean;
  };
  nextSync?: Date;
  pendingOperations: number;
}

export interface PendingChanges {
  creates: Record<string, number>;
  updates: Record<string, number>;
  deletes: Record<string, number>;
  total: number;
}

export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: any;
  remoteVersion: any;
  conflictType: 'update' | 'delete';
  createdAt: Date;
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge';
  mergedData?: any;
}

export type ConflictStrategy = 
  | 'local_wins'
  | 'remote_wins'
  | 'latest_wins'
  | 'manual'
  | 'merge';

export interface SyncError {
  entityType?: string;
  entityId?: string;
  operation: 'push' | 'pull' | 'conflict';
  error: Error;
  timestamp: Date;
  retryable: boolean;
}