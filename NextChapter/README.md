# NextChapter

A React Native mobile application designed to help laid-off professionals navigate career transitions and land their next role within 90 days.

## Overview

Next Chapter combines a structured 30-day "Bounce Plan" with AI-powered coaching, budget tracking, and job search management tools to help users regain stability after a layoff.

### Key Features
- **30-Day Bounce Plan**: Daily 10-minute tasks with progressive disclosure
- **AI Coach**: Adaptive tone switching (Hype, Pragmatist, Tough-Love) based on emotional cues  
- **Budget Tracker**: Financial runway calculator with unemployment benefits integration
- **Job Application Tracker**: Kanban-style pipeline management
- **Resume Scanner**: Keyword matching and AI-assisted rewriting
- **Mood Tracking**: Daily emotional check-ins with trend analysis
- **Biometric Authentication**: Face ID/Touch ID/Fingerprint support for secure access
- **Email Verification**: Secure account verification with automatic status checking

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd NextChapter

# Install dependencies
npm install

# Install OpenAI SDK
npm install openai

# iOS only
cd ios && pod install && cd ..
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your API keys:
# EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android
```

## Project Structure

```
NextChapter/
├── src/
│   ├── screens/        # Screen components organized by feature
│   ├── components/     # Reusable UI components
│   ├── navigation/     # React Navigation v6 setup
│   ├── stores/         # Zustand state management
│   ├── services/       # API and external services
│   ├── hooks/          # Custom React hooks
│   ├── theme/          # Design system and tokens
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Helper functions
│   └── context/        # React Context providers
├── assets/             # Images and static files
├── App.tsx            # Main app entry point
└── package.json       # Dependencies
```

## Tech Stack

- **Framework**: React Native 0.79.5 with Expo SDK 53
- **Language**: TypeScript 5.2 (strict mode)
- **State Management**: Zustand
- **Navigation**: React Navigation v6
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o
- **Styling**: Custom design system ("Grounded Optimism")
- **Testing**: Jest + React Native Testing Library

## Architecture Highlights

- **Offline-First**: All core features work offline with sync
- **Type-Safe**: Full TypeScript with strict mode
- **Accessible**: WCAG 2.1 AA compliant
- **Secure**: Row Level Security, encrypted sensitive data
- **Testable**: TDD approach with 80%+ coverage target

## Development Status

✅ **Completed**:
- Core architecture setup with Metro bundler fixes
- All 7 Zustand stores implemented
- React Navigation structure
- Design system & UI components
- All major screen components
- Supabase integration with auth
- OpenAI AI Coach with crisis intervention
- Accessibility (WCAG 2.1 AA compliant)
- Test infrastructure overhaul
- Safety-critical Coach tests (100% passing)
- BudgetOverviewScreen connected to budgetStore
- Biometric authentication (Face ID/Touch ID/Fingerprint)
- Email verification flow with auto-checking
- WatermelonDB offline storage setup
- App-wide loading and error states
- E2E tests with Detox (7 test suites)
- Error boundaries (25/25 screens) ✅
- Offline sync with WatermelonDB tested and validated
- Tests for all new features

🚧 **In Progress**:
- Setting up EAS account for E2E testing
- CI/CD pipeline configuration
- Push notifications with Expo Push API
- Adding user-friendly sync error messages
- Implementing offline queue size limit

📋 **Testing Status**:
- **Coverage**: 54% (target: 80%)
- **Infrastructure**: ✅ Fixed
- **Safety Tests**: ✅ All passing
- **Mock System**: ✅ Comprehensive

See [Testing Status](docs/technical/testing/TESTING_STATUS.md) for details.

## Development Commands

```bash
# Start development server
npm start

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Run E2E tests
npm run test:e2e:build:ios  # Build iOS app for testing
npm run test:e2e            # Run iOS tests
npm run test:e2e:build:android  # Build Android app
npm run test:e2e:android    # Run Android tests

# Code quality
npm run lint
npm run typecheck

# Build for production
eas build --platform ios
eas build --platform android
```

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Getting Started Guide](docs/GETTING_STARTED.md)
- [Development Status](docs/DEVELOPMENT_STATUS.md)
- [Project Requirements](CLAUDE.md)

## Contributing

Please read [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and workflow instructions.

## License

[License type] - See LICENSE file for details