# Phase 4: Polish & Sustainability Implementation Plan

## Current Status (Start of Phase 4)
- **Tests Passing**: 1,078 (from Phase 3)
- **Test Files**: ~98 total
- **Coverage**: Estimated ~65-70%
- **Target**: 80% coverage with TDD practices

## Phase 4 Goals
1. **Fill Coverage Gaps**: Reach 80% overall coverage
2. **Fix Failing Tests**: Resolve remaining test issues
3. **Add Integration Tests**: Cover critical user flows
4. **Establish TDD**: Set up tools and processes
5. **CI/CD Integration**: Enforce quality gates

## Day 1-3: Fill Remaining Gaps

### Priority 1: Fix Failing Tests
- [ ] OfflineQueueViewer test - Fix syncManager mocking
- [ ] Other failing tests from Phase 3
- [ ] Address any flaky tests

### Priority 2: Complete Component Coverage
**Common Components** (remaining):
- [ ] AccessibleTouchable
- [ ] Badge
- [ ] Fix Checkbox tests
- [ ] Card
- [ ] Divider
- [ ] ErrorBoundary
- [ ] IconButton
- [ ] Input
- [ ] Modal
- [ ] SafeAreaContainer
- [ ] SegmentedControl
- [ ] Switch
- [ ] TextLink
- [ ] Toast

**Feature Components** (high priority):
- [ ] ActiveTaskCard
- [ ] TaskCompletionCard
- [ ] WeekendCard
- [ ] WeeklyProgressDots
- [ ] JobApplicationModal
- [ ] KanbanBoard
- [ ] SearchFilterBar

### Priority 3: Screen Tests
**Critical Screens**:
- [ ] HomeScreen (main navigation hub)
- [ ] TaskDetailScreen (bounce plan core)
- [ ] BudgetCalculatorScreen (financial safety)
- [ ] CoachScreen (AI interaction)
- [ ] JobTrackerScreen (job search)

### Priority 4: Integration Tests
**Critical User Flows**:
- [ ] Onboarding → First Task
- [ ] Task Completion → Progress Update
- [ ] Offline → Online Sync
- [ ] Crisis Keyword → Resource Display
- [ ] Budget Entry → Runway Calculation

## Day 4-5: TDD & CI/CD Setup

### TDD Enablement
1. **Package.json Scripts**:
```json
{
  "scripts": {
    "test:tdd": "jest --watch --coverage",
    "test:changed": "jest -o",
    "test:related": "jest --bail --findRelatedTests",
    "test:coverage": "jest --coverage --coverageReporters=text-summary",
    "test:coverage:detailed": "jest --coverage",
    "precommit": "npm run test:related"
  }
}
```

2. **Pre-commit Hooks** (using husky):
```bash
npm install --save-dev husky lint-staged
npx husky init
```

3. **Coverage Thresholds** in jest.config.js:
```javascript
coverageThreshold: {
  global: {
    branches: 75,
    functions: 75,
    lines: 80,
    statements: 80
  },
  './src/services/emergency/': {
    branches: 95,
    functions: 95,
    lines: 100,
    statements: 100
  },
  './src/services/security/': {
    branches: 95,
    functions: 95,
    lines: 100,
    statements: 100
  }
}
```

### CI/CD Configuration
1. **GitHub Actions** workflow for tests
2. **Coverage reporting** to PR comments
3. **Block merge** if coverage drops
4. **Performance benchmarks** for test execution

### Test Templates
Create reusable templates for:
- Component tests
- Screen tests with navigation
- Store tests with state management
- Service tests with API mocking
- Integration tests

## Success Metrics
- [ ] 80% overall coverage achieved
- [ ] All tests passing (0 failures)
- [ ] Test execution < 10 minutes
- [ ] Pre-commit hooks working
- [ ] CI/CD pipeline configured
- [ ] TDD documentation complete

## Quick Wins for Coverage
1. **Snapshot tests** for stable UI components
2. **Error boundary tests** for all screens
3. **Accessibility tests** for interactive elements
4. **Loading/error states** for async components
5. **Edge cases** in utility functions

## Risk Mitigation
- **Flaky tests**: Use proper async handling
- **Slow tests**: Parallelize execution
- **Mock complexity**: Create shared mock utilities
- **Coverage gaming**: Focus on meaningful tests

## Next Actions
1. Fix OfflineQueueViewer test mocking
2. Run coverage report to identify biggest gaps
3. Tackle high-value components first
4. Set up husky for pre-commit hooks