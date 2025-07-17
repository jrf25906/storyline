# NextChapter Database Schema Design Documentation

## Overview

The NextChapter database schema is designed with the following principles:
- **Privacy-first**: All sensitive data is encrypted, RLS policies ensure data isolation
- **Offline-first**: Sync status tracking, conflict resolution support
- **User wellbeing**: Crisis intervention tracking, mood monitoring
- **Performance**: Strategic indexes, materialized views for analytics
- **Extensibility**: JSONB fields for flexible data, enum types for consistency

## Schema Architecture

### Core User Data

#### `profiles` Table
Extends Supabase's auth.users with app-specific data:
- Subscription management (free/pro tiers)
- Timezone for proper task scheduling
- Push notification tokens
- Biometric and PIN settings for security
- Last active tracking for engagement metrics

#### `layoff_details` Table
Comprehensive layoff information:
- Company and role details with department tracking
- Severance package details (encrypted)
- Health insurance continuation dates
- Outplacement services flag

### Goal & Progress Tracking

#### `user_goals` Table
Tracks user's selected goals with progress:
- 8 goal types covering career, financial, and wellness
- Progress percentage tracking
- Target dates for accountability
- Completion tracking

#### `bounce_plan_tasks` Table
30-day structured plan progress:
- Task completion and skip tracking with reasons
- Time spent and difficulty ratings
- Helpfulness ratings for task improvement
- Reminder tracking
- Sync status for offline support

### Job Search Management

#### `job_applications` Table
Comprehensive application tracking:
- Full contact details and company information
- Remote work type classification
- Salary range tracking (min/max for calculations)
- Interview scheduling with JSONB for flexibility
- Resume version linking
- Keyword matching and ATS scores
- Sync status for offline updates

#### `resume_versions` & `resume_analyses` Tables
Resume management and optimization:
- Multiple resume versions with primary designation
- Parsed content storage in JSONB
- Keyword extraction
- ATS scoring and improvement suggestions
- Job-specific analysis linking

### Financial Planning

#### `budget_data` Table
Sensitive financial information with encryption:
- All monetary values encrypted client-side
- Unemployment benefits tracking
- COBRA cost calculations
- Financial runway calculation
- Alert thresholds
- Encryption version tracking for future updates

#### `budget_entries` Table
Detailed income/expense tracking:
- Category and subcategory organization
- Essential vs non-essential classification
- Frequency-based calculations
- Date range support for temporary items

### Wellness & Mental Health

#### `mood_entries` Table
Comprehensive mood tracking:
- 5-point scales for mood, energy, and stress
- Trigger and activity tracking
- Sync status for offline entries

#### `wellness_activities` Table
Activity logging with impact measurement:
- Category classification
- Before/after mood comparison
- Intensity and duration tracking

#### `crisis_interventions` Table
Critical safety feature:
- Keyword detection tracking
- Resource display logging
- User acknowledgment tracking
- Follow-up flags for support team

### AI Coach Integration

#### `coach_conversations` Table
Conversation history with metadata:
- Tone tracking (hype/pragmatist/tough-love)
- Emotion detection logging
- Token usage for cost management
- Response time tracking
- Helpfulness ratings
- Opt-in encryption for cloud sync
- Review flagging for quality control

### Social Features (Future)

#### `peer_connections` Table
Peer matching system:
- Bidirectional connection model
- Match criteria in JSONB
- Match scoring
- Connection status workflow
- Expiration for stale matches

### System Features

#### `notification_preferences` Table
User notification settings:
- Time-specific reminders
- Feature-specific toggles
- Frequency preferences

#### `sync_queue` Table
Offline-first sync management:
- Operation tracking (insert/update/delete)
- Retry logic with limits
- Error tracking
- Status management

#### `analytics_events` Table
Comprehensive event tracking:
- Flexible property storage in JSONB
- Device information capture
- Session tracking

## Security Implementation

### Row Level Security (RLS)
Every table has RLS enabled with policies ensuring:
- Users can only access their own data
- Peer connections visible to both parties
- Analytics events tied to user identity

### Encryption Strategy
- Sensitive financial data encrypted client-side before storage
- Coach conversations optionally encrypted for cloud sync
- Encryption version tracking for migration support
- PIN hashes for financial feature protection

### Crisis Intervention
- Automatic keyword detection in coach conversations
- Trigger-based intervention logging
- Resource tracking for effectiveness measurement

## Performance Optimizations

### Indexes
Strategic indexes on:
- User + status combinations for filtered queries
- Sync status for offline queue processing
- Date fields for time-based queries
- Subscription tiers for feature gating

### Materialized Views
- `user_engagement_metrics`: Pre-calculated daily metrics
- Concurrent refresh support for zero-downtime updates

### Database Functions
- `handle_new_user()`: Automatic profile creation
- `calculate_financial_runway()`: Complex financial calculations
- `check_crisis_keywords()`: Safety keyword detection
- `update_updated_at_column()`: Automatic timestamp updates

## Offline-First Design

### Sync Status Tracking
Tables with user-generated content include `sync_status`:
- `pending`: Awaiting sync
- `syncing`: Currently uploading
- `synced`: Successfully synchronized
- `failed`: Sync failed, needs retry

### Conflict Resolution
- Last-write-wins strategy with timestamps
- Sync queue for operation ordering
- Retry logic with exponential backoff

### Storage Considerations
- Client-side storage limits tracked
- Selective sync for large data (coach conversations)
- Compression strategies for text content

## Data Privacy & Compliance

### GDPR/CCPA Compliance
- User data isolation via RLS
- One-tap deletion capability
- Data export functionality
- Encryption for sensitive data

### Data Retention
- Coach conversations: 90-day default
- Analytics: Anonymized after 1 year
- Crisis interventions: Permanent for safety

## Migration Strategy

### From Existing Schema
1. Create new tables with `CREATE TABLE IF NOT EXISTS`
2. Migrate data with proper type conversions
3. Update RLS policies
4. Create missing indexes
5. Refresh materialized views

### Version Management
- Track schema version in migrations table
- Use transaction blocks for atomic updates
- Test migrations on staging first

## Future Enhancements

### Planned Features
1. **Group coaching sessions**: Multi-user conversation support
2. **Employer partnerships**: Company-specific resources
3. **Skills assessment**: Detailed skill tracking and gaps
4. **Interview preparation**: Mock interview scheduling
5. **Salary negotiation**: Offer comparison tools

### Scalability Considerations
- Partition large tables by date (analytics, conversations)
- Archive old data to cold storage
- Implement read replicas for analytics
- Consider sharding by user_id for massive scale

## Best Practices

### Development Guidelines
1. Always use UUIDs for primary keys
2. Include sync_status for user-generated content
3. Use JSONB for flexible, queryable data
4. Encrypt sensitive financial information
5. Add appropriate indexes for common queries
6. Use database functions for complex logic
7. Implement proper error handling in functions

### Testing Requirements
1. Test RLS policies with multiple users
2. Verify encryption/decryption flow
3. Test sync queue processing
4. Validate crisis keyword detection
5. Performance test with realistic data volumes
6. Test offline scenarios thoroughly

This schema design prioritizes user privacy, data security, and offline functionality while maintaining flexibility for future enhancements. The architecture supports the app's mission of helping users through a difficult transition with empathy and technical excellence.