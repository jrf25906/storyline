/**
 * Migration examples showing how to replace scattered try-catch blocks
 * with the new centralized error handling system
 * 
 * These examples demonstrate the before/after patterns for Phase 3 cleanup
 */

import { withApiCall, withDatabaseOperation, withAuthOperation, withStorageOperation } from './errorWrappers';
import { withErrorHandling } from '@services/error/GlobalErrorHandler';

// ====================================================================
// Example 1: API Call Migration
// ====================================================================

// ❌ OLD PATTERN: Scattered try-catch with inconsistent error handling
export async function fetchUserProfile_OLD(userId: string): Promise<any> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    // Inconsistent error reporting
    alert('Something went wrong');
    throw error; // Inconsistent error propagation
  }
}

// ✅ NEW PATTERN: Centralized error handling with retry logic
export async function fetchUserProfile_NEW(userId: string) {
  return withApiCall(
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    3, // Retry count
    {
      service: 'userService',
      method: 'fetchProfile',
      userId,
    }
  );
}

// ====================================================================
// Example 2: Database Operation Migration
// ====================================================================

// ❌ OLD PATTERN: Manual error handling without context
export async function saveUserPreferences_OLD(userId: string, preferences: any): Promise<void> {
  try {
    await database.users.update(userId, { preferences });
    console.log('Preferences saved successfully');
  } catch (error) {
    console.error('Error saving preferences:', error);
    // No analytics tracking
    // No user notification
    // No recovery strategy
  }
}

// ✅ NEW PATTERN: Structured error handling with context
export async function saveUserPreferences_NEW(userId: string, preferences: any) {
  return withDatabaseOperation(
    async () => {
      return await database.users.update(userId, { preferences });
    },
    {
      table: 'users',
      operation: 'update',
      userId,
    }
  );
}

// ====================================================================
// Example 3: Authentication Flow Migration
// ====================================================================

// ❌ OLD PATTERN: Complex try-catch nesting with manual state management
export async function signInUser_OLD(email: string, password: string): Promise<any> {
  try {
    const response = await authService.signIn(email, password);
    
    try {
      await AsyncStorage.setItem('@auth_token', response.token);
    } catch (storageError) {
      console.error('Failed to save token:', storageError);
      // Token saved but storage failed - inconsistent state
    }
    
    try {
      await analytics.track('user_signed_in', { userId: response.user.id });
    } catch (analyticsError) {
      console.error('Analytics failed:', analyticsError);
      // Silent failure - no visibility into analytics issues
    }
    
    return response;
  } catch (authError) {
    console.error('Sign in failed:', authError);
    alert('Sign in failed. Please try again.');
    throw authError;
  }
}

// ✅ NEW PATTERN: Composable error handling with proper separation
export async function signInUser_NEW(email: string, password: string) {
  // Step 1: Authenticate user
  const authResult = await withAuthOperation(
    async () => authService.signIn(email, password),
    { action: 'login' }
  );
  
  if (!authResult.success) {
    return authResult;
  }
  
  const { token, user } = authResult.data!;
  
  // Step 2: Save token (separate operation with its own error handling)
  const storageResult = await withStorageOperation(
    async () => AsyncStorage.setItem('@auth_token', token),
    {
      key: '@auth_token',
      operation: 'set',
      userId: user.id,
    }
  );
  
  // Step 3: Track analytics (non-blocking)
  withErrorHandling(
    async () => analytics.track('user_signed_in', { userId: user.id }),
    { action: 'analytics.user_signed_in', userId: user.id },
    { showUserNotification: false } // Don't notify user of analytics failures
  );
  
  return authResult;
}

// ====================================================================
// Example 4: Complex State Update Migration
// ====================================================================

// ❌ OLD PATTERN: Multiple try-catch blocks with state inconsistency risks
export async function updateBudgetData_OLD(userId: string, budgetData: any): Promise<void> {
  try {
    // Validate data
    if (!budgetData.income || budgetData.income < 0) {
      throw new Error('Invalid income amount');
    }
    
    // Save to local storage
    try {
      await AsyncStorage.setItem(`@budget_${userId}`, JSON.stringify(budgetData));
    } catch (storageError) {
      console.error('Local storage failed:', storageError);
      // Continue anyway - might cause sync issues later
    }
    
    // Update remote database
    try {
      await database.budgets.upsert(userId, budgetData);
    } catch (dbError) {
      console.error('Database update failed:', dbError);
      // Local and remote now out of sync
      throw dbError;
    }
    
    // Update app state
    try {
      budgetStore.setBudgetData(budgetData);
    } catch (stateError) {
      console.error('State update failed:', stateError);
      // Database updated but UI not reflecting changes
    }
    
    // Calculate runway
    try {
      const runway = calculateRunway(budgetData);
      budgetStore.setRunway(runway);
    } catch (calcError) {
      console.error('Runway calculation failed:', calcError);
      // Budget saved but runway not calculated
    }
    
  } catch (error) {
    console.error('Budget update failed:', error);
    alert('Failed to save budget');
    throw error;
  }
}

// ✅ NEW PATTERN: Transactional approach with proper error boundaries
export async function updateBudgetData_NEW(userId: string, budgetData: any) {
  // Step 1: Validate input (synchronous validation)
  const validationResult = withValidation(
    () => {
      if (!budgetData.income || budgetData.income < 0) {
        throw new Error('Invalid income amount');
      }
      if (!budgetData.expenses || budgetData.expenses < 0) {
        throw new Error('Invalid expenses amount');
      }
      return true;
    },
    { field: 'budget_data', userId }
  );
  
  if (!validationResult.success) {
    return validationResult;
  }
  
  // Step 2: Save to database first (source of truth)
  const dbResult = await withDatabaseOperation(
    async () => database.budgets.upsert(userId, budgetData),
    {
      table: 'budgets',
      operation: 'update',
      userId,
    }
  );
  
  if (!dbResult.success) {
    return dbResult;
  }
  
  // Step 3: Update local storage (async, non-blocking)
  withStorageOperation(
    async () => AsyncStorage.setItem(`@budget_${userId}`, JSON.stringify(budgetData)),
    {
      key: `@budget_${userId}`,
      operation: 'set',
      userId,
    }
  );
  
  // Step 4: Update app state (sync, but with error boundary)
  const stateResult = withStateOperation(
    () => {
      budgetStore.setBudgetData(budgetData);
      
      // Calculate runway as part of the same state update
      const runway = calculateRunway(budgetData);
      budgetStore.setRunway(runway);
      
      return { budgetData, runway };
    },
    {
      store: 'budgetStore',
      action: 'updateBudgetData',
      userId,
    }
  );
  
  return stateResult;
}

// ====================================================================
// Example 5: Crisis Feature Migration (Critical Error Handling)
// ====================================================================

// ❌ OLD PATTERN: Basic try-catch for critical crisis features
export async function detectCrisisKeywords_OLD(message: string, userId: string): Promise<any> {
  try {
    const response = await aiService.analyzeCrisisIndicators(message);
    
    if (response.isCrisis) {
      try {
        await notificationService.triggerCrisisAlert(userId);
      } catch (alertError) {
        console.error('Crisis alert failed:', alertError);
        // Critical failure - user in crisis but no alert sent
      }
    }
    
    return response;
  } catch (error) {
    console.error('Crisis detection failed:', error);
    // Failing silently for crisis detection is dangerous
    throw error;
  }
}

// ✅ NEW PATTERN: Critical error handling with fallbacks
export async function detectCrisisKeywords_NEW(message: string, userId: string) {
  return withCrisisOperation(
    async () => {
      const response = await aiService.analyzeCrisisIndicators(message);
      
      if (response.isCrisis) {
        // Crisis alert is also a critical operation
        const alertResult = await withCrisisOperation(
          async () => notificationService.triggerCrisisAlert(userId),
          { feature: 'emergency_contact', userId }
        );
        
        // If alert fails, use fallback mechanism
        if (!alertResult.success) {
          // Implement fallback crisis response
          await showInAppCrisisResources();
        }
      }
      
      return response;
    },
    {
      feature: 'crisis_detection',
      userId,
    }
  );
}

// Helper function for crisis fallback
async function showInAppCrisisResources(): Promise<void> {
  // Implementation would show immediate crisis resources
  console.log('Showing in-app crisis resources as fallback');
}

// ====================================================================
// Migration Pattern Summary
// ====================================================================

/**
 * Key Migration Principles:
 * 
 * 1. Replace try-catch with appropriate wrapper functions
 * 2. Provide meaningful context for each operation
 * 3. Separate concerns - don't bundle unrelated operations
 * 4. Use appropriate error severity for the operation type
 * 5. Consider user experience - don't show technical errors
 * 6. Implement fallback strategies for critical operations
 * 7. Make operations atomic where possible
 * 8. Use async/non-blocking for non-critical operations
 * 
 * Migration Checklist:
 * □ Identify the operation type (API, DB, Auth, Storage, etc.)
 * □ Extract meaningful context (user ID, action, additional data)
 * □ Choose appropriate wrapper function
 * □ Configure error handling behavior (notifications, severity)
 * □ Implement fallback strategies for critical operations
 * □ Remove old try-catch blocks
 * □ Test error scenarios thoroughly
 */

export const migrationPatterns = {
  apiCall: { old: fetchUserProfile_OLD, new: fetchUserProfile_NEW },
  databaseOp: { old: saveUserPreferences_OLD, new: saveUserPreferences_NEW },
  authFlow: { old: signInUser_OLD, new: signInUser_NEW },
  stateUpdate: { old: updateBudgetData_OLD, new: updateBudgetData_NEW },
  crisisFeature: { old: detectCrisisKeywords_OLD, new: detectCrisisKeywords_NEW },
};