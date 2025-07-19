import { ServiceResult } from '@services/interfaces/common/errors';
import { globalErrorHandler, withErrorHandling } from '@services/error/GlobalErrorHandler';

/**
 * Error handling wrappers for common patterns in NextChapter app
 * Replaces scattered try-catch blocks with standardized error handling
 */

/**
 * Wrapper for API calls with automatic retry logic
 */
export async function withApiCall<T>(
  apiCall: () => Promise<T>,
  retryCount: number = 3,
  context: {
    service: string;
    method: string;
    userId?: string;
  }
): Promise<ServiceResult<T>> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const result = await withErrorHandling(
        apiCall,
        {
          action: `${context.service}.${context.method}`,
          userId: context.userId,
          additionalData: { attempt, retryCount },
        },
        {
          showUserNotification: attempt === retryCount, // Only show on final failure
          severity: attempt === retryCount ? 'HIGH' : 'MEDIUM',
        }
      );
      
      if (result.success) {
        return result;
      }
      
      lastError = new Error(result.error?.message || 'API call failed');
      
      // Wait before retry (exponential backoff)
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
      
    } catch (error) {
      lastError = error as Error;
    }
  }
  
  return globalErrorHandler.createErrorResult<T>(lastError, {
    action: `${context.service}.${context.method}`,
    additionalData: { retryCount, finalAttempt: true },
  });
}

/**
 * Wrapper for database operations with offline support
 */
export async function withDatabaseOperation<T>(
  operation: () => Promise<T>,
  context: {
    table: string;
    operation: 'create' | 'read' | 'update' | 'delete';
    userId?: string;
  }
): Promise<ServiceResult<T>> {
  return withErrorHandling(
    operation,
    {
      action: `database.${context.table}.${context.operation}`,
      userId: context.userId,
    },
    {
      showUserNotification: true,
      logToAnalytics: true,
      severity: 'MEDIUM',
    }
  );
}

/**
 * Wrapper for authentication operations
 */
export async function withAuthOperation<T>(
  operation: () => Promise<T>,
  context: {
    action: 'login' | 'logout' | 'signup' | 'refresh' | 'verify';
    userId?: string;
  }
): Promise<ServiceResult<T>> {
  return withErrorHandling(
    operation,
    {
      action: `auth.${context.action}`,
      userId: context.userId,
    },
    {
      showUserNotification: true,
      logToAnalytics: true,
      severity: 'HIGH',
      recoveryAction: context.action === 'refresh' ? async () => {
        // Could implement auto-retry for token refresh
        console.log('Implementing auth recovery logic');
      } : undefined,
    }
  );
}

/**
 * Wrapper for file operations (uploads, downloads, etc.)
 */
export async function withFileOperation<T>(
  operation: () => Promise<T>,
  context: {
    type: 'upload' | 'download' | 'delete' | 'read';
    fileName?: string;
    userId?: string;
  }
): Promise<ServiceResult<T>> {
  return withErrorHandling(
    operation,
    {
      action: `file.${context.type}`,
      userId: context.userId,
      additionalData: { fileName: context.fileName },
    },
    {
      showUserNotification: true,
      logToAnalytics: true,
      severity: 'MEDIUM',
    }
  );
}

/**
 * Wrapper for AI/LLM operations with special handling for rate limits
 */
export async function withAIOperation<T>(
  operation: () => Promise<T>,
  context: {
    model: string;
    operation: 'chat' | 'completion' | 'analysis';
    userId?: string;
  }
): Promise<ServiceResult<T>> {
  return withErrorHandling(
    operation,
    {
      action: `ai.${context.model}.${context.operation}`,
      userId: context.userId,
    },
    {
      showUserNotification: true,
      logToAnalytics: true,
      severity: 'MEDIUM',
      recoveryAction: async () => {
        // Could implement fallback to cached responses
        console.log('Implementing AI fallback logic');
      },
    }
  );
}

/**
 * Wrapper for navigation operations
 */
export function withNavigationOperation<T>(
  operation: () => T,
  context: {
    from: string;
    to: string;
    userId?: string;
  }
): ServiceResult<T> {
  try {
    const result = operation();
    return { success: true, data: result };
  } catch (error) {
    globalErrorHandler.handleError(error as Error, {
      action: `navigation.${context.from}_to_${context.to}`,
      userId: context.userId,
      screen: context.from,
    }, {
      showUserNotification: false, // Navigation errors usually don't need user notification
      logToAnalytics: true,
      severity: 'LOW',
    });
    
    return globalErrorHandler.createErrorResult<T>(error as Error);
  }
}

/**
 * Wrapper for local storage operations
 */
export async function withStorageOperation<T>(
  operation: () => Promise<T>,
  context: {
    key: string;
    operation: 'get' | 'set' | 'remove' | 'clear';
    userId?: string;
  }
): Promise<ServiceResult<T>> {
  return withErrorHandling(
    operation,
    {
      action: `storage.${context.operation}`,
      userId: context.userId,
      additionalData: { key: context.key },
    },
    {
      showUserNotification: context.operation !== 'get', // Don't notify for read operations
      logToAnalytics: true,
      severity: 'MEDIUM',
    }
  );
}

/**
 * Wrapper for state management operations
 */
export function withStateOperation<T>(
  operation: () => T,
  context: {
    store: string;
    action: string;
    userId?: string;
  }
): ServiceResult<T> {
  try {
    const result = operation();
    return { success: true, data: result };
  } catch (error) {
    globalErrorHandler.handleError(error as Error, {
      action: `state.${context.store}.${context.action}`,
      userId: context.userId,
    }, {
      showUserNotification: false, // State errors usually don't need immediate notification
      logToAnalytics: true,
      severity: 'LOW',
    });
    
    return globalErrorHandler.createErrorResult<T>(error as Error);
  }
}

/**
 * Wrapper for validation operations
 */
export function withValidation<T>(
  operation: () => T,
  context: {
    field: string;
    value?: any;
    userId?: string;
  }
): ServiceResult<T> {
  try {
    const result = operation();
    return { success: true, data: result };
  } catch (error) {
    // Validation errors are usually user errors, not system errors
    return globalErrorHandler.createErrorResult<T>(error as Error, {
      action: `validation.${context.field}`,
      userId: context.userId,
      additionalData: { field: context.field },
    });
  }
}

/**
 * Crisis-specific wrapper for emergency operations
 * Special handling for crisis intervention features
 */
export async function withCrisisOperation<T>(
  operation: () => Promise<T>,
  context: {
    feature: 'crisis_detection' | 'resource_access' | 'emergency_contact';
    userId?: string;
  }
): Promise<ServiceResult<T>> {
  return withErrorHandling(
    operation,
    {
      action: `crisis.${context.feature}`,
      userId: context.userId,
    },
    {
      showUserNotification: true,
      logToAnalytics: true,
      reportToCrashlytics: true,
      severity: 'CRITICAL', // Crisis features are always critical
      recoveryAction: async () => {
        // Implement crisis feature fallbacks
        console.log('Implementing crisis recovery logic');
      },
    }
  );
}