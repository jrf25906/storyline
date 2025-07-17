import { renderHook, act } from '@testing-library/react-hooks';
import { useOnboarding } from '../useOnboarding';
import { useAuth } from '../useAuth';
import { useOnboardingStore } from '@stores/onboardingStore';
import { createMockStore } from '@/test-utils/mockHelpers';

// Mock dependencies
jest.mock('../useAuth');
jest.mock('@stores/onboardingStore');

describe('useOnboarding', () => {
  const mockUser = { id: 'test-user-123' };
  const mockLoadProgress = jest.fn();
  const mockSaveStepData = jest.fn();
  const mockCompleteOnboarding = jest.fn();
  const mockGoToNextStep = jest.fn();
  const mockGoToPreviousStep = jest.fn();
  const mockReset = jest.fn();
  const mockGetProgressPercentage = jest.fn().mockReturnValue(50);

  const defaultStoreState = {
    currentStep: 'layoff-details',
    data: {
      company: 'Tech Corp',
      role: 'Engineer',
    },
    isLoading: false,
    error: null,
    isCompleted: false,
    loadProgress: mockLoadProgress,
    saveStepData: mockSaveStepData,
    completeOnboarding: mockCompleteOnboarding,
    isCurrentStepValid: jest.fn().mockReturnValue(true),
    canProceed: jest.fn().mockReturnValue(true),
    getProgressPercentage: mockGetProgressPercentage,
    goToNextStep: mockGoToNextStep,
    goToPreviousStep: mockGoToPreviousStep,
    reset: mockReset,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    const mockStore = createMockStore(defaultStoreState);
    (useOnboardingStore as unknown as typeof mockStore).mockReturnValue(defaultStoreState);
  });

  it('should load progress when user is available', () => {
    renderHook(() => useOnboarding());

    expect(mockLoadProgress).toHaveBeenCalledWith(mockUser.id);
  });

  it('should reset when user is not available', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    renderHook(() => useOnboarding());

    expect(mockReset).toHaveBeenCalled();
    expect(mockLoadProgress).not.toHaveBeenCalled();
  });

  it('should save onboarding data with current step', async () => {
    const { result } = renderHook(() => useOnboarding());

    const stepData = { 
      company: 'New Corp',
      role: 'Senior Engineer',
    };

    await act(async () => {
      await result.current.saveOnboardingData(stepData);
    });

    expect(mockSaveStepData).toHaveBeenCalledWith(
      mockUser.id,
      'layoff-details',
      stepData
    );
  });

  it('should complete onboarding with final data', async () => {
    const { result } = renderHook(() => useOnboarding());

    const finalData = { goals: ['job-search', 'wellness'] };

    await act(async () => {
      await result.current.completeOnboarding(finalData);
    });

    expect(mockSaveStepData).toHaveBeenCalledWith(
      mockUser.id,
      'goals',
      finalData
    );
    expect(mockCompleteOnboarding).toHaveBeenCalledWith(mockUser.id);
  });

  it('should complete onboarding without additional data', async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(mockSaveStepData).not.toHaveBeenCalled();
    expect(mockCompleteOnboarding).toHaveBeenCalledWith(mockUser.id);
  });

  it('should not save data when user is not available', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await result.current.saveOnboardingData({ company: 'Test' });
    });

    expect(mockSaveStepData).not.toHaveBeenCalled();
  });

  it('should expose all necessary state and methods', () => {
    const { result } = renderHook(() => useOnboarding());

    expect(result.current).toMatchObject({
      isOnboardingComplete: false,
      isLoading: false,
      error: null,
      onboardingData: {
        company: 'Tech Corp',
        role: 'Engineer',
      },
      currentStep: 'layoff-details',
      saveOnboardingData: expect.any(Function),
      completeOnboarding: expect.any(Function),
      goToNextStep: mockGoToNextStep,
      goToPreviousStep: mockGoToPreviousStep,
      isCurrentStepValid: expect.any(Function),
      canProceed: expect.any(Function),
      progressPercentage: 50,
    });
  });

  it('should handle loading state', () => {
    const mockStore = createMockStore({
      ...defaultStoreState,
      isLoading: true,
    });
    (useOnboardingStore as unknown as typeof mockStore).mockReturnValue({
      ...defaultStoreState,
      isLoading: true,
    });

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const errorMessage = 'Failed to save data';
    const mockStore = createMockStore({
      ...defaultStoreState,
      error: errorMessage,
    });
    (useOnboardingStore as unknown as typeof mockStore).mockReturnValue({
      ...defaultStoreState,
      error: errorMessage,
    });

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle completion state', () => {
    const mockStore = createMockStore({
      ...defaultStoreState,
      isCompleted: true,
    });
    (useOnboardingStore as unknown as typeof mockStore).mockReturnValue({
      ...defaultStoreState,
      isCompleted: true,
    });

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isOnboardingComplete).toBe(true);
  });
});