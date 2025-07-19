import { StateCreator } from 'zustand';
import { 
  JobTrackerStore, 
  JobTrackerStoreState,
  JobApplication,
  JobStatus,
  JobSearchFilter 
} from '@stores/interfaces/jobTrackerStore';
import { createStore, createInitialState, handleAsyncOperation } from '@stores/factory/createStore';

/**
 * Initial state for job tracker store
 */
const initialState = createInitialState<Omit<JobTrackerStoreState, 'isLoading' | 'error'>>({
  jobs: [],
  filteredJobs: [],
  currentFilter: {},
  sortBy: 'date',
  sortOrder: 'desc',
  selectedJobIds: [],
  isImporting: false,
  isExporting: false,
});

/**
 * Helper function to apply filters to jobs
 */
const applyFilters = (jobs: JobApplication[], filter: JobSearchFilter): JobApplication[] => {
  return jobs.filter(job => {
    // Status filter
    if (filter.status && filter.status.length > 0) {
      if (!filter.status.includes(job.status)) return false;
    }
    
    // Search term filter
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      const matchesCompany = job.companyName.toLowerCase().includes(term);
      const matchesPosition = job.position.toLowerCase().includes(term);
      const matchesNotes = job.notes?.toLowerCase().includes(term);
      if (!matchesCompany && !matchesPosition && !matchesNotes) return false;
    }
    
    // Date range filter
    if (filter.dateRange) {
      const jobDate = job.appliedDate || job.createdAt;
      if (jobDate < filter.dateRange.start || jobDate > filter.dateRange.end) return false;
    }
    
    // Remote filter
    if (filter.remote !== undefined) {
      if (job.remote !== filter.remote) return false;
    }
    
    // Salary filter
    if (filter.salaryMin !== undefined && job.salary?.min) {
      if (job.salary.min < filter.salaryMin) return false;
    }
    
    return true;
  });
};

/**
 * Helper function to sort jobs
 */
const sortJobs = (
  jobs: JobApplication[], 
  sortBy: 'date' | 'company' | 'status', 
  order: 'asc' | 'desc'
): JobApplication[] => {
  const sorted = [...jobs].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        const dateA = a.appliedDate || a.createdAt;
        const dateB = b.appliedDate || b.createdAt;
        comparison = dateA.getTime() - dateB.getTime();
        break;
      case 'company':
        comparison = a.companyName.localeCompare(b.companyName);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
};

/**
 * Job CRUD operations implementation
 */
const createJobCrudOperations: StateCreator<JobTrackerStore, [], [], Pick<JobTrackerStore,
  'loadJobs' | 'addJob' | 'updateJob' | 'deleteJob' | 'bulkUpdateStatus'
>> = (set, get) => ({
  loadJobs: async () => {
    await handleAsyncOperation(
      set,
      async () => {
        // TODO: Load from actual database
        const jobs: JobApplication[] = [];
        
        set({ 
          jobs,
          filteredJobs: jobs,
        });
        
        return jobs;
      },
      {
        onError: (error) => {
          console.error('Error loading jobs:', error);
        }
      }
    );
  },

  addJob: async (jobData) => {
    await handleAsyncOperation(
      set,
      async () => {
        const newJob: JobApplication = {
          ...jobData,
          id: `job_${Date.now()}`,
          createdAt: new Date(),
          lastUpdated: new Date(),
        };
        
        set((state) => {
          const jobs = [newJob, ...state.jobs];
          const filteredJobs = applyFilters(jobs, state.currentFilter);
          const sortedJobs = sortJobs(filteredJobs, state.sortBy, state.sortOrder);
          
          return {
            jobs,
            filteredJobs: sortedJobs,
          };
        });
        
        return newJob;
      },
      {
        onError: (error) => {
          console.error('Error adding job:', error);
          throw error;
        }
      }
    );
  },

  updateJob: async (id, updates) => {
    await handleAsyncOperation(
      set,
      async () => {
        set((state) => {
          const jobs = state.jobs.map(job =>
            job.id === id 
              ? { ...job, ...updates, lastUpdated: new Date() }
              : job
          );
          const filteredJobs = applyFilters(jobs, state.currentFilter);
          const sortedJobs = sortJobs(filteredJobs, state.sortBy, state.sortOrder);
          
          return {
            jobs,
            filteredJobs: sortedJobs,
          };
        });
      },
      {
        onError: (error) => {
          console.error('Error updating job:', error);
          throw error;
        }
      }
    );
  },

  deleteJob: async (id) => {
    await handleAsyncOperation(
      set,
      async () => {
        set((state) => {
          const jobs = state.jobs.filter(job => job.id !== id);
          const filteredJobs = applyFilters(jobs, state.currentFilter);
          const sortedJobs = sortJobs(filteredJobs, state.sortBy, state.sortOrder);
          
          return {
            jobs,
            filteredJobs: sortedJobs,
            selectedJobIds: state.selectedJobIds.filter(jobId => jobId !== id),
          };
        });
      },
      {
        onError: (error) => {
          console.error('Error deleting job:', error);
          throw error;
        }
      }
    );
  },

  bulkUpdateStatus: async (jobIds, status) => {
    await handleAsyncOperation(
      set,
      async () => {
        set((state) => {
          const jobs = state.jobs.map(job =>
            jobIds.includes(job.id)
              ? { ...job, status, lastUpdated: new Date() }
              : job
          );
          const filteredJobs = applyFilters(jobs, state.currentFilter);
          const sortedJobs = sortJobs(filteredJobs, state.sortBy, state.sortOrder);
          
          return {
            jobs,
            filteredJobs: sortedJobs,
            selectedJobIds: [],
          };
        });
      },
      {
        onError: (error) => {
          console.error('Error bulk updating status:', error);
          throw error;
        }
      }
    );
  },
});

/**
 * Job search and filter operations implementation
 */
const createJobSearchOperations: StateCreator<JobTrackerStore, [], [], Pick<JobTrackerStore,
  'searchJobs' | 'filterJobs' | 'clearFilters' | 'sortJobs'
>> = (set, get) => ({
  searchJobs: (searchTerm) => {
    set((state) => {
      const filter = { ...state.currentFilter, searchTerm };
      const filteredJobs = applyFilters(state.jobs, filter);
      const sortedJobs = sortJobs(filteredJobs, state.sortBy, state.sortOrder);
      
      return {
        currentFilter: filter,
        filteredJobs: sortedJobs,
      };
    });
  },

  filterJobs: (filter) => {
    set((state) => {
      const newFilter = { ...state.currentFilter, ...filter };
      const filteredJobs = applyFilters(state.jobs, newFilter);
      const sortedJobs = sortJobs(filteredJobs, state.sortBy, state.sortOrder);
      
      return {
        currentFilter: newFilter,
        filteredJobs: sortedJobs,
      };
    });
  },

  clearFilters: () => {
    set((state) => {
      const sortedJobs = sortJobs(state.jobs, state.sortBy, state.sortOrder);
      
      return {
        currentFilter: {},
        filteredJobs: sortedJobs,
      };
    });
  },

  sortJobs: (sortBy) => {
    set((state) => {
      const newOrder = state.sortBy === sortBy && state.sortOrder === 'desc' ? 'asc' : 'desc';
      const sortedJobs = sortJobs(state.filteredJobs, sortBy, newOrder);
      
      return {
        sortBy,
        sortOrder: newOrder,
        filteredJobs: sortedJobs,
      };
    });
  },
});

/**
 * Job analytics operations implementation
 */
const createJobAnalyticsOperations: StateCreator<JobTrackerStore, [], [], Pick<JobTrackerStore,
  'getApplicationStats' | 'getAverageTimeInStage' | 'getTopCompanies'
>> = (set, get) => ({
  getApplicationStats: () => {
    const jobs = get().jobs;
    const total = jobs.length;
    
    // Count by status
    const byStatus = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<JobStatus, number>);
    
    // Weekly applications (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyApplications = jobs.filter(job => 
      (job.appliedDate || job.createdAt) >= weekAgo
    ).length;
    
    // Response rate (interviews / applications)
    const applications = byStatus.applied || 0;
    const interviews = byStatus.interviewing || 0;
    const responseRate = applications > 0 ? (interviews / applications) * 100 : 0;
    
    return {
      total,
      byStatus,
      weeklyApplications,
      responseRate,
    };
  },

  getAverageTimeInStage: () => {
    const jobs = get().jobs;
    const timeInStage: Record<JobStatus, number[]> = {
      bookmarked: [],
      applied: [],
      interviewing: [],
      offered: [],
      rejected: [],
      withdrawn: [],
    };
    
    // TODO: Calculate actual time in each stage
    // This would require tracking status change history
    
    // For now, return placeholder data
    return Object.keys(timeInStage).reduce((acc, status) => {
      acc[status as JobStatus] = 0;
      return acc;
    }, {} as Record<JobStatus, number>);
  },

  getTopCompanies: () => {
    const jobs = get().jobs;
    const companyCount: Record<string, number> = {};
    
    jobs.forEach(job => {
      companyCount[job.companyName] = (companyCount[job.companyName] || 0) + 1;
    });
    
    return Object.entries(companyCount)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },
});

/**
 * Job import/export operations implementation
 */
const createJobImportExportOperations: StateCreator<JobTrackerStore, [], [], Pick<JobTrackerStore,
  'exportJobs' | 'importJobs'
>> = (set, get) => ({
  exportJobs: async (format) => {
    return handleAsyncOperation(
      set,
      async () => {
        const jobs = get().jobs;
        
        if (format === 'json') {
          return JSON.stringify(jobs, null, 2);
        }
        
        // CSV format
        const headers = [
          'Company', 'Position', 'Status', 'Applied Date', 
          'Location', 'Remote', 'Salary Min', 'Salary Max', 'Notes'
        ];
        
        const rows = jobs.map(job => [
          job.companyName,
          job.position,
          job.status,
          job.appliedDate?.toISOString() || '',
          job.location || '',
          job.remote ? 'Yes' : 'No',
          job.salary?.min || '',
          job.salary?.max || '',
          job.notes || '',
        ]);
        
        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');
        
        return csv;
      },
      {
        loadingKey: 'isExporting',
        onError: (error) => {
          console.error('Error exporting jobs:', error);
          throw error;
        }
      }
    ) || '';
  },

  importJobs: async (data, format) => {
    return handleAsyncOperation(
      set,
      async () => {
        let importedJobs: Partial<JobApplication>[] = [];
        
        if (format === 'json') {
          importedJobs = JSON.parse(data);
        } else {
          // Parse CSV
          const lines = data.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          importedJobs = lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            const cleanValues = values.map(v => v.replace(/^"|"$/g, ''));
            
            return {
              companyName: cleanValues[0],
              position: cleanValues[1],
              status: cleanValues[2] as JobStatus,
              appliedDate: cleanValues[3] ? new Date(cleanValues[3]) : undefined,
              location: cleanValues[4] || undefined,
              remote: cleanValues[5] === 'Yes',
              salary: {
                min: cleanValues[6] ? Number(cleanValues[6]) : undefined,
                max: cleanValues[7] ? Number(cleanValues[7]) : undefined,
                currency: 'USD',
              },
              notes: cleanValues[8] || undefined,
            };
          });
        }
        
        // Add imported jobs
        const newJobs: JobApplication[] = importedJobs.map(jobData => ({
          ...jobData,
          id: `job_${Date.now()}_${Math.random()}`,
          companyName: jobData.companyName || 'Unknown Company',
          position: jobData.position || 'Unknown Position',
          status: jobData.status || 'bookmarked',
          createdAt: new Date(),
          lastUpdated: new Date(),
        } as JobApplication));
        
        set((state) => {
          const jobs = [...state.jobs, ...newJobs];
          const filteredJobs = applyFilters(jobs, state.currentFilter);
          const sortedJobs = sortJobs(filteredJobs, state.sortBy, state.sortOrder);
          
          return {
            jobs,
            filteredJobs: sortedJobs,
          };
        });
        
        return newJobs.length;
      },
      {
        loadingKey: 'isImporting',
        onError: (error) => {
          console.error('Error importing jobs:', error);
          throw error;
        }
      }
    ) || 0;
  },
});

/**
 * Complete job tracker store creator
 * Combines all functionality using composition
 */
const jobTrackerStoreCreator: StateCreator<JobTrackerStore, [], [], JobTrackerStore> = (set, get) => ({
  ...initialState,
  ...createJobCrudOperations(set, get, {} as any),
  ...createJobSearchOperations(set, get, {} as any),
  ...createJobAnalyticsOperations(set, get, {} as any),
  ...createJobImportExportOperations(set, get, {} as any),
  
  // Reset function
  reset: () => {
    set(initialState);
  },
});

/**
 * Create and export the job tracker store
 * Using factory pattern for consistent configuration
 */
export const useJobTrackerStore = createStore<JobTrackerStore>(
  jobTrackerStoreCreator,
  {
    name: 'job-tracker-store',
    persist: true,
    partialize: (state) => ({
      jobs: state.jobs,
      currentFilter: state.currentFilter,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
    }),
  }
);