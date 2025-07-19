import { BaseStore, BaseState, AsyncResult } from '@stores/interfaces/base';

/**
 * Offline action interface
 * Represents an action to be processed when back online
 */
export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Sync result interface
 * Reports the outcome of sync operations
 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors?: string[];
}

/**
 * Offline store state interface
 */
export interface OfflineState extends BaseState {
  isOnline: boolean;
  queue: OfflineAction[];
}

/**
 * Network status operations
 * Single Responsibility: Managing network state
 */
export interface NetworkStatusOperations {
  setOnlineStatus: (isOnline: boolean) => void;
}

/**
 * Queue management operations
 * Single Responsibility: Managing offline action queue
 */
export interface QueueOperations {
  addToQueue: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeFromQueue: (actionId: string) => void;
  clearQueue: () => void;
  getQueueSize: () => number;
}

/**
 * Sync operations
 * Single Responsibility: Processing and syncing offline actions
 */
export interface SyncOperations {
  processQueue: () => AsyncResult<SyncResult>;
  retryFailedActions: () => AsyncResult<SyncResult>;
}

/**
 * Action processor interface
 * For dependency injection of action processing logic
 */
export interface IActionProcessor {
  process(action: OfflineAction): Promise<void>;
}

/**
 * Complete offline store interface
 * Composed of all offline-related operations
 */
export interface IOfflineStore extends 
  BaseStore,
  OfflineState,
  NetworkStatusOperations,
  QueueOperations,
  SyncOperations {
  // Additional methods if needed
}

/**
 * Action types enum for type safety
 */
export enum OfflineActionType {
  COMPLETE_TASK = 'COMPLETE_TASK',
  UPDATE_BUDGET = 'UPDATE_BUDGET',
  ADD_JOB_APPLICATION = 'ADD_JOB_APPLICATION',
  UPDATE_MOOD = 'UPDATE_MOOD',
  SAVE_COACH_MESSAGE = 'SAVE_COACH_MESSAGE',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  SYNC_WELLNESS_ACTIVITY = 'SYNC_WELLNESS_ACTIVITY',
}