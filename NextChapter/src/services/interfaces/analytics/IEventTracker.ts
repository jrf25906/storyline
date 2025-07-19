/**
 * Domain-specific event tracking interface
 */

export interface IEventTracker {
  // Onboarding events
  trackOnboardingStarted(): void;
  trackOnboardingStepCompleted(step: string, properties?: OnboardingStepProperties): void;
  trackOnboardingCompleted(properties?: OnboardingCompletionProperties): void;
  trackOnboardingSkipped(atStep: string): void;
  
  // Bounce Plan events
  trackBouncePlanStarted(day: number): void;
  trackTaskViewed(taskId: string, day: number): void;
  trackTaskCompleted(taskId: string, properties?: TaskCompletionProperties): void;
  trackTaskSkipped(taskId: string, reason?: string): void;
  trackWeekCompleted(weekNumber: number, completionRate: number): void;
  
  // Coach events
  trackCoachOpened(): void;
  trackCoachMessageSent(properties: CoachMessageProperties): void;
  trackCoachToneDetected(tone: string, confidence: number): void;
  trackCrisisInterventionShown(): void;
  trackCoachRated(rating: number, feedback?: string): void;
  
  // Job Tracker events
  trackJobApplicationAdded(properties: JobApplicationProperties): void;
  trackJobApplicationUpdated(applicationId: string, changes: string[]): void;
  trackJobApplicationStatusChanged(applicationId: string, fromStatus: string, toStatus: string): void;
  trackInterviewScheduled(applicationId: string, interviewType: string): void;
  trackOfferReceived(applicationId: string, salary?: number): void;
  
  // Resume events
  trackResumeUploaded(properties: ResumeUploadProperties): void;
  trackResumeAnalyzed(resumeId: string, score: number): void;
  trackResumeKeywordAdded(keyword: string): void;
  trackResumeRewritten(section: string): void;
  trackResumeDownloaded(format: string): void;
  
  // Budget events
  trackBudgetCreated(properties: BudgetProperties): void;
  trackBudgetUpdated(changes: string[]): void;
  trackRunwayCalculated(days: number, isLow: boolean): void;
  trackExpenseAdded(category: string, amount: number): void;
  trackBudgetAlertShown(type: string, runwayDays: number): void;
  
  // Wellness events
  trackMoodLogged(mood: number, properties?: MoodProperties): void;
  trackMoodTrendViewed(period: string): void;
  trackWellnessActivityCompleted(activity: string, duration?: number): void;
  trackCrisisResourceAccessed(resource: string): void;
  
  // Engagement events
  trackDailyStreak(days: number): void;
  trackWeeklyActiveDay(): void;
  trackFeatureDiscovered(feature: string): void;
  trackShareAction(content: string, method: string): void;
  trackFeedbackSubmitted(type: string, rating?: number): void;
  
  // Conversion events
  trackTrialStarted(): void;
  trackSubscriptionStarted(plan: string, price: number): void;
  trackSubscriptionCancelled(reason?: string): void;
  trackSubscriptionResumed(): void;
  trackPaymentFailed(error: string): void;
}

// Event property interfaces
export interface OnboardingStepProperties {
  duration: number;
  skippedFields?: string[];
  [key: string]: any;
}

export interface OnboardingCompletionProperties {
  totalDuration: number;
  completedSteps: number;
  skippedSteps: number;
  layoffRecency: string;
  hasExperience: boolean;
}

export interface TaskCompletionProperties {
  day: number;
  timeSpent: number;
  completedOnTime: boolean;
  hadDifficulty?: boolean;
}

export interface CoachMessageProperties {
  tone: string;
  messageLength: number;
  responseTime: number;
  isFirstMessage: boolean;
  conversationLength: number;
}

export interface JobApplicationProperties {
  source: string;
  hasReferral: boolean;
  matchScore?: number;
  industry?: string;
  experienceLevel?: string;
}

export interface ResumeUploadProperties {
  fileSize: number;
  pageCount: number;
  hasAllSections: boolean;
  parseSuccess: boolean;
}

export interface BudgetProperties {
  hasIncome: boolean;
  expenseCategories: number;
  runway: number;
  includesUnemployment: boolean;
}

export interface MoodProperties {
  time: string;
  triggers?: string[];
  activities?: string[];
  notes?: boolean;
}