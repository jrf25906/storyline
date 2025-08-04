import { Job } from 'bull';
import axios, { AxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger';

export interface WebhookJobData {
  url: string;
  payload: any;
  exportId: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryCount?: number;
}

export interface WebhookJobResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
}

export class WebhookProcessor {
  private readonly defaultTimeout = 10000; // 10 seconds
  private readonly maxRetries = 3;

  /**
   * Process webhook notification job
   */
  public async process(job: Job<WebhookJobData>): Promise<WebhookJobResult> {
    const { url, payload, exportId, headers, timeout } = job.data;
    const startTime = Date.now();

    logger.info('Processing webhook notification', {
      jobId: job.id,
      exportId,
      url: this.sanitizeUrl(url),
      attempt: job.attemptsMade + 1
    });

    try {
      // Prepare request configuration
      const config: AxiosRequestConfig = {
        method: 'POST',
        url,
        data: payload,
        timeout: timeout || this.defaultTimeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Storyline-Export-Service/1.0',
          'X-Export-ID': exportId,
          'X-Webhook-Timestamp': new Date().toISOString(),
          ...headers
        },
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      };

      // Add signature if secret is provided (for webhook verification)
      if (process.env.WEBHOOK_SECRET) {
        const signature = this.generateSignature(payload, process.env.WEBHOOK_SECRET);
        config.headers!['X-Webhook-Signature'] = signature;
      }

      // Make the webhook request
      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      if (response.status >= 200 && response.status < 300) {
        logger.info('Webhook notification successful', {
          jobId: job.id,
          exportId,
          url: this.sanitizeUrl(url),
          statusCode: response.status,
          responseTime
        });

        return {
          success: true,
          statusCode: response.status,
          responseTime
        };
      } else {
        const error = `HTTP ${response.status}: ${response.statusText}`;
        logger.warn('Webhook notification failed with client error', {
          jobId: job.id,
          exportId,
          url: this.sanitizeUrl(url),
          statusCode: response.status,
          error,
          responseTime
        });

        // Don't retry 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            statusCode: response.status,
            responseTime,
            error
          };
        }

        throw new Error(error);
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = this.extractErrorMessage(error);

      logger.error('Webhook notification failed', {
        jobId: job.id,
        exportId,
        url: this.sanitizeUrl(url),
        error: errorMessage,
        responseTime,
        attempt: job.attemptsMade + 1,
        willRetry: job.attemptsMade < (job.opts.attempts || this.maxRetries) - 1
      });

      // Re-throw to trigger retry mechanism
      throw new Error(errorMessage);
    }
  }

  /**
   * Handle webhook job completion
   */
  public async onCompleted(job: Job<WebhookJobData>, result: WebhookJobResult): Promise<void> {
    logger.info('Webhook job completed', {
      jobId: job.id,
      exportId: job.data.exportId,
      success: result.success,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      totalAttempts: job.attemptsMade + 1
    });
  }

  /**
   * Handle webhook job failure (after all retries)
   */
  public async onFailed(job: Job<WebhookJobData>, error: Error): Promise<void> {
    logger.error('Webhook job failed permanently', {
      jobId: job.id,
      exportId: job.data.exportId,
      url: this.sanitizeUrl(job.data.url),
      error: error.message,
      totalAttempts: job.attemptsMade,
      maxAttempts: job.opts.attempts
    });

    // Here you might want to store failed webhook attempts for manual retry
    // or alerting purposes
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private generateSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Extract meaningful error message from axios error
   */
  private extractErrorMessage(error: any): string {
    if (error.response) {
      // Server responded with error status
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // Request was made but no response received
      if (error.code === 'ECONNABORTED') {
        return 'Request timeout';
      } else if (error.code === 'ECONNREFUSED') {
        return 'Connection refused';
      } else if (error.code === 'ENOTFOUND') {
        return 'DNS resolution failed';
      } else {
        return `Network error: ${error.code || 'Unknown'}`;
      }
    } else {
      // Something else happened
      return error.message || 'Unknown error';
    }
  }

  /**
   * Sanitize URL for logging (remove sensitive query parameters)
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove potentially sensitive query parameters
      const sensitiveParams = ['token', 'key', 'secret', 'auth', 'api_key'];
      
      for (const param of sensitiveParams) {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      }
      
      return urlObj.toString();
    } catch {
      // If URL parsing fails, just return the original URL
      return url;
    }
  }

  /**
   * Validate webhook job data
   */
  public validateJobData(data: WebhookJobData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.url) {
      errors.push('url is required');
    } else {
      try {
        new URL(data.url);
      } catch {
        errors.push('url must be a valid URL');
      }
    }

    if (!data.payload) {
      errors.push('payload is required');
    }

    if (!data.exportId) {
      errors.push('exportId is required');
    }

    if (data.timeout && (data.timeout < 1000 || data.timeout > 60000)) {
      errors.push('timeout must be between 1000 and 60000 milliseconds');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get retry delay based on attempt number
   */
  public getRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 2^attempt * 1000ms, capped at 30 seconds
    return Math.min(Math.pow(2, attemptNumber) * 1000, 30000);
  }

  /**
   * Check if error should trigger retry
   */
  public shouldRetry(error: any, attemptNumber: number): boolean {
    // Don't retry if we've exceeded max attempts
    if (attemptNumber >= this.maxRetries) {
      return false;
    }

    // Don't retry 4xx client errors (except 408, 429)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      const retryableClientErrors = [408, 429]; // Request Timeout, Too Many Requests
      return retryableClientErrors.includes(error.response.status);
    }

    // Retry 5xx server errors and network errors
    return true;
  }

  /**
   * Create standardized webhook payload
   */
  public createWebhookPayload(
    exportId: string,
    status: 'completed' | 'failed',
    data?: {
      downloadUrl?: string;
      downloadExpiresAt?: Date;
      fileSize?: number;
      metadata?: Record<string, any>;
      errorMessage?: string;
    }
  ): any {
    const payload: any = {
      event: 'export.status_changed',
      exportId,
      status,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    if (data) {
      if (status === 'completed') {
        payload.data = {
          downloadUrl: data.downloadUrl,
          downloadExpiresAt: data.downloadExpiresAt,
          fileSize: data.fileSize,
          metadata: data.metadata
        };
      } else if (status === 'failed' && data.errorMessage) {
        payload.error = {
          message: data.errorMessage,
          timestamp: new Date().toISOString()
        };
      }
    }

    return payload;
  }
}