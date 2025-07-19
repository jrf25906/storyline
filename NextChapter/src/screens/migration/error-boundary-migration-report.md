# Error Boundary Migration Report

## Summary
Total screens found: 44
- Screens with error boundaries: 23
- Screens missing error boundaries: 7
- Test files (excluded): 7
- Special case (HomeScreenWithErrorBoundary): 1
- Excluded demo/test screens: 6

## Screens Missing Error Boundaries

### Auth Screens (2)
1. `/src/screens/auth/TestAuthScreen.tsx`
2. `/src/screens/auth/BiometricAuthScreen.tsx`

### Profile Screens (2)
3. `/src/screens/profile/ProfileScreen.tsx`
4. `/src/screens/profile/AboutScreen.tsx`

### Budget Screens (1)
5. `/src/screens/budget/BudgetCalculatorScreen.tsx`

### Bounce Plan Screens (1)
6. `/src/screens/bounce-plan/TaskDetailScreen.tsx`

### Test/Demo Screens (2) - Lower Priority
7. `/src/screens/BuilderTestScreen.tsx`
8. `/src/screens/BuilderDemoScreen.tsx`

## Migration Required
The following screens need to be updated with the `withErrorBoundary` HOC:

### Critical Screens (6)
These are production screens that should be migrated immediately:
- TestAuthScreen
- BiometricAuthScreen
- ProfileScreen
- AboutScreen
- BudgetCalculatorScreen
- TaskDetailScreen

### Lower Priority (2)
These appear to be test/demo screens:
- BuilderTestScreen
- BuilderDemoScreen

## Pattern to Follow
```typescript
// Add import at the top
import { withErrorBoundary } from '@/components/common/withErrorBoundary';

// Change export from:
export default MyScreen;
// or
export const MyScreen = () => {...}

// To:
const MyScreen = () => {...}
export default withErrorBoundary(MyScreen);
```

## Migration Script
Run the migration script below to automatically add error boundaries to all missing screens.