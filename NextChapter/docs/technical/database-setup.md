# NextChapter Database Setup Guide

## Prerequisites
- Supabase account and project created
- Project URL and Anon Key from Supabase dashboard

## Step 1: Update Environment Variables

1. Copy your Supabase credentials from the Supabase dashboard:
   - Go to Settings > API
   - Copy the Project URL and anon/public key

2. Update your `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 2: Run Database Schema

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `src/services/database/schema.sql`
5. Click "Run" to execute the schema

## Step 3: Enable Authentication

1. In Supabase dashboard, go to Authentication > Providers
2. Enable Email/Password authentication
3. Configure email templates as needed

## Step 4: Test the Setup

Run the app to test authentication:
```bash
npm start
```

## Database Tables Created

- `profiles` - User profile information
- `layoff_details` - Layoff and severance details
- `user_goals` - Selected user goals
- `job_applications` - Job application tracker
- `budget_entries` - Income and expense tracking
- `mood_entries` - Daily mood tracking
- `bounce_plan_tasks` - 30-day plan progress
- `coach_conversations` - AI coach chat history
- `wellness_activities` - Wellness activity log

## Security

All tables have Row Level Security (RLS) enabled, ensuring users can only access their own data.

## Next Steps

1. Test authentication flow (signup, login, logout)
2. Implement onboarding data persistence
3. Build out main app features