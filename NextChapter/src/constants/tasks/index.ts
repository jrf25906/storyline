// Export the main taskLoader functions for new code
export {
  getTasksForWeek,
  getTaskForDay,
  getAllTasks,
  preloadAllTasks,
  clearTaskCache
} from './taskLoader';

// Export types
export type { BouncePlanTaskDefinition, TaskWeek } from './types';

// Export constants for compatibility
export const WEEK_TITLES = {
  1: 'Stabilization & Mindset Reset',
  2: 'Building Momentum', 
  3: 'Active Job Search',
  4: 'Accelerate & Refine'
} as const;

// Compatibility helpers that use the new lazy loading system
import { getAllTasks, getTaskForDay } from './taskLoader';
import { BouncePlanTaskDefinition } from './types';

/**
 * Get tasks by category (compatibility function)
 * @deprecated Use getTasksForWeek and filter if needed for better performance
 */
export async function getTasksByCategory(category: BouncePlanTaskDefinition['category']): Promise<BouncePlanTaskDefinition[]> {
  const allTasks = await getAllTasks();
  return allTasks.filter(task => task.category === category);
}

/**
 * Get task by day (compatibility function)
 * Uses optimized lazy loading under the hood
 */
export async function getTaskByDay(day: number): Promise<BouncePlanTaskDefinition | undefined> {
  const task = await getTaskForDay(day);
  return task || undefined;
}

/**
 * Get week number from day (utility function)
 */
export function getWeekFromDay(day: number): number {
  return Math.ceil(day / 7);
}

/**
 * For backward compatibility - lazy loaded version of BOUNCE_PLAN_TASKS
 * @deprecated Use getTasksForWeek or getAllTasks for better performance
 */
let _cachedAllTasks: BouncePlanTaskDefinition[] | null = null;

export async function getBOUNCE_PLAN_TASKS(): Promise<BouncePlanTaskDefinition[]> {
  if (!_cachedAllTasks) {
    _cachedAllTasks = await getAllTasks();
  }
  return _cachedAllTasks;
}

// Clear cache when module is reset (for testing)
export function clearCompatibilityCache(): void {
  _cachedAllTasks = null;
}