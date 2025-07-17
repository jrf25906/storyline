import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JobApplication, JobApplicationStatus } from '../types/database';
import { jobApplicationService } from '../services/database/jobApplications';

interface JobApplicationStore {
  // State
  applications: JobApplication[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  searchQuery: string;
  selectedStatus: JobApplicationStatus | 'all';
  sortBy: 'date' | 'company' | 'status';
  sortOrder: 'asc' | 'desc';

  // Computed values
  filteredApplications: () => JobApplication[];
  applicationsByStatus: () => Record<JobApplicationStatus, JobApplication[]>;
  stats: () => {
    total: number;
    saved: number;
    applied: number;
    interviewing: number;
    offers: number;
    rejected: number;
  };

  // Actions
  loadApplications: (userId: string) => Promise<void>;
  addApplication: (userId: string, application: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateApplication: (id: string, updates: Partial<JobApplication>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  updateStatus: (id: string, status: JobApplicationStatus) => Promise<void>;
  moveToStatus: (id: string, status: JobApplicationStatus) => Promise<void>;
  
  // Filter and sort actions
  setSearchQuery: (query: string) => void;
  setSelectedStatus: (status: JobApplicationStatus | 'all') => void;
  setSortBy: (sortBy: 'date' | 'company' | 'status') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  
  // Sync actions
  syncOfflineChanges: (userId: string) => Promise<void>;
  hasOfflineChanges: () => boolean;
  
  // Utility actions
  reset: () => void;
}

const initialState = {
  applications: [],
  isLoading: false,
  isSyncing: false,
  error: null,
  searchQuery: '',
  selectedStatus: 'all' as const,
  sortBy: 'date' as const,
  sortOrder: 'desc' as const,
};

export const useJobApplicationStore = create<JobApplicationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        filteredApplications: () => {
          const { applications, searchQuery, selectedStatus, sortBy, sortOrder } = get();
          
          let filtered = applications;
          
          // Filter by status
          if (selectedStatus !== 'all') {
            filtered = filtered.filter(app => app.status === selectedStatus);
          }
          
          // Filter by search query
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(app => 
              app.company.toLowerCase().includes(query) ||
              app.position.toLowerCase().includes(query) ||
              (app.location?.toLowerCase().includes(query) ?? false) ||
              (app.notes?.toLowerCase().includes(query) ?? false)
            );
          }
          
          // Sort applications
          filtered.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
              case 'date':
                comparison = new Date(b.applied_date || b.created_at).getTime() - 
                           new Date(a.applied_date || a.created_at).getTime();
                break;
              case 'company':
                comparison = a.company.localeCompare(b.company);
                break;
              case 'status':
                const statusOrder: JobApplicationStatus[] = [
                  'saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'
                ];
                comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
                break;
            }
            
            return sortOrder === 'asc' ? comparison : -comparison;
          });
          
          return filtered;
        },

        applicationsByStatus: () => {
          const applications = get().applications;
          const byStatus: Record<JobApplicationStatus, JobApplication[]> = {
            saved: [],
            applied: [],
            interviewing: [],
            offer: [],
            rejected: [],
            withdrawn: [],
          };
          
          applications.forEach(app => {
            byStatus[app.status].push(app);
          });
          
          return byStatus;
        },

        stats: () => {
          const byStatus = get().applicationsByStatus();
          return {
            total: get().applications.length,
            saved: byStatus.saved.length,
            applied: byStatus.applied.length,
            interviewing: byStatus.interviewing.length,
            offers: byStatus.offer.length,
            rejected: byStatus.rejected.length,
          };
        },

        loadApplications: async (userId) => {
          set({ isLoading: true, error: null });
          try {
            const applications = await jobApplicationService.getAll(userId);
            set({ applications, isLoading: false });
          } catch (error) {
            console.error('Error loading applications:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load applications',
              isLoading: false 
            });
          }
        },

        addApplication: async (userId, application) => {
          set({ isLoading: true, error: null });
          try {
            const newApplication = await jobApplicationService.create(userId, application);
            set((state) => ({
              applications: [newApplication, ...state.applications],
              isLoading: false,
            }));
          } catch (error) {
            console.error('Error adding application:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to add application',
              isLoading: false 
            });
            throw error;
          }
        },

        updateApplication: async (id, updates) => {
          set({ isLoading: true, error: null });
          try {
            const updatedApplication = await jobApplicationService.update(id, updates);
            set((state) => ({
              applications: state.applications.map(app => 
                app.id === id ? updatedApplication : app
              ),
              isLoading: false,
            }));
          } catch (error) {
            console.error('Error updating application:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update application',
              isLoading: false 
            });
            throw error;
          }
        },

        deleteApplication: async (id) => {
          set({ isLoading: true, error: null });
          try {
            await jobApplicationService.delete(id);
            set((state) => ({
              applications: state.applications.filter(app => app.id !== id),
              isLoading: false,
            }));
          } catch (error) {
            console.error('Error deleting application:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete application',
              isLoading: false 
            });
            throw error;
          }
        },

        updateStatus: async (id, status) => {
          await get().updateApplication(id, { status });
        },

        moveToStatus: async (id, status) => {
          const timestamp = new Date().toISOString();
          const updates: Partial<JobApplication> = { status };
          
          // Add applied date when moving to applied status
          if (status === 'applied') {
            updates.applied_date = timestamp;
          }
          
          await get().updateApplication(id, updates);
        },

        setSearchQuery: (query) => set({ searchQuery: query }),
        setSelectedStatus: (status) => set({ selectedStatus: status }),
        setSortBy: (sortBy) => set({ sortBy }),
        setSortOrder: (order) => set({ sortOrder: order }),

        syncOfflineChanges: async (userId) => {
          set({ isSyncing: true, error: null });
          try {
            await jobApplicationService.syncOfflineChanges(userId);
            // Reload applications after sync
            await get().loadApplications(userId);
            set({ isSyncing: false });
          } catch (error) {
            console.error('Error syncing offline changes:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to sync changes',
              isSyncing: false 
            });
          }
        },

        hasOfflineChanges: () => {
          const applications = get().applications;
          return applications.some(app => app.id.startsWith('offline_'));
        },

        reset: () => set(initialState),
      }),
      {
        name: 'job-application-store',
        storage: {
          getItem: async (name) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          searchQuery: state.searchQuery,
          selectedStatus: state.selectedStatus,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
        }),
      }
    ),
    {
      name: 'JobApplicationStore',
    }
  )
);