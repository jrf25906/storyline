# Next Chapter - Test Coverage Plan

## Overview
This document outlines the missing test coverage for recently implemented features and provides a prioritized plan for achieving the 80% minimum coverage required by CLAUDE.md.

## Current Coverage Status

| Feature | Current Coverage | Target | Priority |
|---------|-----------------|--------|----------|
| Bounce Plan Sync | ~80% ✅ | 80% | Complete |
| Network/Offline Queue | ~30% ❌ | 80% | High |
| AI Coach | ~50% ⚠️ | 80% | High |
| Job Tracker | ~40% ⚠️ | 80% | Medium |

## Test Implementation Plan

### Phase 1: Critical Path Tests (High Priority)

#### 1.1 Network State Detection & Offline Queue
**Files to create:**
- `src/hooks/__tests__/useNetworkStatus.test.ts`
- `src/hooks/__tests__/useNetworkAwareSync.test.ts`
- `src/components/common/__tests__/NetworkStatusBar.test.tsx`
- `src/context/__tests__/OfflineContext.test.tsx`

**Test scenarios:**
```typescript
// useNetworkStatus.test.ts
- ✅ Should return online status when connected
- ✅ Should return offline status when disconnected
- ✅ Should update status on network change
- ✅ Should handle NetInfo errors gracefully

// useNetworkAwareSync.test.ts
- ✅ Should sync immediately when online
- ✅ Should queue operations when offline
- ✅ Should process queue when coming online
- ✅ Should handle sync failures with retry
- ✅ Should respect retry limits

// NetworkStatusBar.test.tsx
- ✅ Should show "Online" with green color
- ✅ Should show "Offline" with orange color
- ✅ Should show sync progress when syncing
- ✅ Should display pending changes count
- ✅ Should trigger manual sync on button press
- ✅ Accessibility: Screen reader announcements

// OfflineContext.test.tsx
- ✅ Should provide network status to children
- ✅ Should check pending syncs periodically
- ✅ Should cleanup intervals on unmount
```

#### 1.2 AI Coach UI Components
**Files to create:**
- `src/screens/main/__tests__/CoachScreen.test.tsx`
- `src/components/coach/__tests__/MessageBubble.test.tsx`
- `src/components/coach/__tests__/MessageInput.test.tsx`
- `src/components/coach/__tests__/CoachHeader.test.tsx`
- `src/components/coach/__tests__/CoachSettings.test.tsx`

**Test scenarios:**
```typescript
// CoachScreen.test.tsx
- ✅ Should load conversation history on mount
- ✅ Should display crisis resources for keywords
- ✅ Should enforce daily message limits
- ✅ Should handle keyboard appearance
- ✅ Should scroll to bottom on new message
- ✅ Integration: Full conversation flow

// MessageBubble.test.tsx
- ✅ Should display user/assistant messages differently
- ✅ Should show tone indicators (color coding)
- ✅ Should format timestamps correctly
- ✅ Should handle long messages with proper wrapping
- ✅ Accessibility: VoiceOver/TalkBack support

// MessageInput.test.tsx
- ✅ Should disable when at daily limit
- ✅ Should show character count warning
- ✅ Should clear after sending
- ✅ Should handle multiline input
- ✅ Should disable send for empty messages
```

### Phase 2: UI Integration Tests (Medium Priority)

#### 2.1 Job Tracker Components
**Files to create:**
- `src/screens/main/__tests__/TrackerScreen.test.tsx`
- `src/components/tracker/__tests__/KanbanBoard.test.tsx`
- `src/components/tracker/__tests__/JobApplicationModal.test.tsx`
- `src/components/tracker/__tests__/SearchFilterBar.test.tsx`

**Test scenarios:**
```typescript
// TrackerScreen.test.tsx
- ✅ Should load applications on mount
- ✅ Should filter by search query
- ✅ Should filter by status
- ✅ Should open modal on FAB press
- ✅ Should refresh on pull-to-refresh
- ✅ Integration: Add → Edit → Delete flow

// KanbanBoard.test.tsx
- ✅ Should render three columns
- ✅ Should group applications by status
- ✅ Should handle drag gesture start
- ✅ Should animate card during drag
- ✅ Should update status on drop
- ✅ Should scroll to column on drop
- ✅ Accessibility: Announce status changes

// JobApplicationModal.test.tsx
- ✅ Should validate required fields
- ✅ Should handle date picker
- ✅ Should save with correct data
- ✅ Should show delete confirmation
- ✅ Should handle keyboard avoiding
```

### Phase 3: End-to-End Tests (High Priority)

#### 3.1 Critical User Journeys
**Files to create:**
- `e2e/bounceplan.e2e.test.ts`
- `e2e/coach.e2e.test.ts`
- `e2e/jobtracker.e2e.test.ts`
- `e2e/offline.e2e.test.ts`

**Test scenarios:**
```typescript
// bounceplan.e2e.test.ts
- ✅ New user onboarding → First task completion
- ✅ Complete task → Sync → Verify in database
- ✅ Work offline → Complete tasks → Go online → Verify sync

// coach.e2e.test.ts
- ✅ First conversation with tone detection
- ✅ Crisis keyword → Resource display
- ✅ Hit daily limit → Disable input
- ✅ Settings → Enable cloud sync → Verify

// jobtracker.e2e.test.ts
- ✅ Add application → Drag to interview → Verify
- ✅ Search and filter applications
- ✅ Edit application → Add notes → Save

// offline.e2e.test.ts
- ✅ Go offline → Make changes → Queue visible
- ✅ Come online → Auto-sync → Queue cleared
- ✅ Sync failure → Retry → Success
```

### Phase 4: Performance & Accessibility Tests

#### 4.1 Performance Tests
**Files to create:**
- `src/__tests__/performance/render.perf.test.ts`
- `src/__tests__/performance/sync.perf.test.ts`

**Metrics to test:**
- Screen render time < 16ms (60fps)
- Sync operation < 3s for 100 items
- Memory usage < 200MB
- Bundle size impact per feature

#### 4.2 Accessibility Tests
**Files to create:**
- `src/__tests__/accessibility/navigation.a11y.test.ts`
- `src/__tests__/accessibility/forms.a11y.test.ts`

**Requirements to test:**
- All interactive elements have labels
- Color contrast ratios meet WCAG 2.1 AA
- Touch targets >= 48x48dp
- Screen reader navigation works
- Keyboard navigation (external keyboard)

## Implementation Strategy

### Week 1: Critical Path Tests
- Day 1-2: Network/Offline hooks and context
- Day 3-4: AI Coach UI components
- Day 5: Integration tests for both features

### Week 2: UI Integration & E2E
- Day 1-2: Job Tracker component tests
- Day 3-4: E2E test setup and critical journeys
- Day 5: Performance and accessibility tests

### Test Writing Guidelines

1. **Follow TDD Approach:**
   ```typescript
   // 1. Write failing test first
   it('should show offline status when disconnected', () => {
     const { getByText } = render(<NetworkStatusBar />);
     expect(getByText('Offline')).toBeTruthy();
   });
   
   // 2. Implement minimum code to pass
   // 3. Refactor and improve
   ```

2. **Use Test Builders:**
   ```typescript
   const mockApplication = buildJobApplication({
     status: 'interviewing',
     company: 'Test Corp'
   });
   ```

3. **Mock at Service Boundaries:**
   ```typescript
   jest.mock('@services/api/supabase');
   jest.mock('@react-native-community/netinfo');
   ```

4. **Test User Behavior, Not Implementation:**
   ```typescript
   // ❌ Bad
   expect(component.state.isLoading).toBe(true);
   
   // ✅ Good
   expect(getByTestId('loading-indicator')).toBeTruthy();
   ```

## Success Criteria

- [ ] All test files created and passing
- [ ] Code coverage >= 80% for each feature
- [ ] E2E tests cover critical user journeys
- [ ] Performance benchmarks met
- [ ] Accessibility tests passing
- [ ] CI pipeline runs all tests

## Testing Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific feature tests
npm test -- --testPathPattern=coach
npm test -- --testPathPattern=tracker
npm test -- --testPathPattern=offline

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm test -- --testPathPattern=a11y

# Run performance tests
npm test -- --testPathPattern=perf
```

## Next Steps

1. **Immediate Action**: Start with Phase 1 critical path tests
2. **Review**: Update this plan after Phase 1 completion
3. **Iterate**: Adjust priorities based on user feedback
4. **Maintain**: Add tests for all new features going forward

## Notes

- Tests should consider stressed users (larger touch targets, clear error messages)
- All async operations should have loading states tested
- Error scenarios should provide helpful recovery options
- Offline functionality is critical - test thoroughly
- Follow empathy-driven testing from CLAUDE.md