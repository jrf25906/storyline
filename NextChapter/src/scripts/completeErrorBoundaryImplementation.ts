/**
 * Script to complete error boundary implementation for remaining screens
 * This provides the template for updating the remaining 17 screens
 */

import { screenErrorMessages } from '../utils/updateScreensWithErrorBoundary';

interface ScreenUpdate {
  path: string;
  screenName: string;
  errorMessage: {
    title: string;
    message: string;
  };
}

const remainingScreens: ScreenUpdate[] = [
  // Resume Feature
  {
    path: 'src/screens/resume/ResumeScannerScreen.tsx',
    screenName: 'ResumeScannerScreen',
    errorMessage: screenErrorMessages.ResumeScannerScreen,
  },
  
  // Auth Screens
  {
    path: 'src/screens/auth/TestAuthScreen.tsx',
    screenName: 'TestAuthScreen',
    errorMessage: screenErrorMessages.TestAuthScreen,
  },
  {
    path: 'src/screens/auth/BiometricAuthScreen.tsx',
    screenName: 'BiometricAuthScreen',
    errorMessage: screenErrorMessages.BiometricAuthScreen,
  },
  {
    path: 'src/screens/auth/EmailVerificationScreen.tsx',
    screenName: 'EmailVerificationScreen',
    errorMessage: screenErrorMessages.EmailVerificationScreen,
  },
  
  // Main Screens
  {
    path: 'src/screens/main/CoachScreen.tsx',
    screenName: 'CoachScreen',
    errorMessage: screenErrorMessages.CoachScreen,
  },
  {
    path: 'src/screens/main/WellnessScreen.tsx',
    screenName: 'WellnessScreen',
    errorMessage: screenErrorMessages.WellnessScreen,
  },
  
  // Onboarding Screens
  {
    path: 'src/screens/onboarding/WelcomeScreen.tsx',
    screenName: 'WelcomeScreen',
    errorMessage: screenErrorMessages.WelcomeScreen,
  },
  {
    path: 'src/screens/onboarding/LayoffDetailsScreen.tsx',
    screenName: 'LayoffDetailsScreen',
    errorMessage: screenErrorMessages.LayoffDetailsScreen,
  },
  {
    path: 'src/screens/onboarding/PersonalInfoScreen.tsx',
    screenName: 'PersonalInfoScreen',
    errorMessage: screenErrorMessages.PersonalInfoScreen,
  },
  {
    path: 'src/screens/onboarding/GoalsScreen.tsx',
    screenName: 'GoalsScreen',
    errorMessage: screenErrorMessages.GoalsScreen,
  },
  {
    path: 'src/screens/onboarding/ExperienceScreen.tsx',
    screenName: 'ExperienceScreen',
    errorMessage: screenErrorMessages.ExperienceScreen,
  },
  
  // Tracker Feature
  {
    path: 'src/screens/tracker/JobApplicationsScreen.tsx',
    screenName: 'JobApplicationsScreen',
    errorMessage: screenErrorMessages.JobApplicationsScreen,
  },
  
  // Bounce Plan Feature
  {
    path: 'src/screens/bounce-plan/ProgressScreen.tsx',
    screenName: 'ProgressScreen',
    errorMessage: screenErrorMessages.ProgressScreen,
  },
  {
    path: 'src/screens/bounce-plan/TaskDetailsScreen.tsx',
    screenName: 'TaskDetailsScreen',
    errorMessage: screenErrorMessages.TaskDetailsScreen,
  },
  {
    path: 'src/screens/bounce-plan/DailyTaskScreen.tsx',
    screenName: 'DailyTaskScreen',
    errorMessage: screenErrorMessages.DailyTaskScreen,
  },
  
  // Coach Feature
  {
    path: 'src/screens/coach/CoachChatScreen.tsx',
    screenName: 'CoachChatScreen',
    errorMessage: screenErrorMessages.CoachChatScreen,
  },
  
  // Budget Feature
  {
    path: 'src/screens/budget/BudgetOverviewScreen.tsx',
    screenName: 'BudgetOverviewScreen',
    errorMessage: screenErrorMessages.BudgetOverviewScreen,
  },
];

/**
 * Template for updating a screen with error boundary
 * 
 * Steps:
 * 1. Add import for withErrorBoundary
 * 2. Change 'export default function' to just 'function'
 * 3. Add export with withErrorBoundary HOC at the end
 */
const updateTemplate = `
// 1. Add this import after other imports:
import { withErrorBoundary } from '../../components/common';

// 2. Change this:
export default function ScreenName() {

// To this:
function ScreenName() {

// 3. Add this at the end of the file:
export default withErrorBoundary(ScreenName, {
  errorMessage: {
    title: 'Error title here',
    message: 'Error message here'
  }
});
`;

// Log the remaining screens for manual update
console.log('Remaining screens to update:');
console.log('===========================');
remainingScreens.forEach((screen, index) => {
  console.log(`\n${index + 1}. ${screen.path}`);
  console.log(`   Screen: ${screen.screenName}`);
  console.log(`   Error Title: "${screen.errorMessage.title}"`);
  console.log(`   Error Message: "${screen.errorMessage.message}"`);
});

console.log('\n\nUpdate Template:');
console.log('================');
console.log(updateTemplate);

export { remainingScreens };