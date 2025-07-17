// Export database functions
export { 
  initializeWatermelonDB, 
  getDatabase, 
  resetDatabase,
  canWrite,
  cleanupOldData 
} from './database';

// Export schema
export { schema } from './schema';

// Export all models
export * from './models';

// Export sync manager
export { WatermelonSyncManager } from './sync/syncManager';

// Export encryption utilities
export { 
  encryptData, 
  decryptData, 
  hashData,
  encryptFinancialData,
  decryptFinancialData,
  clearEncryptionKey
} from './encryption';