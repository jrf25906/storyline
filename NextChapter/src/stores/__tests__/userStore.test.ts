import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
import { useUserStore } from '@stores/userStore';
import { supabase } from '@services/api/supabase';
import { GoalType } from '@types/database';

// Mock Supabase
jest.mock('../../services/api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('userStore', () => {
  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockLayoffDetails = {
    id: 'layoff-123',
    user_id: 'user-123',
    layoff_date: '2024-01-15',
    industry: 'Technology',
    role: 'Software Engineer',
    company_size: 'medium',
    severance_weeks: 8,
    health_insurance_end_date: '2024-03-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockGoals = [
    {
      id: 'goal-1',
      user_id: 'user-123',
      goal_type: 'find_new_role' as GoalType,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'goal-2',
      user_id: 'user-123',
      goal_type: 'skill_development' as GoalType,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset store
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Profile Operations', () => {
    it('should load profile successfully', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.loadProfile('user-123');
      });

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('should handle profile loading error', async () => {
      const mockError = new Error('Failed to load profile');
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.loadProfile('user-123');
      });

      await waitFor(() => {
        expect(result.current.profile).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Failed to load profile');
      });
    });

    it('should update profile successfully', async () => {
      const updatedProfile = { ...mockProfile, first_name: 'Updated' };
      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedProfile,
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => useUserStore());

      // Set initial profile
      act(() => {
        result.current.profile = mockProfile;
      });

      await act(async () => {
        await result.current.updateProfile({ first_name: 'Updated' });
      });

      await waitFor(() => {
        expect(result.current.profile?.first_name).toBe('Updated');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Layoff Details Operations', () => {
    it('should load layoff details successfully', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLayoffDetails,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.loadLayoffDetails('user-123');
      });

      await waitFor(() => {
        expect(result.current.layoffDetails).toEqual(mockLayoffDetails);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should save layoff details successfully', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLayoffDetails,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => useUserStore());

      // Set profile first
      act(() => {
        result.current.profile = mockProfile;
      });

      const layoffData = {
        layoff_date: '2024-01-15',
        industry: 'Technology',
        role: 'Software Engineer',
        company_size: 'medium' as const,
        severance_weeks: 8,
        health_insurance_end_date: '2024-03-15',
      };

      await act(async () => {
        await result.current.saveLayoffDetails(layoffData);
      });

      await waitFor(() => {
        expect(result.current.layoffDetails).toEqual(mockLayoffDetails);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Goals Operations', () => {
    it('should load goals successfully', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockGoals,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.loadGoals('user-123');
      });

      await waitFor(() => {
        expect(result.current.goals).toEqual(mockGoals);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should toggle goal successfully', async () => {
      // Mock for toggling off existing goal
      const mockFrom = jest.fn();
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });
      // Mock for reloading goals
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockGoals.filter(g => g.goal_type !== 'find_new_role'),
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => useUserStore());

      // Set initial state
      act(() => {
        result.current.profile = mockProfile;
        result.current.goals = mockGoals;
      });

      await act(async () => {
        await result.current.toggleGoal('find_new_role');
      });

      await waitFor(() => {
        expect(result.current.goals).toHaveLength(1);
        expect(result.current.goals[0].goal_type).toBe('skill_development');
      });
    });
  });

  describe('Onboarding Operations', () => {
    it('should complete onboarding', () => {
      const { result } = renderHook(() => useUserStore());

      expect(result.current.onboardingCompleted).toBe(false);

      act(() => {
        result.current.completeOnboarding();
      });

      expect(result.current.onboardingCompleted).toBe(true);
    });

    it('should reset onboarding', () => {
      const { result } = renderHook(() => useUserStore());

      // First complete onboarding
      act(() => {
        result.current.completeOnboarding();
      });

      expect(result.current.onboardingCompleted).toBe(true);

      // Then reset it
      act(() => {
        result.current.resetOnboarding();
      });

      expect(result.current.onboardingCompleted).toBe(false);
    });
  });

  describe('Store Reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useUserStore());

      // Set some state
      act(() => {
        result.current.profile = mockProfile;
        result.current.layoffDetails = mockLayoffDetails;
        result.current.goals = mockGoals;
        result.current.isAuthenticated = true;
        result.current.onboardingCompleted = true;
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      // Check all state is reset
      expect(result.current.profile).toBeNull();
      expect(result.current.layoffDetails).toBeNull();
      expect(result.current.goals).toEqual([]);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.onboardingCompleted).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});