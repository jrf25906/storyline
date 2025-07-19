import { 
  loadBouncePlanProgress, 
  syncBouncePlanProgress, 
  batchSyncBouncePlanProgress,
  resetBouncePlanProgress,
  getBouncePlanStats 
} from '@services/database/bouncePlan';
import { supabase } from '@services/api/supabase';

// Mock Supabase client
jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('bouncePlan database service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadBouncePlanProgress', () => {
    it('should load user progress successfully', async () => {
      const mockTasks = [
        {
          id: '1',
          user_id: 'user123',
          day_number: 1,
          task_id: 'day1_breathe',
          completed_at: '2025-01-01T10:00:00Z',
          created_at: '2025-01-01T09:00:00Z',
          skipped_at: null,
          notes: null,
        },
        {
          id: '2',
          user_id: 'user123',
          day_number: 2,
          task_id: 'day2_routine',
          skipped_at: '2025-01-02T09:30:00Z',
          created_at: '2025-01-01T09:00:00Z',
          completed_at: null,
          notes: null,
        },
      ];

      const fromMock = supabase.from as jest.Mock;
      fromMock.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockTasks,
              error: null,
            }),
          }),
        }),
      });

      const result = await loadBouncePlanProgress('user123');

      expect(result.tasks).toEqual(mockTasks);
      expect(result.startDate).toEqual(new Date('2025-01-01T09:00:00Z'));
      expect(fromMock).toHaveBeenCalledWith('bounce_plan_tasks');
    });

    it('should handle errors gracefully', async () => {
      const fromMock = supabase.from as jest.Mock;
      fromMock.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      });

      const result = await loadBouncePlanProgress('user123');

      expect(result.tasks).toEqual([]);
      expect(result.startDate).toBeUndefined();
    });

    it('should return empty array when no tasks exist', async () => {
      const fromMock = supabase.from as jest.Mock;
      fromMock.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await loadBouncePlanProgress('user123');

      expect(result.tasks).toEqual([]);
      expect(result.startDate).toBeUndefined();
    });
  });

  describe('syncBouncePlanProgress', () => {
    it('should insert new task completion', async () => {
      const fromMock = supabase.from as jest.Mock;
      
      // Mock checking for existing task (not found)
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // Not found
              }),
            }),
          }),
        }),
      });

      // Mock insert
      fromMock.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      const result = await syncBouncePlanProgress('user123', {
        taskId: 'day1_breathe',
        completed: true,
        notes: 'Feeling better',
      });

      expect(result).toBe(true);
      expect(fromMock).toHaveBeenCalledTimes(2);
    });

    it('should update existing task', async () => {
      const fromMock = supabase.from as jest.Mock;
      
      // Mock checking for existing task (found)
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'existing-id' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock update
      fromMock.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        }),
      });

      const result = await syncBouncePlanProgress('user123', {
        taskId: 'day1_breathe',
        completed: true,
      });

      expect(result).toBe(true);
    });

    it('should handle invalid task ID format', async () => {
      const result = await syncBouncePlanProgress('user123', {
        taskId: 'invalid_format',
        completed: true,
      });

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      const fromMock = supabase.from as jest.Mock;
      
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error'),
              }),
            }),
          }),
        }),
      });

      const result = await syncBouncePlanProgress('user123', {
        taskId: 'day1_breathe',
        completed: true,
      });

      expect(result).toBe(false);
    });
  });

  describe('batchSyncBouncePlanProgress', () => {
    it('should sync multiple updates successfully', async () => {
      // Mock all operations to succeed
      const fromMock = supabase.from as jest.Mock;
      
      // For each update, mock check and insert
      fromMock.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      }));

      const updates = [
        { taskId: 'day1_breathe', completed: true },
        { taskId: 'day2_routine', completed: true },
        { taskId: 'day3_finances', skipped: true },
      ];

      const result = await batchSyncBouncePlanProgress('user123', updates);

      expect(result).toBe(true);
    });

    it('should return false if any update fails', async () => {
      const fromMock = supabase.from as jest.Mock;
      
      // First update succeeds
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });
      fromMock.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      // Second update fails
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error'),
              }),
            }),
          }),
        }),
      });

      const updates = [
        { taskId: 'day1_breathe', completed: true },
        { taskId: 'day2_routine', completed: true },
      ];

      const result = await batchSyncBouncePlanProgress('user123', updates);

      expect(result).toBe(false);
    });
  });

  describe('resetBouncePlanProgress', () => {
    it('should delete all user tasks successfully', async () => {
      const fromMock = supabase.from as jest.Mock;
      fromMock.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await resetBouncePlanProgress('user123');

      expect(result).toBe(true);
      expect(fromMock).toHaveBeenCalledWith('bounce_plan_tasks');
    });

    it('should handle deletion errors', async () => {
      const fromMock = supabase.from as jest.Mock;
      fromMock.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: new Error('Delete failed'),
          }),
        }),
      });

      const result = await resetBouncePlanProgress('user123');

      expect(result).toBe(false);
    });
  });

  describe('getBouncePlanStats', () => {
    it('should calculate stats correctly', async () => {
      const mockTasks = [
        { id: '1', completed_at: '2025-01-01', skipped_at: null, notes: 'Note 1' },
        { id: '2', completed_at: '2025-01-02', skipped_at: null, notes: null },
        { id: '3', completed_at: null, skipped_at: '2025-01-03', notes: null },
        { id: '4', completed_at: null, skipped_at: null, notes: null },
      ];

      const fromMock = supabase.from as jest.Mock;
      fromMock.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockTasks,
            error: null,
          }),
        }),
      });

      const stats = await getBouncePlanStats('user123');

      expect(stats).toEqual({
        totalTasks: 4,
        completedTasks: 2,
        skippedTasks: 1,
        tasksWithNotes: 1,
        completionRate: 50,
      });
    });

    it('should handle empty task list', async () => {
      const fromMock = supabase.from as jest.Mock;
      fromMock.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const stats = await getBouncePlanStats('user123');

      expect(stats).toEqual({
        totalTasks: 0,
        completedTasks: 0,
        skippedTasks: 0,
        tasksWithNotes: 0,
        completionRate: 0,
      });
    });

    it('should handle errors', async () => {
      const fromMock = supabase.from as jest.Mock;
      fromMock.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      });

      const stats = await getBouncePlanStats('user123');

      expect(stats).toBeNull();
    });
  });

  describe('edge cases and error scenarios', () => {
    describe('syncBouncePlanProgress edge cases', () => {
      it('should handle task IDs with multiple underscores', async () => {
        const fromMock = supabase.from as jest.Mock;
        
        // Mock checking for existing task (not found)
        fromMock.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        });

        // Mock insert
        fromMock.mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        });

        const result = await syncBouncePlanProgress('user123', {
          taskId: 'day10_career_review',
          completed: true,
        });

        expect(result).toBe(true);
      });

      it('should handle network timeout errors', async () => {
        const fromMock = supabase.from as jest.Mock;
        
        fromMock.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockRejectedValue(new Error('Network timeout')),
              }),
            }),
          }),
        });

        const result = await syncBouncePlanProgress('user123', {
          taskId: 'day1_breathe',
          completed: true,
        });

        expect(result).toBe(false);
      });

      it('should handle concurrent updates to same task', async () => {
        const fromMock = supabase.from as jest.Mock;
        
        // Both updates find existing task
        fromMock.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'existing-id' },
                  error: null,
                }),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: {},
              error: null,
            }),
          }),
        });

        // Simulate concurrent updates
        const results = await Promise.all([
          syncBouncePlanProgress('user123', { taskId: 'day1_breathe', completed: true }),
          syncBouncePlanProgress('user123', { taskId: 'day1_breathe', skipped: true }),
        ]);

        expect(results).toEqual([true, true]);
      });
    });

    describe('batchSyncBouncePlanProgress edge cases', () => {
      it('should handle empty updates array', async () => {
        const result = await batchSyncBouncePlanProgress('user123', []);
        expect(result).toBe(true); // Should succeed with no updates
      });

      it('should handle partial batch failures', async () => {
        const fromMock = supabase.from as jest.Mock;
        let callCount = 0;
        
        fromMock.mockImplementation(() => {
          callCount++;
          
          // First task succeeds
          if (callCount <= 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
              insert: jest.fn().mockResolvedValue({
                data: {},
                error: null,
              }),
            };
          }
          
          // Second task fails
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error('Database error'),
                  }),
                }),
              }),
            }),
          };
        });

        const updates = [
          { taskId: 'day1_breathe', completed: true },
          { taskId: 'day2_routine', completed: true },
        ];

        const result = await batchSyncBouncePlanProgress('user123', updates);
        expect(result).toBe(false);
      });

      it('should handle large batch updates', async () => {
        const fromMock = supabase.from as jest.Mock;
        
        fromMock.mockImplementation(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        }));

        // Create 30 updates (full bounce plan)
        const updates = Array.from({ length: 30 }, (_, i) => ({
          taskId: `day${i + 1}_task`,
          completed: true,
        }));

        const result = await batchSyncBouncePlanProgress('user123', updates);
        expect(result).toBe(true);
      });
    });

    describe('database connection scenarios', () => {
      it('should handle database connection loss', async () => {
        const fromMock = supabase.from as jest.Mock;
        fromMock.mockImplementation(() => {
          throw new Error('Connection lost');
        });

        const result = await loadBouncePlanProgress('user123');
        expect(result.tasks).toEqual([]);
        expect(result.startDate).toBeUndefined();
      });

      it('should handle malformed database responses', async () => {
        const fromMock = supabase.from as jest.Mock;
        fromMock.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: 'invalid-data', // Not an array
                error: null,
              }),
            }),
          }),
        });

        const result = await loadBouncePlanProgress('user123');
        expect(result.tasks).toEqual([]);
      });

      it('should handle null data from database', async () => {
        const fromMock = supabase.from as jest.Mock;
        fromMock.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        });

        const result = await loadBouncePlanProgress('user123');
        expect(result.tasks).toEqual([]);
        expect(result.startDate).toBeUndefined();
      });
    });

    describe('data validation', () => {
      it('should extract day number from various task ID formats', async () => {
        const testCases = [
          { taskId: 'day1_breathe', expectedDay: 1 },
          { taskId: 'day10_network', expectedDay: 10 },
          { taskId: 'day25_interview_prep', expectedDay: 25 },
          { taskId: 'day30_celebrate_wins', expectedDay: 30 },
        ];

        const fromMock = supabase.from as jest.Mock;
        
        for (const testCase of testCases) {
          fromMock.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          });

          const insertMock = jest.fn().mockResolvedValue({
            data: {},
            error: null,
          });

          fromMock.mockReturnValueOnce({
            insert: insertMock,
          });

          const result = await syncBouncePlanProgress('user123', {
            taskId: testCase.taskId,
            completed: true,
          });

          expect(result).toBe(true);
          expect(insertMock).toHaveBeenCalledWith(
            expect.objectContaining({
              day_number: testCase.expectedDay,
              task_id: testCase.taskId,
            })
          );
        }
      });

      it('should handle invalid task ID formats gracefully', async () => {
        const invalidTaskIds = [
          'invalid_task',
          'task_without_day',
          'dayone_task',
          'day_task',
          '',
          null,
          undefined,
        ];

        for (const taskId of invalidTaskIds) {
          const result = await syncBouncePlanProgress('user123', {
            taskId: taskId as any,
            completed: true,
          });

          expect(result).toBe(false);
        }
      });
    });
  });
});