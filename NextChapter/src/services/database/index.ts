// Export all database services
export * from './bouncePlan';
export * from './jobApplications';
export * from './coachService';

// Export WatermelonDB functionality
export * from './watermelon';

// Import WatermelonDB initialization
import { initializeWatermelonDB, getDatabase } from '@services/database/watermelon';
import { WatermelonSyncManager } from '@services/database/watermelon/sync/syncManager';

// Global sync manager instance
let syncManager: WatermelonSyncManager | null = null;

// Initialize database with WatermelonDB for offline storage
export async function initializeDatabase() {
  try {
    console.log('Initializing WatermelonDB for offline storage...');
    
    // Initialize WatermelonDB
    const database = await initializeWatermelonDB();
    
    // Create sync manager
    syncManager = new WatermelonSyncManager(database);
    
    // Listen for network status changes
    // Note: In a real app, you'd use NetInfo from @react-native-community/netinfo
    // syncManager.setOnlineStatus(isOnline);
    
    console.log('Database initialization complete - WatermelonDB + Supabase');
    return database;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Export sync manager getter
export function getSyncManager(): WatermelonSyncManager {
  if (!syncManager) {
    throw new Error('Sync manager not initialized. Call initializeDatabase first.');
  }
  return syncManager;
}

// Convenience function to sync data
export async function syncDatabase(userId: string) {
  const manager = getSyncManager();
  return manager.sync(userId);
}