import { BaseAdapter } from '@services/adapters/BaseAdapter';
import {
  IDataService,
  BaseEntity,
  Transaction,
  SyncEvent,
  SyncEventType,
  ConflictResolution,
  SyncOptions,
  Result,
  QueryOptions,
  PaginatedResponse,
  BatchResult,
  AppError,
  ErrorType,
  NetworkState,
  ServiceObserver,
  SyncStatus,
} from '@services/interfaces';
import { supabase } from '@services/api/supabase';
import { getDatabase, canWrite } from '@services/database/watermelon/database';
import { Database, Q } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';

/**
 * Supabase implementation of IDataService
 * Handles offline-first data sync with WatermelonDB
 */
export class SupabaseDataAdapter<T extends BaseEntity> 
  extends BaseAdapter 
  implements IDataService<T> {
  
  private db: Database | null = null;
  private tableName: string;
  private syncObservers: Set<ServiceObserver<SyncEvent>> = new Set();
  private networkObservers: Set<ServiceObserver<NetworkState>> = new Set();
  private networkState: NetworkState = NetworkState.UNKNOWN;
  private syncQueue: Map<string, () => Promise<void>> = new Map();
  private isSyncing = false;

  constructor(tableName: string) {
    super();
    this.tableName = tableName;
  }

  protected async onInitialize(): Promise<Result<void>> {
    try {
      // Initialize WatermelonDB
      this.db = await getDatabase();
      
      // Set up network monitoring
      const unsubscribe = NetInfo.addEventListener(state => {
        const newState = state.isConnected ? NetworkState.ONLINE : NetworkState.OFFLINE;
        if (newState !== this.networkState) {
          this.networkState = newState;
          this.notifyNetworkObservers(newState);
          
          // Auto-sync when coming online
          if (newState === NetworkState.ONLINE) {
            this.sync().catch(err => this.error('Auto-sync failed', err));
          }
        }
      });
      
      this.addDisposable(unsubscribe);
      
      // Check initial network state
      const state = await NetInfo.fetch();
      this.networkState = state.isConnected ? NetworkState.ONLINE : NetworkState.OFFLINE;
      
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async create(data: Omit<T, keyof BaseEntity>): Promise<Result<T>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    const canWriteCheck = await canWrite();
    if (!canWriteCheck) {
      return {
        success: false,
        error: new AppError(ErrorType.STORAGE_FULL, 'Storage limit exceeded'),
      };
    }

    try {
      const collection = this.db!.collections.get(this.tableName);
      let record: T;

      await this.db!.write(async () => {
        record = await collection.create((draft: any) => {
          Object.assign(draft, data);
          draft.syncStatus = SyncStatus.PENDING;
          draft.createdAt = new Date();
          draft.updatedAt = new Date();
        });
      });

      // Queue for sync if online
      if (this.networkState === NetworkState.ONLINE) {
        this.queueSync(record!.id, () => this.syncRecord(record!));
      }

      return { success: true, data: record! as T };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async createBatch(items: Array<Omit<T, keyof BaseEntity>>): Promise<Result<BatchResult<T>>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    const canWriteCheck = await canWrite();
    if (!canWriteCheck) {
      return {
        success: false,
        error: new AppError(ErrorType.STORAGE_FULL, 'Storage limit exceeded'),
      };
    }

    const successful: T[] = [];
    const failed: Array<{ item: T; error: AppError }> = [];

    try {
      await this.db!.write(async () => {
        const collection = this.db!.collections.get(this.tableName);
        
        for (const item of items) {
          try {
            const record = await collection.create((draft: any) => {
              Object.assign(draft, item);
              draft.syncStatus = SyncStatus.PENDING;
              draft.createdAt = new Date();
              draft.updatedAt = new Date();
            });
            successful.push(record as T);
          } catch (error) {
            failed.push({
              item: item as T,
              error: AppError.from(error),
            });
          }
        }
      });

      // Queue successful records for sync
      if (this.networkState === NetworkState.ONLINE) {
        successful.forEach(record => {
          this.queueSync(record.id, () => this.syncRecord(record));
        });
      }

      return { success: true, data: { successful, failed } };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async getById(id: string): Promise<Result<T | null>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      const collection = this.db!.collections.get(this.tableName);
      const record = await collection.find(id);
      return { success: true, data: record as T };
    } catch (error) {
      if (error.message?.includes('not found')) {
        return { success: true, data: null };
      }
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async getByIds(ids: string[]): Promise<Result<T[]>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      const collection = this.db!.collections.get(this.tableName);
      const records = await collection
        .query(Q.where('id', Q.oneOf(ids)))
        .fetch();
      return { success: true, data: records as T[] };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async query(options?: QueryOptions<T>): Promise<Result<PaginatedResponse<T>>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      const collection = this.db!.collections.get(this.tableName);
      let query = collection.query();

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.extend(Q.where(key, value));
          }
        });
      }

      // Apply sorting
      if (options?.sort) {
        const order = options.sort.order === 'desc' ? Q.desc : Q.asc;
        query = query.extend(Q.sortBy(options.sort.field as string, order));
      }

      // Get total count
      const allRecords = await query.fetch();
      const total = allRecords.length;

      // Apply pagination
      const page = options?.pagination?.page || 1;
      const limit = options?.pagination?.limit || 20;
      const offset = (page - 1) * limit;
      
      const paginatedRecords = allRecords.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          data: paginatedRecords as T[],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async getAll(): Promise<Result<T[]>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      const collection = this.db!.collections.get(this.tableName);
      const records = await collection.query().fetch();
      return { success: true, data: records as T[] };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<Result<T>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      const collection = this.db!.collections.get(this.tableName);
      let record: T;

      await this.db!.write(async () => {
        const existing = await collection.find(id);
        record = await existing.update((draft: any) => {
          Object.assign(draft, data);
          draft.syncStatus = SyncStatus.PENDING;
          draft.updatedAt = new Date();
        });
      });

      // Queue for sync if online
      if (this.networkState === NetworkState.ONLINE) {
        this.queueSync(record!.id, () => this.syncRecord(record!));
      }

      return { success: true, data: record! as T };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async updateBatch(
    updates: Array<{ id: string; data: Partial<Omit<T, keyof BaseEntity>> }>
  ): Promise<Result<BatchResult<T>>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    const successful: T[] = [];
    const failed: Array<{ item: T; error: AppError }> = [];

    try {
      await this.db!.write(async () => {
        for (const update of updates) {
          try {
            const collection = this.db!.collections.get(this.tableName);
            const existing = await collection.find(update.id);
            const record = await existing.update((draft: any) => {
              Object.assign(draft, update.data);
              draft.syncStatus = SyncStatus.PENDING;
              draft.updatedAt = new Date();
            });
            successful.push(record as T);
          } catch (error) {
            failed.push({
              item: { id: update.id } as T,
              error: AppError.from(error),
            });
          }
        }
      });

      // Queue successful records for sync
      if (this.networkState === NetworkState.ONLINE) {
        successful.forEach(record => {
          this.queueSync(record.id, () => this.syncRecord(record));
        });
      }

      return { success: true, data: { successful, failed } };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async delete(id: string): Promise<Result<void>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      await this.db!.write(async () => {
        const collection = this.db!.collections.get(this.tableName);
        const record = await collection.find(id);
        await record.update((draft: any) => {
          draft.deletedAt = new Date();
          draft.syncStatus = SyncStatus.PENDING;
        });
      });

      // Queue for sync if online
      if (this.networkState === NetworkState.ONLINE) {
        this.queueSync(id, () => this.syncDeletion(id));
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async deleteBatch(ids: string[]): Promise<Result<BatchResult<string>>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    const successful: string[] = [];
    const failed: Array<{ item: string; error: AppError }> = [];

    try {
      await this.db!.write(async () => {
        for (const id of ids) {
          try {
            const collection = this.db!.collections.get(this.tableName);
            const record = await collection.find(id);
            await record.update((draft: any) => {
              draft.deletedAt = new Date();
              draft.syncStatus = SyncStatus.PENDING;
            });
            successful.push(id);
          } catch (error) {
            failed.push({
              item: id,
              error: AppError.from(error),
            });
          }
        }
      });

      // Queue successful deletions for sync
      if (this.networkState === NetworkState.ONLINE) {
        successful.forEach(id => {
          this.queueSync(id, () => this.syncDeletion(id));
        });
      }

      return { success: true, data: { successful, failed } };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async hardDelete(id: string): Promise<Result<void>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      await this.db!.write(async () => {
        const collection = this.db!.collections.get(this.tableName);
        const record = await collection.find(id);
        await record.destroyPermanently();
      });

      // Remove from Supabase if online
      if (this.networkState === NetworkState.ONLINE) {
        await supabase.from(this.tableName).delete().eq('id', id);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async count(filters?: Partial<T>): Promise<Result<number>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      const collection = this.db!.collections.get(this.tableName);
      let query = collection.query();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.extend(Q.where(key, value));
          }
        });
      }

      const records = await query.fetchCount();
      return { success: true, data: records };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async exists(id: string): Promise<Result<boolean>> {
    const result = await this.getById(id);
    if (!result.success) return result;
    return { success: true, data: result.data !== null };
  }

  async beginTransaction(): Promise<Result<Transaction>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    // WatermelonDB handles transactions internally
    const transaction: Transaction = {
      commit: async () => {
        // No-op for WatermelonDB
      },
      rollback: async () => {
        // No-op for WatermelonDB
      },
    };

    return { success: true, data: transaction };
  }

  async withTransaction<R>(
    operation: (transaction: Transaction) => Promise<R>
  ): Promise<Result<R>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      let result: R;
      await this.db!.write(async () => {
        const transaction = await this.beginTransaction();
        if (transaction.success) {
          result = await operation(transaction.data);
        }
      });
      return { success: true, data: result! };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async sync(options?: SyncOptions): Promise<Result<void>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    if (this.networkState !== NetworkState.ONLINE) {
      return {
        success: false,
        error: new AppError(ErrorType.NETWORK_ERROR, 'Device is offline'),
      };
    }

    if (this.isSyncing) {
      return {
        success: false,
        error: new AppError(ErrorType.OPERATION_CANCELLED, 'Sync already in progress'),
      };
    }

    this.isSyncing = true;
    this.notifySyncObservers({
      type: SyncEventType.SYNC_STARTED,
      entityType: this.tableName,
    });

    try {
      // Get pending items
      const pendingResult = await this.getPendingSync();
      if (!pendingResult.success) {
        throw pendingResult.error;
      }

      const pendingItems = pendingResult.data;
      const total = pendingItems.length;

      // Sync each item
      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];
        
        this.notifySyncObservers({
          type: SyncEventType.SYNC_PROGRESS,
          entityType: this.tableName,
          entityId: item.id,
          progress: (i / total) * 100,
        });

        try {
          await this.syncRecord(item);
        } catch (error) {
          this.notifySyncObservers({
            type: SyncEventType.SYNC_FAILED,
            entityType: this.tableName,
            entityId: item.id,
            error: error as Error,
          });
        }
      }

      // Pull remote changes
      await this.pullRemoteChanges();

      this.notifySyncObservers({
        type: SyncEventType.SYNC_COMPLETED,
        entityType: this.tableName,
      });

      return { success: true, data: undefined };
    } catch (error) {
      this.notifySyncObservers({
        type: SyncEventType.SYNC_FAILED,
        entityType: this.tableName,
        error: error as Error,
      });
      return {
        success: false,
        error: AppError.from(error),
      };
    } finally {
      this.isSyncing = false;
    }
  }

  async getPendingSync(): Promise<Result<T[]>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      const collection = this.db!.collections.get(this.tableName);
      const records = await collection
        .query(Q.where('syncStatus', SyncStatus.PENDING))
        .fetch();
      return { success: true, data: records as T[] };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async getSyncStatus(): Promise<Result<{
    lastSyncedAt?: Date;
    pendingCount: number;
    failedCount: number;
  }>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      const collection = this.db!.collections.get(this.tableName);
      
      const pendingCount = await collection
        .query(Q.where('syncStatus', SyncStatus.PENDING))
        .fetchCount();
      
      const failedCount = await collection
        .query(Q.where('syncStatus', SyncStatus.FAILED))
        .fetchCount();

      const lastSyncedRecord = await collection
        .query(
          Q.where('syncStatus', SyncStatus.SYNCED),
          Q.sortBy('lastSyncedAt', Q.desc),
          Q.take(1)
        )
        .fetch();

      return {
        success: true,
        data: {
          lastSyncedAt: lastSyncedRecord[0]?.lastSyncedAt,
          pendingCount,
          failedCount,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async clearLocal(): Promise<Result<void>> {
    const initCheck = this.ensureInitialized();
    if (!initCheck.success) return initCheck;

    try {
      await this.db!.write(async () => {
        const collection = this.db!.collections.get(this.tableName);
        const allRecords = await collection.query().fetch();
        await this.db!.batch(
          ...allRecords.map(record => record.prepareDestroyPermanently())
        );
      });
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  async getStorageUsage(): Promise<Result<{
    used: number;
    limit: number;
    percentage: number;
  }>> {
    try {
      // This would need platform-specific implementation
      const mockUsed = 10 * 1024 * 1024; // 10MB
      const limit = 25 * 1024 * 1024; // 25MB
      
      return {
        success: true,
        data: {
          used: mockUsed,
          limit,
          percentage: (mockUsed / limit) * 100,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  subscribeSyncEvents(observer: ServiceObserver<SyncEvent>): () => void {
    this.syncObservers.add(observer);
    return () => {
      this.syncObservers.delete(observer);
    };
  }

  getNetworkState(): NetworkState {
    return this.networkState;
  }

  subscribeNetworkState(observer: ServiceObserver<NetworkState>): () => void {
    this.networkObservers.add(observer);
    return () => {
      this.networkObservers.delete(observer);
    };
  }

  // Private helper methods
  private notifySyncObservers(event: SyncEvent): void {
    this.syncObservers.forEach(observer => observer.onEvent(event));
  }

  private notifyNetworkObservers(state: NetworkState): void {
    this.networkObservers.forEach(observer => observer.onEvent(state));
  }

  private queueSync(id: string, syncFn: () => Promise<void>): void {
    this.syncQueue.set(id, syncFn);
    // Process queue after a delay to batch operations
    setTimeout(() => this.processSyncQueue(), 1000);
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.size === 0 || this.networkState !== NetworkState.ONLINE) {
      return;
    }

    const operations = Array.from(this.syncQueue.values());
    this.syncQueue.clear();

    await Promise.all(operations.map(op => op().catch(err => {
      this.error('Sync operation failed', err);
    })));
  }

  private async syncRecord(record: T): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert(this.prepareForSupabase(record))
        .select()
        .single();

      if (error) throw error;

      await this.db!.write(async () => {
        const collection = this.db!.collections.get(this.tableName);
        const localRecord = await collection.find(record.id);
        await localRecord.update((draft: any) => {
          draft.syncStatus = SyncStatus.SYNCED;
          draft.lastSyncedAt = new Date();
        });
      });
    } catch (error) {
      await this.db!.write(async () => {
        const collection = this.db!.collections.get(this.tableName);
        const localRecord = await collection.find(record.id);
        await localRecord.update((draft: any) => {
          draft.syncStatus = SyncStatus.FAILED;
          draft.syncError = error.message;
        });
      });
      throw error;
    }
  }

  private async syncDeletion(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      // Log error but don't update local record as it's already marked for deletion
      this.error('Failed to sync deletion', error);
      throw error;
    }
  }

  private async pullRemoteChanges(): Promise<void> {
    try {
      const lastSync = await this.getLastSyncTime();
      
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .gt('updatedAt', lastSync.toISOString())
        .order('updatedAt', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        await this.db!.write(async () => {
          const collection = this.db!.collections.get(this.tableName);
          
          for (const remoteRecord of data) {
            try {
              const existing = await collection.find(remoteRecord.id);
              await existing.update((draft: any) => {
                Object.assign(draft, this.prepareFromSupabase(remoteRecord));
                draft.syncStatus = SyncStatus.SYNCED;
                draft.lastSyncedAt = new Date();
              });
            } catch {
              // Record doesn't exist locally, create it
              await collection.create((draft: any) => {
                Object.assign(draft, this.prepareFromSupabase(remoteRecord));
                draft.syncStatus = SyncStatus.SYNCED;
                draft.lastSyncedAt = new Date();
              });
            }
          }
        });
      }
    } catch (error) {
      this.error('Failed to pull remote changes', error);
      throw error;
    }
  }

  private async getLastSyncTime(): Promise<Date> {
    try {
      const result = await this.getSyncStatus();
      return result.success && result.data.lastSyncedAt 
        ? result.data.lastSyncedAt 
        : new Date(0);
    } catch {
      return new Date(0);
    }
  }

  private prepareForSupabase(record: T): any {
    const data = { ...record };
    // Remove WatermelonDB specific fields
    delete (data as any)._raw;
    delete (data as any)._changed;
    delete (data as any).collection;
    return data;
  }

  private prepareFromSupabase(data: any): any {
    // Convert string dates to Date objects
    if (data.createdAt) data.createdAt = new Date(data.createdAt);
    if (data.updatedAt) data.updatedAt = new Date(data.updatedAt);
    if (data.deletedAt) data.deletedAt = new Date(data.deletedAt);
    if (data.lastSyncedAt) data.lastSyncedAt = new Date(data.lastSyncedAt);
    return data;
  }
}