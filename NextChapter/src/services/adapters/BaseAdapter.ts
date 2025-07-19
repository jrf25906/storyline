import { Result, AppError, ErrorType, ServiceLifecycle } from '@services/interfaces/common';

/**
 * Base adapter class implementing common service patterns
 * All service adapters should extend this class
 */
export abstract class BaseAdapter implements ServiceLifecycle {
  protected initialized = false;
  private disposables: Array<() => void | Promise<void>> = [];

  /**
   * Initialize the service
   */
  async initialize(): Promise<Result<void>> {
    if (this.initialized) {
      return { success: true, data: undefined };
    }

    try {
      const result = await this.onInitialize();
      if (result.success) {
        this.initialized = true;
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Dispose the service
   */
  async dispose(): Promise<void> {
    try {
      // Run all disposables
      for (const disposable of this.disposables) {
        await disposable();
      }
      this.disposables = [];

      // Run custom disposal
      await this.onDispose();
      
      this.initialized = false;
    } catch (error) {
      console.error('Error during disposal:', error);
      throw error;
    }
  }

  /**
   * Add a disposable to be cleaned up
   */
  protected addDisposable(disposable: () => void | Promise<void>): void {
    this.disposables.push(disposable);
  }

  /**
   * Ensure service is initialized before operation
   */
  protected ensureInitialized(): Result<void> {
    if (!this.initialized) {
      return {
        success: false,
        error: new AppError(
          ErrorType.UNKNOWN_ERROR,
          'Service not initialized',
          { service: this.constructor.name }
        ),
      };
    }
    return { success: true, data: undefined };
  }

  /**
   * Wrap async operations with error handling
   */
  protected async wrapAsync<T>(
    operation: () => Promise<T>,
    errorType: ErrorType = ErrorType.UNKNOWN_ERROR,
    errorMessage?: string
  ): Promise<Result<T>> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const appError = AppError.from(error);
      return {
        success: false,
        error: new AppError(
          errorType,
          errorMessage || appError.message,
          { originalError: appError }
        ),
      };
    }
  }

  /**
   * Wrap sync operations with error handling
   */
  protected wrap<T>(
    operation: () => T,
    errorType: ErrorType = ErrorType.UNKNOWN_ERROR,
    errorMessage?: string
  ): Result<T> {
    try {
      const data = operation();
      return { success: true, data };
    } catch (error) {
      const appError = AppError.from(error);
      return {
        success: false,
        error: new AppError(
          errorType,
          errorMessage || appError.message,
          { originalError: appError }
        ),
      };
    }
  }

  /**
   * Log debug information (only in dev)
   */
  protected debug(message: string, data?: any): void {
    if (__DEV__) {
      console.log(`[${this.constructor.name}] ${message}`, data);
    }
  }

  /**
   * Log warning
   */
  protected warn(message: string, data?: any): void {
    console.warn(`[${this.constructor.name}] ${message}`, data);
  }

  /**
   * Log error
   */
  protected error(message: string, error?: any): void {
    console.error(`[${this.constructor.name}] ${message}`, error);
  }

  /**
   * Override to implement initialization logic
   */
  protected abstract onInitialize(): Promise<Result<void>>;

  /**
   * Override to implement disposal logic
   */
  protected async onDispose(): Promise<void> {
    // Default: no-op
  }

  /**
   * Create a timeout promise
   */
  protected createTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutError?: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(timeoutError || `Operation timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Retry an operation with exponential backoff
   */
  protected async retry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      initialDelay?: number;
      maxDelay?: number;
      factor?: number;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      factor = 2,
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }

        this.debug(`Retry attempt ${attempt} failed, waiting ${delay}ms`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * factor, maxDelay);
      }
    }

    throw lastError!;
  }
}