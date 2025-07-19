import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '@services/database/watermelon/schema';
import { migrations } from '@services/database/watermelon/migrations';
import {
  Profile,
  LayoffDetails,
  UserGoal,
  JobApplication,
  BudgetEntry,
  MoodEntry,
  BouncePlanTask,
  CoachConversation,
  WellnessActivity
} from '@services/database/watermelon/models';

let database: Database | null = null;

// Model classes array
const modelClasses = [
  Profile,
  LayoffDetails,
  UserGoal,
  JobApplication,
  BudgetEntry,
  MoodEntry,
  BouncePlanTask,
  CoachConversation,
  WellnessActivity
];

// Initialize WatermelonDB
export async function initializeWatermelonDB(): Promise<Database> {
  if (database) {
    return database;
  }

  try {
    // Create adapter
    const adapter = new SQLiteAdapter({
      schema,
      migrations,
      dbName: 'nextchapter.db',
      onSetUpError: error => {
        console.error('Database setup error:', error);
        // Could attempt recovery or show user error
      }
    });

    // Create database instance
    database = new Database({
      adapter,
      modelClasses,
    });

    // Initialize storage tracking
    await initializeStorageTracking(database);

    console.log('WatermelonDB initialized successfully');
    return database;
  } catch (error) {
    console.error('Failed to initialize WatermelonDB:', error);
    throw error;
  }
}

// Get current database instance
export function getDatabase(): Database {
  if (!database) {
    throw new Error('Database not initialized. Call initializeWatermelonDB first.');
  }
  return database;
}

// Reset database (for testing or data cleanup)
export async function resetDatabase(): Promise<void> {
  if (database) {
    await database.write(async () => {
      await database!.unsafeResetDatabase();
    });
    database = null;
  }
}

// Storage tracking
async function initializeStorageTracking(db: Database): Promise<void> {
  // Set up periodic storage size checking
  setInterval(async () => {
    await checkStorageSize(db);
  }, 60000); // Check every minute

  // Initial check
  await checkStorageSize(db);
}

// Check database storage size
async function checkStorageSize(db: Database): Promise<void> {
  try {
    const size = await getDatabaseSize();
    await db.localStorage.set('database_size', size);

    // Check against limits
    const softLimit = 20 * 1024 * 1024; // 20MB
    const hardLimit = 25 * 1024 * 1024; // 25MB

    if (size >= hardLimit) {
      console.error('Database size exceeded hard limit');
      // Could trigger cleanup or prevent writes
    } else if (size >= softLimit) {
      console.warn(`Database size approaching storage limit: ${(size / 1024 / 1024).toFixed(2)}MB`);
      // Could show user warning
    }
  } catch (error) {
    console.error('Error checking storage size:', error);
  }
}

// Get database size (platform-specific implementation needed)
async function getDatabaseSize(): Promise<number> {
  // This is a placeholder - actual implementation would be platform-specific
  // For React Native, you might use react-native-fs or similar
  try {
    const mockSize = await database?.localStorage.get('database_size') || 0;
    return mockSize as number;
  } catch {
    return 0;
  }
}

// Storage limit enforcement
export async function canWrite(): Promise<boolean> {
  const size = await getDatabaseSize();
  const hardLimit = 25 * 1024 * 1024; // 25MB
  return size < hardLimit;
}

// Clean up old data when approaching limits
export async function cleanupOldData(): Promise<void> {
  const db = getDatabase();
  
  await db.write(async () => {
    // Clean coach conversations older than 90 days
    const coachCollection = db.collections.get<CoachConversation>('coach_conversations');
    const oldConversations = await coachCollection
      .query(Q => Q.where('created_at', Q.lt(Date.now() - 90 * 24 * 60 * 60 * 1000)))
      .fetch();
    
    await db.batch(...oldConversations.map(conv => conv.prepareDestroyPermanently()));
    
    // Clean completed bounce plan tasks older than 60 days
    const tasksCollection = db.collections.get<BouncePlanTask>('bounce_plan_tasks');
    const oldTasks = await tasksCollection
      .query(Q => 
        Q.and(
          Q.where('completed_at', Q.notEq(null)),
          Q.where('created_at', Q.lt(Date.now() - 60 * 24 * 60 * 60 * 1000))
        )
      )
      .fetch();
    
    await db.batch(...oldTasks.map(task => task.prepareDestroyPermanently()));
  });
}

// Export database instance getter
export { database };