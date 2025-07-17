# Getting Started with Next Chapter Development

## Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (All platforms)
- Supabase account for backend services
- OpenAI API key for AI Coach features

## Initial Setup

### 1. Clone and Install
```bash
git clone [repository-url]
cd NextChapter
npm install
```

### 2. Environment Configuration
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Required environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `EXPO_PUBLIC_OPENAI_API_KEY`: OpenAI API key
- `SUPABASE_SERVICE_ROLE_KEY`: For admin operations

### 3. Install Additional Dependencies
```bash
# Install OpenAI SDK (required for AI Coach)
npm install openai

# iOS specific (Mac only)
cd ios && pod install && cd ..
```

### 4. Database Setup
The database schema is already defined in `/src/services/database/schema.sql`. Apply it to your Supabase project:
1. Go to Supabase SQL Editor
2. Copy and run the schema.sql file
3. Verify Row Level Security is enabled on all tables

## Running the App

### Development Server
```bash
# Start Expo development server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android
```

### Testing
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Lint code
npm run lint

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── screens/          # Screen components by feature
├── components/       # Reusable UI components
├── navigation/       # React Navigation setup
├── stores/          # Zustand state management
├── services/        # API and external services
├── hooks/           # Custom React hooks
├── theme/           # Design system tokens
├── types/           # TypeScript definitions
└── utils/           # Helper functions
```

## Key Development Areas

### 1. Screens (`/src/screens`)
Each feature has its own directory:
- `onboarding/` - User registration flow
- `bounce-plan/` - Daily task management
- `coach/` - AI coaching interface
- `tracker/` - Job application tracking
- `budget/` - Financial planning

### 2. State Management (`/src/stores`)
Zustand stores for each domain:
- `userStore` - Authentication and profile
- `bouncePlanStore` - Task progress
- `budgetStore` - Financial data
- `coachStore` - AI conversations
- `jobApplicationStore` - Application pipeline

### 3. Components (`/src/components`)
- `common/` - Reusable UI elements (Button, Input, Card, etc.)
- All components have TypeScript types and accessibility support

### 4. Services (`/src/services`)
- `supabase/` - Database operations
- `ai/` - OpenAI integration
- `database/` - Data models and sync

## Current Implementation Status

### ✅ Completed
- Core screens structure
- Navigation with React Navigation v6
- Zustand state management
- Supabase integration
- Theme and design system
- Common UI components
- OpenAI AI Coach setup

### 🚧 In Progress
- Connecting screens to stores
- Authentication flow
- Offline data sync

### 📋 Pending
See the project todo list for upcoming tasks.

## Development Tips

### Path Aliases
Use these import aliases:
- `@components/*` → `src/components/*`
- `@screens/*` → `src/screens/*`
- `@services/*` → `src/services/*`
- `@stores/*` → `src/stores/*`
- `@theme/*` → `src/theme/*`
- `@types/*` → `src/types/*`
- `@hooks/*` → `src/hooks/*`
- `@navigation/*` → `src/navigation/*`

### Accessibility
- All interactive elements need `accessibilityLabel`
- Minimum touch target size: 48x48dp
- Test with screen readers enabled

### State Management
```typescript
// Using Zustand stores
import { useUserStore, useBouncePlanStore } from '@stores';

const MyComponent = () => {
  const { profile, signIn } = useUserStore();
  const { todayTasks, completeTask } = useBouncePlanStore();
  
  // Use the store data and actions
};
```

### Theme Usage
```typescript
import { theme } from '@theme';

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.sizes.headingLG,
    color: theme.colors.text.primary,
  },
});
```

## Debugging

### React Native Debugger
1. Install React Native Debugger
2. Run the app and shake device/simulator
3. Select "Debug JS Remotely"

### Reactotron (Optional)
1. Install Reactotron
2. Configure in `src/config/reactotron.ts`
3. View state changes and API calls

## Build for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## Getting Help
- Check `/docs` folder for detailed documentation
- Review CLAUDE.md for project requirements
- See ARCHITECTURE.md for system design
- Run tests to verify your changes