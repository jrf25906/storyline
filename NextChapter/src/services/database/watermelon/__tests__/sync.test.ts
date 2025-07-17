import { Database } from '@nozbe/watermelondb';
import { synchronize } from '@nozbe/watermelondb/sync';
import { WatermelonSyncManager } from '../sync/syncManager';
import { supabase } from '../../../api/supabase';
import { 
  Profile,
  JobApplication,
  BudgetEntry,
  BouncePlanTask,
  CoachConversation
} from '../models';
import { encryptData, decryptData } from '../encryption';

// Mock dependencies
jest.mock('@nozbe/watermelondb/sync');
jest.mock('../../../api/supabase');
jest.mock('../encryption');

describe('WatermelonDB Sync', () => {
  let syncManager: WatermelonSyncManager;
  let mockDatabase: Database;
  let mockSupabase: any;

  beforeEach(() => {
    // Setup mocks
    mockDatabase = {
      write: jest.fn(async (fn) => await fn()),
      collections: {
        get: jest.fn()
      }
    } as any;

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    (supabase as any) = mockSupabase;
    (encryptData as jest.Mock).mockResolvedValue('encrypted_data');
    (decryptData as jest.Mock).mockResolvedValue('decrypted_data');

    syncManager = new WatermelonSyncManager(mockDatabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Sync Strategies', () => {
    it('should implement one-way push for bounce plan tasks', async () => {
      const mockTasks = [
        { id: '1', task_id: 'day1_breathe', completed_at: new Date().toISOString() },
        { id: '2', task_id: 'day2_review', skipped_at: new Date().toISOString() }
      ];

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue(mockTasks)
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.upsert = jest.fn().mockResolvedValue({ data: mockTasks, error: null });

      await syncManager.syncBouncePlanTasks('user123');

      expect(mockSupabase.from).toHaveBeenCalledWith('bounce_plan_tasks');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ task_id: 'day1_breathe' }),
        expect.objectContaining({ task_id: 'day2_review' })
      ]));
    });

    it('should implement last-write-wins for job applications', async () => {
      const localJob = {
        id: '1',
        company: 'Local Company',
        updated_at: '2024-01-01T12:00:00Z',
        _raw: { updated_at: 1704110400000 }
      };

      const remoteJob = {
        id: '1',
        company: 'Remote Company',
        updated_at: '2024-01-01T13:00:00Z'
      };

      const mockCollection = {
        find: jest.fn().mockResolvedValue(localJob),
        query: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([localJob])
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.select.mockResolvedValue({ data: [remoteJob], error: null });

      await syncManager.syncJobApplications('user123');

      // Remote job is newer, should update local
      expect(mockDatabase.write).toHaveBeenCalled();
      expect(localJob.update).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should merge coach conversations with conflict alerts', async () => {
      const localConversations = [
        { id: '1', message: 'Local message', created_at: '2024-01-01T12:00:00Z' },
        { id: '2', message: 'Another local', created_at: '2024-01-01T12:30:00Z' }
      ];

      const remoteConversations = [
        { id: '1', message: 'Remote message', created_at: '2024-01-01T12:00:00Z' },
        { id: '3', message: 'New remote', created_at: '2024-01-01T13:00:00Z' }
      ];

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue(localConversations)
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.select.mockResolvedValue({ data: remoteConversations, error: null });

      const conflicts = await syncManager.syncCoachConversations('user123');

      expect(conflicts).toHaveLength(1); // Conflict for id '1'
      expect(conflicts[0]).toMatchObject({
        id: '1',
        local: { message: 'Local message' },
        remote: { message: 'Remote message' }
      });
    });

    it('should encrypt financial data before sync', async () => {
      const budgetEntry = {
        id: '1',
        category: 'Rent',
        amount: 2000,
        type: 'expense'
      };

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([budgetEntry])
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.upsert = jest.fn().mockResolvedValue({ data: [], error: null });

      await syncManager.syncBudgetEntries('user123');

      expect(encryptData).toHaveBeenCalledWith(2000);
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            amount: 'encrypted_data'
          })
        ])
      );
    });
  });

  describe('Sync Pull Operations', () => {
    it('should pull and decrypt financial data', async () => {
      const encryptedRemoteData = [
        {
          id: '1',
          category: 'Rent',
          amount: 'encrypted_amount',
          type: 'expense'
        }
      ];

      mockSupabase.select.mockResolvedValue({ data: encryptedRemoteData, error: null });
      (decryptData as jest.Mock).mockResolvedValue(2000);

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([]),
        create: jest.fn()
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);

      await syncManager.pullBudgetEntries('user123');

      expect(decryptData).toHaveBeenCalledWith('encrypted_amount');
      expect(mockCollection.create).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle sync errors gracefully', async () => {
      mockSupabase.select.mockResolvedValue({ 
        data: null, 
        error: { message: 'Network error' } 
      });

      const result = await syncManager.sync('user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('Sync Status Management', () => {
    it('should track sync status for each table', async () => {
      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([]),
        update: jest.fn()
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      await syncManager.sync('user123');

      const status = await syncManager.getSyncStatus();
      
      expect(status).toHaveProperty('profiles');
      expect(status).toHaveProperty('job_applications');
      expect(status).toHaveProperty('budget_entries');
      expect(status).toHaveProperty('bounce_plan_tasks');
      
      Object.values(status).forEach(tableStatus => {
        expect(tableStatus).toHaveProperty('lastSyncedAt');
        expect(tableStatus).toHaveProperty('status');
        expect(tableStatus).toHaveProperty('pendingChanges');
      });
    });

    it('should mark records as synced after successful sync', async () => {
      const mockRecord = {
        id: '1',
        markAsSynced: jest.fn(),
        syncStatus: 'pending'
      };

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([mockRecord])
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.upsert = jest.fn().mockResolvedValue({ data: [mockRecord], error: null });

      await syncManager.sync('user123');

      expect(mockRecord.markAsSynced).toHaveBeenCalled();
    });

    it('should mark records as failed on sync error', async () => {
      const mockRecord = {
        id: '1',
        markAsFailed: jest.fn(),
        syncStatus: 'pending'
      };

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([mockRecord])
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.upsert = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Sync failed' } 
      });

      await syncManager.sync('user123');

      expect(mockRecord.markAsFailed).toHaveBeenCalled();
    });
  });

  describe('Offline Queue Management', () => {
    it('should queue changes when offline', async () => {
      // Simulate offline
      syncManager.setOnlineStatus(false);

      const mockRecord = {
        id: '1',
        syncStatus: 'pending'
      };

      await syncManager.queueForSync('job_applications', mockRecord);

      const queue = await syncManager.getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        table: 'job_applications',
        record: mockRecord
      });
    });

    it('should process offline queue when coming online', async () => {
      // Queue some changes while offline
      syncManager.setOnlineStatus(false);
      await syncManager.queueForSync('job_applications', { id: '1' });
      await syncManager.queueForSync('budget_entries', { id: '2' });

      // Come back online
      syncManager.setOnlineStatus(true);
      
      mockSupabase.upsert = jest.fn().mockResolvedValue({ data: [], error: null });

      await syncManager.processOfflineQueue('user123');

      expect(mockSupabase.from).toHaveBeenCalledWith('job_applications');
      expect(mockSupabase.from).toHaveBeenCalledWith('budget_entries');
      expect(mockSupabase.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Storage Limits', () => {
    it('should check storage before sync', async () => {
      // Mock storage at 21MB (over soft limit)
      jest.spyOn(syncManager, 'getDatabaseSize').mockResolvedValue(21 * 1024 * 1024);
      const warnSpy = jest.spyOn(console, 'warn');

      await syncManager.sync('user123');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Storage warning'));
    });

    it('should prevent sync at hard limit', async () => {
      // Mock storage at 25MB (hard limit)
      jest.spyOn(syncManager, 'getDatabaseSize').mockResolvedValue(25 * 1024 * 1024);

      await expect(syncManager.sync('user123')).rejects.toThrow('Storage limit exceeded');
    });

    it('should clean old data when approaching limit', async () => {
      jest.spyOn(syncManager, 'getDatabaseSize').mockResolvedValue(22 * 1024 * 1024);
      
      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        destroyPermanently: jest.fn()
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);

      await syncManager.cleanOldData();

      // Should clean old coach conversations (>90 days)
      expect(mockCollection.where).toHaveBeenCalledWith(
        'created_at',
        expect.any(Function)
      );
      expect(mockCollection.destroyPermanently).toHaveBeenCalled();
    });
  });
});