# NextChapter Supabase Database Setup Guide

This guide provides comprehensive instructions for setting up the NextChapter database schema in Supabase, ensuring proper security, encryption, and all required features are configured correctly.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Pre-Setup Checklist](#pre-setup-checklist)
3. [Schema Application Order](#schema-application-order)
4. [Step-by-Step Instructions](#step-by-step-instructions)
5. [Security Configuration](#security-configuration)
6. [Verification Steps](#verification-steps)
7. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
8. [Post-Setup Configuration](#post-setup-configuration)

## Prerequisites

Before beginning the database setup, ensure you have:

1. **Supabase Project**: A new or existing Supabase project
2. **Admin Access**: Full administrative access to the Supabase project
3. **SQL Editor Access**: Access to the Supabase SQL Editor
4. **Authentication Enabled**: Supabase Auth must be enabled for the project
5. **Project URL & Keys**: Note down your project URL and anon/service keys

### Required Supabase Extensions
The schema requires these PostgreSQL extensions:
- `uuid-ossp` (for UUID generation)
- `pgcrypto` (for encryption functions)

## Pre-Setup Checklist

- [ ] Backup existing database (if applicable)
- [ ] Ensure you're working in the correct environment (dev/staging/prod)
- [ ] Verify Supabase Auth is enabled
- [ ] Have the schema files ready:
  - `src/services/database/schema.sql` (base schema)
  - `src/services/database/schema-enhanced.sql` (full enhanced schema)
  - `src/services/database/migrations/001_schema_enhancements.sql`
  - `src/services/database/migrations/update_mood_entries_table.sql`
- [ ] Review security requirements from CLAUDE.md

## Schema Application Order

The schemas must be applied in this specific order to avoid dependency issues:

1. **Base Schema** (`schema.sql`) - Creates core tables and basic RLS
2. **Enhancement Migration** (`001_schema_enhancements.sql`) - Upgrades to enhanced version
3. **Mood Entries Update** (`update_mood_entries_table.sql`) - Optional, specific enhancement

**Alternative**: Use `schema-enhanced.sql` for a fresh installation (includes everything)

## Step-by-Step Instructions

### Option A: Fresh Installation (Recommended for New Projects)

1. **Open Supabase SQL Editor**
   - Navigate to your project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the Enhanced Schema**
   ```sql
   -- Copy and paste the entire contents of schema-enhanced.sql
   -- This includes all tables, indexes, RLS policies, and functions
   ```

3. **Verify Installation**
   ```sql
   -- Check if all tables were created
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

### Option B: Incremental Installation (For Existing Projects)

1. **Run Base Schema First**
   ```sql
   -- Copy and paste the entire contents of schema.sql
   ```

2. **Apply Enhancement Migration**
   ```sql
   -- Copy and paste the entire contents of 001_schema_enhancements.sql
   -- This safely upgrades existing tables and adds new ones
   ```

3. **Apply Mood Entries Update (Optional)**
   ```sql
   -- Only if you want the enhanced mood tracking features
   -- Copy and paste the entire contents of update_mood_entries_table.sql
   ```

### Enable Row Level Security (RLS)

After creating all tables, verify RLS is enabled:

```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

## Security Configuration

### 1. Verify RLS Policies

Run this query to ensure all RLS policies are in place:

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected policies per table:
- `profiles`: 3 policies (SELECT, UPDATE, INSERT)
- All other user tables: 1 policy for ALL operations
- Special tables (`resume_analyses`, `peer_connections`): Custom policies

### 2. Configure Encryption

The schema uses text fields for encrypted data. In your application:

1. **Encrypted Fields**:
   - `budget_data`: `monthly_income`, `current_savings`, `emergency_fund_target`, `severance_amount`
   - `layoff_details`: `severance_amount`
   - `coach_conversations`: `message_encrypted` (optional)

2. **Client-Side Encryption**:
   - Use CryptoJS in the React Native app
   - Never store encryption keys in the database
   - Use `react-native-keychain` for key storage

### 3. Set Up Authentication Trigger

Verify the auth trigger is working:

```sql
-- Test user creation trigger
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';

-- Check trigger exists
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name = 'on_auth_user_created';
```

## Verification Steps

### 1. Table Structure Verification

```sql
-- Count all tables
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: 17+ tables

-- Verify critical tables exist
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
) as profiles_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'bounce_plan_tasks'
) as bounce_plan_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'coach_conversations'
) as coach_exists;
```

### 2. Index Verification

```sql
-- List all indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Key indexes to verify:
- `idx_profiles_subscription`
- `idx_job_applications_user_status`
- `idx_bounce_plan_user_day`
- `idx_coach_conversations_user`

### 3. Function Verification

```sql
-- List all custom functions
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

Expected functions:
- `handle_new_user`
- `update_updated_at_column`
- `calculate_financial_runway`
- `check_crisis_keywords`
- `check_coach_crisis`
- `refresh_engagement_metrics`

### 4. View Verification

```sql
-- Check views
SELECT 
    table_name,
    view_definition IS NOT NULL as is_defined
FROM information_schema.views
WHERE table_schema = 'public';
```

Expected views:
- `user_dashboard`
- `weekly_mood_averages` (if mood migration applied)
- `monthly_mood_trends` (if mood migration applied)

### 5. Test User Creation Flow

```sql
-- This should automatically create entries in profiles and notification_preferences
-- Run this in Supabase Auth or through your app's signup
```

## Common Issues & Troubleshooting

### Issue 1: Extension Not Available
**Error**: `extension "uuid-ossp" does not exist`

**Solution**:
```sql
-- Check available extensions
SELECT * FROM pg_available_extensions WHERE name IN ('uuid-ossp', 'pgcrypto');

-- If not installed, contact Supabase support
```

### Issue 2: RLS Policy Conflicts
**Error**: `policy "policy_name" for table "table_name" already exists`

**Solution**:
```sql
-- Drop existing policy first
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
-- Then recreate
```

### Issue 3: Type Already Exists
**Error**: `type "subscription_tier" already exists`

**Solution**: The migration scripts handle this with `DO $$ BEGIN ... EXCEPTION` blocks

### Issue 4: Permission Denied
**Error**: `permission denied for schema public`

**Solution**: Ensure you're using the Supabase SQL Editor with admin privileges

### Issue 5: Foreign Key Violations
**Error**: `violates foreign key constraint`

**Solution**: Ensure tables are created in the correct order. Use the enhanced schema for fresh installs.

## Post-Setup Configuration

### 1. Configure Supabase Dashboard

1. **Enable Email Auth**:
   - Dashboard → Authentication → Providers → Email
   - Enable email confirmations

2. **Set Up Auth Emails**:
   - Customize confirmation and recovery emails
   - Add app branding

3. **Configure Storage** (if needed):
   - Create buckets for resume uploads
   - Set appropriate policies

### 2. Set Up Database Backups

1. Go to Database → Backups
2. Verify daily backups are enabled
3. Consider setting up point-in-time recovery for production

### 3. Performance Optimization

```sql
-- Analyze tables for query optimization
ANALYZE;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 4. Set Up Monitoring

1. **Enable Query Performance**:
   - Dashboard → Database → Query Performance
   - Monitor slow queries

2. **Set Up Alerts**:
   - Configure alerts for high CPU/memory usage
   - Set up error rate monitoring

### 5. Create Initial Data (Optional)

```sql
-- Example: Create default bounce plan task templates
-- This would need to be customized based on your task structure
```

### 6. Test Security

```sql
-- Switch to a test user role and verify RLS
SET ROLE authenticated;
SET request.jwt.claim.sub = 'test-user-id';

-- Try to access another user's data (should return empty)
SELECT * FROM profiles WHERE id != 'test-user-id';

-- Reset role
RESET ROLE;
```

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] RLS policies restrict access to user's own data
- [ ] Sensitive fields identified for encryption
- [ ] No sensitive data in unencrypted fields
- [ ] Auth trigger creates user profiles
- [ ] Crisis intervention triggers active
- [ ] Financial data fields marked as encrypted
- [ ] Coach conversations have encryption option
- [ ] Peer connections have proper bidirectional policies

## Maintenance Tasks

### Weekly
- Review slow query logs
- Check for failed sync queue items
- Monitor storage usage

### Monthly
- Refresh materialized view: `SELECT public.refresh_engagement_metrics();`
- Review and archive old analytics events
- Check for unused indexes

### Quarterly
- Review and update RLS policies
- Audit security permissions
- Performance tune queries

## Next Steps

1. **Configure your React Native app**:
   - Set up Supabase client with your project URL and anon key
   - Implement client-side encryption for sensitive fields
   - Set up offline sync with WatermelonDB

2. **Test core features**:
   - User registration and profile creation
   - Bounce plan task creation and completion
   - Job application tracking
   - Budget data encryption/decryption
   - Coach conversation storage

3. **Set up backend services**:
   - Implement Vercel Edge Functions for API endpoints
   - Configure push notification services
   - Set up analytics tracking

For any issues not covered in this guide, consult the Supabase documentation or the NextChapter CLAUDE.md file for specific business logic requirements.