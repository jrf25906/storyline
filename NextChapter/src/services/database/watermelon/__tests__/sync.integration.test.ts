import { Database } from '@nozbe/watermelondb';
import { WatermelonSyncManager } from '@services/database/watermelon/sync/syncManager';
import { supabase } from '@services/api/supabase';
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
} from '@services/database/watermelon/models';
import { encryptData, decryptData, encryptFinancialData, decryptFinancialData } from '@services/database/watermelon/encryption';
import { Q } from '@nozbe/watermelondb';

// Mock dependencies
jest.mock('../../../api/supabase');
jest.mock('../encryption');
jest.mock('react-native-keychain');

describe('WatermelonDB Offline Sync Integration Tests', () => {
  let syncManager: WatermelonSyncManager;
  let mockDatabase: Database;
  let mockSupabase: any;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    // Enhanced mock database with more realistic behavior
    mockDatabase = {
      write: jest.fn(async (fn) => await fn()),
      batch: jest.fn(async (...operations) => await Promise.all(operations)),
      localStorage: {
        get: jest.fn(),
        set: jest.fn()
      },
      collections: {
        get: jest.fn()
      }
    } as any;

    // Enhanced Supabase mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    (supabase as any) = mockSupabase;
    
    // Mock encryption functions
    (encryptData as jest.Mock).mockImplementation(async (data) => `encrypted_${JSON.stringify(data)}`);
    (decryptData as jest.Mock).mockImplementation(async (data) => {
      const match = data.match(/encrypted_(.+)/);
      return match ? JSON.parse(match[1]) : data;
    });
    (encryptFinancialData as jest.Mock).mockImplementation(async (data) => ({
      ...data,
      amount: data.amount ? `encrypted_${data.amount}` : undefined
    }));
    (decryptFinancialData as jest.Mock).mockImplementation(async (data) => ({
      ...data,
      amount: data.amount ? parseInt(data.amount.replace('encrypted_', '')) : undefined
    }));

    syncManager = new WatermelonSyncManager(mockDatabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Model Sync Behavior', () => {
    describe('Profile Sync', () => {
      it('should sync profile with last-write-wins strategy', async () => {
        const localProfile = {
          id: 'profile-1',
          userId: testUserId,
          firstName: 'John',
          lastName: 'Doe',
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          needsSync: () => true,
          markAsSynced: jest.fn(),
          update: jest.fn()
        };

        const remoteProfile = {
          id: 'profile-1',
          user_id: testUserId,
          first_name: 'Jane',
          last_name: 'Smith',
          updated_at: '2024-01-01T11:00:00Z'
        };

        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue([localProfile])
        };

        mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
        mockSupabase.select.mockResolvedValue({ data: [remoteProfile], error: null });

        await syncManager.syncProfiles(testUserId);

        // Remote is newer, should update local
        expect(localProfile.update).toHaveBeenCalled();
      });
    });

    describe('LayoffDetails Sync', () => {
      it('should sync layoff details with proper date handling', async () => {
        const localLayoffDetails = {
          id: 'layoff-1',
          userId: testUserId,
          layoffDate: new Date('2024-01-01'),
          severanceWeeks: 8,
          lastDayWorked: new Date('2023-12-31'),
          needsSync: () => true,
          markAsSynced: jest.fn()
        };

        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue([localLayoffDetails])
        };

        mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
        mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

        await syncManager.syncLayoffDetails(testUserId);

        expect(mockSupabase.upsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              layoff_date: '2024-01-01T00:00:00.000Z',
              last_day_worked: '2023-12-31T00:00:00.000Z',
              severance_weeks: 8
            })
          ])
        );
      });
    });

    describe('UserGoal Sync', () => {
      it('should handle goal sync with priority ordering', async () => {
        const userGoals = [
          {
            id: 'goal-1',
            userId: testUserId,
            goalType: 'job_search',
            targetValue: 10,
            currentValue: 3,
            priority: 1,
            needsSync: () => true,
            markAsSynced: jest.fn()
          },
          {
            id: 'goal-2',
            userId: testUserId,
            goalType: 'networking',
            targetValue: 5,
            currentValue: 1,
            priority: 2,
            needsSync: () => true,
            markAsSynced: jest.fn()
          }
        ];

        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue(userGoals)
        };

        mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
        mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

        await syncManager.syncUserGoals(testUserId);

        expect(mockSupabase.upsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ goal_type: 'job_search', priority: 1 }),
            expect.objectContaining({ goal_type: 'networking', priority: 2 })
          ])
        );
      });
    });

    describe('JobApplication Sync', () => {
      it('should handle concurrent modifications with last-write-wins', async () => {
        const baseTime = new Date('2024-01-01T10:00:00Z');
        
        const localJob = {
          id: 'job-1',
          userId: testUserId,
          company: 'Local Corp',
          position: 'Engineer',
          status: 'applied',
          updatedAt: new Date(baseTime.getTime() + 1000), // 1 second later
          needsSync: () => true,
          markAsSynced: jest.fn(),
          update: jest.fn()
        };

        const remoteJob = {
          id: 'job-1',
          user_id: testUserId,
          company: 'Local Corp',
          position: 'Senior Engineer',
          status: 'interviewing',
          updated_at: baseTime.toISOString() // Earlier
        };

        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue([localJob])
        };

        mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
        mockSupabase.select.mockResolvedValue({ data: [remoteJob], error: null });
        mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

        await syncManager.syncJobApplications(testUserId);

        // Local is newer, should push to remote
        expect(mockSupabase.upsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              company: 'Local Corp',
              position: 'Engineer',
              status: 'applied'
            })
          ])
        );
        expect(localJob.markAsSynced).toHaveBeenCalled();
      });
    });

    describe('BudgetEntry Sync with Encryption', () => {
      it('should encrypt financial data before sync', async () => {
        const budgetEntries = [
          {
            id: 'budget-1',
            userId: testUserId,
            category: 'rent',
            type: 'expense',
            frequency: 'monthly',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            getAmount: jest.fn().mockResolvedValue(2500),
            encryptAmount: jest.fn().mockResolvedValue('encrypted_2500'),
            needsSync: () => true,
            markAsSynced: jest.fn()
          },
          {
            id: 'budget-2',
            userId: testUserId,
            category: 'salary',
            type: 'income',
            frequency: 'monthly',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            getAmount: jest.fn().mockResolvedValue(5000),
            encryptAmount: jest.fn().mockResolvedValue('encrypted_5000'),
            needsSync: () => true,
            markAsSynced: jest.fn()
          }
        ];

        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue(budgetEntries)
        };

        mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
        mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

        await syncManager.syncBudgetEntries(testUserId);

        // Verify encryption was called
        expect(budgetEntries[0].getAmount).toHaveBeenCalled();
        expect(budgetEntries[0].encryptAmount).toHaveBeenCalledWith(2500);
        expect(budgetEntries[1].getAmount).toHaveBeenCalled();
        expect(budgetEntries[1].encryptAmount).toHaveBeenCalledWith(5000);

        // Verify encrypted data was sent
        expect(mockSupabase.upsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              category: 'rent',
              amount: 'encrypted_2500'
            }),
            expect.objectContaining({
              category: 'salary',
              amount: 'encrypted_5000'
            })
          ])
        );
      });

      it('should decrypt financial data when pulling from remote', async () => {
        const remoteEntries = [
          {
            id: 'budget-1',
            user_id: testUserId,
            category: 'rent',
            amount: 'encrypted_2500',
            type: 'expense',
            updated_at: new Date().toISOString()
          }
        ];

        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue([]),
          create: jest.fn()
        };

        mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
        mockSupabase.select.mockResolvedValue({ data: remoteEntries, error: null });

        await syncManager.pullBudgetEntries(testUserId);

        expect(decryptFinancialData).toHaveBeenCalledWith({
          amount: 'encrypted_2500'
        });

        expect(mockCollection.create).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    describe('MoodEntry Sync', () => {
      it('should implement one-way push for mood entries', async () => {
        const moodEntries = [
          {
            id: 'mood-1',
            userId: testUserId,
            mood: 'anxious',
            energyLevel: 3,
            notes: 'Worried about interviews',
            createdAt: new Date(),
            needsSync: () => true,
            markAsSynced: jest.fn()
          },
          {
            id: 'mood-2',
            userId: testUserId,
            mood: 'hopeful',
            energyLevel: 7,
            notes: 'Good networking event',
            createdAt: new Date(),
            needsSync: () => false,
            markAsSynced: jest.fn()
          }
        ];

        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue(moodEntries)
        };

        mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
        mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

        await syncManager.syncMoodEntries(testUserId);

        // Only sync entries that need sync
        expect(mockSupabase.upsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              mood: 'anxious',
              energy_level: 3
            })
          ])
        );
        expect(mockSupabase.upsert).toHaveBeenCalledWith(
          expect.not.arrayContaining([
            expect.objectContaining({
              mood: 'hopeful'
            })
          ])
        );
      });
    });

    describe('BouncePlanTask Sync', () => {
      it('should handle one-way push with completion tracking', async () => {
        const tasks = [
          {
            id: 'task-1',
            userId: testUserId,
            dayNumber: 1,
            taskId: 'day1_breathe',
            completedAt: new Date('2024-01-01T10:00:00Z'),
            skippedAt: null,
            notes: 'Felt calmer',
            createdAt: new Date(),
            needsSync: () => true,
            markAsSynced: jest.fn()
          },
          {
            id: 'task-2',
            userId: testUserId,
            dayNumber: 2,
            taskId: 'day2_review',
            completedAt: null,
            skippedAt: new Date('2024-01-02T10:00:00Z'),
            notes: 'Weekend, will do Monday',
            createdAt: new Date(),
            needsSync: () => true,
            markAsSynced: jest.fn()
          }
        ];

        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue(tasks)
        };

        mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
        mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

        await syncManager.syncBouncePlanTasks(testUserId);

        expect(mockSupabase.upsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              task_id: 'day1_breathe',
              completed_at: '2024-01-01T10:00:00.000Z',
              skipped_at: null
            }),
            expect.objectContaining({
              task_id: 'day2_review',
              completed_at: null,
              skipped_at: '2024-01-02T10:00:00.000Z'
            })
          ])
        );
      });
    });

    describe('CoachConversation Sync with Conflicts', () => {
      it('should detect and report conflicts for coach conversations', async () => {
        const localConversations = [
          {
            id: 'conv-1',
            userId: testUserId,
            message: 'Local: I need help with my resume',
            tone: 'pragmatist',
            isUser: true,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            needsSync: () => true,
            markAsSynced: jest.fn()
          },
          {
            id: 'conv-2',
            userId: testUserId,
            message: 'Local: Thanks for the advice',
            tone: null,
            isUser: true,
            createdAt: new Date('2024-01-01T10:05:00Z'),
            needsSync: () => true,
            markAsSynced: jest.fn()
          }
        ];

        const remoteConversations = [
          {
            id: 'conv-1',
            user_id: testUserId,
            message: 'Remote: I need help with interviewing', // Different message, same timestamp
            tone: 'pragmatist',
            is_user: true,
            created_at: '2024-01-01T10:00:00.000Z'
          },
          {
            id: 'conv-3',
            user_id: testUserId,
            message: 'New remote message',
            tone: 'hype',
            is_user: false,
            created_at: '2024-01-01T10:10:00.000Z'
          }
        ];

        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue(localConversations),
          create: jest.fn()
        };

        mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
        mockSupabase.select.mockResolvedValue({ data: remoteConversations, error: null });
        mockSupabase.insert.mockResolvedValue({ data: [], error: null });

        const conflicts = await syncManager.syncCoachConversations(testUserId);

        // Should detect conflict for conv-1
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0]).toMatchObject({
          id: 'conv-1',
          local: { message: 'Local: I need help with my resume' },
          remote: { message: 'Remote: I need help with interviewing' }
        });

        // Should create new remote conversation
        expect(mockCollection.create).toHaveBeenCalled();
      });
    });

    describe('WellnessActivity Sync', () => {
      it('should sync wellness activities with proper duration tracking', async () => {
        const activities = [
          {
            id: 'wellness-1',
            userId: testUserId,
            activityType: 'meditation',
            duration: 15,
            notes: 'Morning meditation',
            completedAt: new Date(),
            createdAt: new Date(),
            needsSync: () => true,
            markAsSynced: jest.fn()
          }
        ];

        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue(activities)
        };

        mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
        mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

        await syncManager.syncWellnessActivities(testUserId);

        expect(mockSupabase.upsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              activity_type: 'meditation',
              duration: 15
            })
          ])
        );
      });
    });
  });

  describe('Storage Limit Management', () => {
    it('should warn at 20MB soft limit', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockDatabase.localStorage.get.mockResolvedValue(21 * 1024 * 1024); // 21MB

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([])
      };
      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);

      await syncManager.sync(testUserId);

      // Should not throw but should warn
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should throw at 25MB hard limit', async () => {
      mockDatabase.localStorage.get.mockResolvedValue(25 * 1024 * 1024); // 25MB

      await expect(syncManager.sync(testUserId)).rejects.toThrow('Storage limit exceeded');
    });

    it('should clean old coach conversations after 90 days', async () => {
      mockDatabase.localStorage.get.mockResolvedValue(22 * 1024 * 1024); // 22MB

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago

      const oldConversations = [
        {
          id: 'old-conv-1',
          createdAt: oldDate,
          prepareDestroyPermanently: jest.fn().mockReturnValue({ execute: jest.fn() })
        }
      ];

      const mockCoachCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue(oldConversations)
      };

      mockDatabase.collections.get = jest.fn((name) => {
        if (name === 'coach_conversations') return mockCoachCollection;
        return {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue([])
        };
      });

      await syncManager.cleanOldData();

      expect(oldConversations[0].prepareDestroyPermanently).toHaveBeenCalled();
      expect(mockDatabase.batch).toHaveBeenCalled();
    });

    it('should clean old mood entries after 180 days', async () => {
      mockDatabase.localStorage.get.mockResolvedValue(22 * 1024 * 1024); // 22MB

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 200); // 200 days ago

      const oldMoods = [
        {
          id: 'old-mood-1',
          createdAt: oldDate,
          prepareDestroyPermanently: jest.fn().mockReturnValue({ execute: jest.fn() })
        }
      ];

      const mockMoodCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue(oldMoods)
      };

      mockDatabase.collections.get = jest.fn((name) => {
        if (name === 'mood_entries') return mockMoodCollection;
        return {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue([])
        };
      });

      await syncManager.cleanOldData();

      expect(oldMoods[0].prepareDestroyPermanently).toHaveBeenCalled();
      expect(mockDatabase.batch).toHaveBeenCalled();
    });
  });

  describe('Conflict Resolution Scenarios', () => {
    it('should handle multiple concurrent edits with last-write-wins', async () => {
      const now = new Date();
      
      const localJobs = [
        {
          id: 'job-1',
          userId: testUserId,
          company: 'Tech Corp',
          status: 'applied',
          updatedAt: new Date(now.getTime() - 1000), // 1 second ago
          needsSync: () => true,
          markAsSynced: jest.fn(),
          update: jest.fn()
        }
      ];

      const remoteJobs = [
        {
          id: 'job-1',
          user_id: testUserId,
          company: 'Tech Corp',
          status: 'interviewing',
          updated_at: now.toISOString() // Now (newer)
        }
      ];

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue(localJobs)
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.select.mockResolvedValue({ data: remoteJobs, error: null });

      await syncManager.syncJobApplications(testUserId);

      // Remote is newer, should update local
      expect(localJobs[0].update).toHaveBeenCalled();
    });

    it('should merge non-conflicting coach conversations', async () => {
      const localConversations = [
        {
          id: 'conv-1',
          userId: testUserId,
          message: 'Local message 1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          needsSync: () => true,
          markAsSynced: jest.fn()
        }
      ];

      const remoteConversations = [
        {
          id: 'conv-2',
          user_id: testUserId,
          message: 'Remote message 2',
          created_at: '2024-01-01T10:05:00Z'
        }
      ];

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue(localConversations),
        create: jest.fn()
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.select.mockResolvedValue({ data: remoteConversations, error: null });
      mockSupabase.insert.mockResolvedValue({ data: [], error: null });

      const conflicts = await syncManager.syncCoachConversations(testUserId);

      // No conflicts
      expect(conflicts).toHaveLength(0);
      
      // Should create remote conversation locally
      expect(mockCollection.create).toHaveBeenCalled();
      
      // Should push local conversation to remote
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe('Network Interruption Handling', () => {
    it('should queue changes when offline', async () => {
      syncManager.setOnlineStatus(false);

      const mockRecord = {
        id: 'job-1',
        company: 'Offline Corp',
        syncStatus: 'pending'
      };

      await syncManager.queueForSync('job_applications', mockRecord);

      const queue = syncManager.getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        table: 'job_applications',
        record: mockRecord
      });
    });

    it('should process offline queue when coming online', async () => {
      // Queue changes while offline
      syncManager.setOnlineStatus(false);
      
      const job = { id: 'job-1', company: 'Queued Corp', markAsSynced: jest.fn() };
      const budget = { id: 'budget-1', category: 'rent', markAsSynced: jest.fn() };
      
      await syncManager.queueForSync('job_applications', job);
      await syncManager.queueForSync('budget_entries', budget);

      // Mock successful sync
      mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

      // Come back online
      syncManager.setOnlineStatus(true);

      // Allow async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockSupabase.from).toHaveBeenCalledWith('job_applications');
      expect(mockSupabase.from).toHaveBeenCalledWith('budget_entries');
      expect(mockSupabase.upsert).toHaveBeenCalledTimes(2);
    });

    it('should handle sync failure during network interruption', async () => {
      syncManager.setOnlineStatus(true);

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([])
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      
      // Simulate network error
      mockSupabase.select.mockRejectedValue(new Error('Network error'));

      const result = await syncManager.sync(testUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should retry failed sync operations from offline queue', async () => {
      syncManager.setOnlineStatus(false);

      const record = { 
        id: 'retry-1', 
        table: 'job_applications',
        markAsSynced: jest.fn() 
      };

      await syncManager.queueForSync('job_applications', record);

      // First attempt fails
      mockSupabase.upsert.mockRejectedValueOnce(new Error('Network error'));
      
      syncManager.setOnlineStatus(true);
      await syncManager.processOfflineQueue();

      // Record should be re-queued
      expect(syncManager.getOfflineQueue()).toHaveLength(1);

      // Second attempt succeeds
      mockSupabase.upsert.mockResolvedValueOnce({ data: [], error: null });
      await syncManager.processOfflineQueue();

      // Queue should be empty
      expect(syncManager.getOfflineQueue()).toHaveLength(0);
    });
  });

  describe('Security Tests', () => {
    it('should never include raw financial data in sync', async () => {
      const budgetEntry = {
        id: 'budget-1',
        userId: testUserId,
        category: 'savings',
        type: 'income',
        getAmount: jest.fn().mockResolvedValue(10000),
        encryptAmount: jest.fn().mockResolvedValue('AES256_ENCRYPTED_10000'),
        needsSync: () => true,
        markAsSynced: jest.fn(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([budgetEntry])
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

      await syncManager.syncBudgetEntries(testUserId);

      // Verify raw amount was never sent
      const upsertCall = mockSupabase.upsert.mock.calls[0][0];
      expect(JSON.stringify(upsertCall)).not.toContain('10000');
      expect(upsertCall[0].amount).toBe('AES256_ENCRYPTED_10000');
    });

    it('should not log sensitive financial data', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const budgetEntry = {
        id: 'budget-1',
        userId: testUserId,
        category: 'account',
        accountNumber: '123456789',
        routingNumber: '987654321',
        getAmount: jest.fn().mockResolvedValue(50000),
        encryptAmount: jest.fn().mockResolvedValue('ENCRYPTED'),
        needsSync: () => true,
        markAsSynced: jest.fn(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([budgetEntry])
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

      await syncManager.syncBudgetEntries(testUserId);

      // Check console logs don't contain sensitive data
      const allLogs = [
        ...consoleSpy.mock.calls.flat(),
        ...errorSpy.mock.calls.flat()
      ].join(' ');

      expect(allLogs).not.toContain('123456789');
      expect(allLogs).not.toContain('987654321');
      expect(allLogs).not.toContain('50000');
    });

    it('should ensure financial data is never sent to AI', async () => {
      // This test verifies that budget/financial data is excluded from coach conversations
      const mockCoachCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([
          {
            id: 'conv-1',
            userId: testUserId,
            message: 'Help me with budgeting',
            tone: 'pragmatist',
            isUser: true,
            needsSync: () => true,
            markAsSynced: jest.fn()
          }
        ])
      };

      const mockBudgetCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([
          {
            id: 'budget-1',
            category: 'rent',
            getAmount: jest.fn().mockResolvedValue(2000)
          }
        ])
      };

      mockDatabase.collections.get = jest.fn((name) => {
        if (name === 'coach_conversations') return mockCoachCollection;
        if (name === 'budget_entries') return mockBudgetCollection;
        return { query: jest.fn().mockReturnThis(), fetch: jest.fn().mockResolvedValue([]) };
      });

      mockSupabase.select.mockResolvedValue({ data: [], error: null });
      mockSupabase.insert.mockResolvedValue({ data: [], error: null });

      await syncManager.syncCoachConversations(testUserId);

      // Verify coach sync doesn't access budget data
      expect(mockBudgetCollection.query).not.toHaveBeenCalled();
      expect(mockBudgetCollection.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sync gracefully', async () => {
      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([])
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const result = await syncManager.sync(testUserId);

      expect(result.success).toBe(true);
      expect(result.conflicts).toEqual([]);
    });

    it('should handle large batch sync', async () => {
      // Create 100 job applications
      const largeJobSet = Array.from({ length: 100 }, (_, i) => ({
        id: `job-${i}`,
        userId: testUserId,
        company: `Company ${i}`,
        position: `Position ${i}`,
        status: 'applied',
        updatedAt: new Date(),
        needsSync: () => i % 2 === 0, // Half need sync
        markAsSynced: jest.fn()
      }));

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue(largeJobSet)
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.select.mockResolvedValue({ data: [], error: null });
      mockSupabase.upsert.mockResolvedValue({ data: [], error: null });

      await syncManager.syncJobApplications(testUserId);

      // Should batch process
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.arrayContaining(
          largeJobSet
            .filter((_, i) => i % 2 === 0)
            .map(job => expect.objectContaining({ company: job.company }))
        )
      );
    });

    it('should handle partial sync failure', async () => {
      const mockCollections = {
        profiles: {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue([])
        },
        job_applications: {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockRejectedValue(new Error('Job sync failed'))
        },
        budget_entries: {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue([])
        }
      };

      mockDatabase.collections.get = jest.fn((name) => mockCollections[name] || mockCollections.profiles);
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const result = await syncManager.sync(testUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Job sync failed');
    });

    it('should handle sync with missing user ID', async () => {
      const result = await syncManager.sync('');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle database write failures', async () => {
      mockDatabase.write = jest.fn().mockRejectedValue(new Error('Database locked'));

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([{ id: '1', needsSync: () => true }])
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const result = await syncManager.sync(testUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database locked');
    });
  });

  describe('Performance Tests', () => {
    it('should complete sync within reasonable time for typical data set', async () => {
      const startTime = Date.now();

      // Mock typical user data set
      const mockCollections = {
        profiles: { data: [{ id: 'p1' }] },
        layoff_details: { data: [{ id: 'l1' }] },
        user_goals: { data: Array(3).fill({ id: 'g' }) },
        job_applications: { data: Array(20).fill({ id: 'j' }) },
        budget_entries: { data: Array(15).fill({ id: 'b' }) },
        mood_entries: { data: Array(30).fill({ id: 'm' }) },
        bounce_plan_tasks: { data: Array(30).fill({ id: 't' }) },
        coach_conversations: { data: Array(25).fill({ id: 'c' }) },
        wellness_activities: { data: Array(10).fill({ id: 'w' }) }
      };

      Object.entries(mockCollections).forEach(([name, config]) => {
        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue(config.data.map((d, i) => ({
            ...d,
            id: `${d.id}-${i}`,
            needsSync: () => false,
            markAsSynced: jest.fn()
          })))
        };

        mockDatabase.collections.get = jest.fn((collectionName) => {
          if (collectionName === name) return mockCollection;
          return { 
            query: jest.fn().mockReturnThis(), 
            where: jest.fn().mockReturnThis(),
            fetch: jest.fn().mockResolvedValue([]) 
          };
        });
      });

      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      await syncManager.sync(testUserId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Sync should complete within 5 seconds for typical data
      expect(duration).toBeLessThan(5000);
    });

    it('should batch database operations efficiently', async () => {
      const batchSize = 50;
      const records = Array.from({ length: batchSize }, (_, i) => ({
        id: `record-${i}`,
        prepareDestroyPermanently: jest.fn().mockReturnValue({ execute: jest.fn() })
      }));

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue(records)
      };

      mockDatabase.collections.get = jest.fn().mockReturnValue(mockCollection);
      mockDatabase.localStorage.get.mockResolvedValue(22 * 1024 * 1024);

      await syncManager.cleanOldData();

      // Should batch all operations in a single call
      expect(mockDatabase.batch).toHaveBeenCalledTimes(1);
      expect(mockDatabase.batch).toHaveBeenCalledWith(
        ...records.map(r => r.prepareDestroyPermanently())
      );
    });
  });

  describe('Sync Status Tracking', () => {
    it('should accurately track sync status for all tables', async () => {
      const tables = [
        'profiles', 'layoff_details', 'user_goals', 'job_applications',
        'budget_entries', 'mood_entries', 'bounce_plan_tasks',
        'coach_conversations', 'wellness_activities'
      ];

      tables.forEach(table => {
        const mockCollection = {
          query: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue([])
        };
        mockDatabase.collections.get = jest.fn((name) => 
          name === table ? mockCollection : { 
            query: jest.fn().mockReturnThis(), 
            fetch: jest.fn().mockResolvedValue([]) 
          }
        );
      });

      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      await syncManager.sync(testUserId);

      const status = syncManager.getSyncStatus();

      tables.forEach(table => {
        expect(status[table]).toBeDefined();
        expect(status[table].status).toBe('synced');
        expect(status[table].lastSyncedAt).toBeInstanceOf(Date);
        expect(status[table].pendingChanges).toBe(0);
      });
    });

    it('should update sync status on failure', async () => {
      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockRejectedValue(new Error('Fetch failed'))
      };

      mockDatabase.collections.get = jest.fn((name) => {
        if (name === 'job_applications') return mockCollection;
        return { 
          query: jest.fn().mockReturnThis(), 
          where: jest.fn().mockReturnThis(),
          fetch: jest.fn().mockResolvedValue([]) 
        };
      });

      await syncManager.sync(testUserId);

      const status = syncManager.getSyncStatus();
      expect(status.job_applications.status).toBe('error');
    });
  });
});