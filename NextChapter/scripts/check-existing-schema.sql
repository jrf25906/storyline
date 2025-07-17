-- NextChapter: Check Existing Database Schema
-- Run this in Supabase SQL Editor to see what tables already exist

-- 1. List all existing tables
SELECT 
    'Existing Tables:' as section;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'profiles', 'layoff_details', 'user_goals', 'job_applications',
            'budget_entries', 'budget_data', 'mood_entries', 'bounce_plan_tasks',
            'coach_conversations', 'wellness_activities'
        ) THEN '✅ NextChapter table'
        ELSE '❓ Other table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check if Row Level Security is enabled
SELECT 
    '---' as separator,
    'Row Level Security Status:' as section;

SELECT 
    schemaname, 
    tablename, 
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN (
        'profiles', 'layoff_details', 'user_goals', 'job_applications',
        'budget_entries', 'budget_data', 'mood_entries', 'bounce_plan_tasks',
        'coach_conversations', 'wellness_activities'
    )
ORDER BY tablename;

-- 3. Check existing columns in profiles table
SELECT 
    '---' as separator,
    'Profiles Table Structure:' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check for existing functions
SELECT 
    '---' as separator,
    'Existing Functions:' as section;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN (
        'handle_new_user',
        'update_updated_at_column',
        'check_crisis_keywords',
        'calculate_financial_runway',
        'get_job_application_stats',
        'get_mood_trend'
    );

-- 5. Check for existing triggers
SELECT 
    '---' as separator,
    'Existing Triggers:' as section;

SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. Summary of what needs to be done
SELECT 
    '---' as separator,
    'Next Steps:' as section;

SELECT 
    'Based on the above results, you may need to:' as action,
    '1. Drop existing tables if starting fresh' as step1,
    '2. Run migration scripts if updating' as step2,
    '3. Apply missing RLS policies' as step3;