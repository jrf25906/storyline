import { BaseStore, BaseState, AsyncResult } from '@stores/interfaces/base';
import { BouncePlanTask } from '@types/database';

/**
 * Task progress tracking interface
 */
export interface TaskProgress {
  taskId: string;
  completed: boolean;
  skipped: boolean;
  notes?: string;
  completedAt?: string;
  skippedAt?: string;
}

/**
 * Offline operation for queue
 */
export interface OfflineOperation {
  id: string;
  type: 'complete' | 'skip' | 'reopen';
  taskId: string;
  timestamp: Date;
  data?: {
    notes?: string;
  };
}

/**
 * Bounce plan calculations interface
 * Separates calculation logic from state management
 */
export interface BouncePlanCalculations {
  getTaskStatus: (taskId: string) => TaskProgress | undefined;
  getCompletedTasksCount: () => number;
  getSkippedTasksCount: () => number;
  getCompletionRate: () => number;
  getDaysActive: () => number;
  canAccessTask: (dayNumber: number) => boolean;
}

/**
 * Task operations interface
 * Handles task-related actions
 */
export interface TaskOperations {
  loadProgress: (userId: string) => AsyncResult;
  completeTask: (userId: string, taskId: string, notes?: string) => AsyncResult;
  skipTask: (userId: string, taskId: string, notes?: string) => AsyncResult;
  undoTaskAction: (userId: string, taskId: string) => AsyncResult;
  syncProgress: (userId: string) => AsyncResult;
  resetProgress: (userId: string) => AsyncResult;
}

/**
 * Local state management interface
 */
export interface LocalStateOperations {
  setCurrentDay: (day: number) => void;
  updateLocalProgress: (taskId: string, progress: Partial<TaskProgress>) => void;
  clearLocalProgress: () => void;
}

/**
 * Offline queue operations interface
 */
export interface OfflineQueueOperations {
  addToOfflineQueue: (operation: Omit<OfflineOperation, 'id' | 'timestamp'>) => void;
  clearOfflineQueue: () => void;
  getOfflineQueueSize: () => number;
  getOfflineQueue: () => OfflineOperation[];
  processOfflineQueue: (userId: string) => AsyncResult;
  getSyncStatus: () => { pendingOperations: number; lastSync?: Date };
}

/**
 * Analytics operations interface
 */
export interface AnalyticsOperations {
  getStats: (userId: string) => AsyncResult;
}

/**
 * Plan management operations interface
 */
export interface PlanManagementOperations {
  initializePlan: (startDate: Date) => void;
  syncToDatabase: (userId: string) => Promise<boolean>;
  resetPlan: () => void;
}

/**
 * Bounce plan store state interface
 */
export interface BouncePlanStoreState extends BaseState {
  // Core data
  tasks: BouncePlanTask[];
  localProgress: Record<string, TaskProgress>;
  
  // Plan configuration
  startDate: Date | null;
  currentDay: number;
  
  // Sync state
  isSyncing: boolean;
  lastSyncTime: Date | null;
  offlineQueue: OfflineOperation[];
}

/**
 * Complete bounce plan store interface
 * Combines all bounce plan functionality
 */
export interface BouncePlanStore extends 
  BaseStore,
  BouncePlanStoreState,
  BouncePlanCalculations,
  TaskOperations,
  LocalStateOperations,
  OfflineQueueOperations,
  AnalyticsOperations,
  PlanManagementOperations {}