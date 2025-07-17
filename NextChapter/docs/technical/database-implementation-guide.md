# NextChapter Database Implementation Guide

## Setup Instructions

### 1. Fresh Installation
If setting up a new Supabase project:

```bash
# Run the enhanced schema directly
1. Go to Supabase Dashboard > SQL Editor
2. Create new query
3. Copy contents of `src/services/database/schema-enhanced.sql`
4. Execute the query
```

### 2. Upgrading Existing Database
If you already have the basic schema installed:

```bash
# Run the migration script
1. Go to Supabase Dashboard > SQL Editor
2. Create new query
3. Copy contents of `src/services/database/migrations/001_schema_enhancements.sql`
4. Execute the query
```

## Using Enhanced Types in Code

### Import Enhanced Types
```typescript
// Use the enhanced types throughout your application
import { 
  Profile, 
  JobApplication, 
  BudgetData,
  CoachConversation,
  SyncStatus 
} from '@/types/database-enhanced';
```

### Working with Encrypted Fields

#### Client-Side Encryption
```typescript
import CryptoJS from 'crypto-js';
import { secureStorage } from '@/services/security/keychain';

// Encrypt sensitive data before storing
async function encryptFinancialData(data: string): Promise<string> {
  const encryptionKey = await secureStorage.getEncryptionKey();
  return CryptoJS.AES.encrypt(data, encryptionKey).toString();
}

// Decrypt when retrieving
async function decryptFinancialData(encryptedData: string): Promise<string> {
  const encryptionKey = await secureStorage.getEncryptionKey();
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Example: Saving budget data
async function saveBudgetData(budgetData: Partial<BudgetData>) {
  const encrypted = {
    ...budgetData,
    monthly_income: await encryptFinancialData(budgetData.monthly_income),
    current_savings: await encryptFinancialData(budgetData.current_savings),
    severance_amount: await encryptFinancialData(budgetData.severance_amount),
  };
  
  return supabase
    .from('budget_data')
    .upsert(encrypted);
}
```

### Offline-First Implementation

#### Using Sync Status
```typescript
// Track sync status for offline entries
interface OfflineCapable {
  sync_status: SyncStatus;
}

async function saveJobApplication(application: Partial<JobApplication>) {
  const isOnline = await checkNetworkStatus();
  
  const data = {
    ...application,
    sync_status: isOnline ? 'synced' : 'pending',
  };
  
  // Save to local database first
  await localDb.jobApplications.create(data);
  
  if (isOnline) {
    try {
      await supabase.from('job_applications').insert(data);
    } catch (error) {
      // Queue for later sync
      await addToSyncQueue('job_applications', 'insert', data);
    }
  } else {
    // Add to sync queue immediately
    await addToSyncQueue('job_applications', 'insert', data);
  }
}
```

#### Sync Queue Processing
```typescript
async function processSyncQueue() {
  const pendingItems = await supabase
    .from('sync_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
    
  for (const item of pendingItems.data || []) {
    try {
      await supabase
        .from('sync_queue')
        .update({ status: 'syncing' })
        .eq('id', item.id);
        
      // Process based on operation type
      switch (item.operation) {
        case 'insert':
          await supabase.from(item.table_name).insert(item.data);
          break;
        case 'update':
          await supabase.from(item.table_name).update(item.data).eq('id', item.record_id);
          break;
        case 'delete':
          await supabase.from(item.table_name).delete().eq('id', item.record_id);
          break;
      }
      
      // Mark as synced
      await supabase
        .from('sync_queue')
        .update({ status: 'synced', processed_at: new Date().toISOString() })
        .eq('id', item.id);
        
    } catch (error) {
      // Handle retry logic
      await handleSyncError(item, error);
    }
  }
}
```

### Crisis Intervention Integration

#### Monitoring Coach Conversations
```typescript
// The database automatically checks for crisis keywords
// Monitor for interventions in your app
async function checkForCrisisInterventions(userId: string) {
  const { data: interventions } = await supabase
    .from('crisis_interventions')
    .select('*')
    .eq('user_id', userId)
    .eq('user_acknowledged', false)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (interventions?.length > 0) {
    const intervention = interventions[0];
    
    // Show crisis resources based on category
    switch (intervention.keyword_category) {
      case 'suicide':
        showSuicidePreventionResources();
        break;
      case 'self_harm':
        showSelfHarmResources();
        break;
      case 'crisis':
        showGeneralCrisisResources();
        break;
    }
    
    // Track that resources were shown
    await supabase
      .from('crisis_interventions')
      .update({ 
        intervention_shown: true,
        resources_displayed: getDisplayedResources()
      })
      .eq('id', intervention.id);
  }
}
```

### Financial Runway Calculation

#### Using the Database Function
```typescript
// Calculate financial runway using the database function
async function updateFinancialRunway(userId: string) {
  const { data, error } = await supabase
    .rpc('calculate_financial_runway', { p_user_id: userId });
    
  if (error) {
    console.error('Failed to calculate runway:', error);
    return null;
  }
  
  // Check if alert threshold is crossed
  const { data: budgetData } = await supabase
    .from('budget_data')
    .select('financial_runway_days, runway_alert_threshold')
    .eq('user_id', userId)
    .single();
    
  if (budgetData && budgetData.financial_runway_days < budgetData.runway_alert_threshold) {
    // Trigger budget alert
    await createBudgetAlert(userId, budgetData.financial_runway_days);
  }
  
  return data;
}
```

### Analytics Implementation

#### Tracking Events
```typescript
import { AnalyticsEvent } from '@/types/database-enhanced';
import DeviceInfo from 'react-native-device-info';

async function trackEvent(
  eventName: string, 
  properties?: Record<string, any>
): Promise<void> {
  const deviceInfo = {
    platform: Platform.OS,
    version: DeviceInfo.getSystemVersion(),
    model: DeviceInfo.getModel(),
  };
  
  const event: Partial<AnalyticsEvent> = {
    user_id: getCurrentUserId(),
    event_name: eventName,
    event_category: getEventCategory(eventName),
    event_properties: properties,
    device_info: deviceInfo,
    session_id: getSessionId(),
  };
  
  await supabase.from('analytics_events').insert(event);
}

// Usage examples
trackEvent('task_completed', { day_number: 5, task_id: 'networking-1' });
trackEvent('coach_message_sent', { tone: 'hype', word_count: 45 });
trackEvent('application_added', { status: 'applied', has_referral: true });
```

### Resume Management

#### Working with Resume Versions
```typescript
async function uploadResume(file: File, versionName: string) {
  // Parse resume content
  const parsedContent = await parseResumeContent(file);
  const keywords = extractKeywords(parsedContent);
  
  // Create hash for deduplication
  const fileContent = await fileToBase64(file);
  const fileHash = CryptoJS.SHA256(fileContent).toString();
  
  // Check if duplicate exists
  const { data: existing } = await supabase
    .from('resume_versions')
    .select('id')
    .eq('file_hash', fileHash)
    .single();
    
  if (existing) {
    throw new Error('This resume has already been uploaded');
  }
  
  // Save new version
  const { data: resume } = await supabase
    .from('resume_versions')
    .insert({
      version_name: versionName,
      file_name: file.name,
      file_content: fileContent,
      file_hash: fileHash,
      parsed_content: parsedContent,
      keywords: keywords,
      is_primary: false, // User can set primary later
    })
    .select()
    .single();
    
  return resume;
}

// Analyze resume for job match
async function analyzeResumeMatch(resumeId: string, jobId: string) {
  const { data: job } = await supabase
    .from('job_applications')
    .select('keywords')
    .eq('id', jobId)
    .single();
    
  const { data: resume } = await supabase
    .from('resume_versions')
    .select('keywords')
    .eq('id', resumeId)
    .single();
    
  const matchedKeywords = resume.keywords.filter(k => 
    job.keywords.includes(k)
  );
  
  const score = Math.round((matchedKeywords.length / job.keywords.length) * 100);
  
  // Save analysis
  await supabase
    .from('resume_analyses')
    .insert({
      resume_version_id: resumeId,
      job_application_id: jobId,
      analysis_type: 'keyword',
      score: score,
      matched_keywords: matchedKeywords,
      missing_keywords: job.keywords.filter(k => !matchedKeywords.includes(k)),
    });
    
  return { score, matchedKeywords };
}
```

### User Dashboard

#### Using the Dashboard View
```typescript
// Get comprehensive user dashboard data in one query
async function getUserDashboard() {
  const { data, error } = await supabase
    .from('user_dashboard')
    .select('*')
    .single();
    
  if (error) {
    console.error('Failed to load dashboard:', error);
    return null;
  }
  
  // Enhance with real-time calculations
  const enhancedData = {
    ...data,
    days_since_layoff: calculateDaysSince(data.layoff_date),
    tasks_remaining: 30 - data.tasks_completed,
    mood_trend: await calculateMoodTrend(data.user_id),
  };
  
  return enhancedData;
}
```

### Notification Preferences

#### Managing User Notifications
```typescript
async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
) {
  const { error } = await supabase
    .from('notification_preferences')
    .update(preferences)
    .eq('user_id', getCurrentUserId());
    
  if (!error) {
    // Update local notification schedules
    await scheduleNotifications(preferences);
  }
}

async function scheduleNotifications(prefs: Partial<NotificationPreferences>) {
  if (prefs.daily_task_reminder && prefs.daily_task_time) {
    await scheduleDaily('task_reminder', prefs.daily_task_time);
  }
  
  if (prefs.mood_check_reminder && prefs.mood_check_time) {
    await scheduleDaily('mood_check', prefs.mood_check_time);
  }
  
  if (prefs.job_application_reminder) {
    await scheduleWeekly('job_reminder', prefs.job_reminder_frequency);
  }
}
```

## Performance Optimization

### Using Indexes Effectively
```typescript
// Queries optimized for indexes

// Uses idx_job_applications_user_status
const activeApplications = await supabase
  .from('job_applications')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'interviewing');

// Uses idx_mood_entries_user_date
const recentMoods = await supabase
  .from('mood_entries')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(7);

// Uses idx_bounce_plan_sync for offline sync
const pendingTasks = await supabase
  .from('bounce_plan_tasks')
  .select('*')
  .eq('user_id', userId)
  .eq('sync_status', 'pending');
```

### Batch Operations
```typescript
// Batch insert for better performance
async function batchInsertAnalytics(events: AnalyticsEvent[]) {
  // Supabase supports batch inserts
  const { error } = await supabase
    .from('analytics_events')
    .insert(events);
    
  if (error) {
    // Fall back to individual inserts
    for (const event of events) {
      await supabase.from('analytics_events').insert(event);
    }
  }
}
```

## Security Best Practices

### Row Level Security
```typescript
// RLS is automatically enforced, but always verify
async function verifyDataAccess() {
  // This will only return data for the authenticated user
  const { data } = await supabase
    .from('job_applications')
    .select('*');
    
  // No need to filter by user_id - RLS handles it
  return data;
}
```

### Handling Sensitive Data
```typescript
// Never log or expose sensitive fields
function sanitizeUserData(profile: Profile): Partial<Profile> {
  const { pin_hash, ...safeData } = profile;
  return safeData;
}

// Always encrypt before storing
async function updateFinancialInfo(income: string, savings: string) {
  const encryptedData = {
    monthly_income: await encryptFinancialData(income),
    current_savings: await encryptFinancialData(savings),
    encryption_version: 1, // Track encryption method
  };
  
  return supabase
    .from('budget_data')
    .update(encryptedData)
    .eq('user_id', getCurrentUserId());
}
```

## Testing Database Features

### Test Helpers
```typescript
// Create test data with proper types
import { Database } from '@/types/database-enhanced';

type Tables = Database['public']['Tables'];

export function createTestJobApplication(
  overrides?: Partial<Tables['job_applications']['Insert']>
): Tables['job_applications']['Insert'] {
  return {
    company: 'Test Company',
    position: 'Software Engineer',
    status: 'applied',
    user_id: 'test-user-id',
    ...overrides,
  };
}

// Test offline sync
export async function testOfflineSync() {
  // Simulate offline
  await goOffline();
  
  // Create data while offline
  const job = await saveJobApplication({
    company: 'Offline Corp',
    position: 'Test Position',
  });
  
  expect(job.sync_status).toBe('pending');
  
  // Simulate coming back online
  await goOnline();
  await processSyncQueue();
  
  // Verify sync completed
  const synced = await getJobApplication(job.id);
  expect(synced.sync_status).toBe('synced');
}
```

This implementation guide provides practical examples for using all the enhanced database features while maintaining security, performance, and offline-first principles.