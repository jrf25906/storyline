/**
 * Script to identify screens that need error boundaries
 * Run with: npx ts-node src/scripts/addErrorBoundaries.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// List of all screens found
const allScreens = [
  'src/screens/main/SettingsScreen.tsx',
  'src/screens/main/TrackerScreen.tsx',
  'src/screens/main/BudgetScreen.tsx',
  'src/screens/resume/ResumeScannerScreen.tsx',
  'src/screens/auth/TestAuthScreen.tsx',
  'src/screens/main/BouncePlanScreen.tsx',
  'src/screens/auth/ForgotPasswordScreen.tsx',
  'src/screens/main/CoachScreen.tsx',
  'src/screens/main/WellnessScreen.tsx',
  'src/screens/main/HomeScreen.tsx',
  'src/screens/onboarding/WelcomeScreen.tsx',
  'src/screens/onboarding/LayoffDetailsScreen.tsx',
  'src/screens/tracker/JobApplicationsScreen.tsx',
  'src/screens/onboarding/PersonalInfoScreen.tsx',
  'src/screens/onboarding/GoalsScreen.tsx',
  'src/screens/onboarding/ExperienceScreen.tsx',
  'src/screens/bounce-plan/ProgressScreen.tsx',
  'src/screens/coach/CoachChatScreen.tsx',
  'src/screens/bounce-plan/TaskDetailsScreen.tsx',
  'src/screens/bounce-plan/DailyTaskScreen.tsx',
  'src/screens/budget/BudgetOverviewScreen.tsx',
  'src/screens/auth/BiometricAuthScreen.tsx',
  'src/screens/auth/LoginScreen.tsx',
  'src/screens/auth/EmailVerificationScreen.tsx',
  'src/screens/auth/SignupScreen.tsx',
];

// Screens that already have error boundaries
const screensWithErrorBoundaries = [
  'src/screens/auth/SignupScreen.tsx',
  'src/screens/auth/LoginScreen.tsx',
  'src/screens/auth/ForgotPasswordScreen.tsx',
  'src/screens/main/HomeScreen.tsx', // Has HomeScreenWithErrorBoundary
];

// Screens that need error boundaries
const screensNeedingErrorBoundaries = allScreens.filter(
  screen => !screensWithErrorBoundaries.includes(screen)
);

console.log('Screens that need error boundaries:');
console.log('===================================');
screensNeedingErrorBoundaries.forEach((screen, index) => {
  console.log(`${index + 1}. ${screen}`);
});
console.log(`\nTotal: ${screensNeedingErrorBoundaries.length} screens`);

// Export for use in other scripts
export { screensNeedingErrorBoundaries };