import { Alert } from 'react-native';
import { ServiceError, ServiceResult, ErrorSeverity } from '@services/interfaces/common/errors';
import { analyticsService } from '@services/analytics/analyticsService';
import { notificationService } from '@services/notifications/notificationService';

/**
 * Global error handler for NextChapter app
 * Centralizes error logging, user notification, and recovery strategies
 * Designed with empathy for users in crisis situations
 */

interface ErrorContext {
  userId?: string;
  screen?: string;
  action?: string;
  additionalData?: Record<string, any>;
}

interface ErrorHandlingConfig {
  showUserNotification: boolean;
  logToAnalytics: boolean;
  reportToCrashlytics: boolean;
  severity: ErrorSeverity;
  recoveryAction?: () => Promise<void>;
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorQueue: Array<{ error: Error; context: ErrorContext; timestamp: number }> = [];
  private isProcessingQueue = false;

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Set up global error handlers for unhandled exceptions
   */
  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof global !== 'undefined') {
      global.addEventListener?.('unhandledrejection', (event) => {
        this.handleUnhandledRejection(event.reason, {
          action: 'unhandled_promise_rejection',
        });
      });

      // Handle uncaught exceptions
      global.addEventListener?.('error', (event) => {
        this.handleUncaughtException(event.error, {
          action: 'uncaught_exception',
        });
      });
    }

    // React Native specific error handling
    if (__DEV__) {
      console.warn = this.wrapConsoleMethod(console.warn, 'warning');
      console.error = this.wrapConsoleMethod(console.error, 'error');
    }
  }

  /**
   * Wrap console methods to capture development warnings/errors
   */
  private wrapConsoleMethod(originalMethod: Function, level: string) {
    return (...args: any[]) => {
      originalMethod.apply(console, args);
      
      // Only log significant errors to avoid spam
      if (level === 'error' && args[0] && typeof args[0] === 'string') {
        const message = args[0];
        if (this.isSignificantError(message)) {
          this.handleError(new Error(message), {
            action: `console_${level}`,
            additionalData: { args },
          }, {
            showUserNotification: false,
            logToAnalytics: true,
            reportToCrashlytics: false,
            severity: level === 'error' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
          });
        }
      }
    };
  }

  /**
   * Determine if a console message represents a significant error
   */
  private isSignificantError(message: string): boolean {
    const significantPatterns = [
      /failed to fetch/i,
      /network error/i,
      /authentication/i,
      /unauthorized/i,
      /timeout/i,
      /database/i,
      /supabase/i,
    ];

    return significantPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Main error handling method - called by all other error handlers
   */
  public async handleError(
    error: Error | ServiceError,
    context: ErrorContext = {},
    config: Partial<ErrorHandlingConfig> = {}
  ): Promise<void> {
    const fullConfig: ErrorHandlingConfig = {
      showUserNotification: true,
      logToAnalytics: true,
      reportToCrashlytics: true,
      severity: ErrorSeverity.MEDIUM,
      ...config,
    };

    try {
      // Add to error queue for processing
      this.errorQueue.push({
        error: error as Error,
        context,
        timestamp: Date.now(),
      });

      // Process immediately for high severity errors
      if (fullConfig.severity === ErrorSeverity.CRITICAL) {
        await this.processErrorQueue();
      } else if (!this.isProcessingQueue) {
        // Process queue with delay for batching
        setTimeout(() => this.processErrorQueue(), 1000);
      }

      // Handle user notification immediately for critical errors
      if (fullConfig.showUserNotification && fullConfig.severity === ErrorSeverity.CRITICAL) {
        await this.showUserNotification(error, context);
      }

      // Execute recovery action if provided
      if (fullConfig.recoveryAction) {
        try {
          await fullConfig.recoveryAction();
        } catch (recoveryError) {
          console.error('Recovery action failed:', recoveryError);
        }
      }

    } catch (handlerError) {
      // Prevent infinite loops
      console.error('Error in error handler:', handlerError);
    }
  }

  /**
   * Process queued errors in batches
   */
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const errorsToProcess = [...this.errorQueue];
      this.errorQueue = [];

      for (const { error, context } of errorsToProcess) {
        await this.logError(error, context);
      }
    } catch (processingError) {
      console.error('Error processing error queue:', processingError);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Log error to analytics and crash reporting services
   */
  private async logError(error: Error, context: ErrorContext): Promise<void> {
    try {
      // Log to analytics service
      await analyticsService.trackEvent('error_occurred', {
        error_name: error.name,
        error_message: this.sanitizeErrorMessage(error.message),
        stack_trace: this.sanitizeStackTrace(error.stack),
        user_id: context.userId,
        screen: context.screen,
        action: context.action,
        timestamp: new Date().toISOString(),
      });

      // In production, would also log to crash reporting service
      if (__DEV__) {
        console.group('🚨 Error Details');
        console.error('Error:', error);
        console.log('Context:', context);
        console.groupEnd();
      }

    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  /**
   * Show empathetic error notification to user
   */
  private async showUserNotification(error: Error, context: ErrorContext): Promise<void> {
    const isNetworkError = this.isNetworkError(error);
    const isAuthError = this.isAuthenticationError(error);

    let title: string;
    let message: string;
    let actions: Array<{ text: string; onPress?: () => void }> = [];

    if (isNetworkError) {
      title = "Connection Issue";
      message = "We're having trouble connecting right now. Your data is safe and we'll sync when you're back online.";
      actions = [
        { text: "OK" },
        { 
          text: "Retry", 
          onPress: () => {
            // Trigger app-wide retry logic
            this.triggerRetry(context);
          }
        },
      ];
    } else if (isAuthError) {
      title = "Sign In Needed";
      message = "To keep your information secure, please sign in again.";
      actions = [
        { text: "Not Now" },
        { 
          text: "Sign In", 
          onPress: () => {
            // Navigate to auth screen
            this.navigateToAuth();
          }
        },
      ];
    } else {
      title = "Something Went Wrong";
      message = "We're working to fix this. Your progress is saved and you can continue where you left off.";
      actions = [
        { text: "OK" },
        { 
          text: "Report Issue", 
          onPress: () => {
            this.openSupportFlow(error, context);
          }
        },
      ];
    }

    Alert.alert(title, message, actions);
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(reason: any, context: ErrorContext): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    this.handleError(error, {
      ...context,
      action: 'unhandled_rejection',
    }, {
      severity: ErrorSeverity.HIGH,
      showUserNotification: !this.isMinorError(error),
    });
  }

  /**
   * Handle uncaught exceptions
   */
  private handleUncaughtException(error: Error, context: ErrorContext): void {
    this.handleError(error, {
      ...context,
      action: 'uncaught_exception',
    }, {
      severity: ErrorSeverity.CRITICAL,
      showUserNotification: true,
    });
  }

  /**
   * Determine if error is network-related
   */
  private isNetworkError(error: Error): boolean {
    const networkPatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /connection/i,
      /offline/i,
      /ENOTFOUND/,
      /ECONNREFUSED/,
    ];

    return networkPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Determine if error is authentication-related
   */
  private isAuthenticationError(error: Error): boolean {
    const authPatterns = [
      /unauthorized/i,
      /authentication/i,
      /invalid.*token/i,
      /expired.*token/i,
      /forbidden/i,
      /401/,
      /403/,
    ];

    return authPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Determine if error is minor and shouldn't show user notification
   */
  private isMinorError(error: Error): boolean {
    const minorPatterns = [
      /warning/i,
      /deprecated/i,
      /console/i,
    ];

    return minorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Sanitize error message for logging (remove sensitive data)
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potential sensitive data
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]')
      .replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]')
      .replace(/key[=:]\s*\S+/gi, 'key=[REDACTED]')
      .replace(/secret[=:]\s*\S+/gi, 'secret=[REDACTED]');
  }

  /**
   * Sanitize stack trace for logging
   */
  private sanitizeStackTrace(stack?: string): string {
    if (!stack) return '';
    
    // Remove file paths that might contain sensitive info
    return stack.replace(/\/Users\/[^\/]+/g, '/Users/[USER]');
  }

  /**
   * Trigger app-wide retry logic
   */
  private triggerRetry(context: ErrorContext): void {
    // Would trigger retry based on context
    // For now, just log the retry attempt
    console.log('Triggering retry for context:', context);
  }

  /**
   * Navigate to authentication screen
   */
  private navigateToAuth(): void {
    // Would trigger navigation to auth screen
    // This would be implemented with navigation service
    console.log('Navigating to auth screen');
  }

  /**
   * Open support flow for user to report issue
   */
  private openSupportFlow(error: Error, context: ErrorContext): void {
    // Would open support/feedback flow
    // For crisis intervention app, this is important
    console.log('Opening support flow for error:', error.name);
  }

  /**
   * Create a standardized ServiceResult from an error
   */
  public createErrorResult<T>(error: Error, context?: ErrorContext): ServiceResult<T> {
    return {
      success: false,
      error: new ServiceError(
        error.message,
        this.mapErrorToCode(error),
        ErrorSeverity.MEDIUM,
        error.name,
        context?.additionalData
      ),
    };
  }

  /**
   * Map error types to standard error codes
   */
  private mapErrorToCode(error: Error): string {
    if (this.isNetworkError(error)) return 'NETWORK_ERROR';
    if (this.isAuthenticationError(error)) return 'AUTH_ERROR';
    return 'UNKNOWN_ERROR';
  }
}

export const globalErrorHandler = GlobalErrorHandler.getInstance();

/**
 * Utility function for wrapping async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  config?: Partial<ErrorHandlingConfig>
): Promise<ServiceResult<T>> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    await globalErrorHandler.handleError(error as Error, context, config);
    return globalErrorHandler.createErrorResult<T>(error as Error, context);
  }
}

/**
 * Utility function for wrapping sync operations with error handling
 */
export function withSyncErrorHandling<T>(
  operation: () => T,
  context: ErrorContext,
  config?: Partial<ErrorHandlingConfig>
): ServiceResult<T> {
  try {
    const result = operation();
    return { success: true, data: result };
  } catch (error) {
    globalErrorHandler.handleError(error as Error, context, config);
    return globalErrorHandler.createErrorResult<T>(error as Error, context);
  }
}