// Mock dependencies first before any imports
jest.mock('../../../../stores/bouncePlanStore');
jest.mock('../../../../stores/jobTrackerStore');
jest.mock('../../../../stores/budgetStore');
jest.mock('../../../../stores/wellnessStore');
jest.mock('../../../../stores/coachStore');
jest.mock('../../../../utils/encryption');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../../budget/budgetService');

// Mock supabase before importing anything that uses it
jest.mock('../../../api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      upsert: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    })),
  },
}));

// Now import everything
import { syncManager } from '@services/database/sync/syncManager';
import { useBouncePlanStore } from '@stores/bouncePlanStore';
import { useJobTrackerStore } from '@stores/jobTrackerStore';
import { useBudgetStore } from '@stores/budgetStore';
import { useWellnessStore } from '@stores/wellnessStore';
import { useCoachStore } from '@stores/coachStore';
import { supabase } from '@services/api/supabase';
import { encryptData } from '@utils/encryption';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('syncManager', () => {
  const mockUser = { id: 'test-user-id' };

  // Helper to create default store mocks
  const createDefaultStoreMocks = () => ({
    bouncePlan: {
      getOfflineQueueSize: jest.fn().mockReturnValue(0),
      processOfflineQueue: jest.fn().mockResolvedValue(true),
      syncToDatabase: jest.fn().mockResolvedValue(true),
      getSyncStatus: jest.fn().mockReturnValue({ pendingOperations: 0 }),
      getOfflineQueue: jest.fn().mockReturnValue([])
    },
    jobTracker: {
      hasPendingSyncs: jest.fn().mockReturnValue(false),
      getSyncStatus: jest.fn().mockReturnValue({ pendingOperations: 0 }),
      getOfflineQueue: jest.fn().mockReturnValue([]),
      getOfflineApplications: jest.fn().mockReturnValue([]),
      getPendingSyncApplications: jest.fn().mockReturnValue([])
    },
    budget: {
      hasPendingChanges: jest.fn().mockReturnValue(false),
      getSyncStatus: jest.fn().mockReturnValue({ pendingOperations: 0 }),
      getOfflineQueue: jest.fn().mockReturnValue([]),
      budgetData: null
    },
    wellness: {
      hasPendingSyncs: jest.fn().mockReturnValue(false),
      getSyncStatus: jest.fn().mockReturnValue({ pendingOperations: 0 }),
      getOfflineQueue: jest.fn().mockReturnValue([]),
      getPendingSyncMoods: jest.fn().mockReturnValue([])
    },
    coach: {
      cloudSyncEnabled: false,
      hasPendingSyncs: jest.fn().mockReturnValue(false),
      getSyncStatus: jest.fn().mockReturnValue({ pendingOperations: 0 }),
      getOfflineQueue: jest.fn().mockReturnValue([]),
      getPendingSyncMessages: jest.fn().mockReturnValue([])
    }
  });

  const setupDefaultMocks = (overrides = {}) => {
    const mocks = createDefaultStoreMocks();
    
    (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
      ...mocks.bouncePlan,
      ...overrides.bouncePlan
    });
    (useJobTrackerStore.getState as jest.Mock).mockReturnValue({
      ...mocks.jobTracker,
      ...overrides.jobTracker
    });
    (useBudgetStore.getState as jest.Mock).mockReturnValue({
      ...mocks.budget,
      ...overrides.budget
    });
    (useWellnessStore.getState as jest.Mock).mockReturnValue({
      ...mocks.wellness,
      ...overrides.wellness
    });
    (useCoachStore.getState as jest.Mock).mockReturnValue({
      ...mocks.coach,
      ...overrides.coach
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser }
    });

    // Mock encryption
    (encryptData as jest.Mock).mockImplementation((data) => `encrypted_${JSON.stringify(data)}`);
    
    // Setup default store mocks
    setupDefaultMocks();
  });

  describe('syncAll', () => {
    it('should return error if user is not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      });

      const result = await syncManager.syncAll();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('User not authenticated');
    });

    it('should sync bounce plan data successfully', async () => {
      setupDefaultMocks({
        bouncePlan: {
          getOfflineQueueSize: jest.fn().mockReturnValue(2),
          processOfflineQueue: jest.fn().mockResolvedValue(true),
          syncToDatabase: jest.fn().mockResolvedValue(true),
          getSyncStatus: jest.fn().mockReturnValue({ pendingOperations: 0 }),
          getOfflineQueue: jest.fn().mockReturnValue([])
        }
      });

      const result = await syncManager.syncAll();
      const bouncePlanStore = useBouncePlanStore.getState();

      expect(bouncePlanStore.processOfflineQueue).toHaveBeenCalledWith(mockUser.id);
      expect(bouncePlanStore.syncToDatabase).toHaveBeenCalledWith(mockUser.id);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    describe('job applications sync', () => {
      it('should sync job applications with conflict resolution', async () => {
        const mockApplications = [
          {
            id: 'app-1',
            company: 'Company A',
            position: 'Developer',
            status: 'applied',
            updated_at: '2025-01-08T10:00:00Z',
            _localUpdatedAt: '2025-01-08T11:00:00Z', // Local is newer
            _syncStatus: 'pending'
          },
          {
            id: 'app-2',
            company: 'Company B',
            position: 'Engineer',
            status: 'interviewing',
            updated_at: '2025-01-08T12:00:00Z',
            _localUpdatedAt: '2025-01-08T11:00:00Z', // Server is newer
            _syncStatus: 'pending'
          }
        ];

        const mockJobTrackerState = {
          applications: mockApplications,
          getPendingSyncApplications: jest.fn().mockReturnValue(mockApplications),
          resolveConflicts: jest.fn().mockResolvedValue({
            toUpload: [mockApplications[0]], // Local is newer
            toUpdate: [mockApplications[1]]  // Server is newer
          }),
          syncApplications: jest.fn().mockResolvedValue(true),
          updateLocalApplications: jest.fn().mockResolvedValue(true)
        };

        (useJobTrackerStore.getState as jest.Mock).mockReturnValue(mockJobTrackerState);
        (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
          getOfflineQueueSize: jest.fn().mockReturnValue(0),
          syncToDatabase: jest.fn().mockResolvedValue(true)
        });

        const result = await syncManager.syncAll();

        expect(mockJobTrackerState.resolveConflicts).toHaveBeenCalled();
        expect(mockJobTrackerState.syncApplications).toHaveBeenCalledWith(
          [mockApplications[0]],
          mockUser.id
        );
        expect(mockJobTrackerState.updateLocalApplications).toHaveBeenCalledWith(
          [mockApplications[1]]
        );
        expect(result.success).toBe(true);
      });

      it('should handle temporary/offline applications', async () => {
        const mockApplications = [
          {
            id: 'temp_123456',
            company: 'Offline Company',
            position: 'Developer',
            status: 'applied',
            _syncStatus: 'offline'
          }
        ];

        const mockJobTrackerState = {
          applications: mockApplications,
          getOfflineApplications: jest.fn().mockReturnValue(mockApplications),
          uploadOfflineApplications: jest.fn().mockResolvedValue({
            success: true,
            uploaded: 1,
            failed: 0
          })
        };

        (useJobTrackerStore.getState as jest.Mock).mockReturnValue(mockJobTrackerState);
        (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
          getOfflineQueueSize: jest.fn().mockReturnValue(0),
          syncToDatabase: jest.fn().mockResolvedValue(true)
        });

        const result = await syncManager.syncAll();

        expect(mockJobTrackerState.uploadOfflineApplications).toHaveBeenCalledWith(mockUser.id);
        expect(result.success).toBe(true);
      });
    });

    describe('budget data sync', () => {
      it('should encrypt budget data before syncing', async () => {
        const mockBudgetData = {
          monthlyIncome: 5000,
          currentSavings: 10000,
          monthlyExpenses: 3000,
          _syncStatus: 'pending'
        };

        const mockBudgetState = {
          budgetData: mockBudgetData,
          hasPendingChanges: jest.fn().mockReturnValue(true),
          encryptSensitiveData: jest.fn().mockReturnValue({
            ...mockBudgetData,
            monthlyIncome: 'encrypted_5000',
            currentSavings: 'encrypted_10000'
          }),
          syncToDatabase: jest.fn().mockResolvedValue(true)
        };

        (useBudgetStore.getState as jest.Mock).mockReturnValue(mockBudgetState);
        (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
          getOfflineQueueSize: jest.fn().mockReturnValue(0),
          syncToDatabase: jest.fn().mockResolvedValue(true)
        });

        const result = await syncManager.syncAll();

        expect(mockBudgetState.encryptSensitiveData).toHaveBeenCalled();
        expect(mockBudgetState.syncToDatabase).toHaveBeenCalledWith(mockUser.id);
        expect(result.success).toBe(true);
      });

      it('should handle budget sync failures gracefully', async () => {
        const mockBudgetState = {
          budgetData: { monthlyIncome: 5000 },
          hasPendingChanges: jest.fn().mockReturnValue(true),
          encryptSensitiveData: jest.fn().mockReturnValue({}),
          syncToDatabase: jest.fn().mockRejectedValue(new Error('Network error'))
        };

        (useBudgetStore.getState as jest.Mock).mockReturnValue(mockBudgetState);
        (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
          getOfflineQueueSize: jest.fn().mockReturnValue(0),
          syncToDatabase: jest.fn().mockResolvedValue(true)
        });

        const result = await syncManager.syncAll();

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Failed to sync budget data: Network error');
      });
    });

    describe('mood entries sync', () => {
      it('should sync all mood entries and preserve duplicates', async () => {
        const mockMoodEntries = [
          {
            id: 'mood-1',
            value: 3,
            note: 'Feeling okay',
            createdAt: new Date('2025-01-08T10:00:00Z'),
            _syncStatus: 'pending'
          },
          {
            id: 'mood-2',
            value: 4,
            note: 'Better today',
            createdAt: new Date('2025-01-08T14:00:00Z'),
            _syncStatus: 'pending'
          }
        ];

        const mockWellnessState = {
          recentMoods: mockMoodEntries,
          getPendingSyncMoods: jest.fn().mockReturnValue(mockMoodEntries),
          syncMoodEntries: jest.fn().mockResolvedValue({
            success: true,
            synced: 2,
            errors: []
          })
        };

        (useWellnessStore.getState as jest.Mock).mockReturnValue(mockWellnessState);
        (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
          getOfflineQueueSize: jest.fn().mockReturnValue(0),
          syncToDatabase: jest.fn().mockResolvedValue(true)
        });

        const result = await syncManager.syncAll();

        expect(mockWellnessState.syncMoodEntries).toHaveBeenCalledWith(
          mockMoodEntries,
          mockUser.id
        );
        expect(result.success).toBe(true);
      });
    });

    describe('coach conversation sync', () => {
      it('should merge coach conversations with conflict alerts', async () => {
        const mockMessages = [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date('2025-01-08T10:00:00Z'),
            _syncStatus: 'pending'
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Hi there',
            timestamp: new Date('2025-01-08T10:01:00Z'),
            _syncStatus: 'pending'
          }
        ];

        const mockCoachState = {
          conversation: { messages: mockMessages },
          cloudSyncEnabled: true,
          getPendingSyncMessages: jest.fn().mockReturnValue(mockMessages),
          mergeConversations: jest.fn().mockResolvedValue({
            merged: true,
            conflicts: [{
              localMessage: mockMessages[0],
              serverMessage: { ...mockMessages[0], content: 'Hello!' }
            }]
          }),
          syncConversation: jest.fn().mockResolvedValue(true)
        };

        (useCoachStore.getState as jest.Mock).mockReturnValue(mockCoachState);
        (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
          getOfflineQueueSize: jest.fn().mockReturnValue(0),
          syncToDatabase: jest.fn().mockResolvedValue(true)
        });

        const result = await syncManager.syncAll();

        expect(mockCoachState.mergeConversations).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.conflicts).toHaveLength(1);
      });

      it('should skip coach sync if cloud sync is disabled', async () => {
        const mockCoachState = {
          cloudSyncEnabled: false,
          syncConversation: jest.fn()
        };

        (useCoachStore.getState as jest.Mock).mockReturnValue(mockCoachState);
        (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
          getOfflineQueueSize: jest.fn().mockReturnValue(0),
          syncToDatabase: jest.fn().mockResolvedValue(true)
        });

        const result = await syncManager.syncAll();

        expect(mockCoachState.syncConversation).not.toHaveBeenCalled();
        expect(result.success).toBe(true);
      });
    });

    describe('resume drafts sync', () => {
      it('should sync resume drafts', async () => {
        const mockResumeDrafts = [
          {
            id: 'draft-1',
            title: 'Software Engineer Resume',
            content: 'Resume content...',
            updatedAt: new Date('2025-01-08T10:00:00Z'),
            _syncStatus: 'pending'
          }
        ];

        const mockResumeState = {
          drafts: mockResumeDrafts,
          getPendingSyncDrafts: jest.fn().mockReturnValue(mockResumeDrafts),
          syncDrafts: jest.fn().mockResolvedValue({
            success: true,
            synced: 1
          })
        };

        // Mock AsyncStorage for resume drafts
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
          if (key === '@next_chapter/resume_drafts') {
            return Promise.resolve(JSON.stringify(mockResumeDrafts));
          }
          return Promise.resolve(null);
        });

        (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
          getOfflineQueueSize: jest.fn().mockReturnValue(0),
          syncToDatabase: jest.fn().mockResolvedValue(true)
        });

        const result = await syncManager.syncAll();

        expect(result.success).toBe(true);
      });
    });
  });

  describe('hasPendingSyncs', () => {
    it('should return true if any store has pending syncs', () => {
      (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
        getOfflineQueueSize: jest.fn().mockReturnValue(1)
      });
      (useJobTrackerStore.getState as jest.Mock).mockReturnValue({
        hasPendingSyncs: jest.fn().mockReturnValue(false)
      });
      (useBudgetStore.getState as jest.Mock).mockReturnValue({
        hasPendingChanges: jest.fn().mockReturnValue(false)
      });
      (useWellnessStore.getState as jest.Mock).mockReturnValue({
        hasPendingSyncs: jest.fn().mockReturnValue(false)
      });
      (useCoachStore.getState as jest.Mock).mockReturnValue({
        hasPendingSyncs: jest.fn().mockReturnValue(false)
      });

      expect(syncManager.hasPendingSyncs()).toBe(true);
    });

    it('should return false if no store has pending syncs', () => {
      (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
        getOfflineQueueSize: jest.fn().mockReturnValue(0)
      });
      (useJobTrackerStore.getState as jest.Mock).mockReturnValue({
        hasPendingSyncs: jest.fn().mockReturnValue(false)
      });
      (useBudgetStore.getState as jest.Mock).mockReturnValue({
        hasPendingChanges: jest.fn().mockReturnValue(false)
      });
      (useWellnessStore.getState as jest.Mock).mockReturnValue({
        hasPendingSyncs: jest.fn().mockReturnValue(false)
      });
      (useCoachStore.getState as jest.Mock).mockReturnValue({
        hasPendingSyncs: jest.fn().mockReturnValue(false)
      });

      expect(syncManager.hasPendingSyncs()).toBe(false);
    });
  });

  describe('getSyncStatus', () => {
    it('should return detailed sync status for all features', () => {
      const mockStatuses = {
        bouncePlan: {
          pendingOperations: 2,
          lastSync: new Date('2025-01-08T10:00:00Z')
        },
        jobApplications: {
          pendingOperations: 5,
          lastSync: new Date('2025-01-08T09:00:00Z')
        },
        budget: {
          pendingOperations: 1,
          lastSync: new Date('2025-01-08T11:00:00Z')
        },
        wellness: {
          pendingOperations: 3,
          lastSync: new Date('2025-01-08T08:00:00Z')
        },
        coach: {
          pendingOperations: 0,
          lastSync: new Date('2025-01-08T12:00:00Z')
        }
      };

      (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
        getSyncStatus: jest.fn().mockReturnValue(mockStatuses.bouncePlan)
      });
      (useJobTrackerStore.getState as jest.Mock).mockReturnValue({
        getSyncStatus: jest.fn().mockReturnValue(mockStatuses.jobApplications)
      });
      (useBudgetStore.getState as jest.Mock).mockReturnValue({
        getSyncStatus: jest.fn().mockReturnValue(mockStatuses.budget)
      });
      (useWellnessStore.getState as jest.Mock).mockReturnValue({
        getSyncStatus: jest.fn().mockReturnValue(mockStatuses.wellness)
      });
      (useCoachStore.getState as jest.Mock).mockReturnValue({
        getSyncStatus: jest.fn().mockReturnValue(mockStatuses.coach)
      });

      const status = syncManager.getSyncStatus();

      expect(status).toEqual({
        bouncePlan: mockStatuses.bouncePlan,
        jobApplications: mockStatuses.jobApplications,
        budget: mockStatuses.budget,
        wellness: mockStatuses.wellness,
        coach: mockStatuses.coach,
        totalPending: 11,
        isFullySynced: false
      });
    });
  });

  describe('retry logic', () => {
    it('should implement exponential backoff for failed syncs', async () => {
      const mockJobTrackerState = {
        syncApplications: jest.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce(true)
      };

      (useJobTrackerStore.getState as jest.Mock).mockReturnValue(mockJobTrackerState);
      (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
        getOfflineQueueSize: jest.fn().mockReturnValue(0),
        syncToDatabase: jest.fn().mockResolvedValue(true)
      });

      const result = await syncManager.syncWithRetry('jobApplications', 3);

      expect(mockJobTrackerState.syncApplications).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      const mockJobTrackerState = {
        syncApplications: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      (useJobTrackerStore.getState as jest.Mock).mockReturnValue(mockJobTrackerState);

      const result = await syncManager.syncWithRetry('jobApplications', 3);

      expect(mockJobTrackerState.syncApplications).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('offline queue visualization', () => {
    it('should provide queue information for UI display', () => {
      const mockQueueInfo = {
        bouncePlan: [
          { type: 'task_completion', timestamp: new Date(), data: {} }
        ],
        jobApplications: [
          { type: 'application_update', timestamp: new Date(), data: {} },
          { type: 'application_create', timestamp: new Date(), data: {} }
        ],
        budget: [],
        wellness: [
          { type: 'mood_entry', timestamp: new Date(), data: {} }
        ],
        coach: []
      };

      (useBouncePlanStore.getState as jest.Mock).mockReturnValue({
        getOfflineQueue: jest.fn().mockReturnValue(mockQueueInfo.bouncePlan)
      });
      (useJobTrackerStore.getState as jest.Mock).mockReturnValue({
        getOfflineQueue: jest.fn().mockReturnValue(mockQueueInfo.jobApplications)
      });
      (useBudgetStore.getState as jest.Mock).mockReturnValue({
        getOfflineQueue: jest.fn().mockReturnValue(mockQueueInfo.budget)
      });
      (useWellnessStore.getState as jest.Mock).mockReturnValue({
        getOfflineQueue: jest.fn().mockReturnValue(mockQueueInfo.wellness)
      });
      (useCoachStore.getState as jest.Mock).mockReturnValue({
        getOfflineQueue: jest.fn().mockReturnValue(mockQueueInfo.coach)
      });

      const queueVisualization = syncManager.getOfflineQueueVisualization();

      expect(queueVisualization.totalItems).toBe(4);
      expect(queueVisualization.byFeature).toEqual({
        bouncePlan: 1,
        jobApplications: 2,
        budget: 0,
        wellness: 1,
        coach: 0
      });
      expect(queueVisualization.oldestItem).toBeDefined();
    });
  });
});