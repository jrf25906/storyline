/**
 * User properties management service
 */

import { Result } from '@services/interfaces/common/result';

export interface IUserPropertiesService {
  // Core properties
  setUserId(userId: string): void;
  setEmail(email: string): void;
  setName(name: string): void;
  
  // Demographics
  setDemographics(demographics: UserDemographics): void;
  
  // App-specific properties
  setLayoffDate(date: Date): void;
  setIndustry(industry: string): void;
  setExperienceLevel(level: ExperienceLevel): void;
  setJobSearchStatus(status: JobSearchStatus): void;
  setTargetRole(role: string): void;
  setTargetSalary(range: SalaryRange): void;
  
  // Behavioral properties
  setEngagementLevel(level: EngagementLevel): void;
  setPreferredCoachTone(tone: string): void;
  setActiveFeatures(features: string[]): void;
  setCompletionRates(rates: CompletionRates): void;
  
  // Subscription properties
  setSubscriptionStatus(status: SubscriptionStatus): void;
  setSubscriptionPlan(plan: string): void;
  setTrialEndDate(date: Date): void;
  
  // Computed properties
  updateDaysSinceLayoff(): void;
  updateTaskCompletionRate(): void;
  updateEngagementScore(): void;
  updateLifetimeValue(): void;
  
  // Cohorts
  addToCohort(cohortName: string): void;
  removeFromCohort(cohortName: string): void;
  getCohorts(): string[];
  
  // Custom properties
  setCustomProperty(key: string, value: any): void;
  setCustomProperties(properties: Record<string, any>): void;
  incrementProperty(key: string, by?: number): void;
  appendToProperty(key: string, value: any): void;
  
  // Property management
  getAllProperties(): Promise<Result<UserProperties>>;
  clearProperty(key: string): void;
  clearAllProperties(): void;
}

export interface UserDemographics {
  age?: number;
  ageRange?: string;
  gender?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
  };
  education?: string;
}

export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';

export type JobSearchStatus = 
  | 'just_started'
  | 'actively_searching'
  | 'casually_looking'
  | 'interviewing'
  | 'offer_stage'
  | 'accepted_offer';

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export type EngagementLevel = 'low' | 'medium' | 'high' | 'power_user';

export interface CompletionRates {
  onboarding: number;
  dailyTasks: number;
  weeklyTasks: number;
  overallBounce: number;
}

export interface SubscriptionStatus {
  isActive: boolean;
  isPro: boolean;
  isTrialing: boolean;
  isCancelled: boolean;
  willRenew: boolean;
}

export interface UserProperties {
  // Identifiers
  userId: string;
  email?: string;
  name?: string;
  
  // Demographics
  demographics?: UserDemographics;
  
  // Professional
  layoffDate?: Date;
  daysSinceLayoff?: number;
  industry?: string;
  experienceLevel?: ExperienceLevel;
  jobSearchStatus?: JobSearchStatus;
  targetRole?: string;
  targetSalary?: SalaryRange;
  
  // Behavioral
  engagementLevel?: EngagementLevel;
  engagementScore?: number;
  preferredCoachTone?: string;
  activeFeatures?: string[];
  completionRates?: CompletionRates;
  lastActiveDate?: Date;
  totalSessions?: number;
  
  // Subscription
  subscription?: SubscriptionStatus;
  subscriptionPlan?: string;
  trialEndDate?: Date;
  lifetimeValue?: number;
  
  // Cohorts
  cohorts?: string[];
  
  // Custom
  custom?: Record<string, any>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}