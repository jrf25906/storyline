import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'profiles',
      columns: [
        { name: 'first_name', type: 'string', isOptional: true },
        { name: 'last_name', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string', isOptional: true }
      ]
    }),
    
    tableSchema({
      name: 'layoff_details',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'company', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'layoff_date', type: 'string' },
        { name: 'severance_weeks', type: 'number', isOptional: true },
        { name: 'severance_end_date', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string', isOptional: true }
      ]
    }),
    
    tableSchema({
      name: 'user_goals',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'goal_type', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string', isOptional: true }
      ]
    }),
    
    tableSchema({
      name: 'job_applications',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'company', type: 'string' },
        { name: 'position', type: 'string' },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'salary_range', type: 'string', isOptional: true },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'applied_date', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'job_posting_url', type: 'string', isOptional: true },
        { name: 'contact_name', type: 'string', isOptional: true },
        { name: 'contact_email', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string', isOptional: true }
      ]
    }),
    
    tableSchema({
      name: 'budget_entries',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'category', type: 'string' },
        { name: 'amount', type: 'string' }, // Encrypted
        { name: 'type', type: 'string' },
        { name: 'frequency', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string', isOptional: true }
      ]
    }),
    
    tableSchema({
      name: 'mood_entries',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'mood_score', type: 'number' },
        { name: 'mood_label', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string', isOptional: true }
      ]
    }),
    
    tableSchema({
      name: 'bounce_plan_tasks',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'day_number', type: 'number' },
        { name: 'task_id', type: 'string' },
        { name: 'completed_at', type: 'string', isOptional: true },
        { name: 'skipped_at', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string', isOptional: true }
      ]
    }),
    
    tableSchema({
      name: 'coach_conversations',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'message', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'tone', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string', isOptional: true }
      ]
    }),
    
    tableSchema({
      name: 'wellness_activities',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'activity_type', type: 'string' },
        { name: 'duration_minutes', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'completed_at', type: 'string' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string', isOptional: true }
      ]
    })
  ]
});