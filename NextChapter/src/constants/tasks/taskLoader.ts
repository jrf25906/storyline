import { BouncePlanTaskDefinition, TaskWeek } from './types';

/**
 * Lazy task loader for better performance
 * Only loads tasks when needed, reducing initial bundle size
 */

// Cache for loaded task weeks
const taskCache = new Map<TaskWeek, BouncePlanTaskDefinition[]>();

/**
 * Get tasks for a specific week with lazy loading
 * @param week Week number (1-4)
 * @returns Promise resolving to tasks for that week
 */
export const getTasksForWeek = async (week: TaskWeek): Promise<BouncePlanTaskDefinition[]> => {
  // Return cached version if available
  if (taskCache.has(week)) {
    return taskCache.get(week)!;
  }

  // Import the specific week's tasks
  let tasks: BouncePlanTaskDefinition[];
  
  try {
    switch (week) {
      case 1: {
        const week1Module = await import('./week1');
        tasks = week1Module.WEEK_1_TASKS;
        break;
      }
      case 2: {
        const week2Module = await import('./week2');
        tasks = week2Module.WEEK_2_TASKS;
        break;
      }
      case 3: {
        const week3Module = await import('./week3');
        tasks = week3Module.WEEK_3_TASKS;
        break;
      }
      case 4: {
        const week4Module = await import('./week4');
        tasks = week4Module.WEEK_4_TASKS;
        break;
      }
      default:
        throw new Error(`Invalid week: ${week}. Must be 1-4.`);
    }
  } catch (error) {
    // Re-throw with more context
    throw new Error(`Failed to load tasks for week ${week}: ${error}`);
  }

  // Cache the tasks
  taskCache.set(week, tasks);
  return tasks;
};

/**
 * Get a specific task by day
 * @param day Day number (1-30)
 * @returns Promise resolving to the task for that day
 */
export const getTaskForDay = async (day: number): Promise<BouncePlanTaskDefinition | null> => {
  if (day < 1 || day > 30) {
    return null;
  }

  // Determine which week this day belongs to
  const week = Math.ceil(day / 7) as TaskWeek;
  const tasks = await getTasksForWeek(week);
  
  return tasks.find(task => task.day === day) || null;
};

/**
 * Preload tasks for performance optimization
 * Call this during app idle time or on critical user paths
 */
export const preloadAllTasks = async (): Promise<void> => {
  const weeks: TaskWeek[] = [1, 2, 3, 4];
  
  // Load all weeks in parallel
  await Promise.all(
    weeks.map(week => getTasksForWeek(week))
  );
};

/**
 * Get all tasks (compatibility with existing code)
 * This function loads all tasks but in an optimized way
 */
export const getAllTasks = async (): Promise<BouncePlanTaskDefinition[]> => {
  const weeks: TaskWeek[] = [1, 2, 3, 4];
  
  // Load all weeks and flatten
  const weekTasks = await Promise.all(
    weeks.map(week => getTasksForWeek(week))
  );
  
  return weekTasks.flat().sort((a, b) => a.day - b.day);
};

/**
 * Clear task cache (useful for memory management)
 */
export const clearTaskCache = (): void => {
  taskCache.clear();
};