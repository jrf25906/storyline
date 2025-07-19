import {
  withApiCall,
  withDatabaseOperation,
  withAuthOperation,
  withFileOperation,
  withAIOperation,
  withNavigationOperation,
  withStorageOperation,
  withStateOperation,
  withValidation,
  withCrisisOperation,
} from '../errorWrappers';

// Mock the global error handler
jest.mock('@services/error/GlobalErrorHandler', () => ({
  globalErrorHandler: {
    handleError: jest.fn(),
    createErrorResult: jest.fn((error) => ({
      success: false,
      error: { message: error.message, code: 'TEST_ERROR' },
    })),
  },
  withErrorHandling: jest.fn(),
}));

describe('Error Wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup withErrorHandling mock
    const { withErrorHandling } = require('@services/error/GlobalErrorHandler');
    withErrorHandling.mockImplementation(async (operation, context, config) => {
      try {
        const result = await operation();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: { message: error.message, code: 'TEST_ERROR' } };
      }
    });
  });

  describe('withApiCall', () => {
    it('should return success result for successful API calls', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'success' });
      
      const result = await withApiCall(mockApiCall, 3, {
        service: 'userService',
        method: 'getProfile',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'success' });
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    it('should retry API calls on failure', async () => {
      const mockApiCall = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: 'success' });

      const result = await withApiCall(mockApiCall, 3, {
        service: 'userService',
        method: 'getProfile',
        userId: 'user-123',
      });

      expect(mockApiCall).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'success' });
    });

    it('should return error after all retries fail', async () => {
      const mockApiCall = jest.fn().mockRejectedValue(new Error('Persistent error'));

      const result = await withApiCall(mockApiCall, 2, {
        service: 'userService',
        method: 'getProfile',
        userId: 'user-123',
      });

      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Persistent error');
    });

    it('should implement exponential backoff between retries', async () => {
      const mockApiCall = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: 'success' });

      const startTime = Date.now();
      
      await withApiCall(mockApiCall, 2, {
        service: 'userService',
        method: 'getProfile',
        userId: 'user-123',
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThan(2000); // Should wait ~2 seconds for retry
      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });
  });

  describe('withDatabaseOperation', () => {
    it('should handle successful database operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      
      const result = await withDatabaseOperation(mockOperation, {
        table: 'users',
        operation: 'create',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, name: 'Test' });
    });

    it('should handle database operation failures', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      
      const result = await withDatabaseOperation(mockOperation, {
        table: 'users',
        operation: 'create',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Database connection failed');
    });
  });

  describe('withAuthOperation', () => {
    it('should handle successful authentication operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue({ token: 'abc123', user: { id: 1 } });
      
      const result = await withAuthOperation(mockOperation, {
        action: 'login',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ token: 'abc123', user: { id: 1 } });
    });

    it('should handle authentication failures', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      
      const result = await withAuthOperation(mockOperation, {
        action: 'login',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Invalid credentials');
    });
  });

  describe('withFileOperation', () => {
    it('should handle successful file operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue({ url: 'https://example.com/file.pdf' });
      
      const result = await withFileOperation(mockOperation, {
        type: 'upload',
        fileName: 'resume.pdf',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ url: 'https://example.com/file.pdf' });
    });

    it('should handle file operation failures', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('File too large'));
      
      const result = await withFileOperation(mockOperation, {
        type: 'upload',
        fileName: 'resume.pdf',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('File too large');
    });
  });

  describe('withAIOperation', () => {
    it('should handle successful AI operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue({ response: 'AI generated response' });
      
      const result = await withAIOperation(mockOperation, {
        model: 'gpt-4',
        operation: 'chat',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ response: 'AI generated response' });
    });

    it('should handle AI operation failures', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Rate limit exceeded'));
      
      const result = await withAIOperation(mockOperation, {
        model: 'gpt-4',
        operation: 'chat',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Rate limit exceeded');
    });
  });

  describe('withNavigationOperation', () => {
    it('should handle successful navigation operations', () => {
      const mockOperation = jest.fn().mockReturnValue({ success: true });
      
      const result = withNavigationOperation(mockOperation, {
        from: 'HomeScreen',
        to: 'ProfileScreen',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true });
    });

    it('should handle navigation operation failures', () => {
      const mockOperation = jest.fn().mockImplementation(() => {
        throw new Error('Navigation stack error');
      });
      
      const result = withNavigationOperation(mockOperation, {
        from: 'HomeScreen',
        to: 'ProfileScreen',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Navigation stack error');
    });
  });

  describe('withStorageOperation', () => {
    it('should handle successful storage operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue('stored_value');
      
      const result = await withStorageOperation(mockOperation, {
        key: 'user_preferences',
        operation: 'get',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('stored_value');
    });

    it('should handle storage operation failures', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Storage quota exceeded'));
      
      const result = await withStorageOperation(mockOperation, {
        key: 'user_preferences',
        operation: 'set',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Storage quota exceeded');
    });
  });

  describe('withStateOperation', () => {
    it('should handle successful state operations', () => {
      const mockOperation = jest.fn().mockReturnValue({ newState: 'updated' });
      
      const result = withStateOperation(mockOperation, {
        store: 'userStore',
        action: 'updateProfile',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ newState: 'updated' });
    });

    it('should handle state operation failures', () => {
      const mockOperation = jest.fn().mockImplementation(() => {
        throw new Error('Invalid state transition');
      });
      
      const result = withStateOperation(mockOperation, {
        store: 'userStore',
        action: 'updateProfile',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Invalid state transition');
    });
  });

  describe('withValidation', () => {
    it('should handle successful validation', () => {
      const mockOperation = jest.fn().mockReturnValue({ isValid: true });
      
      const result = withValidation(mockOperation, {
        field: 'email',
        value: 'test@example.com',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ isValid: true });
    });

    it('should handle validation failures', () => {
      const mockOperation = jest.fn().mockImplementation(() => {
        throw new Error('Email format is invalid');
      });
      
      const result = withValidation(mockOperation, {
        field: 'email',
        value: 'invalid-email',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Email format is invalid');
    });
  });

  describe('withCrisisOperation', () => {
    it('should handle successful crisis operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue({ resourcesFound: 5 });
      
      const result = await withCrisisOperation(mockOperation, {
        feature: 'resource_access',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ resourcesFound: 5 });
    });

    it('should handle crisis operation failures with high priority', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Crisis service unavailable'));
      
      const result = await withCrisisOperation(mockOperation, {
        feature: 'crisis_detection',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Crisis service unavailable');
      
      // Verify that crisis operations are treated with high priority
      const { withErrorHandling } = require('@services/error/GlobalErrorHandler');
      expect(withErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          action: 'crisis.crisis_detection',
          userId: 'user-123',
        }),
        expect.objectContaining({
          severity: 'CRITICAL',
          showUserNotification: true,
          logToAnalytics: true,
          reportToCrashlytics: true,
        })
      );
    });
  });

  describe('Error Context Tracking', () => {
    it('should include proper context in all wrapper calls', async () => {
      const { withErrorHandling } = require('@services/error/GlobalErrorHandler');
      const mockOperation = jest.fn().mockResolvedValue('success');

      await withApiCall(mockOperation, 1, {
        service: 'testService',
        method: 'testMethod',
        userId: 'user-123',
      });

      expect(withErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          action: 'testService.testMethod',
          userId: 'user-123',
          additionalData: expect.objectContaining({
            attempt: 1,
            retryCount: 1,
          }),
        }),
        expect.any(Object)
      );
    });

    it('should track file names in file operations', async () => {
      const { withErrorHandling } = require('@services/error/GlobalErrorHandler');
      const mockOperation = jest.fn().mockResolvedValue('success');

      await withFileOperation(mockOperation, {
        type: 'upload',
        fileName: 'important-document.pdf',
        userId: 'user-123',
      });

      expect(withErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          action: 'file.upload',
          userId: 'user-123',
          additionalData: expect.objectContaining({
            fileName: 'important-document.pdf',
          }),
        }),
        expect.any(Object)
      );
    });
  });
});