import { BaseStore, BaseState, AsyncResult } from '@stores/interfaces/base';

/**
 * Job application status types
 */
export type JobStatus = 'bookmarked' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';

/**
 * Job application interface
 */
export interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  status: JobStatus;
  appliedDate?: Date;
  jobUrl?: string;
  salary?: {
    min?: number;
    max?: number;
    currency: string;
  };
  location?: string;
  remote?: boolean;
  notes?: string;
  nextSteps?: string;
  contactName?: string;
  contactEmail?: string;
  lastUpdated: Date;
  createdAt: Date;
}

/**
 * Job search filter interface
 */
export interface JobSearchFilter {
  status?: JobStatus[];
  searchTerm?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  remote?: boolean;
  salaryMin?: number;
}

/**
 * Job CRUD operations interface
 */
export interface JobCrudOperations {
  loadJobs: () => AsyncResult;
  addJob: (job: Omit<JobApplication, 'id' | 'createdAt' | 'lastUpdated'>) => AsyncResult;
  updateJob: (id: string, updates: Partial<JobApplication>) => AsyncResult;
  deleteJob: (id: string) => AsyncResult;
  bulkUpdateStatus: (jobIds: string[], status: JobStatus) => AsyncResult;
}

/**
 * Job search and filter operations interface
 */
export interface JobSearchOperations {
  searchJobs: (searchTerm: string) => void;
  filterJobs: (filter: JobSearchFilter) => void;
  clearFilters: () => void;
  sortJobs: (sortBy: 'date' | 'company' | 'status') => void;
}

/**
 * Job analytics operations interface
 */
export interface JobAnalyticsOperations {
  getApplicationStats: () => {
    total: number;
    byStatus: Record<JobStatus, number>;
    weeklyApplications: number;
    responseRate: number;
  };
  getAverageTimeInStage: () => Record<JobStatus, number>;
  getTopCompanies: () => Array<{ company: string; count: number }>;
}

/**
 * Job import/export operations interface
 */
export interface JobImportExportOperations {
  exportJobs: (format: 'csv' | 'json') => AsyncResult<string>;
  importJobs: (data: string, format: 'csv' | 'json') => AsyncResult<number>;
}

/**
 * Job tracker store state interface
 */
export interface JobTrackerStoreState extends BaseState {
  // Core data
  jobs: JobApplication[];
  filteredJobs: JobApplication[];
  
  // UI state
  currentFilter: JobSearchFilter;
  sortBy: 'date' | 'company' | 'status';
  sortOrder: 'asc' | 'desc';
  
  // Selection state
  selectedJobIds: string[];
  
  // Import/export state
  isImporting: boolean;
  isExporting: boolean;
}

/**
 * Complete job tracker store interface
 * Combines all job tracking functionality
 */
export interface JobTrackerStore extends 
  BaseStore,
  JobTrackerStoreState,
  JobCrudOperations,
  JobSearchOperations,
  JobAnalyticsOperations,
  JobImportExportOperations {}