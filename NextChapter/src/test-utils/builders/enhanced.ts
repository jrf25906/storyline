/**
 * Enhanced Test Data Builders
 * 
 * Provides comprehensive builders for all domain entities with realistic test data.
 * Follows the builder pattern for easy test data creation and customization.
 */

import { 
  Task, 
  BudgetData, 
  JobApplication, 
  MoodEntry,
  CoachMessage,
  User,
  NotificationSettings,
  OnboardingData,
  Resume,
  WellnessActivity,
} from '@types';

/**
 * Base builder function that merges defaults with overrides
 */
const createBuilder = <T>(defaults: T) => (overrides?: Partial<T>): T => ({
  ...defaults,
  ...overrides,
});

/**
 * Generate a unique ID for test entities
 */
let idCounter = 0;
export const generateId = (prefix = 'test') => `${prefix}-${++idCounter}`;

/**
 * Generate a random date within a range
 */
export const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

/**
 * Task builder with realistic bounce plan data
 */
export const buildTask = createBuilder<Task>({
  id: generateId('task'),
  day: 1,
  title: 'Update Your Resume',
  description: 'Review and update your resume with recent accomplishments',
  category: 'job-search',
  estimatedMinutes: 30,
  completed: false,
  completedAt: null,
  tips: [
    'Focus on quantifiable achievements',
    'Use action verbs',
    'Keep it to 2 pages maximum',
  ],
  resources: [
    { title: 'Resume Guide', url: 'https://example.com/resume-guide' },
  ],
});

/**
 * Budget data builder with realistic financial information
 */
export const buildBudgetData = createBuilder<BudgetData>({
  monthlyExpenses: 3500,
  currentSavings: 15000,
  severanceAmount: 8000,
  unemploymentBenefits: 1200,
  otherIncome: 0,
  lastUpdated: new Date(),
  runway: 90,
  alerts: [],
});

/**
 * Job application builder with various stages
 */
export const buildJobApplication = createBuilder<JobApplication>({
  id: generateId('job'),
  company: 'Tech Corp',
  position: 'Senior Developer',
  url: 'https://example.com/job',
  appliedDate: new Date(),
  stage: 'applied',
  notes: 'Great culture fit, strong tech stack match',
  salary: '$120k-$150k',
  location: 'Remote',
  contactName: 'Jane Smith',
  contactEmail: 'jane@techcorp.com',
  nextSteps: 'Phone screen scheduled for next week',
  keywords: ['React', 'TypeScript', 'Node.js'],
  lastUpdated: new Date(),
});

/**
 * Mood entry builder for wellness tracking
 */
export const buildMoodEntry = createBuilder<MoodEntry>({
  id: generateId('mood'),
  mood: 3,
  notes: 'Feeling hopeful after sending out applications',
  timestamp: new Date(),
  triggers: ['job-search', 'progress'],
  activities: ['exercise', 'meditation'],
});

/**
 * Coach message builder with different tones
 */
export const buildCoachMessage = createBuilder<CoachMessage>({
  id: generateId('msg'),
  content: 'You\'re making great progress! Keep up the momentum.',
  role: 'assistant',
  tone: 'hype',
  timestamp: new Date(),
  emotionalState: 'hopeful',
});

/**
 * User builder with complete profile
 */
export const buildUser = createBuilder<User>({
  id: generateId('user'),
  email: 'test@example.com',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    industry: 'Technology',
    yearsExperience: 5,
    location: 'San Francisco, CA',
    desiredRole: 'Senior Software Engineer',
    layoffDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    timeElapsed: 30,
  },
  onboardingCompleted: true,
  createdAt: new Date(),
});

/**
 * Notification settings builder
 */
export const buildNotificationSettings = createBuilder<NotificationSettings>({
  dailyTaskReminder: true,
  dailyTaskReminderTime: '09:00',
  weeklyProgress: true,
  budgetAlerts: true,
  moodCheckIn: true,
  applicationDeadlines: true,
  pushEnabled: true,
  emailEnabled: false,
});

/**
 * Onboarding data builder
 */
export const buildOnboardingData = createBuilder<OnboardingData>({
  currentStep: 'complete',
  layoffDetails: {
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    company: 'Previous Corp',
    role: 'Software Engineer',
    yearsAtCompany: 3,
    severanceWeeks: 8,
    hasUnemploymentBenefits: true,
  },
  careerGoals: {
    targetRole: 'Senior Software Engineer',
    targetIndustries: ['Technology', 'FinTech'],
    openToRelocation: true,
    expectedTimeline: '3 months',
    salaryExpectations: '$120k-$150k',
  },
  emotionalState: {
    initialMood: 2,
    biggestConcerns: ['Financial stability', 'Finding the right fit'],
    supportSystem: ['Family', 'Friends', 'Professional network'],
    copingStrategies: ['Exercise', 'Meditation', 'Networking'],
  },
});

/**
 * Resume builder with analysis data
 */
export const buildResume = createBuilder<Resume>({
  id: generateId('resume'),
  fileName: 'john_doe_resume.pdf',
  uploadedAt: new Date(),
  analyzedAt: new Date(),
  keywords: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
  matchScore: 0.85,
  suggestions: [
    'Add more quantifiable achievements',
    'Include specific technologies used',
    'Expand on leadership experience',
  ],
  content: 'John Doe\nSenior Software Engineer...',
});

/**
 * Wellness activity builder
 */
export const buildWellnessActivity = createBuilder<WellnessActivity>({
  id: generateId('wellness'),
  type: 'exercise',
  name: 'Morning Run',
  duration: 30,
  completedAt: new Date(),
  notes: 'Felt energized after',
  moodBefore: 2,
  moodAfter: 4,
});

/**
 * Create a complete test user with all related data
 */
export const buildCompleteUser = (overrides?: any) => {
  const user = buildUser(overrides?.user);
  
  return {
    user,
    tasks: Array.from({ length: 30 }, (_, i) => 
      buildTask({ day: i + 1, completed: i < 5 })
    ),
    budget: buildBudgetData(overrides?.budget),
    applications: [
      buildJobApplication({ stage: 'applied' }),
      buildJobApplication({ stage: 'interviewing', company: 'StartupXYZ' }),
      buildJobApplication({ stage: 'offer', company: 'BigTech Inc' }),
    ],
    moodEntries: Array.from({ length: 7 }, (_, i) => 
      buildMoodEntry({ 
        mood: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      })
    ),
    coachMessages: [
      buildCoachMessage({ role: 'user', content: 'I\'m feeling overwhelmed' }),
      buildCoachMessage({ role: 'assistant', tone: 'pragmatist' }),
    ],
    settings: buildNotificationSettings(overrides?.settings),
  };
};

/**
 * Create test data for specific scenarios
 */
export const scenarios = {
  /**
   * User in crisis mode
   */
  crisisUser: () => buildCompleteUser({
    user: { profile: { layoffDate: new Date() } },
    budget: { runway: 30, currentSavings: 2000 },
  }),

  /**
   * Successful user with multiple offers
   */
  successfulUser: () => buildCompleteUser({
    applications: [
      buildJobApplication({ stage: 'offer', company: 'Dream Company' }),
      buildJobApplication({ stage: 'offer', company: 'Great Startup' }),
    ],
  }),

  /**
   * User needing motivation
   */
  unmotivatedUser: () => buildCompleteUser({
    tasks: Array.from({ length: 30 }, (_, i) => 
      buildTask({ day: i + 1, completed: false })
    ),
    moodEntries: Array.from({ length: 7 }, () => 
      buildMoodEntry({ mood: 1 })
    ),
  }),

  /**
   * New user just starting
   */
  newUser: () => buildCompleteUser({
    user: { 
      onboardingCompleted: false,
      profile: { layoffDate: new Date() },
    },
    tasks: [],
    applications: [],
    moodEntries: [],
  }),
};

/**
 * Reset ID counter for test isolation
 */
export const resetIdCounter = () => {
  idCounter = 0;
};