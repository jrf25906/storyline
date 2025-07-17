# Systematic Test Improvement Plan

## Executive Summary
Current test coverage: **54%** → Target: **80%**  
Failing tests: **140** → Target: **0**  
Timeline: **4 weeks** with phased approach

## 🎯 Strategic Goals
1. **Fix infrastructure blockers** preventing tests from running
2. **Achieve 80% coverage** with focus on critical paths
3. **Establish TDD culture** moving forward
4. **Ensure safety-critical features** have 100% coverage

## 📊 Current State Analysis
- **Root Blocker**: React Native device info mocking issue affecting 140 tests
- **Coverage Gaps**: 
  - 0% coverage: Onboarding (6 screens), Navigation (9/10 components)
  - <50% coverage: Screens (21/30), Components (29/67)
  - Partial coverage: Services, Stores (mocking issues)
- **Critical Missing Tests**: Crisis intervention, offline sync, data encryption

## 🚀 Phase 1: Unblock Infrastructure (Week 1)
**Goal**: Fix all infrastructure issues to enable test execution

### Day 1-2: Fix React Native Mocking
```bash
# Priority 1: Fix device info mocking
# Update jest.setup.js to properly mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  default: {
    getConstants: () => ({
      deviceId: 'test-device-id',
      bundleId: 'com.nextchapter.app',
    }),
    // Add other required methods
  },
}));
```

### Day 3-4: Fix Async/Timing Issues
- Add proper `waitFor` wrappers in all async tests
- Configure fake timers in jest.setup.js
- Create test utilities for common async patterns

### Day 5: Verify All Tests Run
- Run full test suite
- Document any remaining blockers
- Update mock helpers as needed

**Deliverables**:
- ✅ All 140 failing tests now execute (pass or fail meaningfully)
- ✅ Updated jest.setup.js with comprehensive mocks
- ✅ Test execution time < 5 minutes

## 🏗️ Phase 2: Critical Path Coverage (Week 2)
**Goal**: Add tests for safety-critical and core user journeys

### Priority Order (MoSCoW):
**MUST HAVE (Days 1-3)**:
1. **Crisis Intervention Flow** (100% coverage required)
   - EmergencyResourcesCard tests
   - Crisis keyword detection in AI coach
   - Resource display logic

2. **Data Security** (100% coverage required)
   - Encryption/decryption in storageService
   - Secure storage operations
   - API key handling

3. **Offline Functionality**
   - Sync queue management
   - Conflict resolution
   - Offline state handling

**SHOULD HAVE (Days 4-5)**:
4. **Onboarding Flow** (E2E)
   - Welcome → Personal Info → Layoff Details → Complete
   - Data persistence across screens
   - Validation and error handling

5. **Core Features**:
   - Bounce Plan task completion
   - Budget calculation accuracy
   - AI Coach tone switching

### Implementation Strategy
```typescript
// Example: Crisis intervention test structure
describe('Crisis Intervention', () => {
  describe('Keyword Detection', () => {
    it('should detect crisis keywords and show resources', async () => {
      // Test each trigger word
    });
  });
  
  describe('Resource Display', () => {
    it('should prominently display emergency resources', () => {
      // Verify UI placement and accessibility
    });
  });
});
```

**Deliverables**:
- ✅ 100% coverage on safety-critical features
- ✅ E2E test for complete onboarding flow
- ✅ Integration tests for offline sync

## 🔧 Phase 3: Systematic Coverage Expansion (Week 3)
**Goal**: Methodically increase coverage to 80%

### Approach: Bottom-up Testing
1. **Components First** (Days 1-2)
   - Add basic render tests for all 29 untested components
   - Focus on user interaction and accessibility
   - Use snapshot tests for stable components

2. **Screens Next** (Days 3-4)
   - Test screen rendering and navigation
   - Mock store interactions
   - Verify loading/error states

3. **Integration Tests** (Day 5)
   - Screen + Store integration
   - Navigation flows
   - API integration with mocked responses

### Efficiency Tactics
```bash
# Generate boilerplate tests quickly
npm run generate-test -- --component Button
npm run generate-test -- --screen OnboardingScreen
```

```typescript
// Reusable test patterns
const renderWithProviders = (component, options = {}) => {
  return render(
    <NavigationContainer>
      <SafeAreaProvider>
        {component}
      </SafeAreaProvider>
    </NavigationContainer>,
    options
  );
};
```

**Deliverables**:
- ✅ All components have at least render tests
- ✅ All screens have basic coverage
- ✅ Coverage reaches 75%+

## 🎪 Phase 4: Polish & Sustainability (Week 4)
**Goal**: Reach 80% coverage and establish TDD practices

### Days 1-3: Fill Remaining Gaps
- Focus on complex business logic
- Add edge case coverage
- Performance test critical paths

### Days 4-5: Documentation & Process
- Update testing guidelines
- Create test templates
- Set up pre-commit hooks for test execution
- Configure CI/CD to enforce coverage

### TDD Enablement
```json
// package.json additions
{
  "scripts": {
    "test:tdd": "jest --watch --coverage",
    "test:changed": "jest -o",
    "precommit": "jest --bail --findRelatedTests"
  }
}
```

**Deliverables**:
- ✅ 80% overall test coverage achieved
- ✅ TDD workflow documented and tooling in place
- ✅ CI/CD enforces coverage requirements

## 📈 Success Metrics
| Metric | Current | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|---------|---------|---------|---------|---------|
| Tests Passing | 0 | 140+ | 200+ | 350+ | 500+ |
| Coverage | 54% | 54% | 65% | 75% | 80% |
| Safety Features | Partial | Partial | 100% | 100% | 100% |
| CI Build Time | N/A | <5min | <7min | <10min | <10min |

## 🛠️ Quick Win Opportunities
1. **Fix React Native mock** (unblocks 140 tests immediately)
2. **Add render tests** (quick coverage gains)
3. **Use snapshot testing** for stable UI components
4. **Parallelize test execution** in CI
5. **Share test utilities** across test files

## 🚧 Risk Mitigation
- **Risk**: Fixing mocks breaks other tests
  - **Mitigation**: Incremental fixes with regression checks
  
- **Risk**: Test execution becomes too slow
  - **Mitigation**: Parallel execution, selective test runs
  
- **Risk**: Flaky tests from async operations
  - **Mitigation**: Proper waitFor usage, deterministic mocks

## 🎯 Daily Execution Checklist
- [ ] Morning: Run test suite, identify blockers
- [ ] Focus: Work on highest priority uncovered code
- [ ] TDD: Write failing test first for new features
- [ ] Review: Check coverage report before commits
- [ ] Document: Update test patterns/utilities as discovered

## 📚 Resources & References
- Testing Documentation: `/docs/technical/TYPESCRIPT_PATTERNS.md`
- Mock Helpers: `/src/test-utils/mockHelpers.ts`
- Test Examples: `/src/components/common/__tests__/`
- Coverage Reports: `npm run test:coverage`
- TDD Guide: See CLAUDE.md testing section

## 🏁 Definition of Done
- [ ] All tests pass locally and in CI
- [ ] 80% code coverage achieved
- [ ] Safety-critical features have 100% coverage
- [ ] TDD practices documented and adopted
- [ ] Test execution time < 10 minutes
- [ ] Pre-commit hooks enforce test quality
- [ ] Team trained on TDD workflow

---

**Remember**: Every bug found in testing is a crisis prevented for a vulnerable user. Test with empathy.