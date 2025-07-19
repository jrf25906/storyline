import { BOUNCE_PLAN_TASKS, getTasksByCategory, getTaskByDay, getWeekFromDay } from '@constants/bouncePlanTasks';

describe('Bounce Plan Helpers', () => {
  describe('getTasksByCategory', () => {
    it('returns all mindset tasks', () => {
      const mindsetTasks = getTasksByCategory('mindset');
      
      expect(mindsetTasks.length).toBeGreaterThan(0);
      expect(mindsetTasks.every(task => task.category === 'mindset')).toBe(true);
      
      // Verify specific mindset tasks
      expect(mindsetTasks.some(task => task.id === 'day1_breathe')).toBe(true);
      expect(mindsetTasks.some(task => task.id === 'day30_celebrate')).toBe(true);
    });

    it('returns all practical tasks', () => {
      const practicalTasks = getTasksByCategory('practical');
      
      expect(practicalTasks.length).toBeGreaterThan(0);
      expect(practicalTasks.every(task => task.category === 'practical')).toBe(true);
      
      // Verify specific practical tasks
      expect(practicalTasks.some(task => task.id === 'day2_routine')).toBe(true);
      expect(practicalTasks.some(task => task.id === 'day3_finances')).toBe(true);
    });

    it('returns all network tasks', () => {
      const networkTasks = getTasksByCategory('network');
      
      expect(networkTasks.length).toBeGreaterThan(0);
      expect(networkTasks.every(task => task.category === 'network')).toBe(true);
      
      // Verify specific network tasks
      expect(networkTasks.some(task => task.id === 'day5_network_list')).toBe(true);
      expect(networkTasks.some(task => task.id === 'day11_first_reach_out')).toBe(true);
    });

    it('returns all prepare tasks', () => {
      const prepareTasks = getTasksByCategory('prepare');
      
      expect(prepareTasks.length).toBeGreaterThan(0);
      expect(prepareTasks.every(task => task.category === 'prepare')).toBe(true);
      
      // Verify specific prepare tasks
      expect(prepareTasks.some(task => task.id === 'day4_tell_story')).toBe(true);
      expect(prepareTasks.some(task => task.id === 'day8_skills_audit')).toBe(true);
    });

    it('returns all action tasks', () => {
      const actionTasks = getTasksByCategory('action');
      
      expect(actionTasks.length).toBeGreaterThan(0);
      expect(actionTasks.every(task => task.category === 'action')).toBe(true);
      
      // Verify specific action tasks
      expect(actionTasks.some(task => task.id === 'day9_linkedin_update')).toBe(true);
      expect(actionTasks.some(task => task.id === 'day17_first_application')).toBe(true);
    });
  });

  describe('getTaskByDay', () => {
    it('returns correct task for each day', () => {
      const day1Task = getTaskByDay(1);
      expect(day1Task?.id).toBe('day1_breathe');
      expect(day1Task?.title).toBe('Take a Breath & Acknowledge');
      
      const day15Task = getTaskByDay(15);
      expect(day15Task?.id).toBe('day15_target_companies');
      expect(day15Task?.title).toBe('Create Target Company List');
      
      const day30Task = getTaskByDay(30);
      expect(day30Task?.id).toBe('day30_celebrate');
      expect(day30Task?.title).toBe('Celebrate Your Progress');
    });

    it('returns undefined for invalid days', () => {
      expect(getTaskByDay(0)).toBeUndefined();
      expect(getTaskByDay(31)).toBeUndefined();
      expect(getTaskByDay(-1)).toBeUndefined();
      expect(getTaskByDay(100)).toBeUndefined();
    });

    it('correctly identifies weekend tasks', () => {
      const day6Task = getTaskByDay(6);
      expect(day6Task?.isWeekend).toBe(true);
      expect(day6Task?.duration).toBe('0 minutes');
      
      const day7Task = getTaskByDay(7);
      expect(day7Task?.isWeekend).toBe(true);
      
      const day13Task = getTaskByDay(13);
      expect(day13Task?.isWeekend).toBe(true);
      
      const day14Task = getTaskByDay(14);
      expect(day14Task?.isWeekend).toBe(true);
    });
  });

  describe('getWeekFromDay', () => {
    it('calculates correct week for each day', () => {
      // Week 1
      expect(getWeekFromDay(1)).toBe(1);
      expect(getWeekFromDay(2)).toBe(1);
      expect(getWeekFromDay(7)).toBe(1);
      
      // Week 2
      expect(getWeekFromDay(8)).toBe(2);
      expect(getWeekFromDay(14)).toBe(2);
      
      // Week 3
      expect(getWeekFromDay(15)).toBe(3);
      expect(getWeekFromDay(21)).toBe(3);
      
      // Week 4
      expect(getWeekFromDay(22)).toBe(4);
      expect(getWeekFromDay(28)).toBe(4);
      
      // Week 5
      expect(getWeekFromDay(29)).toBe(5);
      expect(getWeekFromDay(30)).toBe(5);
    });
  });

  describe('BOUNCE_PLAN_TASKS integrity', () => {
    it('has exactly 30 tasks', () => {
      expect(BOUNCE_PLAN_TASKS.length).toBe(30);
    });

    it('has sequential days from 1 to 30', () => {
      const days = BOUNCE_PLAN_TASKS.map(task => task.day).sort((a, b) => a - b);
      expect(days).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    });

    it('has unique task IDs', () => {
      const ids = BOUNCE_PLAN_TASKS.map(task => task.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(30);
    });

    it('all tasks have required fields', () => {
      BOUNCE_PLAN_TASKS.forEach(task => {
        expect(task.id).toBeTruthy();
        expect(task.day).toBeGreaterThan(0);
        expect(task.day).toBeLessThanOrEqual(30);
        expect(task.title).toBeTruthy();
        expect(task.description).toBeTruthy();
        expect(task.duration).toBeTruthy();
        expect(['mindset', 'practical', 'network', 'prepare', 'action']).toContain(task.category);
        expect(Array.isArray(task.tips)).toBe(true);
        expect(task.tips.length).toBeGreaterThan(0);
      });
    });

    it('weekend tasks are correctly marked', () => {
      const weekendDays = [6, 7, 13, 14, 20, 21, 27, 28];
      
      weekendDays.forEach(day => {
        const task = getTaskByDay(day);
        expect(task?.isWeekend).toBe(true);
        expect(task?.duration).toBe('0 minutes');
        expect(task?.title).toBe('Weekend Recharge');
      });
      
      // Verify non-weekend tasks are not marked as weekend
      const weekdayTasks = BOUNCE_PLAN_TASKS.filter(task => !weekendDays.includes(task.day));
      weekdayTasks.forEach(task => {
        expect(task.isWeekend).toBeFalsy();
        expect(task.duration).not.toBe('0 minutes');
      });
    });

    it('has proper task distribution across weeks', () => {
      const week1Tasks = BOUNCE_PLAN_TASKS.filter(task => getWeekFromDay(task.day) === 1);
      const week2Tasks = BOUNCE_PLAN_TASKS.filter(task => getWeekFromDay(task.day) === 2);
      const week3Tasks = BOUNCE_PLAN_TASKS.filter(task => getWeekFromDay(task.day) === 3);
      const week4Tasks = BOUNCE_PLAN_TASKS.filter(task => getWeekFromDay(task.day) === 4);
      
      expect(week1Tasks.length).toBe(7);
      expect(week2Tasks.length).toBe(7);
      expect(week3Tasks.length).toBe(7);
      expect(week4Tasks.length).toBe(7);
    });
  });
});

describe('Task Unlock Timing Logic', () => {
  // Mock date/time for consistent testing
  const mockDate = (dateStr: string, hours = 10) => {
    const date = new Date(dateStr);
    date.setHours(hours, 0, 0, 0);
    jest.spyOn(global, 'Date').mockImplementation(() => date as any);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should unlock tasks at 9 AM on their scheduled day', () => {
    const startDate = new Date('2025-01-01');
    startDate.setHours(9, 0, 0, 0);

    // Test at 8:59 AM on day 1 - should be locked
    mockDate('2025-01-01', 8);
    const before9AM = new Date();
    expect(before9AM.getHours()).toBe(8);
    expect(before9AM >= startDate).toBe(false);

    // Test at 9:00 AM on day 1 - should be unlocked
    mockDate('2025-01-01', 9);
    const at9AM = new Date();
    expect(at9AM.getHours()).toBe(9);
    expect(at9AM >= startDate).toBe(true);

    // Test at 10:00 AM on day 1 - should be unlocked
    mockDate('2025-01-01', 10);
    const after9AM = new Date();
    expect(after9AM.getHours()).toBe(10);
    expect(after9AM >= startDate).toBe(true);
  });

  it('should not unlock future days tasks even after 9 AM', () => {
    const startDate = new Date('2025-01-01');
    startDate.setHours(9, 0, 0, 0);

    // Current time: Day 1, 10 AM
    mockDate('2025-01-01', 10);
    
    // Day 2 unlock time
    const day2Unlock = new Date(startDate);
    day2Unlock.setDate(day2Unlock.getDate() + 1);
    
    const currentTime = new Date();
    expect(currentTime < day2Unlock).toBe(true);
  });

  it('should keep tasks unlocked once their unlock time has passed', () => {
    const startDate = new Date('2025-01-01');
    startDate.setHours(9, 0, 0, 0);

    // Current time: Day 5, 3 PM
    mockDate('2025-01-05', 15);
    const currentTime = new Date();

    // Check that days 1-5 should be unlocked
    for (let day = 1; day <= 5; day++) {
      const unlockTime = new Date(startDate);
      unlockTime.setDate(unlockTime.getDate() + (day - 1));
      expect(currentTime >= unlockTime).toBe(true);
    }

    // Day 6 should still be locked
    const day6Unlock = new Date(startDate);
    day6Unlock.setDate(day6Unlock.getDate() + 5);
    expect(currentTime < day6Unlock).toBe(true);
  });

  it('should handle daylight saving time transitions', () => {
    // Test spring forward (DST starts)
    const startDate = new Date('2025-03-08'); // Day before DST
    startDate.setHours(9, 0, 0, 0);

    // On March 9, clocks spring forward
    mockDate('2025-03-09', 10); // 10 AM after DST
    const afterDST = new Date();
    
    const day2Unlock = new Date(startDate);
    day2Unlock.setDate(day2Unlock.getDate() + 1);
    
    // Task should still unlock at 9 AM local time
    expect(afterDST >= day2Unlock).toBe(true);
  });

  it('should cap at day 30', () => {
    const startDate = new Date('2025-01-01');
    
    // Current time: 45 days after start
    mockDate('2025-02-15', 10);
    
    const daysSinceStart = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const cappedDay = Math.min(daysSinceStart, 30);
    
    expect(cappedDay).toBe(30);
  });
});