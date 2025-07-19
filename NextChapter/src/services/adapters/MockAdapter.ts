import { Result } from '@services/interfaces/common';
import { BaseAdapter } from '@services/adapters/BaseAdapter';

/**
 * Options for configuring mock behavior
 */
export interface MockAdapterOptions {
  initializeDelay?: number;
  shouldFailInitialize?: boolean;
  initializeError?: Error;
}

/**
 * Base mock adapter for testing
 * Provides controllable behavior for unit tests
 */
export class MockAdapter extends BaseAdapter {
  private options: MockAdapterOptions;
  private initializeCalls = 0;
  private disposeCalls = 0;

  constructor(options: MockAdapterOptions = {}) {
    super();
    this.options = options;
  }

  /**
   * Get number of times initialize was called
   */
  getInitializeCalls(): number {
    return this.initializeCalls;
  }

  /**
   * Get number of times dispose was called
   */
  getDisposeCalls(): number {
    return this.disposeCalls;
  }

  /**
   * Reset call counters
   */
  resetCounters(): void {
    this.initializeCalls = 0;
    this.disposeCalls = 0;
  }

  protected async onInitialize(): Promise<Result<void>> {
    this.initializeCalls++;

    // Simulate initialization delay
    if (this.options.initializeDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.options.initializeDelay)
      );
    }

    // Simulate initialization failure
    if (this.options.shouldFailInitialize) {
      throw this.options.initializeError || new Error('Mock initialization failed');
    }

    return { success: true, data: undefined };
  }

  protected async onDispose(): Promise<void> {
    this.disposeCalls++;
  }

  /**
   * Expose protected methods for testing
   */
  testWrapAsync<T>(
    operation: () => Promise<T>
  ): Promise<Result<T>> {
    return this.wrapAsync(operation);
  }

  testWrap<T>(operation: () => T): Result<T> {
    return this.wrap(operation);
  }

  testRetry<T>(
    operation: () => Promise<T>,
    options?: Parameters<typeof this.retry>[1]
  ): Promise<T> {
    return this.retry(operation, options);
  }

  testCreateTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return this.createTimeout(promise, timeoutMs);
  }

  testEnsureInitialized(): Result<void> {
    return this.ensureInitialized();
  }
}