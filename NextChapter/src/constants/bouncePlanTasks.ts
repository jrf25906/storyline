// DEPRECATED: This file is maintained for backward compatibility only
// For new code, use @constants/tasks with lazy loading for better performance

import { 
  BouncePlanTaskDefinition,
  getAllTasks,
  getTasksByCategory as getTasksByCategoryAsync,
  getTaskByDay as getTaskByDayAsync,
  getWeekFromDay,
  WEEK_TITLES,
  getBOUNCE_PLAN_TASKS
} from '@constants/tasks';

// Re-export types for compatibility
export interface BouncePlanTaskDefinition {
  id: string;
  day: number;
  title: string;
  description: string;
  duration: string; // e.g., "10 minutes"
  category: 'mindset' | 'practical' | 'network' | 'prepare' | 'action';
  tips: string[];
  isWeekend?: boolean;
}

// For immediate synchronous access, we provide a promise-based getter
// This maintains API compatibility while using optimized loading
let _tasksCache: BouncePlanTaskDefinition[] | null = null;
let _tasksPromise: Promise<BouncePlanTaskDefinition[]> | null = null;

/**
 * Get all bounce plan tasks
 * @deprecated Use getAllTasks() from @constants/tasks for better performance
 */
export const BOUNCE_PLAN_TASKS: BouncePlanTaskDefinition[] = [];

// Initialize tasks asynchronously but make them available synchronously for compatibility
const initializeTasks = async () => {
  if (!_tasksPromise) {
    _tasksPromise = getBOUNCE_PLAN_TASKS();
    _tasksCache = await _tasksPromise;
    
    // Populate the synchronous array for backward compatibility
    BOUNCE_PLAN_TASKS.length = 0;
    BOUNCE_PLAN_TASKS.push(..._tasksCache);
  }
  return _tasksCache!;
};

// Start loading immediately
initializeTasks().catch(console.error);

// Helper function to get tasks by category
export function getTasksByCategory(category: BouncePlanTaskDefinition['category']): BouncePlanTaskDefinition[] {
  return BOUNCE_PLAN_TASKS.filter(task => task.category === category);
}

// Helper function to get task by day
export function getTaskByDay(day: number): BouncePlanTaskDefinition | undefined {
  return BOUNCE_PLAN_TASKS.find(task => task.day === day);
}

// Re-export helper functions
export { getWeekFromDay, WEEK_TITLES };