import { BaseStore, BaseState, AsyncResult } from '@stores/interfaces/base';
import { OnboardingStep, OnboardingData } from '@types/onboarding';

/**
 * Onboarding store state interface
 */
export interface OnboardingState extends BaseState {
  currentStep: OnboardingStep;
  data: OnboardingData;
  isCompleted: boolean;
}

/**
 * Navigation operations
 * Single Responsibility: Managing step navigation
 */
export interface NavigationOperations {
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setCurrentStep: (step: OnboardingStep) => void;
}

/**
 * Data operations
 * Single Responsibility: Managing onboarding data
 */
export interface OnboardingDataOperations {
  setData: (data: Partial<OnboardingData>) => void;
  saveStepData: (
    userId: string, 
    step: OnboardingStep, 
    data: Partial<OnboardingData>
  ) => AsyncResult;
}

/**
 * Progress operations
 * Single Responsibility: Managing onboarding progress
 */
export interface ProgressOperations {
  loadProgress: (userId: string) => AsyncResult;
  completeOnboarding: (userId: string) => AsyncResult;
  getProgressPercentage: () => number;
}

/**
 * Validation operations
 * Single Responsibility: Validating onboarding state
 */
export interface ValidationOperations {
  isCurrentStepValid: () => boolean;
  canProceed: () => boolean;
}

/**
 * Complete onboarding store interface
 * Composed of all onboarding-related operations
 */
export interface IOnboardingStore extends 
  BaseStore,
  OnboardingState,
  NavigationOperations,
  OnboardingDataOperations,
  ProgressOperations,
  ValidationOperations {
  // Additional methods if needed
}

/**
 * Step configuration for validation and navigation
 */
export interface StepConfig {
  step: OnboardingStep;
  required: boolean;
  requiredFields: (keyof OnboardingData)[];
  nextStep?: OnboardingStep;
  previousStep?: OnboardingStep;
}