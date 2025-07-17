// Enhanced Database Types for NextChapter
// Complete type definitions matching the enhanced schema

export type SubscriptionTier = 'free' | 'pro';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type CrisisKeywordCategory = 'suicide' | 'self_harm' | 'crisis' | 'emergency';
export type RemoteType = 'on-site' | 'hybrid' | 'remote';

// Enhanced Profile with subscription and settings
export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  timezone: string;
  subscription_tier: SubscriptionTier;
  subscription_expires_at?: string;
  onboarding_completed_at?: string;
  last_active_at?: string;
  push_token?: string;
  biometric_enabled: boolean;
  pin_hash?: string; // Never expose to client
  created_at: string;
  updated_at: string;
}

// Enhanced Layoff Details
export interface LayoffDetails {
  id: string;
  user_id: string;
  company: string;
  role: string;
  department?: string;
  years_at_company?: number;
  layoff_date: string;
  layoff_reason?: string;
  severance_weeks?: number;
  severance_amount?: string; // Encrypted
  severance_end_date?: string;
  health_insurance_end_date?: string;
  outplacement_services: boolean;
  created_at: string;
  updated_at: string;
}

// Goal types
export type GoalType = 
  | 'job-search' 
  | 'career-change' 
  | 'skills' 
  | 'networking'
  | 'financial' 
  | 'wellness' 
  | 'freelance' 
  | 'entrepreneurship';

// Enhanced User Goal with progress
export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  target_date?: string;
  progress_percentage: number;
  is_active: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Job Application Status
export type JobApplicationStatus = 
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

// Interview details
export interface InterviewDetail {
  date: string;
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'behavioral';
  interviewer?: string;
  notes?: string;
}

// Enhanced Job Application
export interface JobApplication {
  id: string;
  user_id: string;
  company: string;
  position: string;
  department?: string;
  location?: string;
  remote_type?: RemoteType;
  salary_range?: string;
  salary_min?: number;
  salary_max?: number;
  status: JobApplicationStatus;
  applied_date?: string;
  interview_dates?: InterviewDetail[];
  offer_deadline?: string;
  notes?: string;
  job_posting_url?: string;
  company_website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_linkedin?: string;
  resume_version_id?: string;
  keywords?: string[];
  match_score?: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

// Budget types
export type BudgetType = 'income' | 'expense';
export type BudgetFrequency = 'one-time' | 'monthly' | 'weekly' | 'daily';

// Enhanced Budget Data
export interface BudgetData {
  id: string;
  user_id: string;
  monthly_income: string; // Encrypted
  current_savings: string; // Encrypted
  emergency_fund_target?: string; // Encrypted
  monthly_expenses: number;
  severance_amount?: string; // Encrypted
  unemployment_benefit?: number;
  unemployment_weeks?: number;
  unemployment_start_date?: string;
  cobra_cost?: number;
  cobra_months?: number;
  state?: string;
  financial_runway_days?: number;
  runway_alert_threshold: number;
  encryption_version: number;
  last_calculated_at?: string;
  created_at: string;
  updated_at: string;
}

// Budget Entry
export interface BudgetEntry {
  id: string;
  user_id: string;
  category: string;
  subcategory?: string;
  amount: number;
  type: BudgetType;
  frequency: BudgetFrequency;
  description?: string;
  is_essential: boolean;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// Enhanced Mood Entry
export interface MoodEntry {
  id: string;
  user_id: string;
  mood_score: 1 | 2 | 3 | 4 | 5;
  mood_label?: string;
  energy_level?: 1 | 2 | 3 | 4 | 5;
  stress_level?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  triggers?: string[];
  activities?: string[];
  sync_status: SyncStatus;
  created_at: string;
}

// Task types
export type TaskType = 'core' | 'bonus' | 'custom';

// Enhanced Bounce Plan Task
export interface BouncePlanTask {
  id: string;
  user_id: string;
  day_number: number;
  task_id: string;
  task_type?: TaskType;
  completed_at?: string;
  skipped_at?: string;
  skipped_reason?: string;
  time_spent_minutes?: number;
  difficulty_rating?: 1 | 2 | 3 | 4 | 5;
  helpful_rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  reminder_sent_at?: string;
  sync_status: SyncStatus;
  created_at: string;
}

// Coach types
export type CoachTone = 'hype' | 'pragmatist' | 'tough-love';
export type ConversationRole = 'user' | 'assistant' | 'system';

// Enhanced Coach Conversation
export interface CoachConversation {
  id: string;
  user_id: string;
  message: string;
  message_encrypted?: string;
  role: ConversationRole;
  tone?: CoachTone;
  detected_emotion?: string;
  tokens_used?: number;
  response_time_ms?: number;
  helpful_rating?: 1 | 2 | 3 | 4 | 5;
  flagged_for_review: boolean;
  sync_enabled: boolean;
  sync_status: SyncStatus;
  created_at: string;
}

// Resume Version
export interface ResumeVersion {
  id: string;
  user_id: string;
  version_name: string;
  file_name?: string;
  file_content?: string;
  file_hash?: string;
  parsed_content?: {
    contact?: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
    };
    summary?: string;
    experience?: Array<{
      company: string;
      role: string;
      duration: string;
      description: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      year: string;
    }>;
    skills?: string[];
  };
  keywords?: string[];
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Resume Analysis types
export type AnalysisType = 'ats' | 'keyword' | 'improvement';

// Resume Analysis
export interface ResumeAnalysis {
  id: string;
  resume_version_id: string;
  job_application_id?: string;
  analysis_type: AnalysisType;
  score?: number;
  suggestions?: {
    improvements: string[];
    warnings: string[];
    strengths: string[];
  };
  missing_keywords?: string[];
  matched_keywords?: string[];
  created_at: string;
}

// Wellness activity categories
export type WellnessCategory = 
  | 'exercise' 
  | 'meditation' 
  | 'social' 
  | 'hobby' 
  | 'rest' 
  | 'nutrition' 
  | 'therapy';

// Enhanced Wellness Activity
export interface WellnessActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_category?: WellnessCategory;
  duration_minutes?: number;
  intensity_level?: 1 | 2 | 3 | 4 | 5;
  mood_before?: 1 | 2 | 3 | 4 | 5;
  mood_after?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  completed_at: string;
}

// Crisis Intervention
export interface CrisisIntervention {
  id: string;
  user_id: string;
  trigger_source: 'coach' | 'mood' | 'wellness';
  detected_keywords?: string[];
  keyword_category?: CrisisKeywordCategory;
  intervention_shown: boolean;
  resources_displayed?: string[];
  user_acknowledged: boolean;
  follow_up_required: boolean;
  created_at: string;
}

// Peer Connection status
export type PeerConnectionStatus = 
  | 'pending' 
  | 'accepted' 
  | 'declined' 
  | 'expired' 
  | 'blocked';

// Peer Connection
export interface PeerConnection {
  id: string;
  user_a_id: string;
  user_b_id: string;
  match_criteria?: {
    industry?: string;
    location?: string;
    goals?: string[];
    experience_level?: string;
  };
  match_score?: number;
  status: PeerConnectionStatus;
  connected_at?: string;
  expires_at?: string;
  created_at: string;
}

// Analytics Event
export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  event_name: string;
  event_category?: string;
  event_properties?: Record<string, any>;
  device_info?: {
    platform?: string;
    version?: string;
    model?: string;
  };
  session_id?: string;
  created_at: string;
}

// Notification Preferences
export interface NotificationPreferences {
  id: string;
  user_id: string;
  daily_task_reminder: boolean;
  daily_task_time: string; // HH:MM:SS format
  mood_check_reminder: boolean;
  mood_check_time: string; // HH:MM:SS format
  job_application_reminder: boolean;
  job_reminder_frequency: 'daily' | 'weekly' | 'biweekly';
  budget_alert: boolean;
  wellness_reminder: boolean;
  coach_suggestions: boolean;
  created_at: string;
  updated_at: string;
}

// Sync operation types
export type SyncOperation = 'insert' | 'update' | 'delete';

// Sync Queue Entry
export interface SyncQueueEntry {
  id: string;
  user_id: string;
  table_name: string;
  operation: SyncOperation;
  record_id: string;
  data: Record<string, any>;
  retry_count: number;
  max_retries: number;
  status: SyncStatus;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}

// User Dashboard View
export interface UserDashboard {
  user_id: string;
  first_name?: string;
  last_name?: string;
  subscription_tier: SubscriptionTier;
  company?: string;
  role?: string;
  layoff_date?: string;
  severance_end_date?: string;
  financial_runway_days?: number;
  tasks_completed: number;
  active_interviews: number;
  latest_mood?: 1 | 2 | 3 | 4 | 5;
}

// Complete Database Schema Type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'subscription_tier' | 'biometric_enabled'> & 
          Partial<Pick<Profile, 'subscription_tier' | 'biometric_enabled'>>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      layoff_details: {
        Row: LayoffDetails;
        Insert: Omit<LayoffDetails, 'id' | 'created_at' | 'updated_at' | 'outplacement_services'> & 
          Partial<Pick<LayoffDetails, 'outplacement_services'>>;
        Update: Partial<Omit<LayoffDetails, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      user_goals: {
        Row: UserGoal;
        Insert: Omit<UserGoal, 'id' | 'created_at' | 'updated_at' | 'progress_percentage' | 'is_active'> & 
          Partial<Pick<UserGoal, 'progress_percentage' | 'is_active'>>;
        Update: Partial<Omit<UserGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      job_applications: {
        Row: JobApplication;
        Insert: Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'sync_status'> & 
          Partial<Pick<JobApplication, 'sync_status'>>;
        Update: Partial<Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      budget_data: {
        Row: BudgetData;
        Insert: Omit<BudgetData, 'id' | 'created_at' | 'updated_at' | 'runway_alert_threshold' | 'encryption_version'> & 
          Partial<Pick<BudgetData, 'runway_alert_threshold' | 'encryption_version'>>;
        Update: Partial<Omit<BudgetData, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      budget_entries: {
        Row: BudgetEntry;
        Insert: Omit<BudgetEntry, 'id' | 'created_at' | 'updated_at' | 'is_essential' | 'is_active'> & 
          Partial<Pick<BudgetEntry, 'is_essential' | 'is_active'>>;
        Update: Partial<Omit<BudgetEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      mood_entries: {
        Row: MoodEntry;
        Insert: Omit<MoodEntry, 'id' | 'created_at' | 'sync_status'> & 
          Partial<Pick<MoodEntry, 'sync_status'>>;
        Update: Partial<Omit<MoodEntry, 'id' | 'user_id' | 'created_at'>>;
      };
      bounce_plan_tasks: {
        Row: BouncePlanTask;
        Insert: Omit<BouncePlanTask, 'id' | 'created_at' | 'sync_status'> & 
          Partial<Pick<BouncePlanTask, 'sync_status'>>;
        Update: Partial<Omit<BouncePlanTask, 'id' | 'user_id' | 'created_at'>>;
      };
      coach_conversations: {
        Row: CoachConversation;
        Insert: Omit<CoachConversation, 'id' | 'created_at' | 'flagged_for_review' | 'sync_enabled' | 'sync_status'> & 
          Partial<Pick<CoachConversation, 'flagged_for_review' | 'sync_enabled' | 'sync_status'>>;
        Update: Partial<Omit<CoachConversation, 'id' | 'user_id' | 'created_at'>>;
      };
      resume_versions: {
        Row: ResumeVersion;
        Insert: Omit<ResumeVersion, 'id' | 'created_at' | 'updated_at' | 'is_primary'> & 
          Partial<Pick<ResumeVersion, 'is_primary'>>;
        Update: Partial<Omit<ResumeVersion, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      resume_analyses: {
        Row: ResumeAnalysis;
        Insert: Omit<ResumeAnalysis, 'id' | 'created_at'>;
        Update: Partial<Omit<ResumeAnalysis, 'id' | 'resume_version_id' | 'created_at'>>;
      };
      wellness_activities: {
        Row: WellnessActivity;
        Insert: Omit<WellnessActivity, 'id'>;
        Update: Partial<Omit<WellnessActivity, 'id' | 'user_id'>>;
      };
      crisis_interventions: {
        Row: CrisisIntervention;
        Insert: Omit<CrisisIntervention, 'id' | 'created_at' | 'intervention_shown' | 'user_acknowledged' | 'follow_up_required'> & 
          Partial<Pick<CrisisIntervention, 'intervention_shown' | 'user_acknowledged' | 'follow_up_required'>>;
        Update: Partial<Omit<CrisisIntervention, 'id' | 'user_id' | 'created_at'>>;
      };
      peer_connections: {
        Row: PeerConnection;
        Insert: Omit<PeerConnection, 'id' | 'created_at' | 'status'> & 
          Partial<Pick<PeerConnection, 'status'>>;
        Update: Partial<Omit<PeerConnection, 'id' | 'user_a_id' | 'user_b_id' | 'created_at'>>;
      };
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: Omit<AnalyticsEvent, 'id' | 'created_at'>;
        Update: never; // Analytics events should not be updated
      };
      notification_preferences: {
        Row: NotificationPreferences;
        Insert: Omit<NotificationPreferences, 'id' | 'created_at' | 'updated_at' | 'daily_task_reminder' | 'daily_task_time' | 'mood_check_reminder' | 'mood_check_time' | 'job_application_reminder' | 'job_reminder_frequency' | 'budget_alert' | 'wellness_reminder' | 'coach_suggestions'> & 
          Partial<Pick<NotificationPreferences, 'daily_task_reminder' | 'daily_task_time' | 'mood_check_reminder' | 'mood_check_time' | 'job_application_reminder' | 'job_reminder_frequency' | 'budget_alert' | 'wellness_reminder' | 'coach_suggestions'>>;
        Update: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      sync_queue: {
        Row: SyncQueueEntry;
        Insert: Omit<SyncQueueEntry, 'id' | 'created_at' | 'retry_count' | 'max_retries' | 'status'> & 
          Partial<Pick<SyncQueueEntry, 'retry_count' | 'max_retries' | 'status'>>;
        Update: Partial<Omit<SyncQueueEntry, 'id' | 'user_id' | 'created_at'>>;
      };
    };
    Views: {
      user_dashboard: {
        Row: UserDashboard;
      };
    };
    Functions: {
      handle_new_user: {
        Args: Record<string, never>;
        Returns: void;
      };
      calculate_financial_runway: {
        Args: { p_user_id: string };
        Returns: number;
      };
      check_crisis_keywords: {
        Args: { p_text: string };
        Returns: {
          detected: boolean;
          keywords: string[] | null;
          category: CrisisKeywordCategory | null;
        };
      };
      refresh_engagement_metrics: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}