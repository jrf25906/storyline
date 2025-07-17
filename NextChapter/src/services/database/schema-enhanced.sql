-- NextChapter Enhanced Database Schema
-- Comprehensive schema with all features from CLAUDE.md

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro');
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed');
CREATE TYPE crisis_keyword_category AS ENUM ('suicide', 'self_harm', 'crisis', 'emergency');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    location TEXT,
    timezone TEXT DEFAULT 'UTC',
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE,
    push_token TEXT,
    biometric_enabled BOOLEAN DEFAULT false,
    pin_hash TEXT, -- For financial features PIN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription_tier);
CREATE INDEX idx_profiles_last_active ON public.profiles(last_active_at);

-- Layoff details with additional fields
CREATE TABLE public.layoff_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    years_at_company NUMERIC(4,2),
    layoff_date DATE NOT NULL,
    layoff_reason TEXT,
    severance_weeks INTEGER,
    severance_amount TEXT, -- Encrypted
    severance_end_date DATE,
    health_insurance_end_date DATE,
    outplacement_services BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id)
);

-- User goals with progress tracking
CREATE TABLE public.user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN (
        'job-search', 'career-change', 'skills', 'networking', 
        'financial', 'wellness', 'freelance', 'entrepreneurship'
    )),
    target_date DATE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    is_active BOOLEAN DEFAULT true,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, goal_type)
);

-- Job applications tracker with enhanced fields
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT,
    location TEXT,
    remote_type TEXT CHECK (remote_type IN ('on-site', 'hybrid', 'remote')),
    salary_range TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN (
        'saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'
    )),
    applied_date DATE,
    interview_dates JSONB, -- Array of interview dates and types
    offer_deadline DATE,
    notes TEXT,
    job_posting_url TEXT,
    company_website TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contact_linkedin TEXT,
    resume_version_id UUID, -- Link to specific resume version used
    keywords TEXT[], -- Keywords from job posting
    match_score INTEGER, -- Resume match score
    sync_status sync_status DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for job applications
CREATE INDEX idx_job_applications_user_status ON public.job_applications(user_id, status);
CREATE INDEX idx_job_applications_sync ON public.job_applications(user_id, sync_status);
CREATE INDEX idx_job_applications_dates ON public.job_applications(applied_date DESC);

-- Budget data with enhanced encryption support
CREATE TABLE public.budget_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_income TEXT NOT NULL, -- Encrypted
    current_savings TEXT NOT NULL, -- Encrypted
    emergency_fund_target TEXT, -- Encrypted
    monthly_expenses DECIMAL(10, 2) NOT NULL,
    severance_amount TEXT, -- Encrypted
    unemployment_benefit DECIMAL(10, 2),
    unemployment_weeks INTEGER,
    unemployment_start_date DATE,
    cobra_cost DECIMAL(10, 2),
    cobra_months INTEGER,
    state TEXT,
    financial_runway_days INTEGER, -- Calculated field
    runway_alert_threshold INTEGER DEFAULT 60,
    encryption_version INTEGER DEFAULT 1, -- Track encryption method version
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id)
);

-- Budget entries for detailed tracking
CREATE TABLE public.budget_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subcategory TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    frequency TEXT NOT NULL CHECK (frequency IN ('one-time', 'monthly', 'weekly', 'daily')),
    description TEXT,
    is_essential BOOLEAN DEFAULT false, -- For expense prioritization
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for budget entries
CREATE INDEX idx_budget_entries_user_type ON public.budget_entries(user_id, type, is_active);

-- Enhanced mood tracking with triggers
CREATE TABLE public.mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
    mood_label TEXT,
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
    notes TEXT,
    triggers TEXT[], -- What triggered this mood
    activities TEXT[], -- What activities were done
    sync_status sync_status DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for mood queries
CREATE INDEX idx_mood_entries_user_date ON public.mood_entries(user_id, created_at DESC);

-- Bounce plan tasks with enhanced tracking
CREATE TABLE public.bounce_plan_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
    task_id TEXT NOT NULL,
    task_type TEXT, -- 'core', 'bonus', 'custom'
    completed_at TIMESTAMP WITH TIME ZONE,
    skipped_at TIMESTAMP WITH TIME ZONE,
    skipped_reason TEXT,
    time_spent_minutes INTEGER,
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
    notes TEXT,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    sync_status sync_status DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, day_number, task_id)
);

-- Create index for bounce plan queries
CREATE INDEX idx_bounce_plan_user_day ON public.bounce_plan_tasks(user_id, day_number);
CREATE INDEX idx_bounce_plan_sync ON public.bounce_plan_tasks(user_id, sync_status);

-- Coach conversations with enhanced metadata
CREATE TABLE public.coach_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_encrypted TEXT, -- For users who opt-in to cloud sync
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    tone TEXT CHECK (tone IN ('hype', 'pragmatist', 'tough-love')),
    detected_emotion TEXT, -- Emotion detected from user message
    tokens_used INTEGER,
    response_time_ms INTEGER,
    helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
    flagged_for_review BOOLEAN DEFAULT false,
    sync_enabled BOOLEAN DEFAULT false,
    sync_status sync_status DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for coach conversations
CREATE INDEX idx_coach_conversations_user ON public.coach_conversations(user_id, created_at DESC);
CREATE INDEX idx_coach_conversations_sync ON public.coach_conversations(user_id, sync_enabled, sync_status);

-- Resume versions tracking
CREATE TABLE public.resume_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version_name TEXT NOT NULL,
    file_name TEXT,
    file_content TEXT, -- Base64 encoded or extracted text
    file_hash TEXT, -- SHA256 hash for deduplication
    parsed_content JSONB, -- Structured resume data
    keywords TEXT[], -- Extracted keywords
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for resume queries
CREATE INDEX idx_resume_versions_user ON public.resume_versions(user_id, is_primary);

-- Resume analysis results
CREATE TABLE public.resume_analyses (
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

-- Wellness activities with categories
CREATE TABLE public.wellness_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_category TEXT CHECK (activity_category IN (
        'exercise', 'meditation', 'social', 'hobby', 'rest', 'nutrition', 'therapy'
    )),
    duration_minutes INTEGER,
    intensity_level INTEGER CHECK (intensity_level >= 1 AND intensity_level <= 5),
    mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 5),
    mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 5),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for wellness queries
CREATE INDEX idx_wellness_activities_user ON public.wellness_activities(user_id, completed_at DESC);

-- Crisis intervention logs
CREATE TABLE public.crisis_interventions (
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

-- Peer connections (for future peer connect feature)
CREATE TABLE public.peer_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_criteria JSONB, -- Industry, location, goals, etc.
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

-- Analytics events
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    event_category TEXT,
    event_properties JSONB,
    device_info JSONB,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for analytics queries
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_name ON public.analytics_events(event_name, created_at DESC);

-- Notification preferences
CREATE TABLE public.notification_preferences (
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

-- Sync queue for offline support
CREATE TABLE public.sync_queue (
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

-- Create index for sync queue
CREATE INDEX idx_sync_queue_user_status ON public.sync_queue(user_id, status);
CREATE INDEX idx_sync_queue_created ON public.sync_queue(created_at) WHERE status = 'pending';

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layoff_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounce_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own layoff details" ON public.layoff_details FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON public.user_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own job applications" ON public.job_applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budget" ON public.budget_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budget data" ON public.budget_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own mood entries" ON public.mood_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bounce plan" ON public.bounce_plan_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own coach conversations" ON public.coach_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wellness activities" ON public.wellness_activities FOR ALL USING (auth.uid() = user_id);
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

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate financial runway
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

-- Function to detect crisis keywords
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

-- Trigger to create profile and preferences on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp triggers for all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_layoff_details_updated_at BEFORE UPDATE ON public.layoff_details
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON public.user_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_budget_entries_updated_at BEFORE UPDATE ON public.budget_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_budget_data_updated_at BEFORE UPDATE ON public.budget_data
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_resume_versions_updated_at BEFORE UPDATE ON public.resume_versions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to check for crisis keywords in coach conversations
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

CREATE TRIGGER check_coach_crisis_trigger
    AFTER INSERT ON public.coach_conversations
    FOR EACH ROW EXECUTE FUNCTION public.check_coach_crisis();

-- Create views for common queries
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
CREATE MATERIALIZED VIEW public.user_engagement_metrics AS
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
CREATE INDEX idx_engagement_metrics_date ON public.user_engagement_metrics(date DESC);

-- Refresh materialized view function (to be called periodically)
CREATE OR REPLACE FUNCTION public.refresh_engagement_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_engagement_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;