/**
 * Utility to update screens with error boundary
 * This provides the implementation logic for wrapping screens
 */

export interface ScreenUpdateConfig {
  screenPath: string;
  errorMessage?: {
    title: string;
    message: string;
  };
}

export function generateUpdatedScreenContent(
  originalContent: string,
  screenName: string,
  errorMessage?: { title: string; message: string }
): string {
  // Check if already has withErrorBoundary
  if (originalContent.includes('withErrorBoundary')) {
    return originalContent;
  }

  // Check if it's already using ErrorBoundary component directly
  if (originalContent.includes('<ErrorBoundary>')) {
    // Convert to withErrorBoundary HOC pattern
    return convertToHOCPattern(originalContent, screenName, errorMessage);
  }

  // Add import for withErrorBoundary
  const importStatement = `import { withErrorBoundary } from '../../components/common';`;
  
  // Find the right place to add the import (after other imports)
  const importRegex = /^import.*from.*;$/gm;
  const imports = originalContent.match(importRegex) || [];
  const lastImportIndex = originalContent.lastIndexOf(imports[imports.length - 1]);
  const afterLastImport = lastImportIndex + imports[imports.length - 1].length;

  // Insert the import
  let updatedContent = 
    originalContent.slice(0, afterLastImport) + 
    '\n' + importStatement + 
    originalContent.slice(afterLastImport);

  // Find the export statement
  const exportRegex = /export\s+default\s+function\s+(\w+Screen)/;
  const exportMatch = updatedContent.match(exportRegex);
  
  if (!exportMatch) {
    // Handle arrow function exports
    const arrowExportRegex = /export\s+default\s+(\w+Screen)/;
    const arrowMatch = updatedContent.match(arrowExportRegex);
    if (arrowMatch) {
      const componentName = arrowMatch[1];
      return wrapWithHOC(updatedContent, componentName, errorMessage);
    }
    return updatedContent; // Can't process if we can't find the export
  }

  const componentName = exportMatch[1];
  return wrapWithHOC(updatedContent, componentName, errorMessage);
}

function wrapWithHOC(
  content: string,
  componentName: string,
  errorMessage?: { title: string; message: string }
): string {
  // Replace the export statement
  const exportRegex = new RegExp(`export\\s+default\\s+(function\\s+)?${componentName}`);
  
  // First, remove export default from the component
  let updatedContent = content.replace(exportRegex, `function ${componentName}`);
  
  // Add the HOC export at the end
  const errorConfig = errorMessage 
    ? `, {\n  errorMessage: {\n    title: '${errorMessage.title}',\n    message: '${errorMessage.message}'\n  }\n}`
    : '';
    
  updatedContent += `\n\nexport default withErrorBoundary(${componentName}${errorConfig});`;
  
  return updatedContent;
}

function convertToHOCPattern(
  content: string,
  screenName: string,
  errorMessage?: { title: string; message: string }
): string {
  // This would be more complex - for now, just return as is
  // In a real implementation, we'd parse the JSX and refactor it
  console.log(`Note: ${screenName} already uses ErrorBoundary directly. Consider converting to withErrorBoundary HOC pattern for consistency.`);
  return content;
}

// Screen-specific error messages
export const screenErrorMessages: Record<string, { title: string; message: string }> = {
  'SettingsScreen': {
    title: 'Unable to load settings',
    message: "We're having trouble accessing your settings. Please try again."
  },
  'TrackerScreen': {
    title: 'Job tracker temporarily unavailable',
    message: "Don't worry, your data is safe. Please try again in a moment."
  },
  'BudgetScreen': {
    title: 'Budget calculator needs a moment',
    message: "We're working on loading your financial data. Please try again."
  },
  'ResumeScannerScreen': {
    title: 'Resume scanner taking a break',
    message: "The scanner will be back shortly. Please try again."
  },
  'BouncePlanScreen': {
    title: 'Bounce Plan loading issue',
    message: "Your progress is saved. Please try refreshing the screen."
  },
  'CoachScreen': {
    title: 'Your coach is temporarily away',
    message: "The AI coach will be back shortly. Your conversation history is safe."
  },
  'WellnessScreen': {
    title: 'Wellness check-in unavailable',
    message: "Take a deep breath. We'll have this working again soon."
  },
  'WelcomeScreen': {
    title: 'Welcome experience interrupted',
    message: "Let's get you started on the right foot. Please try again."
  },
  'LayoffDetailsScreen': {
    title: 'Unable to save your details',
    message: "Your information is important. Please try again."
  },
  'JobApplicationsScreen': {
    title: 'Application tracker needs a moment',
    message: "Your applications are safe. Please refresh to continue."
  },
  'PersonalInfoScreen': {
    title: 'Personal info form unavailable',
    message: "We need just a moment to prepare your form."
  },
  'GoalsScreen': {
    title: 'Goals setup interrupted',
    message: "Your aspirations matter. Let's try this again."
  },
  'ExperienceScreen': {
    title: 'Experience form needs attention',
    message: "Your background is valuable. Please try again."
  },
  'ProgressScreen': {
    title: 'Progress tracker taking a break',
    message: "Your achievements are saved. Please refresh."
  },
  'CoachChatScreen': {
    title: 'Chat temporarily offline',
    message: "Your coach will be back. Your messages are saved."
  },
  'TaskDetailsScreen': {
    title: 'Task details unavailable',
    message: "This task will be available again shortly."
  },
  'DailyTaskScreen': {
    title: "Today's task needs a refresh",
    message: "Your progress is saved. Please try again."
  },
  'BudgetOverviewScreen': {
    title: 'Budget overview loading issue',
    message: "Your financial data is secure. Please refresh."
  },
  'BiometricAuthScreen': {
    title: 'Security check interrupted',
    message: "Let's secure your account. Please try again."
  },
  'EmailVerificationScreen': {
    title: 'Email verification paused',
    message: "Almost there! Please try verifying again."
  },
  'TestAuthScreen': {
    title: 'Test screen error',
    message: "This is a test environment. Please try again."
  }
};