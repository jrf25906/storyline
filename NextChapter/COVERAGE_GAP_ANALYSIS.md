# Test Coverage Gap Analysis - NextChapter App

## Current Status: 54.61% Coverage
**Target: 80% Coverage**
**Gap: 25.39%**

## Critical Coverage Breakdown

### 🚨 HIGH PRIORITY - Safety Critical Components (0% Coverage)

#### 1. Crisis & Mental Health Components
- **components/app/NotificationSetup.tsx** - 2.04% coverage
  - Handles crisis intervention notifications
  - Mental health reminders
  - **Impact**: Users may miss critical support when needed
  - **Effort**: ~200 lines of tests needed

#### 2. Onboarding Components (0% Coverage)
- **components/feature/onboarding/** - 0% coverage
  - DateInput.tsx - Tracks layoff date (critical for benefits)
  - OnboardingProgressBar.tsx - User journey tracking
  - **Impact**: Poor onboarding = high drop-off rate
  - **Effort**: ~150 lines of tests per component

#### 3. Navigation (0% Coverage)
- **navigation/** - 0% coverage
  - Core app navigation logic
  - **Impact**: Navigation failures = app unusable
  - **Effort**: ~100 lines of tests

### 💰 FINANCIAL SAFETY (Partial Coverage)

#### 1. Budget Components
- **components/feature/budget/** - 79.16% coverage
  - BudgetForm.tsx needs improvement
  - RunwayIndicator.tsx needs edge case testing
  - **Impact**: Wrong financial calculations = bad decisions
  - **Effort**: ~100 lines to reach 95%

#### 2. Budget Services
- **services/budget/** - 82.85% coverage
  - Edge cases for unemployment calculations
  - COBRA cost estimation accuracy
  - **Effort**: ~50 lines for full coverage

### 🧠 EMOTIONAL SUPPORT (Partial Coverage)

#### 1. Coach Components
- **components/coach/** - 65.62% coverage
  - CoachHeader.tsx - 14.28% (critical for tone display)
  - CoachSettings.tsx - 20% (tone switching logic)
  - **Impact**: Wrong emotional tone = user harm
  - **Effort**: ~150 lines needed

#### 2. Wellness Components
- **components/feature/wellness/** - 79.62% coverage
  - MoodSelector.tsx needs edge cases
  - Crisis detection thresholds
  - **Effort**: ~75 lines needed

### 📱 CORE FUNCTIONALITY GAPS

#### 1. Job Tracker (16.98% Coverage)
- **components/feature/job-tracker/** 
  - ApplicationForm.tsx
  - JobCard.tsx
  - KanbanBoard.tsx
  - **Impact**: Core feature unusable
  - **Effort**: ~300 lines needed

#### 2. Sync Components (4.02% Coverage)
- **components/feature/sync/**
  - OfflineQueueViewer.tsx
  - SyncStatusIndicator.tsx
  - **Impact**: Data loss when offline
  - **Effort**: ~200 lines needed

#### 3. Database Services (25.92% Coverage)
- **services/database/**
  - Critical for data persistence
  - Offline/online sync logic
  - **Effort**: ~400 lines needed

## Quick Wins (High Impact, Low Effort)

### 1. Config Files (Can Skip)
- **config/** - 0% coverage (11 lines)
- Skip testing constants/config

### 2. Simple Components (Easy 100%)
- **components/dev/** - 0% coverage (31 lines)
- Development-only components, can skip

### 3. Already High Coverage (Polish to 100%)
- **components/feature/resume/** - 98.68% coverage
- **services/resume/** - 91.32% coverage
- **utils/budget/** - 100% coverage ✅
- Just need 1-2 edge cases each

## Prioritized Action Plan

### Phase 1: Safety Critical (Week 1)
1. **NotificationSetup.tsx** - Crisis notifications
2. **CoachSettings.tsx** - Emotional tone safety
3. **MoodSelector.tsx** - Mental health tracking
4. **Navigation** - Core app functionality
**Expected Coverage Gain: +8%**

### Phase 2: Core Features (Week 2)
1. **Job Tracker Components** - Main user flow
2. **Onboarding Screens** - User retention
3. **Database Services** - Data integrity
**Expected Coverage Gain: +10%**

### Phase 3: Polish (Week 3)
1. **Sync Components** - Offline reliability
2. **Budget edge cases** - Financial accuracy
3. **High coverage files to 100%**
**Expected Coverage Gain: +7%**

## Effort Calculation

### To Reach 80% Coverage:
- **Total Lines Needed**: ~2,051 lines
- **Files Needing Tests**: 47 files
- **Critical Files**: 15 files
- **Estimated Time**: 3 weeks (1 developer)

### Coverage Distribution Target:
- Safety Critical: 95%+ coverage
- Core Features: 85%+ coverage
- UI Components: 80%+ coverage
- Utils/Helpers: 70%+ coverage
- Config/Types: Skip or minimal

## Test Implementation Strategy

### 1. Use Existing Patterns
```typescript
// All tests should follow established patterns:
- Mock stores with createMockStore()
- Mock navigation with mockNavigation
- Use test builders for data
- Include accessibility tests
- Test error states
```

### 2. Focus on User Impact
- Crisis detection accuracy
- Financial calculation precision
- Emotional tone appropriateness
- Offline data integrity

### 3. Skip These Files
- Type definitions (*.d.ts)
- Style files (*.styles.ts) 
- Constants (unless complex logic)
- Dev-only components

## Monitoring Progress

### Weekly Targets:
- Week 1: 54% → 62% (+8%)
- Week 2: 62% → 72% (+10%)
- Week 3: 72% → 80% (+8%)

### Daily Progress:
- 3-4 components per day
- ~250-300 lines of tests per day
- Run coverage after each component

## Command Reference

```bash
# Generate coverage report
npm test -- --coverage

# Test specific file
npm test path/to/file.test.tsx

# Watch mode for TDD
npm test -- --watch

# Update snapshots
npm test -- -u

# Run with specific coverage threshold
npm test -- --coverage --coverageThreshold='{"global":{"lines":80}}'
```

## Success Metrics

1. **80% overall coverage** ✅
2. **95% coverage on safety-critical components** ✅
3. **Zero untested crisis intervention code** ✅
4. **All financial calculations tested** ✅
5. **Offline sync fully tested** ✅

---
*Generated: January 13, 2025*
*Mission: Help vulnerable users safely through career transitions*