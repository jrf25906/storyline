# Next Chapter - Project Guidelines

## Project Overview
Mobile app helping recently laid-off professionals regain stability and secure their next role within 90 days. Combines a structured 30-day Bounce Plan, AI coaching with adaptive tone switching, budget tracking, and job search management tools.

**North-star outcome:** 50% of active users report securing at least one interview within 30 days of onboarding.

## Tech Stack
- **Framework**: React Native 0.72+ with Expo SDK 49
- **Language**: TypeScript 5.2 (strict mode enabled)
- **State Management**: Zustand for app state, React Query for server state
- **Navigation**: React Navigation v6 (stack + tab navigators)
- **Database**: Supabase (PostgreSQL) for cloud sync, WatermelonDB for offline storage
- **Authentication**: Supabase Auth with biometric support

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

### Open/Closed Principle (OCP)
- **Extensibility**: Use composition over modification
- **Configuration**: Use constants and configuration files for feature flags
- **Hooks**: Create custom hooks for reusable logic

### Liskov Substitution Principle (LSP)
- **Type Safety**: Ensure derived types can replace base types
- **Props**: Use consistent prop interfaces across similar components

### Interface Segregation Principle (ISP)
- **Props**: Don't force components to accept props they don't use
- **Types**: Create specific interfaces rather than large generic ones

### Dependency Inversion Principle (DIP)
- **Services**: Depend on abstractions (interfaces) not concrete implementations
- **Context**: Use context providers for dependency injection
- **Testing**: Mock dependencies at the interface level

### DRY (Don't Repeat Yourself)
- **Constants**: Extract magic numbers and strings to constants
- **Utilities**: Create shared utility functions in `/utils`
- **Components**: Build reusable components in `/components/common`
- **Hooks**: Extract repeated logic into custom hooks
- **Types**: Define shared types in `/types`
- **Validation**: Centralize validation logic

## Testing Requirements

### Mandatory Testing Rules
- **ALWAYS BUILD TESTS**: Every feature implementation MUST include comprehensive tests
- **Tests are non-negotiable**: No feature is complete without its test suite
- **Test before code**: Write failing tests first, then implement to make them pass
- **No exceptions**: Even small utilities and helpers require tests

### Test-Driven Development (TDD)
- **Write tests first**: Create failing tests before implementing features
- **Red-Green-Refactor**: Write test → Make it pass → Improve code
- **Test coverage**: Minimum 80% for all new code
- **No merge without tests**: Every PR must include relevant tests

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

3. **E2E Tests** (Detox)
   - Onboarding flow
   - Core features (Bounce Plan, Coach, Job Tracker)
   - Offline functionality

4. **Accessibility Tests**
   - Screen reader compatibility
   - Keyboard navigation
   - Touch target sizes
   - Color contrast ratios

## Security Requirements
- **API Keys**: Never store raw keys - use react-native-keychain for tokens
- **Data Encryption**: All sensitive data encrypted at rest using CryptoJS
- **Financial Data**: SHA256 hashed client-side, never passed to LLM
- **Authentication**: Biometric auth for app access, additional PIN for financial features
- **PII Handling**: GDPR/CCPA compliant with one-tap data deletion
- **Coach Conversations**: Local storage only by default, opt-in cloud sync with encryption

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

## Accessibility Implementation
- VoiceOver/TalkBack support on all interactive elements
- Dynamic type scaling support
- High-contrast mode compatibility  
- Keyboard navigation for external keyboard users
- Screen reader announcements for state changes
- Alternative text for all images and icons

## Documentation Requirements

### Mandatory Documentation Updates
- **ALWAYS UPDATE DOCS**: After completing any task, especially major feature additions, documentation MUST be updated
- **Keep docs current**: Documentation should reflect the actual state of the codebase
- **Document new features**: Every new feature requires corresponding documentation updates
- **Update existing docs**: When modifying existing features, update related documentation

### Documentation Types to Maintain
1. **Technical Documentation** (`/docs/technical/`)
   - Architecture changes
   - New service implementations
   - Database schema updates
   - API changes

2. **Feature Documentation** (`/docs/features/`)
   - User-facing feature descriptions
   - Feature requirements and specifications
   - Implementation summaries

3. **Development Documentation**
   - Setup guides
   - Testing procedures
   - Deployment processes
   - Troubleshooting guides

4. **README Files**
   - Component-level README files for complex features
   - Service-level documentation
   - Navigation structure updates

### Documentation Standards
- Use clear, concise language
- Include code examples where relevant
- Update version numbers and dates
- Cross-reference related documentation
- Include screenshots for UI changes

## Key Principle
This app's mission is helping people through one of life's most stressful transitions—every technical decision should prioritize user wellbeing, privacy, and reliable functionality.