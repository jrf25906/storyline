/**
 * Temporary compatibility layer for offlineStore migration
 * This file re-exports the refactored store while maintaining backward compatibility
 * 
 * TODO: Remove this file after all components have been updated to import from refactored/offlineStore
 */
export { 
  useOfflineStore,
  createOfflineAction,
  usePendingOfflineActions,
  useFailedOfflineActions,
  setActionProcessor 
} from './refactored/offlineStore';

// Re-export types for backward compatibility
export type { 
  IOfflineStore as OfflineState,
  OfflineAction,
  SyncResult,
  IActionProcessor 
} from './interfaces/offlineStore';

export { OfflineActionType } from './interfaces/offlineStore';