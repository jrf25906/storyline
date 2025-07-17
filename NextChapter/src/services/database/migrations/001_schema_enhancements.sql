-- Migration: Enhanced Schema Updates
-- This migration upgrades the existing schema to the enhanced version
-- Run this after the initial schema.sql has been applied

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crisis_keyword_category AS ENUM ('suicide', 'self_harm', 'crisis', 'emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Add indexes to profiles
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at);

-- Update layoff_details table
ALTER TABLE public.layoff_details
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS years_at_company NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS layoff_reason TEXT,
ADD COLUMN IF NOT EXISTS severance_amount TEXT, -- Encrypted
ADD COLUMN IF NOT EXISTS health_insurance_end_date DATE,
ADD COLUMN IF NOT EXISTS outplacement_services BOOLEAN DEFAULT false;

-- Update user_goals table
ALTER TABLE public.user_goals
ADD COLUMN IF NOT EXISTS target_date DATE,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Update job_applications table
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS remote_type TEXT CHECK (remote_type IN ('on-site', 'hybrid', 'remote')),
ADD COLUMN IF NOT EXISTS salary_min INTEGER,
ADD COLUMN IF NOT EXISTS salary_max INTEGER,
ADD COLUMN IF NOT EXISTS interview_dates JSONB,
ADD COLUMN IF NOT EXISTS offer_deadline DATE,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_linkedin TEXT,
ADD COLUMN IF NOT EXISTS resume_version_id UUID,
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS match_score INTEGER,
ADD COLUMN IF NOT EXISTS sync_status sync_status DEFAULT 'synced';

-- Add indexes to job_applications
CREATE INDEX IF NOT EXISTS idx_job_applications_user_status ON public.job_applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_sync ON public.job_applications(user_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_job_applications_dates ON public.job_applications(applied_date DESC);

-- Update budget_data table
ALTER TABLE public.budget_data
ADD COLUMN IF NOT EXISTS emergency_fund_target TEXT, -- Encrypted
ADD COLUMN IF NOT EXISTS unemployment_start_date DATE,
ADD COLUMN IF NOT EXISTS cobra_months INTEGER,
ADD COLUMN IF NOT EXISTS financial_runway_days INTEGER,
ADD COLUMN IF NOT EXISTS runway_alert_threshold INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_calculated_at TIMESTAMP WITH TIME ZONE;

-- Update budget_entries table
ALTER TABLE public.budget_entries
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS is_essential BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add index to budget_entries
CREATE INDEX IF NOT EXISTS idx_budget_entries_user_type ON public.budget_entries(user_id, type, is_active);

-- Update mood_entries table
ALTER TABLE public.mood_entries
ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
ADD COLUMN IF NOT EXISTS stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
ADD COLUMN IF NOT EXISTS triggers TEXT[],
ADD COLUMN IF NOT EXISTS activities TEXT[],
ADD COLUMN IF NOT EXISTS sync_status sync_status DEFAULT 'synced';

-- Add index to mood_entries
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON public.mood_entries(user_id, created_at DESC);

-- Update bounce_plan_tasks table
ALTER TABLE public.bounce_plan_tasks
ADD COLUMN IF NOT EXISTS task_type TEXT,
ADD COLUMN IF NOT EXISTS skipped_reason TEXT,
ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER,
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
ADD COLUMN IF NOT EXISTS helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_status sync_status DEFAULT 'synced';

-- Add indexes to bounce_plan_tasks
CREATE INDEX IF NOT EXISTS idx_bounce_plan_user_day ON public.bounce_plan_tasks(user_id, day_number);
CREATE INDEX IF NOT EXISTS idx_bounce_plan_sync ON public.bounce_plan_tasks(user_id, sync_status);

-- Update coach_conversations table
ALTER TABLE public.coach_conversations
ADD COLUMN IF NOT EXISTS message_encrypted TEXT,
ADD COLUMN IF NOT EXISTS detected_emotion TEXT,
ADD COLUMN IF NOT EXISTS tokens_used INTEGER,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sync_status sync_status DEFAULT 'synced';

-- Modify role check to include 'system'
ALTER TABLE public.coach_conversations 
DROP CONSTRAINT IF EXISTS coach_conversations_role_check;

ALTER TABLE public.coach_conversations
ADD CONSTRAINT coach_conversations_role_check 
CHECK (role IN ('user', 'assistant', 'system'));

-- Add indexes to coach_conversations
CREATE INDEX IF NOT EXISTS idx_coach_conversations_user ON public.coach_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_conversations_sync ON public.coach_conversations(user_id, sync_enabled, sync_status);

-- Update wellness_activities table
ALTER TABLE public.wellness_activities
ADD COLUMN IF NOT EXISTS activity_category TEXT CHECK (activity_category IN (
    'exercise', 'meditation', 'social', 'hobby', 'rest', 'nutrition', 'therapy'
)),
ADD COLUMN IF NOT EXISTS intensity_level INTEGER CHECK (intensity_level >= 1 AND intensity_level <= 5),
ADD COLUMN IF NOT EXISTS mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 5),
ADD COLUMN IF NOT EXISTS mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 5);

-- Add index to wellness_activities
CREATE INDEX IF NOT EXISTS idx_wellness_activities_user ON public.wellness_activities(user_id, completed_at DESC);

-- Create new tables that don't exist yet

-- Resume versions table
CREATE TABLE IF NOT EXISTS public.resume_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version_name TEXT NOT NULL,
    file_name TEXT,
    file_content TEXT,
    file_hash TEXT,
    parsed_content JSONB,
    keywords TEXT[],
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON public.resume_versions(user_id, is_primary);

-- Resume analyses table
CREATE TABLE IF NOT EXISTS public.resume_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_version_id UUID NOT NULL REFERENCES public.resume_versions(id) ON DELETE CASCADE,
    job_application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('ats', 'keyword', 'improvement')),
    score INTEGER,
    suggestions JSONB,
    missing_keywords TEXT[],
    matched_keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Crisis interventions table
CREATE TABLE IF NOT EXISTS public.crisis_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_source TEXT NOT NULL CHECK (trigger_source IN ('coach', 'mood', 'wellness')),
    detected_keywords TEXT[],
    keyword_category crisis_keyword_category,
    intervention_shown BOOLEAN DEFAULT true,
    resources_displayed TEXT[],
    user_acknowledged BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Peer connections table
CREATE TABLE IF NOT EXISTS public.peer_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_criteria JSONB,
    match_score INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'accepted', 'declined', 'expired', 'blocked'
    )),
    connected_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT different_users CHECK (user_a_id != user_b_id),
    CONSTRAINT unique_connection UNIQUE (user_a_id, user_b_id)
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    event_category TEXT,
    event_properties JSONB,
    device_info JSONB,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name, created_at DESC);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_task_reminder BOOLEAN DEFAULT true,
    daily_task_time TIME DEFAULT '09:00:00',
    mood_check_reminder BOOLEAN DEFAULT true,
    mood_check_time TIME DEFAULT '18:00:00',
    job_application_reminder BOOLEAN DEFAULT true,
    job_reminder_frequency TEXT DEFAULT 'weekly',
    budget_alert BOOLEAN DEFAULT true,
    wellness_reminder BOOLEAN DEFAULT false,
    coach_suggestions BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id)
);

-- Sync queue table
CREATE TABLE IF NOT EXISTS public.sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
    record_id UUID NOT NULL,
    data JSONB NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status sync_status DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user_status ON public.sync_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON public.sync_queue(created_at) WHERE status = 'pending';

-- Enable RLS on new tables
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Users can manage own resumes" ON public.resume_versions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own resume analyses" ON public.resume_analyses 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.resume_versions 
            WHERE resume_versions.id = resume_analyses.resume_version_id 
            AND resume_versions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own crisis logs" ON public.crisis_interventions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their peer connections" ON public.peer_connections 
    FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
    
CREATE POLICY "Users can update their peer connections" ON public.peer_connections 
    FOR UPDATE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
    
CREATE POLICY "Users can insert peer connections" ON public.peer_connections 
    FOR INSERT WITH CHECK (auth.uid() = user_a_id);

CREATE POLICY "Users can manage own analytics" ON public.analytics_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sync queue" ON public.sync_queue FOR ALL USING (auth.uid() = user_id);

-- Update handle_new_user function to include notification preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add financial runway calculation function
CREATE OR REPLACE FUNCTION public.calculate_financial_runway(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_budget_data RECORD;
    v_monthly_burn DECIMAL;
    v_total_resources DECIMAL;
    v_runway_days INTEGER;
BEGIN
    SELECT * INTO v_budget_data
    FROM public.budget_data
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Calculate monthly burn rate
    v_monthly_burn := v_budget_data.monthly_expenses;
    
    -- This is a simplified calculation - in practice, you'd decrypt the values
    -- For now, we'll use the monthly_expenses as a base
    v_total_resources := COALESCE(v_budget_data.unemployment_benefit * v_budget_data.unemployment_weeks / 4, 0);
    
    IF v_monthly_burn > 0 THEN
        v_runway_days := FLOOR((v_total_resources / v_monthly_burn) * 30);
    ELSE
        v_runway_days := 999; -- Infinite runway if no expenses
    END IF;
    
    -- Update the calculated field
    UPDATE public.budget_data
    SET financial_runway_days = v_runway_days,
        last_calculated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN v_runway_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add crisis keyword detection function
CREATE OR REPLACE FUNCTION public.check_crisis_keywords(p_text TEXT)
RETURNS TABLE(detected BOOLEAN, keywords TEXT[], category crisis_keyword_category) AS $$
DECLARE
    v_suicide_keywords TEXT[] := ARRAY['suicide', 'kill myself', 'end it all', 'not worth living'];
    v_self_harm_keywords TEXT[] := ARRAY['hurt myself', 'self harm', 'cutting'];
    v_crisis_keywords TEXT[] := ARRAY['crisis', 'emergency', 'cant go on', 'breaking point'];
    v_detected_keywords TEXT[] := '{}';
    v_category crisis_keyword_category;
BEGIN
    p_text := LOWER(p_text);
    
    -- Check suicide keywords
    SELECT ARRAY_AGG(keyword) INTO v_detected_keywords
    FROM UNNEST(v_suicide_keywords) AS keyword
    WHERE p_text LIKE '%' || keyword || '%';
    
    IF array_length(v_detected_keywords, 1) > 0 THEN
        RETURN QUERY SELECT true, v_detected_keywords, 'suicide'::crisis_keyword_category;
        RETURN;
    END IF;
    
    -- Check self-harm keywords
    SELECT ARRAY_AGG(keyword) INTO v_detected_keywords
    FROM UNNEST(v_self_harm_keywords) AS keyword
    WHERE p_text LIKE '%' || keyword || '%';
    
    IF array_length(v_detected_keywords, 1) > 0 THEN
        RETURN QUERY SELECT true, v_detected_keywords, 'self_harm'::crisis_keyword_category;
        RETURN;
    END IF;
    
    -- Check general crisis keywords
    SELECT ARRAY_AGG(keyword) INTO v_detected_keywords
    FROM UNNEST(v_crisis_keywords) AS keyword
    WHERE p_text LIKE '%' || keyword || '%';
    
    IF array_length(v_detected_keywords, 1) > 0 THEN
        RETURN QUERY SELECT true, v_detected_keywords, 'crisis'::crisis_keyword_category;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT false, NULL::TEXT[], NULL::crisis_keyword_category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for crisis detection in coach conversations
CREATE OR REPLACE FUNCTION public.check_coach_crisis()
RETURNS TRIGGER AS $$
DECLARE
    v_crisis_check RECORD;
BEGIN
    IF NEW.role = 'user' THEN
        SELECT * INTO v_crisis_check
        FROM public.check_crisis_keywords(NEW.message);
        
        IF v_crisis_check.detected THEN
            INSERT INTO public.crisis_interventions (
                user_id,
                trigger_source,
                detected_keywords,
                keyword_category
            ) VALUES (
                NEW.user_id,
                'coach',
                v_crisis_check.keywords,
                v_crisis_check.category
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_coach_crisis_trigger ON public.coach_conversations;
CREATE TRIGGER check_coach_crisis_trigger
    AFTER INSERT ON public.coach_conversations
    FOR EACH ROW EXECUTE FUNCTION public.check_coach_crisis();

-- Add update timestamp triggers for new tables
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON public.user_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_resume_versions_updated_at BEFORE UPDATE ON public.resume_versions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create user dashboard view
CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT 
    p.id as user_id,
    p.first_name,
    p.last_name,
    p.subscription_tier,
    ld.company,
    ld.role,
    ld.layoff_date,
    ld.severance_end_date,
    bd.financial_runway_days,
    (SELECT COUNT(*) FROM public.bounce_plan_tasks WHERE user_id = p.id AND completed_at IS NOT NULL) as tasks_completed,
    (SELECT COUNT(*) FROM public.job_applications WHERE user_id = p.id AND status = 'interviewing') as active_interviews,
    (SELECT mood_score FROM public.mood_entries WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) as latest_mood
FROM public.profiles p
LEFT JOIN public.layoff_details ld ON ld.user_id = p.id
LEFT JOIN public.budget_data bd ON bd.user_id = p.id
WHERE p.id = auth.uid();

-- Grant permissions on the view
GRANT SELECT ON public.user_dashboard TO authenticated;

-- Create materialized view for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_engagement_metrics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(DISTINCT user_id) as daily_active_users,
    COUNT(DISTINCT CASE WHEN event_name = 'task_completed' THEN user_id END) as users_completed_tasks,
    COUNT(DISTINCT CASE WHEN event_name = 'coach_message_sent' THEN user_id END) as users_used_coach,
    COUNT(DISTINCT CASE WHEN event_name = 'application_added' THEN user_id END) as users_added_applications,
    COUNT(CASE WHEN event_name = 'task_completed' THEN 1 END) as total_tasks_completed,
    COUNT(CASE WHEN event_name = 'coach_message_sent' THEN 1 END) as total_coach_messages
FROM public.analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_date ON public.user_engagement_metrics(date DESC);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_engagement_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_engagement_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to track migration version
COMMENT ON SCHEMA public IS 'NextChapter Enhanced Schema v1.0';