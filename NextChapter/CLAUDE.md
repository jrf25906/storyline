# Next Chapter - React Native Layoff Recovery App

## Project Overview
Mobile app helping recently laid-off professionals regain stability and secure their next role within 90 days. Combines a structured 30-day Bounce Plan, AI coaching with adaptive tone switching, budget tracking, and job search management tools.

**North-star outcome:** 50% of active users report securing at least one interview within 30 days of onboarding.

## Core Features
- **30-Day Bounce Plan**: Daily 10-minute structured tasks with progressive disclosure
- **AI Coach**: Adaptive tone switching (Hype, Pragmatist, Tough-Love) based on emotional cues
- **Budget Tracker**: Financial runway calculator with unemployment benefits integration
- **Job Application Tracker**: Kanban-style pipeline management
- **Resume Scanner**: Keyword matching and AI-assisted rewriting
- **Mood Tracking**: Daily emotional check-ins with trend analysis
- **Peer Connect**: Optional industry/location-based networking (MVP: 1 match/month)

## Tech Stack
- **Framework**: React Native 0.72+ with Expo SDK 49
- **Language**: TypeScript 5.2 (strict mode enabled)
- **State Management**: Zustand for app state, React Query for server state
- **Navigation**: React Navigation v6 (stack + tab navigators)
- **AI Integration**: OpenAI GPT-4o API with custom prompt engineering
- **Database**: Supabase (PostgreSQL) for cloud sync, WatermelonDB for offline storage
- **Authentication**: Supabase Auth with biometric support
- **Backend**: Node.js + Express on Vercel Edge Functions
- **Push Notifications**: Expo Push API with daily task reminders

## Project Structure
```
src/
├── screens/           # Screen components organized by feature
│   ├── onboarding/    # Wizard, initial setup
│   ├── bounce-plan/   # Daily tasks, progress tracking
│   ├── coach/         # AI chat interface
│   ├── tracker/       # Job application management
│   └── budget/        # Financial planning tools
├── components/        # Reusable UI components
│   ├── common/        # Generic components (buttons, inputs)
│   └── feature/       # Feature-specific components
├── services/          # API clients and external integrations
│   ├── ai/            # OpenAI API client and prompt templates
│   ├── supabase/      # Database operations
│   └── notifications/ # Push notification handling
├── stores/            # Zustand state management
├── hooks/             # Custom React hooks
├── utils/             # Helper functions and constants
├── navigation/        # Navigation configuration and types
├── theme/             # Design system tokens and styling
└── types/             # TypeScript type definitions
```

## Commands
- `npm start`: Start Expo development server
- `npm run ios`: Launch iOS simulator
- `npm run android`: Launch Android emulator
- `npm test`: Run Jest unit tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage report
- `npm run test:e2e`: Run Detox end-to-end tests
- `npm run lint`: ESLint with React Native config
- `npm run typecheck`: TypeScript validation
- `eas build --platform ios`: Create iOS build
- `eas build --platform android`: Create Android build
- `npm run coach:test`: Test AI coach prompt templates

## Code Style & Conventions
- **TypeScript**: Strict mode enabled, no implicit any allowed
- **Components**: Functional components with hooks only, no class components
- **Props**: Interfaces named as `ComponentNameProps`
- **Styles**: Separate `styles.ts` files using StyleSheet.create, no inline styles except dynamic values
- **Platform-specific**: Use `.ios.tsx` and `.android.tsx` extensions when needed
- **Storage**: Async storage keys prefixed with `@next_chapter/`
- **Error Boundaries**: Required wrapper for all screen components
- **Accessibility**: Required props on all interactive elements, WCAG 2.1 AA compliance
- **File naming**: camelCase for components, kebab-case for utilities

## SOLID Principles & Best Practices

### Single Responsibility Principle (SRP)
- **Components**: Each component should have one clear purpose
- **Functions**: Keep functions focused on a single task
- **Services**: Separate API calls, data transformation, and business logic
- **Example**: Don't mix data fetching, state management, and UI in one component

### Open/Closed Principle (OCP)
- **Extensibility**: Use composition over modification
- **Configuration**: Use constants and configuration files for feature flags
- **Hooks**: Create custom hooks for reusable logic
- **Example**: Use strategy pattern for AI coach tone switching

### Liskov Substitution Principle (LSP)
- **Type Safety**: Ensure derived types can replace base types
- **Props**: Use consistent prop interfaces across similar components
- **Example**: All screen components must work with navigation props

### Interface Segregation Principle (ISP)
- **Props**: Don't force components to accept props they don't use
- **Types**: Create specific interfaces rather than large generic ones
- **Example**: Separate read-only vs editable component props

### Dependency Inversion Principle (DIP)
- **Services**: Depend on abstractions (interfaces) not concrete implementations
- **Context**: Use context providers for dependency injection
- **Testing**: Mock dependencies at the interface level
- **Example**: Database operations should use repository pattern

### DRY (Don't Repeat Yourself)
- **Constants**: Extract magic numbers and strings to constants
- **Utilities**: Create shared utility functions in `/utils`
- **Components**: Build reusable components in `/components/common`
- **Hooks**: Extract repeated logic into custom hooks
- **Types**: Define shared types in `/types`
- **Validation**: Centralize validation logic

### Code Organization Patterns
```typescript
// ❌ Bad: Mixed concerns
const TaskCard = () => {
  const [data, setData] = useState();
  
  useEffect(() => {
    // Direct API call in component
    fetch('/api/tasks').then(res => res.json()).then(setData);
  }, []);
  
  return <View style={{padding: 20}}>...</View>;
};

// ✅ Good: Separated concerns
// hooks/useTaskData.ts
const useTaskData = (taskId: string) => {
  const [data, setData] = useState<Task>();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    taskService.getTask(taskId).then(setData).finally(() => setLoading(false));
  }, [taskId]);
  
  return { data, loading };
};

// components/TaskCard.tsx
const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <TaskContent task={task} />
    </TouchableOpacity>
  );
};

// styles.ts
const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
});
```

## Security Requirements
- **API Keys**: Never store raw keys - use react-native-keychain for tokens
- **Data Encryption**: All sensitive data encrypted at rest using CryptoJS
- **Financial Data**: SHA256 hashed client-side, never passed to LLM
- **Authentication**: Biometric auth for app access, additional PIN for financial features
- **PII Handling**: GDPR/CCPA compliant with one-tap data deletion
- **Coach Conversations**: Local storage only by default, opt-in cloud sync with encryption
- **Row-level Security**: Enabled on all Supabase tables

## AI Coach Implementation
### Tone System
- **Hype**: "You've got this. Let's turn the corner—today's win:..."
- **Pragmatist**: "Here's a step-by-step plan to get clarity. Start with..."
- **Tough-Love**: "Let's be real: what you've tried isn't working. Try this next."

### Emotional Triggers
- **Hype Triggers**: "hopeless", "lost", "worthless", "failure", "burnt out"
- **Tough-Love Triggers**: "lazy", "they screwed me", "no one will hire me", "this is rigged"
- **Default Fallback**: Pragmatist tone when emotion not detected

### Technical Requirements
- Response time: <5s P90
- Rate limiting: 10 messages/day free tier, unlimited for Pro
- Token management: Max 4000 tokens per exchange
- Content moderation: OpenAI moderation API on input/output
- Conversation retention: 90 days default, user-deletable
- Offline behavior: Read-only with cached common Q&A

## Offline-First Architecture
### Cached Data
- Bounce Plan tasks and completion status
- Coach conversation history (last 25 messages)
- Job application tracker entries
- Budget and mood data
- Resume draft text

### Sync Strategy
- **Bounce Plan**: One-way push on reconnect
- **Applications**: Conflict resolution on timestamp (last-write-wins)
- **Coach History**: Merge with conflict alerts
- **Financial Data**: Client-side encryption before sync

### Storage Limits
- Soft limit: 20MB (warning to user)
- Hard limit: 25MB (disable new entries until sync)

## Testing Requirements

### Test-Driven Development (TDD)
- **Write tests first**: Create failing tests before implementing features
- **Red-Green-Refactor**: Write test → Make it pass → Improve code
- **Test coverage**: Minimum 80% for all new code
- **No merge without tests**: Every PR must include relevant tests

### Test Structure
```
src/
├── components/
│   └── feature/
│       └── bounce-plan/
│           ├── TaskCard.tsx
│           ├── TaskCard.styles.ts
│           └── __tests__/
│               └── TaskCard.test.tsx
├── services/
│   └── database/
│       ├── bouncePlan.ts
│       └── __tests__/
│           └── bouncePlan.test.ts
└── stores/
    ├── bouncePlanStore.ts
    └── __tests__/
        └── bouncePlanStore.test.ts
```

### Test Categories
1. **Unit Tests** (Jest + React Native Testing Library)
   - Components: UI rendering, user interactions
   - Stores: State management logic
   - Services: API calls, data transformations
   - Utils: Pure functions, helpers
   - Coverage: Minimum 80%

2. **Integration Tests**
   - Screen components with navigation
   - Store + Service interactions
   - Offline/online sync scenarios
   - Coverage: Critical user flows

3. **E2E Tests** (Detox)
   - Onboarding flow
   - Core features (Bounce Plan, Coach, Job Tracker)
   - Offline functionality
   - Coverage: Happy paths + critical edge cases

4. **Accessibility Tests**
   - Screen reader compatibility
   - Keyboard navigation
   - Touch target sizes
   - Color contrast ratios

5. **Performance Tests**
   - Cold start: <3s
   - Screen transitions: 60fps
   - Memory usage: <200MB
   - Bundle size: Monitor with each PR

### Testing Best Practices
```typescript
// ❌ Bad: Testing implementation details
it('should set state to loading', () => {
  const { result } = renderHook(() => useTaskData());
  expect(result.current.loading).toBe(true);
});

// ✅ Good: Testing behavior
it('should display loading indicator while fetching tasks', () => {
  const { getByTestId } = render(<TaskList />);
  expect(getByTestId('loading-indicator')).toBeTruthy();
});

// ❌ Bad: Brittle selectors
const button = getByText('Submit');

// ✅ Good: Accessible queries
const button = getByRole('button', { name: 'Submit task' });

// ❌ Bad: No test isolation
it('should complete task', () => {
  // Relies on previous test state
  expect(completedTasks.length).toBe(2);
});

// ✅ Good: Isolated tests
it('should complete task', () => {
  const { completeTask } = setup();
  completeTask('task-1');
  expect(getCompletedTasks()).toContain('task-1');
});
```

### Mock Strategy
- **External services**: Mock at service boundary
- **Navigation**: Use mock navigation prop
- **Storage**: Mock AsyncStorage
- **Network**: Mock fetch/axios at adapter level
- **Time**: Use jest.useFakeTimers() for time-based features

### Test Data Builders
```typescript
// test-utils/builders.ts
export const buildTask = (overrides?: Partial<Task>): Task => ({
  id: 'task-1',
  title: 'Default Task',
  completed: false,
  ...overrides,
});

// Usage in tests
const completedTask = buildTask({ completed: true });
```

### Continuous Testing
- **Pre-commit**: Run related tests via husky
- **CI Pipeline**: Full test suite on every PR
- **Nightly**: E2E tests on staging builds
- **Coverage reports**: Block PRs below 80%

### AI-Specific Testing
- **Prompt validation**: Test all coach tone templates
- **Response quality**: Verify appropriate tone selection
- **Content moderation**: Test inappropriate content filtering
- **Rate limiting**: Verify API call limits
- **Fallback behavior**: Test offline coach responses
- **Accuracy target**: ≥85% tone detection accuracy

## Business Logic Rules
### Bounce Plan
- Tasks unlock daily at 9am local time
- Users can revisit/redo previous tasks, cannot skip ahead
- Weekends pre-skipped by default
- 30-day plan adjusts based on onboarding inputs (layoff date, elapsed time)

### Coach Behavior
- System prompts switch based on detected emotional state
- Financial data never included in AI prompts
- Professional boundary enforcement (no personal relationship advice)
- Crisis intervention: Detect distress keywords, surface mental health resources

### Budget Calculator
- Real-time runway recalculation on input changes
- State-specific unemployment benefit estimation
- COBRA cost lookup integration
- Alert threshold: <60 days runway

### Application Tracker
- Drag-and-drop between stages: Applied → Interviewing → Offer
- Auto-timestamps on status changes
- Notes field for each application
- Integration with resume scanner for keyword optimization

## User Experience Principles
### Stress-Friendly Design
- Larger touch targets (minimum 48x48dp)
- High-contrast dark/light modes
- Reduced cognitive load mode for overwhelmed users
- Calming copy, avoid red alerts unless critical
- Progressive disclosure: Advanced features unlock after basic setup

### Emotional Support
- Empathetic error messages
- Celebration of small wins
- Non-judgmental language throughout
- Crisis resources easily accessible
- Privacy-first messaging

## Analytics & Monitoring
### Key Events
- `user_signed_up`: Track onboarding completion
- `task_completed`: Bounce plan engagement with skip tracking
- `coach_message_sent`: Usage patterns and tone effectiveness
- `resume_uploaded`: Feature adoption
- `application_added`: Job search activity
- `mood_logged`: Emotional trend tracking
- `budget_saved`: Financial planning engagement

### Success Metrics
- Day-2 activation: ≥60%
- Task adherence: ≥17 tasks completed per 30 days
- Interview progress: ≥25% log interview within 60 days
- Coach satisfaction: ≥4.2/5 rating
- Free to Pro conversion: ≥5% within 30 days

## Do Not
- Store sensitive financial data in AsyncStorage without encryption
- Make direct API calls from components (use service layer)
- Implement custom navigation solutions outside React Navigation
- Bypass error boundaries for critical user flows
- Include personal financial data in AI prompts
- Use inline styles except for dynamic values
- Share user data without explicit consent
- Display red error states for non-critical issues
- Implement complex gamification that could feel manipulative

## TypeScript Patterns & Testing
For detailed TypeScript patterns, mock helpers, and testing best practices, see:
- [TypeScript Patterns Documentation](./docs/TYPESCRIPT_PATTERNS.md)
- Mock helpers: `src/test-utils/mockHelpers.ts`
- Type guards: `src/utils/typeGuards.ts`

Key patterns:
- Use `createMockStore` for Zustand store mocking
- Use `NETWORK_STATES` for network state mocking
- Use `getErrorMessage` for error handling
- Follow TDD: Write tests first, fix tests to match implementation

## Feature Flags & Rollouts
- Coach tone switching: Gradual rollout with A/B testing
- Resume scanner: Limited beta (accuracy validation)
- Peer Connect: Invite-only initial rollout
- Budget analytics: Pro tier feature gate

## Crisis Intervention Protocol
- Keywords trigger mental health resource display
- National suicide prevention hotline prominent placement
- Local crisis center contact integration
- Coach trained to de-escalate and redirect to professional help
- Never attempt to provide therapy or medical advice

## Design System Implementation Status

### "Grounded Optimism" Visual Language ✅
The app now fully implements the new design system (January 2025):
- **Theme**: Warm color palette with Deep Forest primary (#2D5A27)
- **Components**: All core components updated with new styling
- **Navigation**: Bottom tabs with 80px height and larger touch targets
- **Screens**: All major screens redesigned with emotional support in mind
- **Animations**: Calming, gentle transitions throughout
- **Accessibility**: Enhanced focus states and screen reader support

See `/docs/DESIGN_SYSTEM_IMPLEMENTATION.md` for full details.

## Recent Feature Completions (January 2025)

### ✅ Expo Package Installation
- Fixed react-native-linear-gradient compatibility
- Installed all required Expo packages
- App now works with Expo Go
- Resolved module resolution errors

### ✅ BudgetOverviewScreen Integration
- Connected to budgetStore for real-time financial data
- Implemented runway calculations and alerts
- Added pull-to-refresh functionality
- Created comprehensive test suite with 100% coverage

### ✅ Biometric Authentication
- Face ID/Touch ID support for iOS
- Fingerprint/Face Recognition for Android
- Secure storage with expo-secure-store
- Settings screen for management
- Automatic enrollment prompts
- Full test coverage including edge cases

### ✅ Email Verification Flow
- Auto-checking verification status every 5 seconds
- Resend functionality with 60-second cooldown
- Change email option with account reset
- Real-time status updates
- Comprehensive error handling
- Complete test suite with timer mocking

### ✅ Error Boundaries (Complete)
- Created reusable withErrorBoundary HOC
- Implemented stress-friendly error handling
- Updated all 25 screens
- Full test coverage with accessibility
- Empathetic error messaging
- Fixed reset functionality

### ✅ WatermelonDB Offline Storage
- Complete database schema implementation
- 9 models with relationships
- Offline-first sync strategies
- AES-256 encryption for financial data
- Storage limit management (20MB/25MB)
- Comprehensive test coverage

### ✅ App-wide Loading/Error States
- CalmingLoadingIndicator with breathing animations
- EmpathyErrorState with progressive disclosure
- Global state management with UIStore
- Network status detection and display
- Stress-friendly design throughout
- Full accessibility compliance

### ✅ E2E Tests with Detox
- 7 comprehensive test suites
- iOS and Android configurations
- CI/CD integration ready
- Performance benchmarks validation
- Crisis intervention testing
- Offline/sync scenario coverage
- EAS Build configuration for Expo managed workflow
- Fixed react-native-linear-gradient compatibility issue

### ✅ Offline Sync Testing
- 40+ comprehensive test scenarios
- All sync strategies validated
- Security requirements passed
- Performance within targets (~3.5s typical sync)
- Edge cases handled (network interruptions, conflicts)
- Production-ready implementation

## Development Workflows

### Daily Development Flow
1. Start with `claude` command in project directory
2. Use `/plan` to outline day's tasks with MoSCoW prioritization
3. Begin with failing tests (TDD approach)
4. Implement features incrementally with frequent commits
5. Use `think harder` for complex architectural decisions
6. Test on both iOS and Android simulators
7. Run accessibility audit for new UI components
8. End-of-day review with `/summary` and metric check

### Feature Implementation Workflow (TDD + SOLID)
**For all features, follow Test-Driven Development:**

1. **Requirements Analysis**
   - Break down user stories into testable requirements
   - Identify edge cases and error scenarios
   - Define acceptance criteria

2. **Test First (Red Phase)**
   ```typescript
   // Write failing tests first
   describe('TaskCard', () => {
     it('should display task title and description', () => {
       const task = buildTask({ title: 'Test Task' });
       const { getByText } = render(<TaskCard task={task} />);
       expect(getByText('Test Task')).toBeTruthy();
     });
   });
   ```

3. **Minimal Implementation (Green Phase)**
   - Write just enough code to make tests pass
   - Don't add features not required by tests
   - Keep it simple, don't optimize yet

4. **Refactor (Refactor Phase)**
   - Apply SOLID principles
   - Extract reusable components/hooks
   - Remove duplication (DRY)
   - Improve naming and structure

5. **Architecture Checklist**
   - [ ] **SRP**: Each module has one reason to change
   - [ ] **OCP**: New features extend, don't modify
   - [ ] **LSP**: Subtypes are substitutable
   - [ ] **ISP**: No unused dependencies
   - [ ] **DIP**: Depend on abstractions
   - [ ] **DRY**: No duplicated logic

6. **Integration & Testing**
   - Unit tests: 80% minimum coverage
   - Integration tests: Critical paths
   - Accessibility tests: WCAG 2.1 AA
   - Performance tests: Meets benchmarks

7. **Code Review Focus**
   - SOLID compliance
   - Test coverage and quality
   - Accessibility requirements
   - Security best practices
   - Performance impact

8. **Documentation**
   - Update component documentation
   - Add usage examples
   - Document any design decisions

### Example: Implementing a New Feature
```typescript
// 1. Start with the test
// __tests__/NotificationBadge.test.tsx
describe('NotificationBadge', () => {
  it('should display count when greater than 0', () => {
    const { getByText } = render(<NotificationBadge count={5} />);
    expect(getByText('5')).toBeTruthy();
  });
  
  it('should be hidden when count is 0', () => {
    const { queryByTestId } = render(<NotificationBadge count={0} />);
    expect(queryByTestId('notification-badge')).toBeNull();
  });
});

// 2. Create minimal implementation
// NotificationBadge.tsx
interface NotificationBadgeProps {
  count: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <View testID="notification-badge" style={styles.badge}>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
};

// 3. Refactor: Extract reusable logic
// hooks/useNotifications.ts (SRP)
export const useNotifications = () => {
  const { notifications } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  return { unreadCount };
};

// 4. Apply DRY: Create reusable Badge component
// components/common/Badge.tsx
interface BadgeProps {
  value: number | string;
  variant?: 'primary' | 'danger' | 'success';
  testID?: string;
}

export const Badge: React.FC<BadgeProps> = ({ value, variant = 'primary', testID }) => {
  if (!value || value === 0) return null;
  
  return (
    <View testID={testID} style={[styles.badge, styles[variant]]}>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
};

// 5. Final implementation using composition
export const NotificationBadge: React.FC = () => {
  const { unreadCount } = useNotifications();
  return <Badge value={unreadCount} variant="danger" testID="notification-badge" />;
};
```

### User Story Implementation
**Pattern: "As a [persona], I want [goal] so that [outcome]"**
1. **Story Analysis**: Break down acceptance criteria and edge cases
2. **Design Mockup**: Create stress-friendly UI that supports the user's emotional state
3. **Data Flow**: Map user inputs to state changes and API calls
4. **Error Scenarios**: Define helpful error messages and recovery paths
5. **Accessibility**: Ensure screen reader support and keyboard navigation
6. **Offline Behavior**: Implement graceful degradation when disconnected
7. **Testing**: Cover happy path, edge cases, and accessibility scenarios

### Crisis Response Workflow
**For urgent user-impacting issues:**
1. **Immediate**: Disable affected feature via feature flag
2. **Assess**: Determine user impact scope and severity
3. **Communicate**: Update status page and in-app messaging
4. **Fix**: Implement hotfix with accelerated testing
5. **Deploy**: Use gradual rollout with monitoring
6. **Post-mortem**: Document root cause and prevention measures

### AI Coach Development Workflow
**For prompt engineering and tone refinement:**
1. **Baseline**: Test current prompts against persona scenarios
2. **Iterate**: Modify system prompts for specific emotional triggers
3. **Validate**: Run moderated testing for tone accuracy (≥85% target)
4. **A/B Test**: Compare effectiveness with user feedback metrics
5. **Monitor**: Track conversation ratings and flag inappropriate responses
6. **Refine**: Adjust based on real user interactions and edge cases

### Testing Workflow
**Multi-layered approach for sensitive user data:**
1. **Unit Tests**: Business logic, utility functions, data transformations
2. **Component Tests**: UI behavior, accessibility, error states
3. **Integration Tests**: API interactions, state management, offline sync
4. **E2E Tests**: Critical user journeys (onboarding → first task → coach interaction)
5. **Security Tests**: Data encryption, authentication flows, PII handling
6. **Accessibility Tests**: Screen reader compatibility, keyboard navigation
7. **Performance Tests**: Memory usage, render times, offline behavior
8. **User Testing**: Moderated sessions with target persona representatives

### Code Review Workflow
**Empathy-driven review process:**
1. **AI Pre-review**: Automated checks for style, security vulnerabilities, accessibility
2. **Human Review**: Focus on user empathy, business logic, and architectural decisions
3. **Accessibility Check**: Verify screen reader support and stress-friendly UX
4. **Security Audit**: Validate encryption, data handling, and privacy compliance
5. **Performance Validation**: Check bundle size impact and runtime efficiency
6. **User Impact**: Consider emotional state of target users in design decisions

### Deployment Workflow
**Gradual rollout for sensitive user base:**
1. **Pre-flight**: Run full test suite including accessibility and security tests
2. **Staging**: Deploy to staging environment with production-like data
3. **Beta Testing**: Limited rollout to opt-in beta users (stress tolerance varies)
4. **Canary Release**: 5% traffic with enhanced monitoring
5. **Gradual Rollout**: Increase to 25%, 50%, 100% with rollback capability
6. **Post-deploy**: Monitor error rates, user feedback, and business metrics

### Offline-First Development Workflow
**Ensuring resilience for users in crisis:**
1. **Local-First**: Build features to work entirely offline initially
2. **Sync Layer**: Add cloud synchronization as enhancement
3. **Conflict Resolution**: Implement last-write-wins with user notification
4. **Degradation**: Ensure graceful behavior when storage limits hit
5. **Recovery**: Test data recovery scenarios and sync failure handling

### Progressive Enhancement Workflow
**Building resilience into features:**
1. **Core Layer**: Essential functionality that works offline
2. **Enhancement 1**: Cloud sync and backup when connected
3. **Enhancement 2**: AI features with fallback to static guidance
4. **Enhancement 3**: Advanced analytics with basic tracking fallback
5. **Enhancement 4**: Community features with solo alternatives

### Sprint Planning Workflow
**User-centered development cycles:**
1. **User Research Review**: Analyze recent feedback and usage patterns
2. **Persona Check**: Ensure upcoming work serves target user needs
3. **Risk Assessment**: Identify potential user stress points in planned features
4. **Accessibility Planning**: Allocate time for inclusive design
5. **Technical Debt**: Balance new features with stability improvements
6. **Crisis Preparedness**: Ensure team capacity for urgent user issues

### Quality Gates
**Before any release:**
- [ ] All critical user flows tested end-to-end
- [ ] Accessibility audit completed with WCAG 2.1 AA compliance
- [ ] Security review passed for data handling
- [ ] Performance benchmarks met (<3s cold start, 60fps)
- [ ] Crisis intervention features validated
- [ ] Offline behavior tested and documented
- [ ] Error messages reviewed for empathetic tone
- [ ] Analytics events implemented and tested

## Accessibility Implementation
- VoiceOver/TalkBack support on all interactive elements
- Dynamic type scaling support
- High-contrast mode compatibility  
- Keyboard navigation for external keyboard users
- Screen reader announcements for state changes
- Alternative text for all images and icons

This Claude.md file serves as the foundation for specialized development assistance. The app's mission is helping people through one of life's most stressful transitions—every technical decision should prioritize user wellbeing, privacy, and reliable functionality.