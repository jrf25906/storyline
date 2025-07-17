# Next Chapter App Architecture

## Overview
Next Chapter is a React Native application built with Expo SDK that helps recently laid-off professionals navigate their career transition. The app combines structured daily tasks, AI coaching, budget tracking, and job search management.

## Tech Stack

### Core Technologies
- **Framework**: React Native 0.72+ with Expo SDK 49
- **Language**: TypeScript 5.2 (strict mode enabled)
- **State Management**: Zustand for app state, React Query for server state
- **Navigation**: React Navigation v6 (stack + tab navigators)
- **Database**: Supabase (PostgreSQL) for cloud sync, AsyncStorage for offline
- **AI Integration**: OpenAI GPT-4o API with custom prompt engineering
- **Styling**: Custom design system with theme tokens

## Architecture Layers

### 1. Presentation Layer (`/src/screens`)
Organized by feature area:
- **Onboarding**: Welcome flow and user profile setup
- **Bounce Plan**: Daily task management and progress tracking
- **Coach**: AI-powered career coaching with adaptive tones
- **Tracker**: Job application pipeline management
- **Budget**: Financial runway calculator and expense tracking

### 2. Navigation Layer (`/src/navigation`)
- **AppNavigator**: Root navigator with auth state handling
- **AuthStack**: Onboarding and authentication screens
- **MainTabs**: Bottom tab navigation for core features
- **Feature Stacks**: Nested navigators for each feature area

### 3. State Management (`/src/stores`)
Zustand stores with TypeScript and offline support:
- **userStore**: Authentication and profile management
- **bouncePlanStore**: Task progress and completion tracking
- **budgetStore**: Financial data and runway calculations
- **coachStore**: AI conversation history and preferences
- **jobApplicationStore**: Application pipeline state

### 4. Service Layer (`/src/services`)
- **Supabase Services**: Database operations with Row Level Security
- **AI Services**: OpenAI integration with tone detection
- **Security Services**: Encryption and secure credential management
- **Sync Services**: Offline-first data synchronization

### 5. UI Components (`/src/components`)
- **Common Components**: Reusable UI elements (Button, Input, Card, etc.)
- **Feature Components**: Feature-specific components
- **All components include**:
  - Full accessibility support
  - TypeScript typing
  - Theme integration
  - 48dp minimum touch targets

### 6. Design System (`/src/theme`)
- **Colors**: Primary, semantic, and dark mode palettes
- **Typography**: Font scales and text styles
- **Spacing**: 8pt grid system
- **Borders & Shadows**: Consistent elevation and radius
- **Motion**: Animation timings and easings

## Data Flow

```
User Interaction → Screen Component → Zustand Store → Supabase Service → Database
                                    ↓                ↓
                              AsyncStorage    Offline Queue
```

## Key Features

### Offline-First Architecture
- All data cached locally in AsyncStorage
- Optimistic updates for better UX
- Background sync when connection restored
- Conflict resolution with last-write-wins

### Security & Privacy
- Row Level Security on all database tables
- Client-side encryption for financial data
- Secure credential storage with react-native-keychain
- No financial data sent to AI services

### AI Coach Implementation
- Three tone modes: Hype, Pragmatist, Tough-Love
- Emotional trigger detection
- Rate limiting (10 messages/day free tier)
- Content moderation with OpenAI API
- Offline fallback responses

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader support (VoiceOver/TalkBack)
- Keyboard navigation
- High contrast mode support
- Dynamic type scaling

## Testing Strategy
- **Unit Tests**: Jest + React Native Testing Library
- **Integration Tests**: API and state management
- **E2E Tests**: Detox for critical user flows
- **Accessibility Tests**: Automated accessibility audits
- **AI Tests**: Tone detection accuracy (≥85% target)

## Performance Targets
- Cold start: <3s
- Screen transitions: 60fps
- Memory usage: <200MB
- Bundle size: Monitor with each PR
- Offline functionality: 100% core features

## Deployment
- **iOS**: EAS Build → TestFlight → App Store
- **Android**: EAS Build → Google Play Console
- **Backend**: Supabase (managed PostgreSQL)
- **Edge Functions**: Vercel for serverless functions

## Monitoring
- **Analytics**: PostHog/Amplitude (pending implementation)
- **Error Tracking**: Sentry integration
- **Performance**: React Native Performance Monitor
- **User Feedback**: In-app feedback system

## Development Workflow
1. Feature branches from `main`
2. TDD approach with failing tests first
3. PR with tests, documentation, and accessibility checks
4. Code review focusing on user empathy
5. Staged rollout with feature flags