import { BouncePlanTaskDefinition } from '@constants/bouncePlanTasks';
import { BouncePlanTask } from '@types/database';
import { User } from '@supabase/supabase-js';

/**
 * Test data builders following the builder pattern
 * These help create consistent test data while allowing overrides
 */

export const buildUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-123',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  ...overrides,
});

export const buildBouncePlanTaskDefinition = (
  overrides?: Partial<BouncePlanTaskDefinition>
): BouncePlanTaskDefinition => ({
  id: 'day1_test',
  day: 1,
  title: 'Test Task',
  description: 'Test task description',
  duration: '10 minutes',
  category: 'mindset',
  tips: ['Tip 1', 'Tip 2'],
  isWeekend: false,
  ...overrides,
});

export const buildBouncePlanTask = (
  overrides?: Partial<BouncePlanTask>
): BouncePlanTask => ({
  id: 'db-task-123',
  user_id: 'test-user-123',
  day_number: 1,
  task_id: 'day1_test',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const buildCompletedTask = (
  overrides?: Partial<BouncePlanTask>
): BouncePlanTask => buildBouncePlanTask({
  completed_at: new Date().toISOString(),
  ...overrides,
});

export const buildSkippedTask = (
  overrides?: Partial<BouncePlanTask>
): BouncePlanTask => buildBouncePlanTask({
  skipped_at: new Date().toISOString(),
  ...overrides,
});

// Date builders for testing time-based logic
export const buildDate = {
  today: (hours = 10, minutes = 0) => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  },
  
  daysAgo: (days: number, hours = 10) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(hours, 0, 0, 0);
    return date;
  },
  
  daysFromNow: (days: number, hours = 10) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hours, 0, 0, 0);
    return date;
  },
};

// Mock data sets for testing
export const mockTaskSet = {
  week1: () => [
    buildBouncePlanTaskDefinition({ id: 'day1_breathe', day: 1, category: 'mindset' }),
    buildBouncePlanTaskDefinition({ id: 'day2_routine', day: 2, category: 'practical' }),
    buildBouncePlanTaskDefinition({ id: 'day3_finances', day: 3, category: 'practical' }),
    buildBouncePlanTaskDefinition({ id: 'day4_tell_story', day: 4, category: 'prepare' }),
    buildBouncePlanTaskDefinition({ id: 'day5_network_list', day: 5, category: 'network' }),
  ],
  
  withWeekend: () => [
    ...mockTaskSet.week1(),
    buildBouncePlanTaskDefinition({ 
      id: 'day6_weekend', 
      day: 6, 
      category: 'mindset',
      isWeekend: true,
      duration: '0 minutes',
      title: 'Weekend Recharge',
    }),
  ],
};

// Helper function to build store state
export const buildBouncePlanStoreState = (overrides?: any) => ({
  startDate: buildDate.daysAgo(5),
  currentDay: 5,
  completedTasks: new Set(['day1_breathe', 'day2_routine']),
  skippedTasks: new Set(['day3_finances']),
  taskNotes: {
    'day1_breathe': 'Feeling better after this exercise',
  },
  isLoading: false,
  lastSyncedAt: new Date(),
  ...overrides,
});

// Navigation prop builder
export const buildNavigationProp = (overrides?: any) => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  isFocused: jest.fn(() => true),
  ...overrides,
});

// Theme builder
export const buildTheme = () => ({
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    title: { fontSize: 28, fontWeight: '700' as const },
    subtitle: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    caption: { fontSize: 14, fontWeight: '400' as const },
  },
});

// Export feature-specific builders
export * from './builders/bouncePlan';
export * from './builders/budget';