import { 
  ExportFormat, 
  ExportTemplate, 
  ExportOptions, 
  ExportRequest,
  BatchExportRequest 
} from '@storyline/shared-types';
import { DocumentContent, MemoryService } from './MemoryService';
import { StorageService } from './StorageService';
import { TemplateService } from './TemplateService';

// Import all exporters
import { DOCXExporter } from './exporters/DOCXExporter';
import { PDFExporter } from './exporters/PDFExporter';
import { EPUBExporter } from './exporters/EPUBExporter';
import { MarkdownExporter } from './exporters/MarkdownExporter';
import { HTMLExporter } from './exporters/HTMLExporter';
import { TXTExporter } from './exporters/TXTExporter';

import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface ExportResult {
  exportId: string;
  format: ExportFormat;
  downloadUrl: string;
  downloadExpiresAt: Date;
  fileSize: number;
  metadata: Record<string, any>;
}

export interface AuthorInfo {
  name: string;
  email?: string;
  bio?: string;
}

export class ExportService {
  private static instance: ExportService;
  private memoryService: MemoryService;
  private storageService: StorageService;
  private templateService: TemplateService;
  
  // Exporters
  private docxExporter: DOCXExporter;
  private pdfExporter: PDFExporter;
  private epubExporter: EPUBExporter;
  private markdownExporter: MarkdownExporter;
  private htmlExporter: HTMLExporter;
  private txtExporter: TXTExporter;

  private constructor() {
    this.memoryService = MemoryService.getInstance();
    this.storageService = StorageService.getInstance();
    this.templateService = TemplateService.getInstance();
    
    // Initialize exporters
    this.docxExporter = new DOCXExporter();
    this.pdfExporter = new PDFExporter();
    this.epubExporter = new EPUBExporter();
    this.markdownExporter = new MarkdownExporter();
    this.htmlExporter = new HTMLExporter();
    this.txtExporter = new TXTExporter();
  }

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Initialize export service
   */
  public async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.storageService.initialize(),
        this.templateService.initialize(),
        this.pdfExporter.initialize()
      ]);
      
      logger.info('Export service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize export service', { error });
      throw error;
    }
  }

  /**
   * Export a single document
   */
  public async exportDocument(
    documentId: string,
    userId: string,
    format: ExportFormat,
    template: ExportTemplate = 'manuscript',
    options: ExportOptions = {},
    authorInfo?: AuthorInfo
  ): Promise<ExportResult> {
    const exportId = uuidv4();
    
    try {
      logger.info('Starting document export', {
        exportId,
        documentId,
        userId,
        format,
        template
      });

      // Retrieve document content
      const documentContent = await this.memoryService.getDocument(documentId, userId);
      
      // Perform export based on format
      const exportResult = await this.performExport(
        documentContent,
        format,
        template,
        options,
        authorInfo
      );

      // Upload to storage
      const storageKey = await this.storageService.uploadFile(
        exportResult.buffer || Buffer.from(exportResult.content || ''),
        exportResult.filename,
        exportResult.contentType,
        {
          exportId,
          documentId,
          userId,
          format,
          template,
          wordCount: exportResult.metadata.wordCount?.toString() || '0'
        }
      );

      // Generate download URL
      const downloadUrl = await this.storageService.generateDownloadUrl(storageKey);
      const downloadExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const result: ExportResult = {
        exportId,
        format,
        downloadUrl,
        downloadExpiresAt,
        fileSize: exportResult.buffer?.length || exportResult.content?.length || 0,
        metadata: exportResult.metadata
      };

      logger.info('Document export completed successfully', {
        exportId,
        format,
        fileSize: `${(result.fileSize / 1024).toFixed(2)} KB`,
        downloadUrl: downloadUrl.split('?')[0] // Log without query params
      });

      return result;
    } catch (error) {
      logger.error('Document export failed', {
        exportId,
        documentId,
        userId,
        format,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Export multiple documents as a batch
   */
  public async exportBatchDocuments(
    documentIds: string[],
    userId: string,
    format: ExportFormat,
    template: ExportTemplate = 'manuscript',
    options: ExportOptions = {},
    authorInfo?: AuthorInfo
  ): Promise<ExportResult> {
    const exportId = uuidv4();
    
    try {
      logger.info('Starting batch document export', {
        exportId,
        documentIds,
        userId,
        format,
        template,
        documentCount: documentIds.length
      });

      // Retrieve all documents
      const documents = await this.memoryService.getDocuments(documentIds, userId);
      
      if (documents.length === 0) {
        throw new Error('No documents found for export');
      }

      // Perform batch export based on format
      const exportResult = await this.performBatchExport(
        documents,
        format,
        template,
        options,
        authorInfo
      );

      // Upload to storage
      const storageKey = await this.storageService.uploadFile(
        exportResult.buffer || Buffer.from(exportResult.content || ''),
        exportResult.filename,
        exportResult.contentType,
        {
          exportId,
          documentIds: documentIds.join(','),
          userId,
          format,
          template,
          documentCount: documents.length.toString(),
          totalWordCount: documents.reduce((sum, doc) => sum + doc.document.metadata.wordCount, 0).toString()
        }
      );

      // Generate download URL
      const downloadUrl = await this.storageService.generateDownloadUrl(storageKey);
      const downloadExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const result: ExportResult = {
        exportId,
        format,
        downloadUrl,
        downloadExpiresAt,
        fileSize: exportResult.buffer?.length || exportResult.content?.length || 0,
        metadata: {
          ...exportResult.metadata,
          documentCount: documents.length,
          batchExport: true
        }
      };

      logger.info('Batch document export completed successfully', {
        exportId,
        format,
        documentCount: documents.length,
        fileSize: `${(result.fileSize / 1024).toFixed(2)} KB`
      });

      return result;
    } catch (error) {
      logger.error('Batch document export failed', {
        exportId,
        documentIds,
        userId,
        format,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Perform export based on format
   */
  private async performExport(
    documentContent: DocumentContent,
    format: ExportFormat,
    template: ExportTemplate,
    options: ExportOptions,
    authorInfo?: AuthorInfo
  ): Promise<any> {
    switch (format) {
      case 'docx':
        return await this.docxExporter.export(documentContent, options, authorInfo);
      
      case 'pdf':
        return await this.pdfExporter.export(documentContent, options, template, authorInfo);
      
      case 'epub':
        return await this.epubExporter.export(documentContent, options, authorInfo);
      
      case 'markdown':
        return await this.markdownExporter.export(documentContent, options, authorInfo);
      
      case 'html':
        return await this.htmlExporter.export(documentContent, options, template, authorInfo);
      
      case 'txt':
        return await this.txtExporter.export(documentContent, options, authorInfo);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Perform batch export based on format
   */
  private async performBatchExport(
    documents: DocumentContent[],
    format: ExportFormat,
    template: ExportTemplate,
    options: ExportOptions,
    authorInfo?: AuthorInfo
  ): Promise<any> {
    switch (format) {
      case 'docx':
        // For DOCX, we'll export individual documents and combine them
        // This is a simplified approach - in production you might want more sophisticated merging
        throw new Error('Batch DOCX export not yet implemented - use individual exports');
      
      case 'pdf':
        return await this.pdfExporter.exportBatch(documents, options, template, authorInfo);
      
      case 'epub':
        return await this.epubExporter.exportBatch(documents, options, authorInfo);
      
      case 'markdown':
        return await this.markdownExporter.exportBatch(documents, options, authorInfo);
      
      case 'html':
        return await this.htmlExporter.exportBatch(documents, options, template, authorInfo);
      
      case 'txt':
        return await this.txtExporter.exportBatch(documents, options, authorInfo);
      
      default:
        throw new Error(`Unsupported batch export format: ${format}`);
    }
  }

  /**
   * Get export status and metadata
   */
  public async getExportStatus(exportId: string): Promise<{
    status: 'completed' | 'not_found';
    downloadUrl?: string;
    downloadExpiresAt?: Date;
    metadata?: Record<string, any>;
  }> {
    try {
      // In a real implementation, you'd store export metadata in a database
      // For now, we'll just check if the file exists in storage
      
      // This is a simplified implementation - you'd need to store export metadata
      logger.info('Export status check requested', { exportId });
      
      return {
        status: 'not_found'
      };
    } catch (error) {
      logger.error('Failed to get export status', { exportId, error });
      throw error;
    }
  }

  /**
   * List available export formats
   */
  public getAvailableFormats(): ExportFormat[] {
    return ['docx', 'pdf', 'epub', 'markdown', 'html', 'txt'];
  }

  /**
   * List available templates
   */
  public getAvailableTemplates(): ExportTemplate[] {
    return ['manuscript', 'book', 'screenplay', 'academic', 'blog'];
  }

  /**
   * Validate export options
   */
  public validateExportOptions(format: ExportFormat, options: ExportOptions): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check format-specific requirements
    switch (format) {
      case 'pdf':
        if (options.pdfOptions?.scale && (options.pdfOptions.scale < 0.1 || options.pdfOptions.scale > 2)) {
          errors.push('PDF scale must be between 0.1 and 2.0');
        }
        break;
      
      case 'epub':
        if (options.epubOptions?.isbn && !/^\d{10}(\d{3})?$/.test(options.epubOptions.isbn.replace(/[-\s]/g, ''))) {
          errors.push('Invalid ISBN format');
        }
        break;
    }

    // Check general options
    if (options.fontSize && (options.fontSize < 8 || options.fontSize > 72)) {
      errors.push('Font size must be between 8 and 72 points');
    }

    if (options.lineSpacing && (options.lineSpacing < 0.5 || options.lineSpacing > 3)) {
      errors.push('Line spacing must be between 0.5 and 3.0');
    }

    if (options.margins) {
      const { top, right, bottom, left } = options.margins;
      if ([top, right, bottom, left].some(margin => margin < 0 || margin > 100)) {
        errors.push('Margins must be between 0 and 100mm');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Health check for the export service
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    exporters: Record<ExportFormat, boolean>;
  }> {
    const services = {
      memory: await this.memoryService.healthCheck(),
      storage: true, // Storage service doesn't have a health check method yet
      template: true  // Template service doesn't have a health check method yet
    };

    // Test basic functionality of each exporter
    const exporters: Record<ExportFormat, boolean> = {
      docx: true, // These would need actual health checks
      pdf: true,
      epub: true,
      markdown: true,
      html: true,
      txt: true
    };

    const allHealthy = Object.values(services).every(Boolean) && Object.values(exporters).every(Boolean);
    const anyHealthy = Object.values(services).some(Boolean) || Object.values(exporters).some(Boolean);

    return {
      status: allHealthy ? 'healthy' : (anyHealthy ? 'degraded' : 'unhealthy'),
      services,
      exporters
    };
  }

  /**
   * Cleanup expired exports and temp files
   */
  public async cleanup(): Promise<{
    cleanedFiles: number;
    errors: number;
  }> {
    let cleanedFiles = 0;
    let errors = 0;

    try {
      // This would typically query a database for expired exports
      // and clean up the associated storage files
      logger.info('Starting export cleanup');
      
      // Placeholder implementation
      logger.info('Export cleanup completed', { cleanedFiles, errors });
      
      return { cleanedFiles, errors };
    } catch (error) {
      logger.error('Export cleanup failed', { error });
      return { cleanedFiles, errors: errors + 1 };
    }
  }

  /**
   * Close export service and cleanup resources
   */
  public async close(): Promise<void> {
    try {
      await this.pdfExporter.close();
      logger.info('Export service closed successfully');
    } catch (error) {
      logger.error('Error closing export service', { error });
    }
  }
}