# Top 10 Components Needing Tests - Priority Order

## 1. 🚨 NotificationSetup.tsx (2.04% coverage)
**Location**: `src/components/app/NotificationSetup.tsx`
**Current**: 1/49 lines covered
**Priority**: CRITICAL - Handles crisis intervention notifications
**User Impact**: Missing mental health alerts could be life-threatening
**Test Requirements**:
- Permission request flow
- Notification scheduling for daily tasks
- Crisis alert prioritization
- Fallback for denied permissions
- Accessibility for screen readers
**Effort**: ~200 lines of tests

## 2. 🧠 CoachSettings.tsx (20% coverage)
**Location**: `src/components/coach/CoachSettings.tsx`
**Current**: 5/25 lines covered
**Priority**: CRITICAL - AI tone switching for emotional safety
**User Impact**: Wrong tone could harm vulnerable users
**Test Requirements**:
- Tone selection (Hype/Pragmatist/Tough-Love)
- Emotional trigger detection
- Tone persistence across sessions
- Crisis keyword override
- Accessibility compliance
**Effort**: ~150 lines of tests

## 3. 💼 Job Tracker Components (16.98% coverage)
**Location**: `src/components/feature/job-tracker/`
**Current**: 18/106 lines covered
**Priority**: HIGH - Core app functionality
**User Impact**: Can't track job applications = can't achieve mission
**Test Requirements**:
- ApplicationForm.tsx - Form validation, data persistence
- JobCard.tsx - Status updates, drag-drop
- KanbanBoard.tsx - Column management, sorting
- StatusBadge.tsx - Visual states
**Effort**: ~300 lines of tests

## 4. 📱 Navigation (0% coverage)
**Location**: `src/navigation/`
**Current**: 0/21 lines covered
**Priority**: HIGH - App unusable without navigation
**User Impact**: Users stuck, can't access features
**Test Requirements**:
- Tab navigation setup
- Stack navigation flows
- Deep linking
- Auth state handling
- Back button behavior
**Effort**: ~100 lines of tests

## 5. 🏁 Onboarding Screens (0% coverage)
**Location**: `src/screens/onboarding/`
**Current**: 0/79 lines covered
**Priority**: HIGH - First user experience
**User Impact**: Poor onboarding = 80% drop-off rate
**Test Requirements**:
- WelcomeScreen.tsx - First impression
- LayoffDetailsScreen.tsx - Critical data collection
- PersonalInfoScreen.tsx - PII handling
- GoalsScreen.tsx - User objectives
**Effort**: ~400 lines of tests

## 6. 💾 Database Services (25.92% coverage)
**Location**: `src/services/database/`
**Current**: 49/189 lines covered
**Priority**: HIGH - Data integrity
**User Impact**: Data loss = trust loss
**Test Requirements**:
- Offline queue management
- Sync conflict resolution
- Encryption at rest
- Migration handling
- Error recovery
**Effort**: ~300 lines of tests

## 7. 🔄 Sync Components (4.02% coverage)
**Location**: `src/components/feature/sync/`
**Current**: 6/149 lines covered
**Priority**: MEDIUM - Offline reliability
**User Impact**: Lost progress when offline
**Test Requirements**:
- SyncStatusIndicator.tsx - Visual feedback
- OfflineQueueViewer.tsx - Queue management
- Retry logic
- Conflict UI
**Effort**: ~200 lines of tests

## 8. 🔔 Notification Services (41.04% coverage)
**Location**: `src/services/notifications/`
**Current**: 71/173 lines covered
**Priority**: MEDIUM - User engagement
**User Impact**: Missed reminders = lost momentum
**Test Requirements**:
- Push notification handling
- Schedule management
- Permission flows
- Background tasks
- Analytics tracking
**Effort**: ~150 lines of tests

## 9. 🏠 HomeScreen (35.97% coverage)
**Location**: `src/screens/main/HomeScreen.tsx`
**Current**: Partial coverage
**Priority**: MEDIUM - Main user dashboard
**User Impact**: Confusing home = poor engagement
**Test Requirements**:
- Task card rendering
- Progress visualization
- Navigation to features
- Empty states
- Loading states
**Effort**: ~150 lines of tests

## 10. 🎯 CoachHeader.tsx (14.28% coverage)
**Location**: `src/components/coach/CoachHeader.tsx`
**Current**: 3/21 lines covered
**Priority**: MEDIUM - Shows current AI tone
**User Impact**: User confusion about coach state
**Test Requirements**:
- Tone indicator display
- Settings navigation
- Visual states for each tone
- Accessibility labels
**Effort**: ~100 lines of tests

## Summary Statistics

### By Category:
- **Safety Critical**: 3 components (450 lines)
- **Core Features**: 4 components (850 lines)
- **User Experience**: 3 components (500 lines)

### By Effort:
- **Small** (<100 lines): 2 components
- **Medium** (100-200 lines): 5 components
- **Large** (>200 lines): 3 components

### Total Effort:
- **1,800 lines of test code**
- **Expected coverage increase: ~15-20%**
- **Time estimate: 5-7 days for one developer**

## Implementation Order

### Day 1-2: Safety Critical
1. NotificationSetup.tsx
2. CoachSettings.tsx
3. CoachHeader.tsx

### Day 3-4: Core Functionality
4. Navigation
5. Job Tracker Components

### Day 5-6: User Journey
6. Onboarding Screens
7. HomeScreen

### Day 7: Data Integrity
8. Database Services
9. Sync Components
10. Notification Services

---
*Focus on user safety first, then core features, then polish*