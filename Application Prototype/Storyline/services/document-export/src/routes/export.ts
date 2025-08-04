import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ExportService } from '../services/ExportService';
import { ExportProcessor } from '../jobs/ExportProcessor';
import { exportQueue, batchExportQueue } from '../config/queues';
import { logger } from '../utils/logger';
import { 
  ExportFormat, 
  ExportTemplate, 
  ExportOptions
} from '@storyline/shared-types';

const router = Router();
const exportService = ExportService.getInstance();
const exportProcessor = new ExportProcessor();

/**
 * POST /export/document/:documentId
 * Export a single document
 */
router.post('/document/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { 
      userId, 
      format, 
      template = 'manuscript', 
      options = {}, 
      authorInfo,
      webhookUrl,
      async = true
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        error: 'userId is required',
        code: 'MISSING_USER_ID'
      });
    }

    if (!format) {
      return res.status(400).json({
        error: 'format is required',
        code: 'MISSING_FORMAT'
      });
    }

    // Validate format
    const availableFormats = exportService.getAvailableFormats();
    if (!availableFormats.includes(format as ExportFormat)) {
      return res.status(400).json({
        error: `Unsupported format. Available formats: ${availableFormats.join(', ')}`,
        code: 'INVALID_FORMAT'
      });
    }

    // Validate template
    const availableTemplates = exportService.getAvailableTemplates();
    if (!availableTemplates.includes(template as ExportTemplate)) {
      return res.status(400).json({
        error: `Unsupported template. Available templates: ${availableTemplates.join(', ')}`,
        code: 'INVALID_TEMPLATE'
      });
    }

    // Validate export options
    const validationResult = exportService.validateExportOptions(format as ExportFormat, options as ExportOptions);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Invalid export options',
        details: validationResult.errors,
        code: 'INVALID_OPTIONS'
      });
    }

    const exportId = uuidv4();

    if (async) {
      // Queue the export job
      const jobData = {
        exportId,
        documentId,
        userId,
        format: format as ExportFormat,
        template: template as ExportTemplate,
        options: options as ExportOptions,
        authorInfo,
        webhookUrl,
        isBatch: false
      };

      // Validate job data
      const jobValidation = exportProcessor.validateJobData(jobData);
      if (!jobValidation.valid) {
        return res.status(400).json({
          error: 'Invalid job data',
          details: jobValidation.errors,
          code: 'INVALID_JOB_DATA'
        });
      }

      const priority = exportProcessor.getJobPriority(jobData);
      const estimatedDuration = exportProcessor.estimateJobDuration(jobData);

      const job = await exportQueue.add('export-document', jobData, {
        priority,
        delay: 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 50,
        removeOnFail: 100
      });

      logger.info('Export job queued', {
        jobId: job.id,
        exportId,
        documentId,
        format,
        template,
        priority,
        estimatedDuration
      });

      res.status(202).json({
        exportId,
        status: 'queued',
        jobId: job.id,
        estimatedDuration,
        message: 'Export job has been queued for processing',
        statusUrl: `/export/status/${exportId}`,
        ...(webhookUrl && { webhookUrl })
      });
    } else {
      // Synchronous export (not recommended for large documents)
      try {
        const result = await exportService.exportDocument(
          documentId,
          userId,
          format as ExportFormat,
          template as ExportTemplate,
          options as ExportOptions,
          authorInfo
        );

        res.json({
          exportId: result.exportId,
          status: 'completed',
          downloadUrl: result.downloadUrl,
          downloadExpiresAt: result.downloadExpiresAt,
          fileSize: result.fileSize,
          metadata: result.metadata
        });
      } catch (error) {
        logger.error('Synchronous export failed', {
          exportId,
          documentId,
          format,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        res.status(500).json({
          exportId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Export failed',
          code: 'EXPORT_FAILED'
        });
      }
    }
  } catch (error) {
    logger.error('Export request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentId: req.params.documentId
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /export/batch
 * Export multiple documents as a batch
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { 
      documentIds, 
      userId, 
      format, 
      template = 'manuscript', 
      options = {}, 
      authorInfo,
      webhookUrl,
      async = true
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        error: 'userId is required',
        code: 'MISSING_USER_ID'
      });
    }

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        error: 'documentIds array is required and must not be empty',
        code: 'MISSING_DOCUMENT_IDS'
      });
    }

    if (documentIds.length > 50) {
      return res.status(400).json({
        error: 'Maximum 50 documents allowed per batch export',
        code: 'TOO_MANY_DOCUMENTS'
      });
    }

    if (!format) {
      return res.status(400).json({
        error: 'format is required',
        code: 'MISSING_FORMAT'
      });
    }

    // Validate format
    const availableFormats = exportService.getAvailableFormats();
    if (!availableFormats.includes(format as ExportFormat)) {
      return res.status(400).json({
        error: `Unsupported format. Available formats: ${availableFormats.join(', ')}`,
        code: 'INVALID_FORMAT'
      });
    }

    // Check if format supports batch export
    if (format === 'docx') {
      return res.status(400).json({
        error: 'DOCX format does not support batch export yet',
        code: 'BATCH_NOT_SUPPORTED'
      });
    }

    // Validate template
    const availableTemplates = exportService.getAvailableTemplates();
    if (!availableTemplates.includes(template as ExportTemplate)) {
      return res.status(400).json({
        error: `Unsupported template. Available templates: ${availableTemplates.join(', ')}`,
        code: 'INVALID_TEMPLATE'
      });
    }

    // Validate export options
    const validationResult = exportService.validateExportOptions(format as ExportFormat, options as ExportOptions);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Invalid export options',
        details: validationResult.errors,
        code: 'INVALID_OPTIONS'
      });
    }

    const exportId = uuidv4();

    if (async) {
      // Queue the batch export job
      const jobData = {
        exportId,
        documentIds,
        userId,
        format: format as ExportFormat,
        template: template as ExportTemplate,
        options: options as ExportOptions,
        authorInfo,
        webhookUrl,
        isBatch: true
      };

      // Validate job data
      const jobValidation = exportProcessor.validateJobData(jobData);
      if (!jobValidation.valid) {
        return res.status(400).json({
          error: 'Invalid job data',
          details: jobValidation.errors,
          code: 'INVALID_JOB_DATA'
        });
      }

      const priority = exportProcessor.getJobPriority(jobData);
      const estimatedDuration = exportProcessor.estimateJobDuration(jobData);

      const job = await batchExportQueue.add('export-batch', jobData, {
        priority,
        delay: 0,
        attempts: 2, // Fewer retries for batch jobs
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 20,
        removeOnFail: 50
      });

      logger.info('Batch export job queued', {
        jobId: job.id,
        exportId,
        documentCount: documentIds.length,
        format,
        template,
        priority,
        estimatedDuration
      });

      res.status(202).json({
        exportId,
        status: 'queued',
        jobId: job.id,
        documentCount: documentIds.length,
        estimatedDuration,
        message: 'Batch export job has been queued for processing',
        statusUrl: `/export/status/${exportId}`,
        ...(webhookUrl && { webhookUrl })
      });
    } else {
      // Synchronous batch export (not recommended)
      try {
        const result = await exportService.exportBatchDocuments(
          documentIds,
          userId,
          format as ExportFormat,
          template as ExportTemplate,
          options as ExportOptions,
          authorInfo
        );

        res.json({
          exportId: result.exportId,
          status: 'completed',
          downloadUrl: result.downloadUrl,
          downloadExpiresAt: result.downloadExpiresAt,
          fileSize: result.fileSize,
          metadata: result.metadata
        });
      } catch (error) {
        logger.error('Synchronous batch export failed', {
          exportId,
          documentIds,
          format,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        res.status(500).json({
          exportId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Batch export failed',
          code: 'EXPORT_FAILED'
        });
      }
    }
  } catch (error) {
    logger.error('Batch export request failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /export/status/:exportId
 * Get export status and download information
 */
router.get('/status/:exportId', async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;

    if (!exportId) {
      return res.status(400).json({
        error: 'exportId is required',
        code: 'MISSING_EXPORT_ID'
      });
    }

    // Check job status in queues
    const jobs = await Promise.all([
      exportQueue.getJob(exportId),
      batchExportQueue.getJob(exportId)
    ]);

    const job = jobs.find(j => j !== null);

    if (!job) {
      // Try to get status from export service (completed exports)
      const status = await exportService.getExportStatus(exportId);
      
      if (status.status === 'not_found') {
        return res.status(404).json({
          error: 'Export not found',
          code: 'EXPORT_NOT_FOUND'
        });
      }

      return res.json({
        exportId,
        status: status.status,
        ...(status.downloadUrl && {
          downloadUrl: status.downloadUrl,
          downloadExpiresAt: status.downloadExpiresAt
        }),
        ...(status.metadata && { metadata: status.metadata })
      });
    }

    // Return job status
    const jobState = await job.getState();
    const progress = job.progress();

    let response: any = {
      exportId,
      jobId: job.id,
      status: jobState,
      progress: progress || 0,
      createdAt: new Date(job.timestamp),
      ...(job.processedOn && { startedAt: new Date(job.processedOn) }),
      ...(job.finishedOn && { completedAt: new Date(job.finishedOn) })
    };

    // Add additional information based on job state
    if (jobState === 'completed' && job.returnvalue) {
      response = {
        ...response,
        downloadUrl: job.returnvalue.downloadUrl,
        downloadExpiresAt: job.returnvalue.downloadExpiresAt,
        fileSize: job.returnvalue.fileSize,
        metadata: job.returnvalue.metadata
      };
    } else if (jobState === 'failed' && job.failedReason) {
      response = {
        ...response,
        error: job.failedReason,
        attemptsMade: job.attemptsMade
      };
    }

    res.json(response);
  } catch (error) {
    logger.error('Status check failed', {
      exportId: req.params.exportId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /export/formats
 * Get available export formats
 */
router.get('/formats', (req: Request, res: Response) => {
  const formats = exportService.getAvailableFormats();
  res.json({
    formats: formats.map(format => ({
      format,
      batchSupported: format !== 'docx'
    }))
  });
});

/**
 * GET /export/templates
 * Get available export templates
 */
router.get('/templates', (req: Request, res: Response) => {
  const templates = exportService.getAvailableTemplates();
  res.json({
    templates: templates.map(template => ({
      template,
      description: getTemplateDescription(template)
    }))
  });
});

/**
 * POST /export/validate
 * Validate export options without performing export
 */
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { format, options = {} } = req.body;

    if (!format) {
      return res.status(400).json({
        error: 'format is required',
        code: 'MISSING_FORMAT'
      });
    }

    const availableFormats = exportService.getAvailableFormats();
    if (!availableFormats.includes(format as ExportFormat)) {
      return res.status(400).json({
        error: `Unsupported format. Available formats: ${availableFormats.join(', ')}`,
        code: 'INVALID_FORMAT'
      });
    }

    const validationResult = exportService.validateExportOptions(format as ExportFormat, options as ExportOptions);

    res.json({
      valid: validationResult.valid,
      errors: validationResult.errors
    });
  } catch (error) {
    logger.error('Validation request failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /export/:exportId
 * Cancel or delete an export
 */
router.delete('/:exportId', async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;

    if (!exportId) {
      return res.status(400).json({
        error: 'exportId is required',
        code: 'MISSING_EXPORT_ID'
      });
    }

    // Try to find and cancel the job
    const jobs = await Promise.all([
      exportQueue.getJob(exportId),
      batchExportQueue.getJob(exportId)
    ]);

    const job = jobs.find(j => j !== null);

    if (!job) {
      return res.status(404).json({
        error: 'Export not found',
        code: 'EXPORT_NOT_FOUND'
      });
    }

    const jobState = await job.getState();

    if (jobState === 'completed') {
      return res.status(400).json({
        error: 'Cannot cancel completed export',
        code: 'EXPORT_COMPLETED'
      });
    }

    if (jobState === 'active') {
      // Job is currently being processed, try to cancel it
      await job.remove();
      logger.info('Active export job cancelled', { exportId, jobId: job.id });
    } else {
      // Job is waiting in queue, remove it
      await job.remove();
      logger.info('Queued export job cancelled', { exportId, jobId: job.id });
    }

    res.json({
      exportId,
      status: 'cancelled',
      message: 'Export has been cancelled'
    });
  } catch (error) {
    logger.error('Export cancellation failed', {
      exportId: req.params.exportId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Get template description
 */
function getTemplateDescription(template: ExportTemplate): string {
  const descriptions: Record<ExportTemplate, string> = {
    manuscript: 'Standard manuscript format with proper spacing and formatting',
    book: 'Book layout with chapters, headers, and publishing-ready formatting',
    screenplay: 'Industry-standard screenplay format with proper scene formatting',
    academic: 'Academic paper format with citations and formal structure',
    blog: 'Web-friendly blog post format with modern styling'
  };

  return descriptions[template] || 'Custom template format';
}

export default router;