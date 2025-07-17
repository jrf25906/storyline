# WatermelonDB Implementation for Next Chapter

## Overview
This implementation provides offline-first database functionality using WatermelonDB with Supabase sync capabilities.

## Database Models Created

### 1. **Profile**
- User profile information
- Relations: has_many to all other tables
- Fields: firstName, lastName, phone, location

### 2. **LayoffDetails**
- Layoff information for users
- Fields: company, role, layoffDate, severanceWeeks, severanceEndDate
- Helper methods: getDaysSinceLayoff(), isSeveranceActive()

### 3. **UserGoal**
- User's recovery goals
- Goal types: job-search, career-change, skills, networking, financial, wellness, freelance, entrepreneurship
- Fields: goalType, isActive

### 4. **JobApplication**
- Job application tracking
- Status types: saved, applied, interviewing, offer, rejected, withdrawn
- Fields: company, position, location, salaryRange, status, appliedDate, notes
- Helper methods: updateStatus(), isActive(), getDaysSinceApplied()

### 5. **BudgetEntry**
- Financial tracking with encryption
- Types: income, expense
- Frequencies: one-time, monthly, weekly, daily
- Fields: category, amount (encrypted), type, frequency, description
- Encryption: Amount field is encrypted using AES-256

### 6. **MoodEntry**
- Daily mood tracking
- Mood scores: 1-5
- Fields: moodScore, moodLabel, notes
- Helper methods: getMoodEmoji(), isPositive(), isNegative()

### 7. **BouncePlanTask**
- 30-day bounce plan tasks
- Fields: dayNumber, taskId, completedAt, skippedAt, notes
- Helper methods: markAsCompleted(), markAsSkipped(), isAvailable(), isOverdue()

### 8. **CoachConversation**
- AI coach chat history
- Roles: user, assistant
- Tones: hype, pragmatist, tough-love
- Fields: message, role, tone
- Helper methods: containsEmotionalTrigger(), getToneLabel()

### 9. **WellnessActivity**
- Wellness activity tracking
- Fields: activityType, durationMinutes, notes, completedAt
- Helper methods: isPhysicalActivity(), isMentalActivity()

## Sync Implementation

### Sync Strategies by Table:
1. **Bounce Plan Tasks**: One-way push (local → remote)
2. **Job Applications**: Last-write-wins (timestamp-based conflict resolution)
3. **Budget Entries**: Encrypted sync with bidirectional updates
4. **Coach Conversations**: Merge with conflict detection and alerts
5. **Other tables**: Configurable per-table strategies

### Offline Behavior:
- All changes are queued when offline
- Automatic sync when connection restored
- Conflict resolution based on table-specific strategies

### Storage Limits:
- **Soft limit**: 20MB (warning shown to user)
- **Hard limit**: 25MB (writes disabled)
- Automatic cleanup of old data when approaching limits

## Security Features

### Encryption:
- Financial data (amounts) encrypted using AES-256
- Encryption keys stored in device keychain
- Client-side encryption before sync
- Never pass financial data to AI

### Data Retention:
- Coach conversations: 90 days
- Mood entries: 180 days
- Completed tasks: 60 days
- Automatic cleanup when storage limit approached

## Usage Example

```typescript
import { 
  initializeDatabase, 
  getDatabase,
  syncDatabase,
  saveLocalJobApplication,
  getLocalJobApplications 
} from '@/services/database';

// Initialize on app start
await initializeDatabase();

// Save data locally
const job = await saveLocalJobApplication({
  user_id: 'user123',
  company: 'Tech Corp',
  position: 'Senior Developer',
  status: 'applied'
});

// Get local data
const jobs = await getLocalJobApplications('user123');

// Sync with cloud
await syncDatabase('user123');
```

## Testing

Comprehensive test coverage includes:
- Schema validation
- Model behavior
- Sync strategies
- Encryption/decryption
- Storage limits
- Offline queue management

Run tests with:
```bash
npm test src/services/database/watermelon
```

## Migration Support

Database migrations are supported through WatermelonDB's migration system. Future schema changes can be added to `migrations.ts`.

## Performance Considerations

- Indexes on user_id and status fields for fast queries
- Batch operations for bulk updates
- Lazy loading of related data
- Automatic query optimization

## Error Handling

- Graceful degradation when offline
- Retry mechanism for failed syncs
- User-friendly error messages
- Automatic recovery from corruption