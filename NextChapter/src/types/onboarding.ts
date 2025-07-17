export type OnboardingStep = 
  | 'welcome' 
  | 'layoff-details' 
  | 'personal-info' 
  | 'goals';

export interface LayoffDetails {
  company?: string;
  role?: string;
  layoffDate?: string;
  severanceWeeks?: string;
}

export interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
}

export interface Goals {
  goals?: string[];
}

export interface OnboardingData extends LayoffDetails, PersonalInfo, Goals {}

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  data: OnboardingData;
  timestamp: number;
}

export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location?: string;
  company?: string;
  role?: string;
  layoff_date: string;
  severance_weeks?: number;
  goals: string[];
  elapsed_days_since_layoff?: number;
  onboarding_completed_at: string;
  created_at?: string;
  updated_at: string;
}