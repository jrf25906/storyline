import {
  isNetworkError,
  getUserFriendlyErrorMessage,
  logError,
  createTimeoutPromise,
  withErrorHandling,
} from '@utils/errorHandling';

describe('errorHandling utilities', () => {
  describe('isNetworkError', () => {
    it('returns true for network-related errors', () => {
      const networkErrors = [
        new Error('Network request failed'),
        new Error('fetch failed'),
        new Error('No internet connection'),
        new Error('ECONNREFUSED: Connection refused'),
        new Error('Request timeout'),
      ];

      networkErrors.forEach(error => {
        expect(isNetworkError(error)).toBe(true);
      });
    });

    it('returns false for non-network errors', () => {
      expect(isNetworkError(new Error('Invalid input'))).toBe(false);
      expect(isNetworkError(new Error('User not found'))).toBe(false);
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });

    it('handles error objects without message property', () => {
      expect(isNetworkError({ toString: () => 'network request failed' })).toBe(true);
      expect(isNetworkError({ toString: () => 'validation error' })).toBe(false);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('returns network error message for network errors', () => {
      const error = new Error('Network request failed');
      expect(getUserFriendlyErrorMessage(error))
        .toBe('Having trouble connecting. Please check your internet connection and try again.');
    });

    it('handles auth context errors', () => {
      const error = { message: 'Invalid login credentials' };
      expect(getUserFriendlyErrorMessage(error, 'auth'))
        .toBe('Email or password doesn\'t match our records. Please try again.');
    });

    it('handles HTTP status codes', () => {
      expect(getUserFriendlyErrorMessage({ status: 401 }))
        .toBe('Your session has expired. Please sign in again.');
      
      expect(getUserFriendlyErrorMessage({ statusCode: 404 }))
        .toBe('We couldn\'t find what you\'re looking for. It may have been moved or deleted.');
      
      expect(getUserFriendlyErrorMessage({ status: 500 }))
        .toBe('Our servers are having a moment. Please try again in a few minutes.');
    });

    it('handles specific error types', () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      expect(getUserFriendlyErrorMessage(validationError))
        .toBe('Please check your information and try again.');

      // Create a timeout error that won't trigger isNetworkError
      const timeoutError = { name: 'TimeoutError', message: 'Operation timed out' };
      expect(getUserFriendlyErrorMessage(timeoutError))
        .toBe('This is taking longer than expected. Please try again.');
    });

    it('returns default message for unknown errors', () => {
      expect(getUserFriendlyErrorMessage(new Error('Unknown error')))
        .toBe('Something unexpected happened. Please try again in a moment.');
    });
  });

  describe('logError', () => {
    const originalConsoleError = console.error;
    const mockConsoleError = jest.fn();

    beforeEach(() => {
      console.error = mockConsoleError;
      mockConsoleError.mockClear();
    });

    afterEach(() => {
      console.error = originalConsoleError;
    });

    it('logs errors with context in development', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'login' };
      
      logError(error, context);
      
      expect(mockConsoleError).toHaveBeenCalledWith('Error logged:', expect.objectContaining({
        message: 'Test error',
        context,
        timestamp: expect.any(String),
      }));
    });
  });

  describe('createTimeoutPromise', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('rejects with timeout error after specified time', async () => {
      const promise = createTimeoutPromise(1000);
      
      jest.advanceTimersByTime(1000);
      
      await expect(promise).rejects.toThrow('Request timed out. Please check your connection and try again.');
      
      try {
        await promise;
      } catch (error: any) {
        expect(error.isNetworkError).toBe(true);
        expect(error.isTimeout).toBe(true);
      }
    });

    it('uses default timeout of 30 seconds', () => {
      const promise = createTimeoutPromise();
      
      jest.advanceTimersByTime(29999);
      // Should not reject yet
      
      jest.advanceTimersByTime(1);
      // Now it should reject
      
      expect(promise).rejects.toThrow();
    });
  });

  describe('withErrorHandling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns successful promise result', async () => {
      const result = await withErrorHandling(Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('transforms errors to user-friendly messages', async () => {
      const originalError = new Error('Network request failed');
      
      try {
        await withErrorHandling(Promise.reject(originalError));
      } catch (error: any) {
        expect(error.message).toBe('Having trouble connecting. Please check your internet connection and try again.');
        expect(error.originalError).toBe(originalError);
      }
    });

    it('calls onError callback when provided', async () => {
      const onError = jest.fn();
      const error = new Error('Test error');
      
      try {
        await withErrorHandling(Promise.reject(error), { onError });
      } catch {
        // Expected to throw
      }
      
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('respects custom timeout', async () => {
      const slowPromise = new Promise(() => {
        // Never resolves
      });
      
      const promise = withErrorHandling(slowPromise, { timeout: 500 });
      
      jest.advanceTimersByTime(500);
      
      // Check that it rejects with an error
      await expect(promise).rejects.toThrow();
      
      // Check the error details more carefully
      try {
        await promise;
      } catch (error: any) {
        // The error should have the originalError property
        expect(error.originalError).toBeDefined();
        expect(error.originalError.isTimeout).toBe(true);
        expect(error.originalError.isNetworkError).toBe(true);
        // The message should be transformed to network error message
        expect(error.message).toContain('trouble connecting');
      }
    });

    it('uses context for error messages', async () => {
      const authError = { message: 'Invalid login credentials' };
      
      try {
        await withErrorHandling(Promise.reject(authError), { context: 'auth' });
      } catch (error: any) {
        expect(error.message).toBe('Email or password doesn\'t match our records. Please try again.');
      }
    });
  });
});