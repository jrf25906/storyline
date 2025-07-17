import { BouncePlanTask } from '../../types/database';
import { BouncePlanProgress, TaskUpdate } from '../../services/database/bouncePlan';

/**
 * Test data builders for Bounce Plan related tests
 * Following the builder pattern for creating test data
 */

export const buildBouncePlanTask = (overrides?: Partial<BouncePlanTask>): BouncePlanTask => ({
  id: 'task-1',
  user_id: 'user123',
  day_number: 1,
  task_id: 'day1_breathe',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const buildCompletedTask = (
  dayNumber: number,
  taskId: string,
  overrides?: Partial<BouncePlanTask>
): BouncePlanTask => 
  buildBouncePlanTask({
    day_number: dayNumber,
    task_id: taskId,
    completed_at: new Date().toISOString(),
    ...overrides,
  });

export const buildSkippedTask = (
  dayNumber: number,
  taskId: string,
  overrides?: Partial<BouncePlanTask>
): BouncePlanTask => 
  buildBouncePlanTask({
    day_number: dayNumber,
    task_id: taskId,
    skipped_at: new Date().toISOString(),
    ...overrides,
  });

export const buildTaskWithNotes = (
  dayNumber: number,
  taskId: string,
  notes: string,
  overrides?: Partial<BouncePlanTask>
): BouncePlanTask => 
  buildBouncePlanTask({
    day_number: dayNumber,
    task_id: taskId,
    notes,
    completed_at: new Date().toISOString(),
    ...overrides,
  });

export const buildBouncePlanProgress = (
  overrides?: Partial<BouncePlanProgress>
): BouncePlanProgress => ({
  tasks: [],
  startDate: new Date('2025-01-01'),
  ...overrides,
});

export const buildTaskUpdate = (overrides?: Partial<TaskUpdate>): TaskUpdate => ({
  taskId: 'day1_breathe',
  completed: false,
  skipped: false,
  notes: undefined,
  ...overrides,
});

export const buildCompletedTaskUpdate = (
  taskId: string,
  notes?: string
): TaskUpdate => 
  buildTaskUpdate({
    taskId,
    completed: true,
    notes,
  });

export const buildSkippedTaskUpdate = (
  taskId: string,
  notes?: string
): TaskUpdate => 
  buildTaskUpdate({
    taskId,
    skipped: true,
    notes,
  });

/**
 * Build a full 30-day bounce plan progress
 */
export const buildFullBouncePlan = (
  completedDays: number[] = [],
  skippedDays: number[] = [],
  startDate: Date = new Date('2025-01-01')
): BouncePlanProgress => {
  const tasks: BouncePlanTask[] = [];
  
  // Add completed tasks
  completedDays.forEach(day => {
    tasks.push(buildCompletedTask(day, `day${day}_task`));
  });
  
  // Add skipped tasks
  skippedDays.forEach(day => {
    tasks.push(buildSkippedTask(day, `day${day}_task`));
  });
  
  return buildBouncePlanProgress({
    tasks,
    startDate,
  });
};

/**
 * Build test data for offline sync scenarios
 */
export const buildOfflineSyncScenario = () => ({
  localTasks: {
    completed: new Set(['day1_breathe', 'day2_routine', 'day3_finances']),
    skipped: new Set(['day4_emails']),
    notes: {
      'day1_breathe': 'Local note 1',
      'day3_finances': 'Local note 3',
    },
  },
  serverTasks: [
    buildCompletedTask(1, 'day1_breathe', { notes: 'Server note 1' }),
    buildSkippedTask(2, 'day2_routine'),
    buildCompletedTask(5, 'day5_apply', { notes: 'Server note 5' }),
  ],
  expectedMerge: {
    // Last-write-wins: local state overwrites server
    completed: new Set(['day1_breathe', 'day2_routine', 'day3_finances']),
    skipped: new Set(['day4_emails']),
    notes: {
      'day1_breathe': 'Local note 1', // Local wins
      'day3_finances': 'Local note 3',
    },
  },
});

/**
 * Build network state for testing
 */
export const buildNetworkState = (isConnected: boolean = true) => ({
  isConnected,
  isInternetReachable: isConnected,
  type: isConnected ? 'wifi' : 'none',
  details: null,
});

/**
 * Build mock Supabase responses
 */
export const buildSupabaseSuccess = <T>(data: T) => ({
  data,
  error: null,
});

export const buildSupabaseError = (message: string, code?: string) => ({
  data: null,
  error: {
    message,
    code: code || 'UNKNOWN',
  },
});

export const buildSupabaseNotFoundError = () => 
  buildSupabaseError('No rows found', 'PGRST116');

/**
 * Build common test scenarios
 */
export const testScenarios = {
  newUser: () => ({
    progress: buildBouncePlanProgress({ tasks: [] }),
    store: {
      completedTasks: new Set<string>(),
      skippedTasks: new Set<string>(),
      taskNotes: {},
      startDate: null,
    },
  }),
  
  activeUser: () => ({
    progress: buildFullBouncePlan([1, 2, 3, 5], [4]),
    store: {
      completedTasks: new Set(['day1_breathe', 'day2_routine', 'day3_finances', 'day5_apply']),
      skippedTasks: new Set(['day4_emails']),
      taskNotes: {
        'day1_breathe': 'Good start',
        'day3_finances': 'Budget reviewed',
      },
      startDate: new Date('2025-01-01'),
    },
  }),
  
  completedPlan: () => ({
    progress: buildFullBouncePlan(
      Array.from({ length: 30 }, (_, i) => i + 1), // All 30 days completed
      []
    ),
    store: {
      completedTasks: new Set(
        Array.from({ length: 30 }, (_, i) => `day${i + 1}_task`)
      ),
      skippedTasks: new Set<string>(),
      taskNotes: {},
      startDate: new Date('2024-12-01'), // Started 30+ days ago
    },
  }),
};