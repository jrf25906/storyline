// Database types matching Supabase schema

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface LayoffDetails {
  id: string;
  user_id: string;
  company: string;
  role: string;
  layoff_date: string;
  severance_weeks?: number;
  severance_end_date?: string;
  created_at: string;
  updated_at: string;
}

export type GoalType = 
  | 'job-search' 
  | 'career-change' 
  | 'skills' 
  | 'networking'
  | 'financial' 
  | 'wellness' 
  | 'freelance' 
  | 'entrepreneurship';

export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  is_active: boolean;
  created_at: string;
}

export type JobApplicationStatus = 
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface JobApplication {
  id: string;
  user_id: string;
  company: string;
  position: string;
  location?: string;
  salary_range?: string;
  status: JobApplicationStatus;
  applied_date?: string;
  notes?: string;
  job_posting_url?: string;
  contact_name?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
}

export type BudgetType = 'income' | 'expense';
export type BudgetFrequency = 'one-time' | 'monthly' | 'weekly' | 'daily';

export interface BudgetEntry {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  type: BudgetType;
  frequency: BudgetFrequency;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood_score: 1 | 2 | 3 | 4 | 5;
  mood_label?: string;
  notes?: string;
  created_at: string;
}

export interface BouncePlanTask {
  id: string;
  user_id: string;
  day_number: number;
  task_id: string;
  completed_at?: string;
  skipped_at?: string;
  notes?: string;
  created_at: string;
}

export type CoachTone = 'hype' | 'pragmatist' | 'tough-love';

export interface CoachConversation {
  id: string;
  user_id: string;
  message: string;
  role: 'user' | 'assistant';
  tone?: CoachTone;
  created_at: string;
}

export interface WellnessActivity {
  id: string;
  user_id: string;
  activity_type: string;
  duration_minutes?: number;
  notes?: string;
  completed_at: string;
}

// Database function types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      layoff_details: {
        Row: LayoffDetails;
        Insert: Omit<LayoffDetails, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LayoffDetails, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      user_goals: {
        Row: UserGoal;
        Insert: Omit<UserGoal, 'id' | 'created_at'>;
        Update: Partial<Omit<UserGoal, 'id' | 'user_id' | 'created_at'>>;
      };
      job_applications: {
        Row: JobApplication;
        Insert: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      budget_entries: {
        Row: BudgetEntry;
        Insert: Omit<BudgetEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BudgetEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      mood_entries: {
        Row: MoodEntry;
        Insert: Omit<MoodEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<MoodEntry, 'id' | 'user_id' | 'created_at'>>;
      };
      bounce_plan_tasks: {
        Row: BouncePlanTask;
        Insert: Omit<BouncePlanTask, 'id' | 'created_at'>;
        Update: Partial<Omit<BouncePlanTask, 'id' | 'user_id' | 'created_at'>>;
      };
      coach_conversations: {
        Row: CoachConversation;
        Insert: Omit<CoachConversation, 'id' | 'created_at'>;
        Update: Partial<Omit<CoachConversation, 'id' | 'user_id' | 'created_at'>>;
      };
      wellness_activities: {
        Row: WellnessActivity;
        Insert: Omit<WellnessActivity, 'id'>;
        Update: Partial<Omit<WellnessActivity, 'id' | 'user_id'>>;
      };
    };
  };
}