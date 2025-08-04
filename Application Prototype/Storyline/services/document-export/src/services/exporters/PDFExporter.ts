import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';
import { ExportOptions, PDFExportOptions, ExportTemplate } from '@storyline/shared-types';
import { DocumentContent } from '../MemoryService';
import { TemplateService, TemplateData } from '../TemplateService';
import { logger } from '../../utils/logger';

export interface PDFExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
  metadata: {
    pageCount: number;
    wordCount: number;
    fileSize: number;
  };
}

export class PDFExporter {
  private templateService: TemplateService;
  private browser: Browser | null = null;

  constructor() {
    this.templateService = TemplateService.getInstance();
  }

  /**
   * Initialize PDF exporter (start Puppeteer browser)
   */
  public async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps'
        ]
      });
      
      logger.info('PDF exporter initialized with Puppeteer');
    } catch (error) {
      logger.error('Failed to initialize PDF exporter', { error });
      throw error;
    }
  }

  /**
   * Export document to PDF format
   */
  public async export(
    documentContent: DocumentContent,
    options: ExportOptions,
    template: ExportTemplate = 'manuscript',
    authorInfo?: { name: string; email?: string }
  ): Promise<PDFExportResult> {
    try {
      logger.info('Starting PDF export', {
        documentId: documentContent.document.id,
        title: documentContent.document.title,
        template,
        wordCount: documentContent.document.metadata.wordCount
      });

      if (!this.browser) {
        await this.initialize();
      }

      // Prepare template data
      const templateData = this.prepareTemplateData(documentContent, options, template, authorInfo);
      
      // Compile template
      const compiledTemplate = await this.templateService.compileTemplate(
        template,
        templateData,
        options.customTemplate,
        options.customCSS
      );
      
      // Generate PDF
      const buffer = await this.generatePDF(compiledTemplate, options);
      
      // Calculate metadata
      const metadata = await this.calculateMetadata(buffer, documentContent);
      
      const filename = this.generateFilename(documentContent.document.title, template);
      
      logger.info('PDF export completed successfully', {
        documentId: documentContent.document.id,
        fileSize: `${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
        pages: metadata.pageCount
      });

      return {
        buffer,
        filename,
        contentType: 'application/pdf',
        metadata
      };
    } catch (error) {
      logger.error('PDF export failed', {
        documentId: documentContent.document.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate PDF from compiled template
   */
  private async generatePDF(
    compiledTemplate: { html: string; css: string },
    options: ExportOptions
  ): Promise<Buffer> {
    if (!this.browser) {
      throw new Error('PDF exporter not initialized');
    }

    const page = await this.browser.newPage();
    let buffer: Buffer;

    try {
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 1
      });

      // Set content with CSS included
      const fullHTML = this.injectCSSIntoHTML(compiledTemplate.html, compiledTemplate.css);
      await page.setContent(fullHTML, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for any dynamic content to load
      await page.waitForTimeout(1000);

      // Configure PDF options
      const pdfOptions = this.configurePDFOptions(options);
      
      // Generate PDF
      buffer = await page.pdf(pdfOptions);
      
      logger.debug('PDF generated successfully', {
        size: `${(buffer.length / 1024).toFixed(2)} KB`,
        options: pdfOptions
      });

    } finally {
      await page.close();
    }

    return buffer;
  }

  /**
   * Inject CSS into HTML document
   */
  private injectCSSIntoHTML(html: string, css: string): string {
    // Find the head tag and inject CSS before closing it
    const headEndIndex = html.indexOf('</head>');
    if (headEndIndex !== -1) {
      const beforeHead = html.substring(0, headEndIndex);
      const afterHead = html.substring(headEndIndex);
      return `${beforeHead}<style>${css}</style>${afterHead}`;
    }
    
    // If no head tag found, wrap content with basic structure
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${css}</style>
</head>
<body>
    ${html}
</body>
</html>`;
  }

  /**
   * Configure PDF generation options
   */
  private configurePDFOptions(options: ExportOptions): PDFOptions {
    const pdfOptions = options.pdfOptions || {} as PDFExportOptions;
    
    const config: PDFOptions = {
      format: this.mapPageSize(options.pageSize || 'A4'),
      printBackground: pdfOptions.printBackground !== false,
      displayHeaderFooter: pdfOptions.displayHeaderFooter || false,
      margin: this.mapMargins(options.margins),
      preferCSSPageSize: true,
      timeout: 30000
    };

    // Orientation
    if (pdfOptions.orientation) {
      config.landscape = pdfOptions.orientation === 'landscape';
    }

    // Scale
    if (pdfOptions.scale && pdfOptions.scale >= 0.1 && pdfOptions.scale <= 2) {
      config.scale = pdfOptions.scale;
    }

    // Header and footer templates
    if (pdfOptions.displayHeaderFooter) {
      if (pdfOptions.headerTemplate || options.header) {
        config.headerTemplate = pdfOptions.headerTemplate || `
          <div style="font-size: 10px; width: 100%; text-align: center; margin: 0 1cm;">
            ${options.header || '<span class="title"></span>'}
          </div>`;
      }

      if (pdfOptions.footerTemplate || options.footer || options.pageNumbers) {
        config.footerTemplate = pdfOptions.footerTemplate || `
          <div style="font-size: 10px; width: 100%; text-align: center; margin: 0 1cm;">
            ${options.footer || ''}
            ${options.pageNumbers ? '<span class="pageNumber"></span> / <span class="totalPages"></span>' : ''}
          </div>`;
      }
    }

    return config;
  }

  /**
   * Map page size to Puppeteer format
   */
  private mapPageSize(pageSize: string): puppeteer.PaperFormat {
    const sizeMap: Record<string, puppeteer.PaperFormat> = {
      'A4': 'A4',
      'A5': 'A5',
      'Letter': 'Letter',
      'Legal': 'Legal'
    };

    return sizeMap[pageSize] || 'A4';
  }

  /**
   * Map margins to Puppeteer format
   */
  private mapMargins(margins?: { top: number; right: number; bottom: number; left: number }) {
    if (!margins) {
      return {
        top: '2.5cm',
        right: '2.5cm',
        bottom: '2.5cm',
        left: '2.5cm'
      };
    }

    return {
      top: `${margins.top}mm`,
      right: `${margins.right}mm`,
      bottom: `${margins.bottom}mm`,
      left: `${margins.left}mm`
    };
  }

  /**
   * Prepare template data for rendering
   */
  private prepareTemplateData(
    documentContent: DocumentContent,
    options: ExportOptions,
    template: ExportTemplate,
    authorInfo?: { name: string; email?: string }
  ): TemplateData {
    const totalWords = documentContent.chapters
      ? documentContent.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
      : documentContent.document.metadata.wordCount;

    return {
      document: documentContent.document,
      chapters: documentContent.chapters,
      images: documentContent.images,
      metadata: {
        exportedAt: new Date(),
        exportFormat: 'pdf',
        totalWords,
        exportOptions: options
      },
      author: authorInfo ? {
        name: authorInfo.name,
        email: authorInfo.email
      } : undefined,
      formatting: {
        fontSize: options.fontSize || 12,
        fontFamily: options.fontFamily || 'Times New Roman',
        lineSpacing: options.lineSpacing || 1.5,
        margins: options.margins || { top: 25, right: 25, bottom: 25, left: 25 },
        pageSize: options.pageSize || 'A4'
      }
    };
  }

  /**
   * Calculate PDF metadata
   */
  private async calculateMetadata(
    buffer: Buffer,
    documentContent: DocumentContent
  ): Promise<{ pageCount: number; wordCount: number; fileSize: number }> {
    // For a more accurate page count, you could parse the PDF
    // For now, we'll estimate based on content length
    const content = documentContent.chapters
      ? documentContent.chapters.map(c => c.content).join(' ')
      : documentContent.document.content;
    
    const wordCount = content.trim().split(/\s+/).length;
    const pageCount = Math.max(1, Math.ceil(wordCount / 250)); // Rough estimate

    return {
      pageCount,
      wordCount,
      fileSize: buffer.length
    };
  }

  /**
   * Generate filename
   */
  private generateFilename(title: string, template: ExportTemplate): string {
    const cleanTitle = title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    const timestamp = new Date().toISOString().split('T')[0];
    return `${cleanTitle}-${template}-${timestamp}.pdf`;
  }

  /**
   * Export multiple documents as a batch PDF
   */
  public async exportBatch(
    documents: DocumentContent[],
    options: ExportOptions,
    template: ExportTemplate = 'manuscript',
    authorInfo?: { name: string; email?: string }
  ): Promise<PDFExportResult> {
    try {
      logger.info('Starting batch PDF export', {
        documentCount: documents.length,
        template
      });

      if (!this.browser) {
        await this.initialize();
      }

      // Combine all documents into one template data structure
      const combinedData = this.combineBatchData(documents, options, template, authorInfo);
      
      // Compile template
      const compiledTemplate = await this.templateService.compileTemplate(
        template,
        combinedData,
        options.customTemplate,
        options.customCSS
      );
      
      // Generate PDF
      const buffer = await this.generatePDF(compiledTemplate, options);
      
      // Calculate metadata
      const metadata = await this.calculateBatchMetadata(buffer, documents);
      
      const filename = this.generateBatchFilename(documents.length, template);
      
      logger.info('Batch PDF export completed successfully', {
        documentCount: documents.length,
        fileSize: `${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
        pages: metadata.pageCount
      });

      return {
        buffer,
        filename,
        contentType: 'application/pdf',
        metadata
      };
    } catch (error) {
      logger.error('Batch PDF export failed', {
        documentCount: documents.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Batch PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Combine multiple documents for batch export
   */
  private combineBatchData(
    documents: DocumentContent[],
    options: ExportOptions,
    template: ExportTemplate,
    authorInfo?: { name: string; email?: string }
  ): TemplateData {
    // Create a combined document structure
    const combinedDocument = {
      ...documents[0].document,
      title: `Batch Export - ${documents.length} Documents`,
      content: documents.map(doc => `<h1>${doc.document.title}</h1>\n${doc.document.content}`).join('\n\n'),
      metadata: {
        ...documents[0].document.metadata,
        wordCount: documents.reduce((sum, doc) => sum + doc.document.metadata.wordCount, 0)
      }
    };

    const allChapters = documents.flatMap((doc, docIndex) => {
      const prefix = documents.length > 1 ? `${doc.document.title} - ` : '';
      return doc.chapters?.map(chapter => ({
        ...chapter,
        title: `${prefix}${chapter.title}`
      })) || [];
    });

    const allImages = documents.flatMap(doc => doc.images || []);

    return {
      document: combinedDocument,
      chapters: allChapters.length > 0 ? allChapters : undefined,
      images: allImages.length > 0 ? allImages : undefined,
      metadata: {
        exportedAt: new Date(),
        exportFormat: 'pdf',
        totalWords: combinedDocument.metadata.wordCount,
        exportOptions: options
      },
      author: authorInfo ? {
        name: authorInfo.name,
        email: authorInfo.email
      } : undefined,
      formatting: {
        fontSize: options.fontSize || 12,
        fontFamily: options.fontFamily || 'Times New Roman',
        lineSpacing: options.lineSpacing || 1.5,
        margins: options.margins || { top: 25, right: 25, bottom: 25, left: 25 },
        pageSize: options.pageSize || 'A4'
      }
    };
  }

  /**
   * Calculate batch metadata
   */
  private async calculateBatchMetadata(
    buffer: Buffer,
    documents: DocumentContent[]
  ): Promise<{ pageCount: number; wordCount: number; fileSize: number }> {
    const wordCount = documents.reduce((sum, doc) => sum + doc.document.metadata.wordCount, 0);
    const pageCount = Math.max(1, Math.ceil(wordCount / 250));

    return {
      pageCount,
      wordCount,
      fileSize: buffer.length
    };
  }

  /**
   * Generate batch filename
   */
  private generateBatchFilename(documentCount: number, template: ExportTemplate): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `batch-export-${documentCount}-docs-${template}-${timestamp}.pdf`;
  }

  /**
   * Close PDF exporter and cleanup resources
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('PDF exporter closed successfully');
    }
  }
}