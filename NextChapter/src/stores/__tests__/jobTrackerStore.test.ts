import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useJobTrackerStore } from '@stores/jobTrackerStore';
import { supabase } from '@services/api/supabase';
import { JobApplication } from '@types/database';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/api/supabase');

const mockApplication: JobApplication = {
  id: '1',
  user_id: 'user-123',
  company: 'Test Company',
  position: 'Software Engineer',
  location: 'San Francisco, CA',
  salary_range: '$120k - $150k',
  status: 'applied',
  applied_date: '2024-01-01',
  notes: 'Great opportunity',
  job_posting_url: 'https://example.com/job',
  contact_name: 'John Doe',
  contact_email: 'john@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('jobTrackerStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    // Mock Supabase auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  describe('loadApplications', () => {
    it('should load applications from Supabase when user is authenticated', async () => {
      const mockApplications = [mockApplication];
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockApplications,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useJobTrackerStore());

      await act(async () => {
        await result.current.loadApplications();
      });

      expect(result.current.applications).toEqual(mockApplications);
      expect(result.current.isLoading).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@next_chapter/job_applications',
        JSON.stringify(mockApplications)
      );
    });

    it('should load from AsyncStorage when offline', async () => {
      const mockApplications = [mockApplication];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockApplications)
      );
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useJobTrackerStore());

      await act(async () => {
        await result.current.loadApplications();
      });

      expect(result.current.applications).toEqual(mockApplications);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useJobTrackerStore());

      await act(async () => {
        await result.current.loadApplications();
      });

      expect(result.current.applications).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('addApplication', () => {
    it('should add application to Supabase when online', async () => {
      const newApplication = {
        company: 'New Company',
        position: 'Developer',
        status: 'applied' as const,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockApplication, ...newApplication },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useJobTrackerStore());

      await act(async () => {
        await result.current.addApplication(newApplication);
      });

      expect(result.current.applications).toHaveLength(1);
      expect(result.current.applications[0].company).toBe('New Company');
    });

    it('should create temporary application when offline', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const newApplication = {
        company: 'Offline Company',
        position: 'Developer',
        status: 'applied' as const,
      };

      const { result } = renderHook(() => useJobTrackerStore());

      await act(async () => {
        await result.current.addApplication(newApplication);
      });

      expect(result.current.applications).toHaveLength(1);
      expect(result.current.applications[0].id).toMatch(/^temp_/);
      expect(result.current.applications[0].company).toBe('Offline Company');
    });
  });

  describe('updateApplicationStatus', () => {
    it('should update application status', async () => {
      const updatedApplication = { ...mockApplication, status: 'interviewing' as const };
      
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedApplication,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useJobTrackerStore());
      
      // Set initial application
      act(() => {
        result.current.applications = [mockApplication];
      });

      await act(async () => {
        await result.current.updateApplicationStatus('1', 'interviewing');
      });

      expect(result.current.applications[0].status).toBe('interviewing');
    });
  });

  describe('deleteApplication', () => {
    it('should delete application from Supabase', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useJobTrackerStore());
      
      // Set initial application
      act(() => {
        result.current.applications = [mockApplication];
      });

      await act(async () => {
        await result.current.deleteApplication('1');
      });

      expect(result.current.applications).toHaveLength(0);
    });
  });

  describe('search and filter', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useJobTrackerStore());

      act(() => {
        result.current.setSearchQuery('Google');
      });

      expect(result.current.searchQuery).toBe('Google');
    });

    it('should update selected status filter', () => {
      const { result } = renderHook(() => useJobTrackerStore());

      act(() => {
        result.current.setSelectedStatus('interviewing');
      });

      expect(result.current.selectedStatus).toBe('interviewing');
    });
  });

  describe('syncWithSupabase', () => {
    it('should sync temporary applications with Supabase', async () => {
      const tempApplication = {
        ...mockApplication,
        id: 'temp_123',
        user_id: 'offline',
      };

      const { result } = renderHook(() => useJobTrackerStore());
      
      // Set temporary application
      act(() => {
        result.current.applications = [tempApplication];
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...tempApplication, id: 'real-id' },
              error: null,
            }),
          }),
        }),
      });

      // Mock loadApplications
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{ ...tempApplication, id: 'real-id' }],
              error: null,
            }),
          }),
        }),
      });

      await act(async () => {
        await result.current.syncWithSupabase();
      });

      expect(result.current.applications[0].id).not.toMatch(/^temp_/);
    });
  });
});