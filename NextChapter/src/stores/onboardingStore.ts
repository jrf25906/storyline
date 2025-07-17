import { create } from 'zustand';
import { OnboardingService } from '../services/onboarding';
import { 
  OnboardingStep, 
  OnboardingData 
} from '../types/onboarding';

interface OnboardingState {
  // State
  currentStep: OnboardingStep;
  data: OnboardingData;
  isLoading: boolean;
  error: string | null;
  isCompleted: boolean;

  // Service instance
  service: OnboardingService;

  // Actions
  setCurrentStep: (step: OnboardingStep) => void;
  setData: (data: Partial<OnboardingData>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Navigation
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  
  // Persistence
  loadProgress: (userId: string) => Promise<void>;
  saveStepData: (
    userId: string, 
    step: OnboardingStep, 
    data: Partial<OnboardingData>
  ) => Promise<void>;
  completeOnboarding: (userId: string) => Promise<void>;
  
  // Validation
  isCurrentStepValid: () => boolean;
  canProceed: () => boolean;
  
  // Utility
  getProgressPercentage: () => number;
  reset: () => void;
}

const initialState = {
  currentStep: 'welcome' as OnboardingStep,
  data: {},
  isLoading: false,
  error: null,
  isCompleted: false,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,
  service: new OnboardingService(),

  // Basic setters
  setCurrentStep: (step) => set({ currentStep: step }),
  setData: (data) => set((state) => ({ 
    data: { ...state.data, ...data } 
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Navigation
  goToNextStep: () => {
    const { currentStep, service } = get();
    const nextStep = service.getNextStep(currentStep);
    if (nextStep) {
      set({ currentStep: nextStep });
    }
  },

  goToPreviousStep: () => {
    const { currentStep, service } = get();
    const previousStep = service.getPreviousStep(currentStep);
    if (previousStep) {
      set({ currentStep: previousStep });
    }
  },

  // Load existing progress
  loadProgress: async (userId: string) => {
    const { service } = get();
    set({ isLoading: true, error: null });

    try {
      const progress = await service.loadProgress(userId);
      if (progress) {
        set({
          currentStep: progress.currentStep,
          data: progress.data,
        });
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      set({ error: 'Failed to load onboarding progress' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Save step data with persistence
  saveStepData: async (
    userId: string, 
    step: OnboardingStep, 
    stepData: Partial<OnboardingData>
  ) => {
    const { service, data } = get();
    const updatedData = { ...data, ...stepData };
    
    set({ 
      currentStep: step,
      data: updatedData,
      isLoading: true,
      error: null,
    });

    try {
      await service.saveProgress(userId, step, stepData);
    } catch (error) {
      console.error('Failed to save progress:', error);
      set({ error: 'Failed to save progress. Your data is still saved locally.' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Complete onboarding
  completeOnboarding: async (userId: string) => {
    const { service, data } = get();
    set({ isLoading: true, error: null });

    try {
      await service.completeOnboarding(userId, data);
      set({ isCompleted: true });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      set({ error: 'Failed to complete onboarding' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Validation
  isCurrentStepValid: () => {
    const { currentStep, data, service } = get();
    return service.validateStep(currentStep, data);
  },

  canProceed: () => {
    const { currentStep, data, service } = get();
    return service.canProceed(currentStep, data);
  },

  // Progress tracking
  getProgressPercentage: () => {
    const { currentStep, service } = get();
    return service.getProgressPercentage(currentStep);
  },

  // Reset store
  reset: () => set(initialState),
}));