/**
 * Task and notification scheduling service
 */

import { Result } from '@services/interfaces/common/result';

export interface ISchedulingService {
  // Recurring schedules
  createRecurringSchedule(schedule: RecurringSchedule): Promise<Result<string>>;
  updateRecurringSchedule(
    scheduleId: string,
    updates: Partial<RecurringSchedule>
  ): Promise<Result<void>>;
  deleteRecurringSchedule(scheduleId: string): Promise<Result<void>>;
  getRecurringSchedules(): Promise<Result<RecurringSchedule[]>>;
  
  // One-time schedules
  scheduleOneTime(schedule: OneTimeSchedule): Promise<Result<string>>;
  cancelOneTime(scheduleId: string): Promise<Result<void>>;
  
  // Execution
  executeSchedule(scheduleId: string): Promise<Result<void>>;
  getNextExecution(scheduleId: string): Promise<Result<Date | null>>;
  
  // History
  getExecutionHistory(
    scheduleId: string,
    options?: HistoryOptions
  ): Promise<Result<ScheduleExecution[]>>;
  
  // Pause/resume
  pauseSchedule(scheduleId: string): Promise<Result<void>>;
  resumeSchedule(scheduleId: string): Promise<Result<void>>;
  
  // Events
  onScheduleExecuted(callback: (execution: ScheduleExecution) => void): () => void;
  onScheduleFailed(callback: (error: ScheduleError) => void): () => void;
}

export interface RecurringSchedule {
  id?: string;
  name: string;
  type: ScheduleType;
  pattern: SchedulePattern;
  action: ScheduleAction;
  enabled: boolean;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

export interface OneTimeSchedule {
  id?: string;
  name: string;
  executeAt: Date;
  action: ScheduleAction;
  metadata?: Record<string, any>;
}

export type ScheduleType = 
  | 'daily_task'
  | 'job_followup'
  | 'mood_checkin'
  | 'budget_review'
  | 'custom';

export type SchedulePattern = 
  | { type: 'daily'; time: TimeOfDay }
  | { type: 'weekly'; daysOfWeek: number[]; time: TimeOfDay }
  | { type: 'monthly'; dayOfMonth: number; time: TimeOfDay }
  | { type: 'interval'; minutes: number }
  | { type: 'cron'; expression: string };

export interface TimeOfDay {
  hour: number; // 0-23
  minute: number; // 0-59
}

export interface ScheduleAction {
  type: 'notification' | 'function' | 'api_call';
  payload: NotificationAction | FunctionAction | ApiCallAction;
}

export interface NotificationAction {
  title: string;
  body: string;
  data?: Record<string, any>;
  categoryId?: string;
}

export interface FunctionAction {
  functionName: string;
  parameters?: Record<string, any>;
}

export interface ApiCallAction {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  executedAt: Date;
  success: boolean;
  duration: number; // milliseconds
  error?: string;
  result?: any;
}

export interface HistoryOptions {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  successOnly?: boolean;
}

export interface ScheduleError {
  scheduleId: string;
  error: Error;
  occurredAt: Date;
  retryCount: number;
  willRetry: boolean;
}