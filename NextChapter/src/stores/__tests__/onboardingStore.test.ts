import { renderHook, act } from '@testing-library/react-hooks';
import { useOnboardingStore } from '@stores/onboardingStore';
import { OnboardingService } from '@services/onboarding';

// Mock the OnboardingService
jest.mock('../../services/onboarding');

describe('onboardingStore', () => {
  const mockUserId = 'test-user-123';
  const mockService = new OnboardingService();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useOnboardingStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useOnboardingStore());

      expect(result.current.currentStep).toBe('welcome');
      expect(result.current.data).toEqual({});
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('loadProgress', () => {
    it('should load existing progress', async () => {
      const mockProgress = {
        currentStep: 'personal-info' as const,
        data: {
          company: 'Tech Corp',
          role: 'Engineer',
          firstName: 'John',
        },
        timestamp: Date.now(),
      };

      (mockService.loadProgress as jest.Mock).mockResolvedValueOnce(mockProgress);

      const { result } = renderHook(() => useOnboardingStore());

      await act(async () => {
        await result.current.loadProgress(mockUserId);
      });

      expect(result.current.currentStep).toBe('personal-info');
      expect(result.current.data).toEqual(mockProgress.data);
    });

    it('should handle load errors gracefully', async () => {
      (mockService.loadProgress as jest.Mock).mockRejectedValueOnce(
        new Error('Load failed')
      );

      const { result } = renderHook(() => useOnboardingStore());

      await act(async () => {
        await result.current.loadProgress(mockUserId);
      });

      expect(result.current.error).toBe('Failed to load onboarding progress');
    });
  });

  describe('saveStepData', () => {
    it('should save step data and update state', async () => {
      (mockService.saveProgress as jest.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useOnboardingStore());

      const stepData = {
        company: 'Tech Corp',
        role: 'Engineer',
      };

      await act(async () => {
        await result.current.saveStepData(mockUserId, 'layoff-details', stepData);
      });

      expect(result.current.currentStep).toBe('layoff-details');
      expect(result.current.data).toEqual(stepData);
      expect(mockService.saveProgress).toHaveBeenCalledWith(
        mockUserId,
        'layoff-details',
        stepData
      );
    });

    it('should merge with existing data', async () => {
      const { result } = renderHook(() => useOnboardingStore());

      // Set initial data
      act(() => {
        result.current.setData({ company: 'Tech Corp' });
      });

      const additionalData = { role: 'Engineer' };

      await act(async () => {
        await result.current.saveStepData(mockUserId, 'layoff-details', additionalData);
      });

      expect(result.current.data).toEqual({
        company: 'Tech Corp',
        role: 'Engineer',
      });
    });
  });

  describe('navigation', () => {
    it('should navigate to next step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setCurrentStep('layoff-details');
      });

      act(() => {
        result.current.goToNextStep();
      });

      expect(result.current.currentStep).toBe('personal-info');
    });

    it('should not navigate past the last step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setCurrentStep('goals');
      });

      act(() => {
        result.current.goToNextStep();
      });

      expect(result.current.currentStep).toBe('goals');
    });

    it('should navigate to previous step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setCurrentStep('personal-info');
      });

      act(() => {
        result.current.goToPreviousStep();
      });

      expect(result.current.currentStep).toBe('layoff-details');
    });

    it('should not navigate before the first step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.goToPreviousStep();
      });

      expect(result.current.currentStep).toBe('welcome');
    });
  });

  describe('validation', () => {
    it('should validate current step data', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setCurrentStep('layoff-details');
        result.current.setData({
          company: 'Tech Corp',
          role: 'Engineer',
          layoffDate: '2025-01-01',
        });
      });

      const isValid = result.current.isCurrentStepValid();
      expect(isValid).toBe(true);
    });

    it('should return false for invalid step data', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setCurrentStep('layoff-details');
        result.current.setData({
          company: 'Tech Corp',
          // Missing required fields
        });
      });

      const isValid = result.current.isCurrentStepValid();
      expect(isValid).toBe(false);
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding successfully', async () => {
      (mockService.completeOnboarding as jest.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useOnboardingStore());

      const completeData = {
        company: 'Tech Corp',
        role: 'Engineer',
        layoffDate: '2025-01-01',
        firstName: 'John',
        lastName: 'Doe',
        goals: ['job-search'],
      };

      act(() => {
        result.current.setData(completeData);
      });

      await act(async () => {
        await result.current.completeOnboarding(mockUserId);
      });

      expect(mockService.completeOnboarding).toHaveBeenCalledWith(
        mockUserId,
        completeData
      );
      expect(result.current.isCompleted).toBe(true);
    });

    it('should handle completion errors', async () => {
      (mockService.completeOnboarding as jest.Mock).mockRejectedValueOnce(
        new Error('Completion failed')
      );

      const { result } = renderHook(() => useOnboardingStore());

      await act(async () => {
        await result.current.completeOnboarding(mockUserId);
      });

      expect(result.current.error).toBe('Failed to complete onboarding');
      expect(result.current.isCompleted).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useOnboardingStore());

      // Set some data
      act(() => {
        result.current.setCurrentStep('personal-info');
        result.current.setData({ firstName: 'John' });
        result.current.setError('Some error');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.currentStep).toBe('welcome');
      expect(result.current.data).toEqual({});
      expect(result.current.error).toBeNull();
      expect(result.current.isCompleted).toBe(false);
    });
  });
});