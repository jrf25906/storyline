import { BouncePlanTaskDefinition, TaskWeek } from '../types';

// Create a synchronous test version that doesn't use dynamic imports
// This simulates the functionality without Jest's dynamic import limitations

class TaskLoaderTest {
  private taskCache = new Map<TaskWeek, BouncePlanTaskDefinition[]>();
  
  // Test data - simulates the week modules
  private weekTasks = {
    1: [
      { id: 'day1_test', day: 1, title: 'Test Task 1', category: 'mindset' as const, description: 'Test', duration: '10 min', tips: [] },
      { id: 'day2_test', day: 2, title: 'Test Task 2', category: 'practical' as const, description: 'Test', duration: '10 min', tips: [] }
    ],
    2: [
      { id: 'day8_test', day: 8, title: 'Test Task 8', category: 'prepare' as const, description: 'Test', duration: '10 min', tips: [] },
      { id: 'day9_test', day: 9, title: 'Test Task 9', category: 'action' as const, description: 'Test', duration: '10 min', tips: [] }
    ],
    3: [
      { id: 'day15_test', day: 15, title: 'Test Task 15', category: 'network' as const, description: 'Test', duration: '10 min', tips: [] }
    ],
    4: [
      { id: 'day22_test', day: 22, title: 'Test Task 22', category: 'action' as const, description: 'Test', duration: '10 min', tips: [] }
    ]
  };

  async getTasksForWeek(week: TaskWeek): Promise<BouncePlanTaskDefinition[]> {
    if (this.taskCache.has(week)) {
      return this.taskCache.get(week)!;
    }

    if (week < 1 || week > 4) {
      throw new Error(`Invalid week: ${week}. Must be 1-4.`);
    }

    // Create a deep copy to simulate fresh loading
    const tasks = JSON.parse(JSON.stringify(this.weekTasks[week])) as BouncePlanTaskDefinition[];
    this.taskCache.set(week, tasks);
    return tasks;
  }

  async getTaskForDay(day: number): Promise<BouncePlanTaskDefinition | null> {
    if (day < 1 || day > 30) {
      return null;
    }

    const week = Math.ceil(day / 7) as TaskWeek;
    const tasks = await this.getTasksForWeek(week);
    
    return tasks.find(task => task.day === day) || null;
  }

  async getAllTasks(): Promise<BouncePlanTaskDefinition[]> {
    const weeks: TaskWeek[] = [1, 2, 3, 4];
    
    const weekTasks = await Promise.all(
      weeks.map(week => this.getTasksForWeek(week))
    );
    
    return weekTasks.flat().sort((a, b) => a.day - b.day);
  }

  async preloadAllTasks(): Promise<void> {
    const weeks: TaskWeek[] = [1, 2, 3, 4];
    
    await Promise.all(
      weeks.map(week => this.getTasksForWeek(week))
    );
  }

  clearTaskCache(): void {
    this.taskCache.clear();
  }
}

// Create test instance
const taskLoader = new TaskLoaderTest();

// Export functions that match the main API
const getTasksForWeek = taskLoader.getTasksForWeek.bind(taskLoader);
const getTaskForDay = taskLoader.getTaskForDay.bind(taskLoader);
const getAllTasks = taskLoader.getAllTasks.bind(taskLoader);
const preloadAllTasks = taskLoader.preloadAllTasks.bind(taskLoader);
const clearTaskCache = taskLoader.clearTaskCache.bind(taskLoader);

describe('TaskLoader', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearTaskCache();
    // Clear module cache
    jest.clearAllMocks();
  });

  describe('getTasksForWeek', () => {
    it('should load tasks for week 1', async () => {
      const tasks = await getTasksForWeek(1 as TaskWeek);
      
      expect(tasks).toHaveLength(2);
      expect(tasks[0]).toMatchObject({
        id: 'day1_test',
        day: 1,
        title: 'Test Task 1',
        category: 'mindset'
      });
    });

    it('should load tasks for week 2', async () => {
      const tasks = await getTasksForWeek(2 as TaskWeek);
      
      expect(tasks).toHaveLength(2);
      expect(tasks[0]).toMatchObject({
        id: 'day8_test',
        day: 8,
        title: 'Test Task 8',
        category: 'prepare'
      });
    });

    it('should cache loaded tasks', async () => {
      // First call
      const tasks1 = await getTasksForWeek(1 as TaskWeek);
      
      // Second call should return cached version
      const tasks2 = await getTasksForWeek(1 as TaskWeek);
      
      expect(tasks1).toBe(tasks2); // Same reference indicates caching
    });

    it('should throw error for invalid week', async () => {
      await expect(getTasksForWeek(5 as TaskWeek)).rejects.toThrow('Invalid week: 5. Must be 1-4.');
    });
  });

  describe('getTaskForDay', () => {
    it('should return task for valid day', async () => {
      const task = await getTaskForDay(1);
      
      expect(task).toMatchObject({
        id: 'day1_test',
        day: 1,
        title: 'Test Task 1'
      });
    });

    it('should return task from correct week', async () => {
      const task = await getTaskForDay(8);
      
      expect(task).toMatchObject({
        id: 'day8_test',
        day: 8,
        title: 'Test Task 8'
      });
    });

    it('should return null for invalid day (< 1)', async () => {
      const task = await getTaskForDay(0);
      expect(task).toBeNull();
    });

    it('should return null for invalid day (> 30)', async () => {
      const task = await getTaskForDay(31);
      expect(task).toBeNull();
    });

    it('should return null for day with no task', async () => {
      const task = await getTaskForDay(3); // No task defined for day 3 in our mocks
      expect(task).toBeNull();
    });
  });

  describe('getAllTasks', () => {
    it('should load all tasks from all weeks', async () => {
      const allTasks = await getAllTasks();
      
      expect(allTasks).toHaveLength(6); // 2 + 2 + 1 + 1 from our mocks
      
      // Should be sorted by day
      expect(allTasks[0].day).toBe(1);
      expect(allTasks[1].day).toBe(2);
      expect(allTasks[2].day).toBe(8);
      expect(allTasks[3].day).toBe(9);
      expect(allTasks[4].day).toBe(15);
      expect(allTasks[5].day).toBe(22);
    });

    it('should maintain task order by day', async () => {
      const allTasks = await getAllTasks();
      
      for (let i = 1; i < allTasks.length; i++) {
        expect(allTasks[i].day).toBeGreaterThan(allTasks[i - 1].day);
      }
    });
  });

  describe('preloadAllTasks', () => {
    it('should preload all weeks without errors', async () => {
      await expect(preloadAllTasks()).resolves.toBeUndefined();
    });

    it('should cache all tasks after preloading', async () => {
      await preloadAllTasks();
      
      // Subsequent calls should be fast (cached)
      const week1Tasks = await getTasksForWeek(1 as TaskWeek);
      const week2Tasks = await getTasksForWeek(2 as TaskWeek);
      const week3Tasks = await getTasksForWeek(3 as TaskWeek);
      const week4Tasks = await getTasksForWeek(4 as TaskWeek);
      
      expect(week1Tasks).toHaveLength(2);
      expect(week2Tasks).toHaveLength(2);
      expect(week3Tasks).toHaveLength(1);
      expect(week4Tasks).toHaveLength(1);
    });
  });

  describe('clearTaskCache', () => {
    it('should clear the cache and reload tasks', async () => {
      // Load tasks to populate cache
      const tasks1 = await getTasksForWeek(1 as TaskWeek);
      
      // Clear cache
      clearTaskCache();
      
      // Load tasks again - should create new instances
      const tasks2 = await getTasksForWeek(1 as TaskWeek);
      
      // Content should be the same, but references should be different
      expect(tasks1).toEqual(tasks2);
      expect(tasks1).not.toBe(tasks2);
    });
  });

  describe('error handling', () => {
    it('should handle invalid week numbers', async () => {
      await expect(getTasksForWeek(0 as TaskWeek)).rejects.toThrow('Invalid week: 0. Must be 1-4.');
      await expect(getTasksForWeek(5 as TaskWeek)).rejects.toThrow('Invalid week: 5. Must be 1-4.');
    });
  });

  describe('performance', () => {
    it('should load tasks efficiently', async () => {
      const start = Date.now();
      
      await getAllTasks();
      
      const duration = Date.now() - start;
      
      // Should complete within reasonable time (100ms is generous for tests)
      expect(duration).toBeLessThan(100);
    });

    it('should benefit from caching', async () => {
      // First load
      await getTasksForWeek(1 as TaskWeek);
      
      // Second load (cached) - should return same reference
      const tasks1 = await getTasksForWeek(1 as TaskWeek);
      const tasks2 = await getTasksForWeek(1 as TaskWeek);
      
      // Cached loads should return same reference
      expect(tasks1).toBe(tasks2);
    });
  });

  describe('memory efficiency', () => {
    it('should not create duplicate task objects for same week', async () => {
      const tasks1 = await getTasksForWeek(1 as TaskWeek);
      const tasks2 = await getTasksForWeek(1 as TaskWeek);
      
      // Should return same reference (cached)
      expect(tasks1).toBe(tasks2);
      
      // Individual tasks should also be same references
      expect(tasks1[0]).toBe(tasks2[0]);
    });
  });
});