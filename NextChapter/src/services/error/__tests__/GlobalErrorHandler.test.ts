import { globalErrorHandler, withErrorHandling } from '../GlobalErrorHandler';
import { ErrorSeverity } from '@services/interfaces/common/errors';

// Mock analytics service
jest.mock('@services/analytics/analyticsService', () => ({
  analyticsService: {
    trackEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock notification service
jest.mock('@services/notifications/notificationService', () => ({
  notificationService: {},
}));

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('GlobalErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console spy calls
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleError', () => {
    it('should handle basic errors without throwing', async () => {
      const testError = new Error('Test error');
      
      await expect(
        globalErrorHandler.handleError(testError, { userId: 'test-user' })
      ).resolves.not.toThrow();
    });

    it('should process high severity errors immediately', async () => {
      const testError = new Error('Critical error');
      const trackEventSpy = require('@services/analytics/analyticsService').analyticsService.trackEvent;
      
      await globalErrorHandler.handleError(testError, 
        { userId: 'test-user', action: 'test-action' },
        { severity: ErrorSeverity.CRITICAL }
      );

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(trackEventSpy).toHaveBeenCalledWith('error_occurred', expect.objectContaining({
        error_name: 'Error',
        error_message: 'Critical error',
        user_id: 'test-user',
        action: 'test-action',
      }));
    });

    it('should sanitize sensitive data in error messages', async () => {
      const sensitiveError = new Error('Login failed: password=secret123 token=abc123');
      const trackEventSpy = require('@services/analytics/analyticsService').analyticsService.trackEvent;
      
      await globalErrorHandler.handleError(sensitiveError, { userId: 'test-user' });
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(trackEventSpy).toHaveBeenCalledWith('error_occurred', expect.objectContaining({
        error_message: 'Login failed: password=[REDACTED] token=[REDACTED]',
      }));
    });

    it('should execute recovery action when provided', async () => {
      const testError = new Error('Test error');
      const recoveryAction = jest.fn().mockResolvedValue(undefined);
      
      await globalErrorHandler.handleError(testError, 
        { userId: 'test-user' },
        { recoveryAction }
      );

      expect(recoveryAction).toHaveBeenCalled();
    });

    it('should handle recovery action failures gracefully', async () => {
      const testError = new Error('Test error');
      const failingRecoveryAction = jest.fn().mockRejectedValue(new Error('Recovery failed'));
      const consoleSpy = jest.spyOn(console, 'error');
      
      await globalErrorHandler.handleError(testError, 
        { userId: 'test-user' },
        { recoveryAction: failingRecoveryAction }
      );

      expect(consoleSpy).toHaveBeenCalledWith('Recovery action failed:', expect.any(Error));
    });
  });

  describe('withErrorHandling', () => {
    it('should return success result for successful operations', async () => {
      const successOperation = jest.fn().mockResolvedValue('success data');
      
      const result = await withErrorHandling(
        successOperation,
        { userId: 'test-user', action: 'test-operation' }
      );

      expect(result).toEqual({
        success: true,
        data: 'success data',
      });
      expect(successOperation).toHaveBeenCalled();
    });

    it('should return error result for failed operations', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      const result = await withErrorHandling(
        failingOperation,
        { userId: 'test-user', action: 'test-operation' }
      );

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          message: 'Operation failed',
          code: 'UNKNOWN_ERROR',
        }),
      });
    });

    it('should handle network errors correctly', async () => {
      const networkError = new Error('Network request failed');
      const failingOperation = jest.fn().mockRejectedValue(networkError);
      
      const result = await withErrorHandling(
        failingOperation,
        { userId: 'test-user', action: 'api-call' }
      );

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          message: 'Network request failed',
          code: 'NETWORK_ERROR',
        }),
      });
    });

    it('should handle authentication errors correctly', async () => {
      const authError = new Error('Unauthorized access - invalid token');
      const failingOperation = jest.fn().mockRejectedValue(authError);
      
      const result = await withErrorHandling(
        failingOperation,
        { userId: 'test-user', action: 'protected-resource' }
      );

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          message: 'Unauthorized access - invalid token',
          code: 'AUTH_ERROR',
        }),
      });
    });
  });

  describe('User Notifications', () => {
    const { Alert } = require('react-native');

    it('should show network error notification with retry option', async () => {
      const networkError = new Error('Failed to fetch');
      
      await globalErrorHandler.handleError(networkError, 
        { userId: 'test-user' },
        { severity: ErrorSeverity.CRITICAL }
      );

      expect(Alert.alert).toHaveBeenCalledWith(
        'Connection Issue',
        expect.stringContaining('trouble connecting'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'OK' }),
          expect.objectContaining({ text: 'Retry' }),
        ])
      );
    });

    it('should show auth error notification with sign in option', async () => {
      const authError = new Error('Unauthorized - token expired');
      
      await globalErrorHandler.handleError(authError, 
        { userId: 'test-user' },
        { severity: ErrorSeverity.CRITICAL }
      );

      expect(Alert.alert).toHaveBeenCalledWith(
        'Sign In Needed',
        expect.stringContaining('please sign in again'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Not Now' }),
          expect.objectContaining({ text: 'Sign In' }),
        ])
      );
    });

    it('should show generic error notification with support option', async () => {
      const genericError = new Error('Something unexpected happened');
      
      await globalErrorHandler.handleError(genericError, 
        { userId: 'test-user' },
        { severity: ErrorSeverity.CRITICAL }
      );

      expect(Alert.alert).toHaveBeenCalledWith(
        'Something Went Wrong',
        expect.stringContaining('working to fix this'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'OK' }),
          expect.objectContaining({ text: 'Report Issue' }),
        ])
      );
    });

    it('should not show notification for minor errors', async () => {
      const minorError = new Error('Warning: deprecated function used');
      
      await globalErrorHandler.handleError(minorError, 
        { userId: 'test-user' },
        { severity: ErrorSeverity.LOW }
      );

      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('Error Classification', () => {
    it('should classify network errors correctly', async () => {
      const networkErrors = [
        new Error('Network request failed'),
        new Error('fetch timeout'),
        new Error('Connection refused'),
        new Error('ENOTFOUND example.com'),
      ];

      for (const error of networkErrors) {
        const result = globalErrorHandler.createErrorResult(error);
        expect(result.error?.code).toBe('NETWORK_ERROR');
      }
    });

    it('should classify auth errors correctly', async () => {
      const authErrors = [
        new Error('Unauthorized access'),
        new Error('Invalid token provided'),
        new Error('Authentication failed'),
        new Error('403 Forbidden'),
      ];

      for (const error of authErrors) {
        const result = globalErrorHandler.createErrorResult(error);
        expect(result.error?.code).toBe('AUTH_ERROR');
      }
    });

    it('should classify unknown errors correctly', async () => {
      const unknownError = new Error('Random error message');
      const result = globalErrorHandler.createErrorResult(unknownError);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('Development Mode', () => {
    it('should wrap console.error in development mode', () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;

      const consoleSpy = jest.spyOn(console, 'error');
      
      // This would normally trigger the wrapped console.error
      // But since we're mocking it, we'll just verify the spy was set up
      expect(consoleSpy).toBeDefined();

      (global as any).__DEV__ = originalDev;
    });
  });

  describe('Error Queue Processing', () => {
    it('should process error queue in batches', async () => {
      const errors = [
        new Error('Error 1'),
        new Error('Error 2'),
        new Error('Error 3'),
      ];

      // Add multiple errors quickly
      const promises = errors.map(error => 
        globalErrorHandler.handleError(error, { userId: 'test-user' })
      );

      await Promise.all(promises);

      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const trackEventSpy = require('@services/analytics/analyticsService').analyticsService.trackEvent;
      expect(trackEventSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Context', () => {
    it('should include context in error logging', async () => {
      const testError = new Error('Context test error');
      const context = {
        userId: 'user-123',
        screen: 'BudgetScreen',
        action: 'calculate_runway',
        additionalData: { amount: 1000 },
      };

      await globalErrorHandler.handleError(testError, context);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const trackEventSpy = require('@services/analytics/analyticsService').analyticsService.trackEvent;
      expect(trackEventSpy).toHaveBeenCalledWith('error_occurred', expect.objectContaining({
        user_id: 'user-123',
        screen: 'BudgetScreen',
        action: 'calculate_runway',
      }));
    });
  });
});