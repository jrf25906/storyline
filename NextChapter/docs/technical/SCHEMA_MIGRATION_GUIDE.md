# Schema Migration Guide - Handling Existing Tables

## The Issue
You're getting the error `relation "profiles" already exists` because some tables have already been created in your Supabase database. This is common if:
- You ran part of the schema before
- Supabase created some tables automatically
- You have an existing project with some tables

## Solution Steps

### Step 1: Check What Already Exists
First, run the diagnostic script to see what's already in your database:

1. Go to Supabase SQL Editor
2. Copy and paste the entire contents of `/scripts/check-existing-schema.sql`
3. Run it and review the output

This will show you:
- Which tables already exist
- Whether Row Level Security (RLS) is enabled
- What columns exist in the profiles table
- Any existing functions and triggers

### Step 2: Choose Your Approach

Based on what you find, choose one of these approaches:

#### Option A: Safe Migration (Recommended)
If you have existing data you want to keep:

1. Use `/scripts/safe-schema-migration.sql`
2. This script:
   - Uses `CREATE TABLE IF NOT EXISTS` (won't error on existing tables)
   - Recreates all RLS policies (safe to run multiple times)
   - Only creates missing components

#### Option B: Fresh Start
If you don't have any important data and want to start fresh:

1. In the `safe-schema-migration.sql` file, uncomment the DROP TABLE section
2. **WARNING**: This will delete all data in those tables
3. Run the script to drop and recreate everything

### Step 3: Run the Migration

1. **Copy the entire contents** of `/scripts/safe-schema-migration.sql`
2. **Paste into Supabase SQL Editor**
3. **Review the script** - especially if uncommenting the DROP section
4. **Click "Run"**

### Step 4: Verify the Migration

After running the migration, verify everything worked:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Test creating a user profile
-- This should work automatically when a new user signs up
```

## Common Issues & Solutions

### Issue: "permission denied for schema public"
**Solution**: Make sure you're using the Supabase SQL Editor with admin privileges, not a client connection.

### Issue: "foreign key constraint violation"
**Solution**: This happens if you try to drop tables in the wrong order. Use the CASCADE option in the DROP statements.

### Issue: RLS policies not working
**Solution**: 
1. Make sure RLS is enabled on the table
2. Check that you're authenticated when testing
3. Verify the auth.uid() matches the user_id in your data

## What the Migration Does

The safe migration script:
1. ✅ Creates tables only if they don't exist
2. ✅ Enables Row Level Security on all tables
3. ✅ Creates/updates all RLS policies (safe to re-run)
4. ✅ Sets up the automatic profile creation trigger
5. ✅ Adds timestamp update triggers
6. ✅ Ensures all foreign key relationships are correct

## Next Steps

After successful migration:
1. Test user signup to ensure profile creation works
2. Test that authenticated users can only see their own data
3. Proceed with testing the authentication flow in your app

## Need to Add More Tables Later?

The enhanced schema (`schema-enhanced.sql`) includes additional tables for advanced features:
- `resume_scans`
- `notifications`
- `peer_connections`
- `crisis_resources`
- `sync_queue`
- `engagement_metrics`

You can add these later by running the enhancement migration script.