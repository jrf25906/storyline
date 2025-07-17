# Integration Tests

This directory contains integration tests that verify critical user flows and component interactions in the Next Chapter app.

## Test Categories

### Critical User Flows
1. **Onboarding Flow** - User registration → First task setup
2. **Task Management** - Task completion → Progress updates → Celebrations
3. **Offline Sync** - Offline actions → Online synchronization
4. **Crisis Support** - Crisis keyword detection → Resource display
5. **Budget Management** - Budget entry → Runway calculations → Warnings

### Component Integration
- Screen + Navigation interactions
- Store + Service integrations
- Context + Hook interactions
- Animation + Accessibility combinations

## Test Structure

Each integration test follows this pattern:
1. **Setup** - Mock dependencies and initial state
2. **User Actions** - Simulate real user interactions
3. **Assertions** - Verify expected outcomes and side effects
4. **Cleanup** - Reset state for next test

## Running Integration Tests

```bash
# Run all integration tests
npm test -- --testPathPattern="integration"

# Run specific flow
npm test -- --testPathPattern="onboarding-flow"
```