import { getAuthErrorMessage } from '@utils/validation';

export interface NetworkError extends Error {
  isNetworkError: boolean;
  isTimeout?: boolean;
  status?: number;
}

/**
 * Determines if an error is network-related
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Check if the error has the isNetworkError flag
  if (error.isNetworkError === true) {
    return true;
  }
  
  const networkErrorPatterns = [
    'network request failed',
    'fetch failed',
    'networkerror',
    'no internet',
    'connection refused',
    'timeout',
    'offline',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENETUNREACH',
  ];
  
  const errorMessage = (error.message || error.toString()).toLowerCase();
  return networkErrorPatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Transforms errors into user-friendly messages following stress-friendly principles
 */
export function getUserFriendlyErrorMessage(error: any, context?: 'auth' | 'data' | 'general'): string {
  // Check for network errors first
  if (isNetworkError(error)) {
    return 'Having trouble connecting. Please check your internet connection and try again.';
  }

  // Handle auth-specific errors
  if (context === 'auth') {
    return getAuthErrorMessage(error);
  }

  // Handle specific error codes
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    switch (status) {
      case 400:
        return 'The information provided seems incomplete. Please check and try again.';
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You don\'t have permission to do this. Please contact support if you need help.';
      case 404:
        return 'We couldn\'t find what you\'re looking for. It may have been moved or deleted.';
      case 429:
        return 'We\'re receiving too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return 'Our servers are having a moment. Please try again in a few minutes.';
      default:
        if (status >= 500) {
          return 'Something went wrong on our end. We\'re working on it.';
        }
    }
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return 'Please check your information and try again.';
  }

  if (error.name === 'TimeoutError') {
    return 'This is taking longer than expected. Please try again.';
  }

  // Default empathetic message
  return 'Something unexpected happened. Please try again in a moment.';
}

/**
 * Logs errors for monitoring while respecting user privacy
 */
export function logError(error: any, context: Record<string, any> = {}): void {
  // In production, this would send to error monitoring service
  // For now, just console log in development
  if (__DEV__) {
    console.error('Error logged:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Creates a timeout promise for network requests
 */
export function createTimeoutPromise(ms: number = 30000): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error('Request timed out. Please check your connection and try again.') as NetworkError;
      error.isNetworkError = true;
      error.isTimeout = true;
      reject(error);
    }, ms);
  });
}

/**
 * Wraps a promise with timeout and error handling
 */
export async function withErrorHandling<T>(
  promise: Promise<T>,
  options: {
    timeout?: number;
    context?: 'auth' | 'data' | 'general';
    onError?: (error: any) => void;
  } = {}
): Promise<T> {
  const { timeout = 30000, context = 'general', onError } = options;

  try {
    const result = await Promise.race([
      promise,
      createTimeoutPromise(timeout),
    ]);
    return result;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    
    logError(error, { context });
    
    // Transform the error message
    const friendlyMessage = getUserFriendlyErrorMessage(error, context);
    const enhancedError = new Error(friendlyMessage) as any;
    enhancedError.originalError = error;
    
    throw enhancedError;
  }
}