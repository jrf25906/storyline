# Analytics Service

Privacy-first analytics implementation for Next Chapter app using PostHog.

## Overview

The analytics service provides:
- ✅ Privacy-compliant event tracking (GDPR/CCPA)
- ✅ Offline queue with automatic sync
- ✅ Financial data hashing
- ✅ User opt-out controls
- ✅ Debug mode for development
- ✅ Type-safe event tracking

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set PostHog API key:**
   - Production: Store in secure keychain as `posthog_api_key`
   - Development: Set `EXPO_PUBLIC_POSTHOG_API_KEY` in `.env`

3. **Initialize in app startup:**
   ```typescript
   import { setupAnalytics } from '@/services/analytics/config';
   
   // In App.tsx or initialization service
   await setupAnalytics();
   ```

## Usage

### Track Events

```typescript
import { trackEvent } from '@/services/analytics';

// User signs up
trackEvent('user_signed_up', { method: 'email' });

// Task completed
trackEvent('task_completed', {
  task_id: 'day-1-task',
  day_index: 1,
  skipped: false
});

// Coach interaction
trackEvent('coach_message_sent', {
  mode: 'pull',
  tone: 'hype'
});
```

### Set User Properties

```typescript
import { getAnalytics } from '@/services/analytics';

const analytics = getAnalytics();
analytics.setUserProperties({
  industry: 'tech',
  location_state: 'CA',
  days_since_layoff: 30
});
```

### Privacy Controls

```typescript
// User opts out
await analytics.optOut();

// User opts in
await analytics.optIn();

// Delete all data (GDPR request)
await analytics.deleteAllData();
```

## Events

### Core Events
- `user_signed_up` - Onboarding completion
- `task_completed` - Bounce plan progress
- `coach_message_sent` - AI coach usage
- `resume_uploaded` - Feature adoption
- `application_added` - Job search activity
- `mood_logged` - Emotional tracking
- `budget_saved` - Financial planning

### Success Metrics
- `activation` - Day-2 activation tracking
- `interview_progress` - Interview milestone
- `coach_rating` - Coach satisfaction
- `tier_conversion` - Free to Pro upgrade

## Privacy Features

1. **Anonymous IDs**: No PII in user identification
2. **Data Hashing**: Financial data automatically hashed
3. **Opt-out**: One-tap analytics disable
4. **Data Deletion**: Complete data removal on request
5. **Offline Queue**: Events stored locally when offline
6. **PII Filtering**: Automatic removal of sensitive properties

## Testing

Run tests:
```bash
npm test src/services/analytics
```

Coverage:
```bash
npm run test:coverage -- src/services/analytics
```

## Debug Mode

Enable in development:
```typescript
const analytics = getAnalytics();
analytics.enableDebugMode();
```

Events will be logged to console with `[Analytics Debug]` prefix.

## Offline Behavior

1. Events queued when offline (max 100 events)
2. Automatic flush when connection restored
3. Queue persisted in AsyncStorage
4. Oldest events dropped if queue full

## Configuration

Default settings:
- Flush at: 20 events
- Flush interval: 10 seconds
- Max queue size: 100 events
- Host: https://app.posthog.com

## Security Notes

- API keys stored in secure keychain
- No financial data sent to analytics
- All data encrypted in transit
- Row-level security on backend
- Anonymous user IDs only

## Compliance

- GDPR compliant with opt-out and deletion
- CCPA compliant with data controls
- No PII collected or transmitted
- User consent required for tracking