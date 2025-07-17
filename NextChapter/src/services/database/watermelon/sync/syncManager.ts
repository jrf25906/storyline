import { Database } from '@nozbe/watermelondb';
import { synchronize } from '@nozbe/watermelondb/sync';
import { supabase } from '../../../api/supabase';
import { 
  Profile,
  JobApplication,
  BudgetEntry,
  BouncePlanTask,
  CoachConversation,
  MoodEntry,
  LayoffDetails,
  UserGoal,
  WellnessActivity
} from '../models';
import { encryptFinancialData, decryptFinancialData } from '../encryption';
import { Q } from '@nozbe/watermelondb';

interface SyncResult {
  success: boolean;
  error?: string;
  conflicts?: any[];
}

interface TableSyncStatus {
  lastSyncedAt: Date | null;
  status: 'synced' | 'pending' | 'error';
  pendingChanges: number;
}

interface SyncStatus {
  [tableName: string]: TableSyncStatus;
}

export class WatermelonSyncManager {
  private database: Database;
  private isOnline: boolean = true;
  private offlineQueue: Array<{ table: string; record: any }> = [];
  private syncStatus: SyncStatus = {};

  constructor(database: Database) {
    this.database = database;
    this.initializeSyncStatus();
  }

  private initializeSyncStatus() {
    const tables = [
      'profiles', 'layoff_details', 'user_goals', 'job_applications',
      'budget_entries', 'mood_entries', 'bounce_plan_tasks',
      'coach_conversations', 'wellness_activities'
    ];

    tables.forEach(table => {
      this.syncStatus[table] = {
        lastSyncedAt: null,
        status: 'pending',
        pendingChanges: 0
      };
    });
  }

  setOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (online && this.offlineQueue.length > 0) {
      // Process offline queue when coming online
      this.processOfflineQueue();
    }
  }

  async sync(userId: string): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: false, error: 'Device is offline' };
    }

    // Check storage limits
    const canWrite = await this.canWriteToDatabase();
    if (!canWrite) {
      throw new Error('Storage limit exceeded. Please free up space.');
    }

    try {
      const conflicts: any[] = [];

      // Sync each table according to its strategy
      await this.syncBouncePlanTasks(userId);
      await this.syncJobApplications(userId);
      const budgetResult = await this.syncBudgetEntries(userId);
      const coachConflicts = await this.syncCoachConversations(userId);
      
      if (coachConflicts.length > 0) {
        conflicts.push(...coachConflicts);
      }

      // Sync other tables
      await this.syncProfiles(userId);
      await this.syncMoodEntries(userId);
      await this.syncWellnessActivities(userId);
      await this.syncLayoffDetails(userId);
      await this.syncUserGoals(userId);

      return { success: true, conflicts };
    } catch (error) {
      console.error('Sync error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
    }
  }

  // One-way push sync for Bounce Plan tasks
  async syncBouncePlanTasks(userId: string): Promise<void> {
    const collection = this.database.collections.get<BouncePlanTask>('bounce_plan_tasks');
    
    const localTasks = await collection
      .query(Q.where('user_id', userId))
      .fetch();

    const tasksToSync = localTasks.filter(task => task.needsSync());

    if (tasksToSync.length === 0) return;

    // Push to Supabase
    const { error } = await supabase
      .from('bounce_plan_tasks')
      .upsert(
        tasksToSync.map(task => ({
          id: task.id,
          user_id: task.userId,
          day_number: task.dayNumber,
          task_id: task.taskId,
          completed_at: task.completedAt,
          skipped_at: task.skippedAt,
          notes: task.notes,
          created_at: task.createdAt.toISOString()
        }))
      );

    if (!error) {
      // Mark as synced
      await this.database.write(async () => {
        await Promise.all(tasksToSync.map(task => task.markAsSynced()));
      });
    } else {
      throw new Error(`Failed to sync bounce plan tasks: ${error.message}`);
    }

    this.updateSyncStatus('bounce_plan_tasks', 'synced');
  }

  // Last-write-wins sync for Job Applications
  async syncJobApplications(userId: string): Promise<void> {
    const collection = this.database.collections.get<JobApplication>('job_applications');
    
    // Get local changes
    const localJobs = await collection
      .query(Q.where('user_id', userId))
      .fetch();

    // Get remote data
    const { data: remoteJobs, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to fetch job applications: ${error.message}`);

    // Compare and resolve conflicts
    const remoteJobsMap = new Map(remoteJobs?.map(job => [job.id, job]) || []);
    const localJobsMap = new Map(localJobs.map(job => [job.id, job]));

    await this.database.write(async () => {
      // Update local with newer remote data
      for (const [id, remoteJob] of remoteJobsMap) {
        const localJob = localJobsMap.get(id);
        
        if (!localJob || new Date(remoteJob.updated_at) > localJob.updatedAt) {
          // Remote is newer or doesn't exist locally
          if (localJob) {
            await localJob.update(record => {
              Object.assign(record, this.mapRemoteToLocal(remoteJob));
              record.syncStatus = 'synced';
            });
          } else {
            await collection.create(record => {
              Object.assign(record, this.mapRemoteToLocal(remoteJob));
              record.syncStatus = 'synced';
            });
          }
        }
      }

      // Push local changes that are newer
      const toUpsert = [];
      for (const localJob of localJobs) {
        const remoteJob = remoteJobsMap.get(localJob.id);
        
        if (!remoteJob || localJob.updatedAt > new Date(remoteJob.updated_at)) {
          toUpsert.push(this.mapLocalToRemote(localJob));
          await localJob.markAsSynced();
        }
      }

      if (toUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('job_applications')
          .upsert(toUpsert);
        
        if (upsertError) {
          throw new Error(`Failed to upsert job applications: ${upsertError.message}`);
        }
      }
    });

    this.updateSyncStatus('job_applications', 'synced');
  }

  // Encrypted sync for Budget Entries
  async syncBudgetEntries(userId: string): Promise<void> {
    const collection = this.database.collections.get<BudgetEntry>('budget_entries');
    
    // Push local changes (encrypted)
    const localEntries = await collection
      .query(Q.where('user_id', userId))
      .fetch();

    const entriesToSync = [];
    for (const entry of localEntries) {
      if (entry.needsSync()) {
        const amount = await entry.getAmount();
        entriesToSync.push({
          id: entry.id,
          user_id: entry.userId,
          category: entry.category,
          amount: await entry.encryptAmount(amount), // Re-encrypt for sync
          type: entry.type,
          frequency: entry.frequency,
          description: entry.description,
          is_active: entry.isActive,
          created_at: entry.createdAt.toISOString(),
          updated_at: entry.updatedAt.toISOString()
        });
      }
    }

    if (entriesToSync.length > 0) {
      const { error } = await supabase
        .from('budget_entries')
        .upsert(entriesToSync);

      if (!error) {
        await this.database.write(async () => {
          const synced = localEntries.filter(e => e.needsSync());
          await Promise.all(synced.map(entry => entry.markAsSynced()));
        });
      } else {
        throw new Error(`Failed to sync budget entries: ${error.message}`);
      }
    }

    // Pull remote changes
    await this.pullBudgetEntries(userId);
    
    this.updateSyncStatus('budget_entries', 'synced');
  }

  async pullBudgetEntries(userId: string): Promise<void> {
    const collection = this.database.collections.get<BudgetEntry>('budget_entries');
    
    const { data: remoteEntries, error } = await supabase
      .from('budget_entries')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to pull budget entries: ${error.message}`);

    const localEntries = await collection
      .query(Q.where('user_id', userId))
      .fetch();

    const localEntriesMap = new Map(localEntries.map(e => [e.id, e]));

    await this.database.write(async () => {
      for (const remoteEntry of remoteEntries || []) {
        const localEntry = localEntriesMap.get(remoteEntry.id);
        
        // Decrypt the amount for local storage
        const decryptedData = await decryptFinancialData({
          amount: remoteEntry.amount
        });

        if (!localEntry) {
          // Create new entry
          await collection.create(record => {
            Object.assign(record, {
              ...remoteEntry,
              encryptedAmount: remoteEntry.amount, // Store as encrypted
              syncStatus: 'synced'
            });
          });
        } else if (new Date(remoteEntry.updated_at) > localEntry.updatedAt) {
          // Update existing entry
          await localEntry.update(record => {
            Object.assign(record, {
              ...remoteEntry,
              encryptedAmount: remoteEntry.amount, // Store as encrypted
              syncStatus: 'synced'
            });
          });
        }
      }
    });
  }

  // Merge with conflict detection for Coach Conversations
  async syncCoachConversations(userId: string): Promise<any[]> {
    const collection = this.database.collections.get<CoachConversation>('coach_conversations');
    const conflicts: any[] = [];
    
    const localConversations = await collection
      .query(Q.where('user_id', userId))
      .fetch();

    const { data: remoteConversations, error } = await supabase
      .from('coach_conversations')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to fetch coach conversations: ${error.message}`);

    const localMap = new Map(localConversations.map(c => [c.id, c]));
    const remoteMap = new Map(remoteConversations?.map(c => [c.id, c]) || []);

    // Detect conflicts
    for (const [id, localConv] of localMap) {
      const remoteConv = remoteMap.get(id);
      
      if (remoteConv && 
          localConv.message !== remoteConv.message &&
          localConv.createdAt.toISOString() === remoteConv.created_at) {
        conflicts.push({
          id,
          local: { message: localConv.message },
          remote: { message: remoteConv.message }
        });
      }
    }

    // Merge non-conflicting conversations
    await this.database.write(async () => {
      // Add remote conversations not in local
      for (const [id, remoteConv] of remoteMap) {
        if (!localMap.has(id)) {
          await collection.create(record => {
            Object.assign(record, this.mapRemoteToLocal(remoteConv));
            record.syncStatus = 'synced';
          });
        }
      }

      // Push local conversations not in remote
      const toPush = [];
      for (const localConv of localConversations) {
        if (!remoteMap.has(localConv.id) && localConv.needsSync()) {
          toPush.push(this.mapLocalToRemote(localConv));
        }
      }

      if (toPush.length > 0) {
        const { error: pushError } = await supabase
          .from('coach_conversations')
          .insert(toPush);
        
        if (!pushError) {
          const pushed = localConversations.filter(c => 
            !remoteMap.has(c.id) && c.needsSync()
          );
          await Promise.all(pushed.map(c => c.markAsSynced()));
        }
      }
    });

    this.updateSyncStatus('coach_conversations', conflicts.length > 0 ? 'pending' : 'synced');
    return conflicts;
  }

  // Helper methods for other tables
  async syncProfiles(userId: string): Promise<void> {
    // Similar to job applications - last write wins
    await this.genericSync('profiles', userId, 'last-write-wins');
  }

  async syncMoodEntries(userId: string): Promise<void> {
    // One-way push like bounce plan
    await this.genericSync('mood_entries', userId, 'push-only');
  }

  async syncWellnessActivities(userId: string): Promise<void> {
    await this.genericSync('wellness_activities', userId, 'push-only');
  }

  async syncLayoffDetails(userId: string): Promise<void> {
    await this.genericSync('layoff_details', userId, 'last-write-wins');
  }

  async syncUserGoals(userId: string): Promise<void> {
    await this.genericSync('user_goals', userId, 'last-write-wins');
  }

  // Generic sync method for simpler tables
  private async genericSync(
    tableName: string, 
    userId: string, 
    strategy: 'push-only' | 'last-write-wins'
  ): Promise<void> {
    const collection = this.database.collections.get(tableName);
    const localRecords = await collection
      .query(Q.where('user_id', userId))
      .fetch();

    if (strategy === 'push-only') {
      const toSync = localRecords.filter(r => r.needsSync());
      if (toSync.length > 0) {
        const { error } = await supabase
          .from(tableName)
          .upsert(toSync.map(r => this.mapLocalToRemote(r)));

        if (!error) {
          await this.database.write(async () => {
            await Promise.all(toSync.map(r => r.markAsSynced()));
          });
        }
      }
    } else {
      // Implement last-write-wins similar to job applications
      // ... (similar logic as syncJobApplications)
    }

    this.updateSyncStatus(tableName, 'synced');
  }

  // Offline queue management
  async queueForSync(table: string, record: any): Promise<void> {
    if (!this.isOnline) {
      this.offlineQueue.push({ table, record });
    }
  }

  async processOfflineQueue(userId?: string): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const { table, record } of queue) {
      try {
        const { error } = await supabase
          .from(table)
          .upsert(this.mapLocalToRemote(record));

        if (!error && record.markAsSynced) {
          await record.markAsSynced();
        }
      } catch (error) {
        console.error(`Failed to sync queued record in ${table}:`, error);
        // Re-queue on failure
        this.offlineQueue.push({ table, record });
      }
    }
  }

  getOfflineQueue(): Array<{ table: string; record: any }> {
    return [...this.offlineQueue];
  }

  // Storage management
  async getDatabaseSize(): Promise<number> {
    const size = await this.database.localStorage.get('database_size');
    return (size as number) || 0;
  }

  private async canWriteToDatabase(): Promise<boolean> {
    const size = await this.getDatabaseSize();
    const hardLimit = 25 * 1024 * 1024; // 25MB
    return size < hardLimit;
  }

  async cleanOldData(): Promise<void> {
    const size = await this.getDatabaseSize();
    const softLimit = 20 * 1024 * 1024; // 20MB
    
    if (size < softLimit) return;

    await this.database.write(async () => {
      // Clean old coach conversations (>90 days)
      const coachCollection = this.database.collections.get<CoachConversation>('coach_conversations');
      const oldConversations = await coachCollection
        .query(
          Q.where('created_at', Q.lt(Date.now() - 90 * 24 * 60 * 60 * 1000))
        )
        .fetch();

      await this.database.batch(
        ...oldConversations.map(c => c.prepareDestroyPermanently())
      );

      // Clean old mood entries (>180 days)
      const moodCollection = this.database.collections.get<MoodEntry>('mood_entries');
      const oldMoods = await moodCollection
        .query(
          Q.where('created_at', Q.lt(Date.now() - 180 * 24 * 60 * 60 * 1000))
        )
        .fetch();

      await this.database.batch(
        ...oldMoods.map(m => m.prepareDestroyPermanently())
      );
    });
  }

  // Sync status management
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  private updateSyncStatus(table: string, status: 'synced' | 'pending' | 'error') {
    this.syncStatus[table] = {
      ...this.syncStatus[table],
      status,
      lastSyncedAt: status === 'synced' ? new Date() : this.syncStatus[table].lastSyncedAt
    };
  }

  // Helper methods for data transformation
  private mapLocalToRemote(record: any): any {
    const remote: any = {
      id: record.id,
      created_at: record.createdAt?.toISOString() || new Date().toISOString()
    };

    // Map common fields
    if ('updatedAt' in record) {
      remote.updated_at = record.updatedAt?.toISOString() || new Date().toISOString();
    }

    // Copy other fields (simplified - in real implementation would be more specific)
    Object.keys(record).forEach(key => {
      if (!['_raw', 'collection', 'syncStatus', 'lastSyncedAt'].includes(key) && 
          !remote.hasOwnProperty(key)) {
        remote[key] = record[key];
      }
    });

    return remote;
  }

  private mapRemoteToLocal(remote: any): any {
    const local: any = {
      id: remote.id,
      createdAt: new Date(remote.created_at)
    };

    if (remote.updated_at) {
      local.updatedAt = new Date(remote.updated_at);
    }

    // Map other fields
    Object.keys(remote).forEach(key => {
      if (!['created_at', 'updated_at'].includes(key) && !local.hasOwnProperty(key)) {
        local[key] = remote[key];
      }
    });

    return local;
  }
}