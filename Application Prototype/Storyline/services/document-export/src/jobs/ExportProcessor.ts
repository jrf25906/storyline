import { Job } from 'bull';
import { ExportService } from '../services/ExportService';
import { webhookQueue } from '../config/queues';
import { logger } from '../utils/logger';
import { 
  ExportFormat, 
  ExportTemplate, 
  ExportOptions, 
  ExportRequest,
  ExportStatus 
} from '@storyline/shared-types';

export interface ExportJobData {
  exportId: string;
  documentId?: string;
  documentIds?: string[];
  userId: string;
  format: ExportFormat;
  template: ExportTemplate;
  options: ExportOptions;
  authorInfo?: {
    name: string;
    email?: string;
    bio?: string;
  };
  webhookUrl?: string;
  isBatch?: boolean;
}

export interface ExportJobResult {
  exportId: string;
  status: ExportStatus;
  downloadUrl?: string;
  downloadExpiresAt?: Date;
  fileSize?: number;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export class ExportProcessor {
  private exportService: ExportService;

  constructor() {
    this.exportService = ExportService.getInstance();
  }

  /**
   * Process export job
   */
  public async process(job: Job<ExportJobData>): Promise<ExportJobResult> {
    const { 
      exportId, 
      documentId, 
      documentIds, 
      userId, 
      format, 
      template, 
      options, 
      authorInfo, 
      webhookUrl,
      isBatch 
    } = job.data;

    logger.info('Processing export job', {
      jobId: job.id,
      exportId,
      format,
      template,
      isBatch,
      documentCount: isBatch ? documentIds?.length : 1
    });

    try {
      // Update job progress
      await job.progress(10);

      let exportResult;

      if (isBatch && documentIds?.length) {
        // Batch export
        await job.progress(20);
        exportResult = await this.exportService.exportBatchDocuments(
          documentIds,
          userId,
          format,
          template,
          options,
          authorInfo
        );
      } else if (documentId) {
        // Single document export
        await job.progress(20);
        exportResult = await this.exportService.exportDocument(
          documentId,
          userId,
          format,
          template,
          options,
          authorInfo
        );
      } else {
        throw new Error('Either documentId or documentIds must be provided');
      }

      await job.progress(90);

      // Schedule webhook notification if provided
      if (webhookUrl) {
        await this.scheduleWebhookNotification(
          exportId,
          webhookUrl,
          'completed',
          exportResult
        );
      }

      await job.progress(100);

      const result: ExportJobResult = {
        exportId,
        status: 'completed',
        downloadUrl: exportResult.downloadUrl,
        downloadExpiresAt: exportResult.downloadExpiresAt,
        fileSize: exportResult.fileSize,
        metadata: exportResult.metadata
      };

      logger.info('Export job completed successfully', {
        jobId: job.id,
        exportId,
        format,
        fileSize: `${(exportResult.fileSize / 1024).toFixed(2)} KB`
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Export job failed', {
        jobId: job.id,
        exportId,
        format,
        error: errorMessage
      });

      // Schedule webhook notification for failure if provided
      if (webhookUrl) {
        await this.scheduleWebhookNotification(
          exportId,
          webhookUrl,
          'failed',
          null,
          errorMessage
        );
      }

      const result: ExportJobResult = {
        exportId,
        status: 'failed',
        errorMessage
      };

      return result;
    }
  }

  /**
   * Schedule webhook notification
   */
  private async scheduleWebhookNotification(
    exportId: string,
    webhookUrl: string,
    status: ExportStatus,
    exportResult?: any,
    errorMessage?: string
  ): Promise<void> {
    try {
      const webhookPayload = {
        exportId,
        status,
        timestamp: new Date().toISOString(),
        ...(exportResult && {
          downloadUrl: exportResult.downloadUrl,
          downloadExpiresAt: exportResult.downloadExpiresAt,
          fileSize: exportResult.fileSize,
          metadata: exportResult.metadata
        }),
        ...(errorMessage && { errorMessage })
      };

      await webhookQueue.add('send-webhook', {
        url: webhookUrl,
        payload: webhookPayload,
        exportId
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      logger.info('Webhook notification scheduled', {
        exportId,
        webhookUrl,
        status
      });
    } catch (error) {
      logger.error('Failed to schedule webhook notification', {
        exportId,
        webhookUrl,
        error
      });
    }
  }

  /**
   * Handle job completion
   */
  public async onCompleted(job: Job<ExportJobData>, result: ExportJobResult): Promise<void> {
    logger.info('Export job completed', {
      jobId: job.id,
      exportId: result.exportId,
      status: result.status,
      processingTime: Date.now() - job.processedOn
    });

    // Here you would typically update the export status in a database
    // For now, we'll just log the completion
  }

  /**
   * Handle job failure
   */
  public async onFailed(job: Job<ExportJobData>, error: Error): Promise<void> {
    logger.error('Export job failed', {
      jobId: job.id,
      exportId: job.data.exportId,
      error: error.message,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts
    });

    // Here you would typically update the export status in a database
    // For now, we'll just log the failure
  }

  /**
   * Handle job stalled
   */
  public async onStalled(job: Job<ExportJobData>): Promise<void> {
    logger.warn('Export job stalled', {
      jobId: job.id,
      exportId: job.data.exportId,
      processingTime: Date.now() - job.processedOn
    });
  }

  /**
   * Validate job data
   */
  public validateJobData(data: ExportJobData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.exportId) {
      errors.push('exportId is required');
    }

    if (!data.userId) {
      errors.push('userId is required');
    }

    if (!data.format) {
      errors.push('format is required');
    }

    if (!data.template) {
      errors.push('template is required');
    }

    if (data.isBatch) {
      if (!data.documentIds || data.documentIds.length === 0) {
        errors.push('documentIds is required for batch exports');
      }
    } else {
      if (!data.documentId) {
        errors.push('documentId is required for single document exports');
      }
    }

    // Validate export options if provided
    if (data.options) {
      const validationResult = this.exportService.validateExportOptions(data.format, data.options);
      if (!validationResult.valid) {
        errors.push(...validationResult.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get job priority based on format and options
   */
  public getJobPriority(data: ExportJobData): number {
    let priority = 0;

    // Higher priority for simpler formats
    switch (data.format) {
      case 'txt':
        priority = 10;
        break;
      case 'markdown':
        priority = 9;
        break;
      case 'html':
        priority = 8;
        break;
      case 'docx':
        priority = 7;
        break;
      case 'pdf':
        priority = 5;
        break;
      case 'epub':
        priority = 3;
        break;
    }

    // Lower priority for batch jobs
    if (data.isBatch) {
      priority -= 2;
    }

    // Lower priority for complex templates
    if (data.template === 'screenplay' || data.template === 'academic') {
      priority -= 1;
    }

    return Math.max(1, priority);
  }

  /**
   * Estimate job duration based on format and content
   */
  public estimateJobDuration(data: ExportJobData): number {
    let baseDuration = 30; // 30 seconds base

    // Adjust based on format complexity
    switch (data.format) {
      case 'txt':
      case 'markdown':
        baseDuration = 10;
        break;
      case 'html':
        baseDuration = 20;
        break;
      case 'docx':
        baseDuration = 45;
        break;
      case 'pdf':
        baseDuration = 60;
        break;
      case 'epub':
        baseDuration = 90;
        break;
    }

    // Adjust for batch processing
    if (data.isBatch && data.documentIds) {
      baseDuration *= Math.min(data.documentIds.length, 10); // Cap at 10x for very large batches
    }

    // Adjust for template complexity
    if (data.template === 'screenplay' || data.template === 'academic') {
      baseDuration *= 1.5;
    }

    return baseDuration * 1000; // Convert to milliseconds
  }
}