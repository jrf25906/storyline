import { appSchema, tableSchema } from '@nozbe/watermelondb';
import { schema } from '../schema';

describe('WatermelonDB Schema', () => {
  it('should define all required tables', () => {
    expect(schema.tables).toBeDefined();
    
    // Check for all required tables
    const requiredTables = [
      'profiles',
      'layoff_details',
      'user_goals',
      'job_applications', 
      'budget_entries',
      'mood_entries',
      'bounce_plan_tasks',
      'coach_conversations',
      'wellness_activities'
    ];

    requiredTables.forEach(tableName => {
      const table = schema.tables[tableName];
      expect(table).toBeDefined();
      expect(table.name).toBe(tableName);
    });
  });

  it('should have proper columns for profiles table', () => {
    const table = schema.tables.profiles;
    const columnNames = Object.keys(table.columns);
    
    expect(columnNames).toContain('first_name');
    expect(columnNames).toContain('last_name');
    expect(columnNames).toContain('phone');
    expect(columnNames).toContain('location');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  it('should have proper columns for job_applications table', () => {
    const table = schema.tables.job_applications;
    const columnNames = Object.keys(table.columns);
    
    expect(columnNames).toContain('company');
    expect(columnNames).toContain('position');
    expect(columnNames).toContain('status');
    expect(columnNames).toContain('applied_date');
    expect(columnNames).toContain('notes');
  });

  it('should have proper columns for budget_entries table', () => {
    const table = schema.tables.budget_entries;
    const columnNames = Object.keys(table.columns);
    
    expect(columnNames).toContain('category');
    expect(columnNames).toContain('amount');
    expect(columnNames).toContain('type');
    expect(columnNames).toContain('frequency');
    expect(columnNames).toContain('is_active');
  });

  it('should have proper columns for mood_entries table', () => {
    const table = schema.tables.mood_entries;
    const columnNames = Object.keys(table.columns);
    
    expect(columnNames).toContain('mood_score');
    expect(columnNames).toContain('mood_label');
    expect(columnNames).toContain('notes');
  });

  it('should have proper columns for bounce_plan_tasks table', () => {
    const table = schema.tables.bounce_plan_tasks;
    const columnNames = Object.keys(table.columns);
    
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('day_number');
    expect(columnNames).toContain('task_id');
    expect(columnNames).toContain('completed_at');
    expect(columnNames).toContain('skipped_at');
    expect(columnNames).toContain('notes');
  });

  it('should have sync metadata columns', () => {
    const syncColumns = ['last_synced_at', 'sync_status'];
    
    Object.values(schema.tables).forEach(table => {
      const columnNames = Object.keys(table.columns);
      syncColumns.forEach(column => {
        expect(columnNames).toContain(column);
      });
    });
  });

  it('should have proper indexes for performance', () => {
    // Job applications should have index on user_id and status
    const jobAppTable = schema.tables.job_applications;
    expect(jobAppTable.columns.user_id.isIndexed).toBe(true);
    expect(jobAppTable.columns.status.isIndexed).toBe(true);
    
    // Bounce plan tasks should have index on user_id
    const bouncePlanTable = schema.tables.bounce_plan_tasks;
    expect(bouncePlanTable.columns.user_id.isIndexed).toBe(true);
  });
});