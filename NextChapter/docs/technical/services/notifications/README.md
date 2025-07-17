# Push Notification System

## Overview
The Next Chapter app uses Expo Push Notifications to provide gentle, timely reminders that support users through their recovery journey. All notifications are designed with empathy and respect for the user's emotional state.

## Notification Types

### 1. Daily Task Reminders
- **Time**: 9:00 AM local time
- **Purpose**: Remind users to complete their daily 10-minute Bounce Plan task
- **Frequency**: Daily (respects weekends if skipped in settings)

### 2. Job Application Follow-ups
- **Time**: 7 days after application submission
- **Purpose**: Remind users to follow up on job applications
- **Frequency**: One-time per application

### 3. Budget Alerts
- **Trigger**: When financial runway drops below 60 days
- **Purpose**: Alert users to review their budget plan
- **Frequency**: Maximum once per 24 hours

### 4. Mood Check-ins
- **Time**: 8:00 PM local time
- **Purpose**: Evening reminder to log mood for pattern tracking
- **Frequency**: Daily (optional)

## User Controls

### Quiet Hours
- Default: 10 PM - 8 AM
- No non-urgent notifications during quiet hours
- Budget alerts (urgent) still delivered

### Notification Preferences
Users can individually toggle:
- Daily task reminders
- Job follow-up reminders
- Budget alerts
- Mood check-ins

## Implementation

### Permission Flow
1. Request permissions during onboarding (skippable)
2. Gentle re-prompt after first task completion
3. Settings always available to enable/disable

### Offline Support
- Local notifications work without internet
- Scheduled notifications persist across app restarts
- Sync notification state when connection restored

### Deep Linking
All notifications support deep linking to relevant screens:
- Daily tasks → Bounce Plan daily task screen
- Job follow-ups → Specific application detail
- Budget alerts → Budget overview
- Mood check-ins → Mood tracker check-in

## Testing

### Test Commands
```bash
# Run all notification tests
npm test src/services/notifications

# Run notification integration tests
npm test src/services/notifications/__tests__/notificationIntegration.test.ts

# Test notification components
npm test src/components/common/__tests__/NotificationSettings.test.tsx
```

### Manual Testing
1. Use "Send Test Notification" in settings
2. Test quiet hours by changing device time
3. Test permission flows on fresh install
4. Verify deep links open correct screens

## Privacy & Security
- No personal data in notification content
- Financial details never included in alerts
- All preferences stored locally
- Push tokens encrypted in storage
- User can delete all notification data

## Accessibility
- All notifications include:
  - Clear, concise titles
  - Descriptive body text
  - Proper accessibility labels
  - Support for screen readers

## Error Handling
- Graceful degradation without permissions
- Fallback to in-app reminders
- Clear error messages if scheduling fails
- Automatic retry for failed notifications

## Best Practices
1. Keep notification text empathetic and encouraging
2. Avoid urgency or pressure in messaging
3. Respect user's emotional state
4. Test on both iOS and Android
5. Monitor notification engagement metrics
6. A/B test notification timing and copy