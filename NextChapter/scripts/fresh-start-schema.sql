-- NextChapter: Fresh Start Database Setup
-- This will DELETE everything and start fresh!

-- Step 1: Drop all existing tables (this deletes all data!)
DROP TABLE IF EXISTS wellness_activities CASCADE;
DROP TABLE IF EXISTS coach_conversations CASCADE;
DROP TABLE IF EXISTS bounce_plan_tasks CASCADE;
DROP TABLE IF EXISTS mood_entries CASCADE;
DROP TABLE IF EXISTS budget_data CASCADE;
DROP TABLE IF EXISTS budget_entries CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS layoff_details CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 2: Drop existing functions and triggers
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 3: Now copy and run the ENTIRE contents of:
-- /Users/jamesfarmer/NextChapter/src/services/database/schema.sql
-- 
-- You'll need to:
-- 1. Open that file in your code editor
-- 2. Select ALL the text (Cmd+A on Mac, Ctrl+A on Windows)
-- 3. Copy it (Cmd+C on Mac, Ctrl+C on Windows)
-- 4. Come back to Supabase SQL Editor
-- 5. Paste it below this line
-- 6. Click the "Run" button

-- PASTE THE schema.sql CONTENTS BELOW THIS LINE: