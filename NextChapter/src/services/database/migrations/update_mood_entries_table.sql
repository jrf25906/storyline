-- Migration: Update mood_entries table for enhanced mood tracking

-- Drop the existing mood_entries table (preserve data if needed in production)
DROP TABLE IF EXISTS public.mood_entries CASCADE;

-- Create the updated mood_entries table
CREATE TABLE public.mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value INTEGER NOT NULL CHECK (value >= 1 AND value <= 5),
    note TEXT,
    triggers TEXT[], -- Array of trigger words/phrases
    activities TEXT[], -- Array of activities done
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for efficient queries
CREATE INDEX idx_mood_entries_user_id_created_at ON public.mood_entries(user_id, created_at DESC);
CREATE INDEX idx_mood_entries_created_at ON public.mood_entries(created_at DESC);

-- Enable RLS
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own mood entries" ON public.mood_entries 
    FOR ALL USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON public.mood_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add helpful views for analytics

-- Weekly mood average view
CREATE VIEW public.weekly_mood_averages AS
SELECT 
    user_id,
    DATE_TRUNC('week', created_at) as week_start,
    AVG(value) as average_mood,
    COUNT(*) as entry_count,
    MIN(value) as lowest_mood,
    MAX(value) as highest_mood
FROM public.mood_entries
GROUP BY user_id, DATE_TRUNC('week', created_at);

-- Grant access to the view
GRANT SELECT ON public.weekly_mood_averages TO authenticated;

-- Monthly mood trends view
CREATE VIEW public.monthly_mood_trends AS
SELECT 
    user_id,
    DATE_TRUNC('month', created_at) as month_start,
    AVG(value) as average_mood,
    COUNT(*) as entry_count,
    MIN(value) as lowest_mood,
    MAX(value) as highest_mood,
    -- Calculate trend (positive = improving)
    CASE 
        WHEN COUNT(*) > 15 THEN 
            (AVG(CASE WHEN created_at > DATE_TRUNC('month', created_at) + INTERVAL '15 days' THEN value END) - 
             AVG(CASE WHEN created_at <= DATE_TRUNC('month', created_at) + INTERVAL '15 days' THEN value END))
        ELSE NULL
    END as trend_direction
FROM public.mood_entries
GROUP BY user_id, DATE_TRUNC('month', created_at);

-- Grant access to the view
GRANT SELECT ON public.monthly_mood_trends TO authenticated;