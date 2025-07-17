# Navigation Structure

This directory contains the React Navigation v6 setup for the Next Chapter app.

## Structure Overview

```
AppNavigator (Root)
├── Auth Stack (Not authenticated)
│   ├── Welcome
│   ├── LayoffDetails
│   ├── PersonalInfo
│   ├── Goals
│   ├── Login
│   ├── Signup
│   └── ForgotPassword
│
├── Main Tabs (Authenticated)
│   ├── Home
│   ├── BouncePlan Stack
│   │   ├── BouncePlanOverview
│   │   ├── DailyTask (modal)
│   │   └── TaskHistory
│   ├── Coach Stack
│   │   ├── CoachChat
│   │   └── CoachHistory
│   ├── Tracker Stack
│   │   ├── JobApplications
│   │   └── ApplicationDetails (modal)
│   ├── Budget Stack
│   │   ├── BudgetOverview
│   │   ├── BudgetCalculator (modal)
│   │   └── ExpenseTracker
│   └── Profile Stack
│       ├── ProfileOverview
│       ├── Settings
│       ├── Wellness
│       └── About
│
└── Modal Screens (Global)
    ├── AddJobApplication
    ├── EditJobApplication
    ├── ResumeScanner
    ├── BudgetDetails
    └── CoachSettings
```

## Usage

### Basic Navigation

```typescript
import { useAppNavigation } from '../navigation/navigationHelpers';

function MyComponent() {
  const navigation = useAppNavigation();

  const handlePress = () => {
    // Navigate to a screen
    navigation.navigate('Coach', {
      screen: 'CoachChat'
    });

    // Navigate to a modal
    navigation.navigate('AddJobApplication');
  };
}
```

### Typed Navigation Props

```typescript
import { CoachStackScreenProps } from '../types/navigation';

type Props = CoachStackScreenProps<'CoachChat'>;

function CoachChatScreen({ navigation, route }: Props) {
  // navigation and route are fully typed
}
```

### Navigation Helpers

```typescript
import { navigationHelpers } from '../navigation/navigationHelpers';

// Reset to main after onboarding
navigationHelpers.resetToMain(navigation);

// Reset to auth after logout
navigationHelpers.resetToAuth(navigation);

// Navigate to modals with params
navigationHelpers.navigateToEditJobApplication(navigation, 'job-123', 'Tracker');
```

## Key Files

- `AppNavigator.tsx` - Root navigator with auth logic
- `MainTabNavigator.tsx` - Bottom tab navigator
- `*StackNavigator.tsx` - Feature-specific stack navigators
- `navigationHelpers.ts` - Utility functions for navigation
- `navigationOptions.ts` - Consistent styling options

## TypeScript Support

All navigation is fully typed. The types are defined in `src/types/navigation.ts` and include:

- `RootStackParamList` - Root stack screens and params
- `AuthStackParamList` - Auth flow screens
- `MainTabParamList` - Main tab screens
- Feature-specific param lists for each stack

## Accessibility

All screens include:
- `headerAccessibilityLabel` for screen readers
- `tabBarAccessibilityLabel` for tab navigation
- `testID` props for testing
- Proper `accessibilityRole` attributes

## Testing

Navigation can be tested using the mock navigation prop:

```typescript
import { createMockNavigation } from '../../test-utils/mockHelpers';

const mockNavigation = createMockNavigation();
const { getByText } = render(
  <MyScreen navigation={mockNavigation} route={{ params: {} }} />
);
```