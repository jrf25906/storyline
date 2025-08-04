import { ExportOptions, ExportTemplate } from '@storyline/shared-types';
import { DocumentContent } from '../MemoryService';
import { TemplateService, TemplateData } from '../TemplateService';
import { logger } from '../../utils/logger';

export interface HTMLExportResult {
  content: string;
  filename: string;
  contentType: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    elementCount: number;
  };
}

export class HTMLExporter {
  private templateService: TemplateService;

  constructor() {
    this.templateService = TemplateService.getInstance();
  }

  /**
   * Export document to HTML format
   */
  public async export(
    documentContent: DocumentContent,
    options: ExportOptions,
    template: ExportTemplate = 'manuscript',
    authorInfo?: { name: string; email?: string }
  ): Promise<HTMLExportResult> {
    try {
      logger.info('Starting HTML export', {
        documentId: documentContent.document.id,
        title: documentContent.document.title,
        template,
        wordCount: documentContent.document.metadata.wordCount
      });

      // Prepare template data
      const templateData = this.prepareTemplateData(documentContent, options, template, authorInfo);
      
      // Compile template
      const compiledTemplate = await this.templateService.compileTemplate(
        template,
        templateData,
        options.customTemplate,
        options.customCSS
      );

      // Generate complete HTML document
      const html = this.generateCompleteHTML(
        compiledTemplate.html,
        compiledTemplate.css,
        documentContent,
        options
      );

      // Calculate metadata
      const metadata = this.calculateMetadata(html);
      const filename = this.generateFilename(documentContent.document.title, template);

      logger.info('HTML export completed successfully', {
        documentId: documentContent.document.id,
        fileSize: `${(html.length / 1024).toFixed(2)} KB`,
        wordCount: metadata.wordCount
      });

      return {
        content: html,
        filename,
        contentType: 'text/html',
        metadata
      };
    } catch (error) {
      logger.error('HTML export failed', {
        documentId: documentContent.document.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`HTML export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate complete HTML document with proper structure
   */
  private generateCompleteHTML(
    bodyHTML: string,
    css: string,
    documentContent: DocumentContent,
    options: ExportOptions
  ): string {
    const title = documentContent.document.title;
    const description = this.generateDescription(documentContent);
    const keywords = documentContent.document.tags.join(', ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHTML(title)}</title>
    <meta name="description" content="${this.escapeHTML(description)}">
    ${keywords ? `<meta name="keywords" content="${this.escapeHTML(keywords)}">` : ''}
    <meta name="generator" content="Storyline Document Export Service">
    <meta name="export-date" content="${new Date().toISOString()}">
    ${documentContent.document.genre ? `<meta name="genre" content="${this.escapeHTML(documentContent.document.genre)}">` : ''}
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${this.escapeHTML(title)}">
    <meta property="og:description" content="${this.escapeHTML(description)}">
    <meta property="og:type" content="article">
    
    <!-- Print Styles -->
    <style media="print">
        @page {
            margin: 2cm;
            size: ${options.pageSize || 'A4'};
        }
        
        body {
            font-size: 12pt;
            line-height: 1.5;
        }
        
        .no-print {
            display: none !important;
        }
        
        a {
            text-decoration: none;
            color: #000;
        }
        
        a[href]:after {
            content: " (" attr(href) ")";
            font-size: 90%;
        }
    </style>
    
    <!-- Main Styles -->
    <style>
        ${css}
        
        /* Additional responsive styles */
        @media screen and (max-width: 768px) {
            body {
                font-size: 16px;
                line-height: 1.6;
                padding: 1rem;
            }
            
            .manuscript,
            .book,
            .screenplay,
            .academic-paper,
            .blog-post {
                max-width: 100%;
                margin: 0;
            }
        }
        
        /* Accessibility improvements */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        
        /* Focus styles for keyboard navigation */
        a:focus,
        button:focus {
            outline: 2px solid #0066cc;
            outline-offset: 2px;
        }
    </style>
    
    ${this.generateStructuredData(documentContent, options)}
</head>
<body>
    <!-- Skip to content link for accessibility -->
    <a href="#main-content" class="sr-only">Skip to main content</a>
    
    <!-- Navigation for longer documents -->
    ${this.generateNavigation(documentContent)}
    
    <!-- Main content -->
    <main id="main-content" role="main">
        ${bodyHTML}
    </main>
    
    <!-- Footer -->
    <footer class="export-footer no-print" role="contentinfo">
        <p>
            Exported from Storyline on ${new Date().toLocaleDateString()} 
            | Word count: ${documentContent.document.metadata.wordCount.toLocaleString()}
            ${documentContent.document.genre ? ` | Genre: ${documentContent.document.genre}` : ''}
        </p>
    </footer>
    
    ${this.generateJavaScript(options)}
</body>
</html>`;
  }

  /**
   * Generate navigation for longer documents
   */
  private generateNavigation(documentContent: DocumentContent): string {
    if (!documentContent.chapters || documentContent.chapters.length <= 1) {
      return '';
    }

    const navItems = documentContent.chapters.map((chapter, index) => {
      const id = this.generateChapterId(chapter.title || `Chapter ${index + 1}`);
      return `<li><a href="#${id}">${chapter.title || `Chapter ${index + 1}`}</a></li>`;
    }).join('\n        ');

    return `
    <nav class="document-nav no-print" role="navigation" aria-label="Document chapters">
        <details>
            <summary>Table of Contents</summary>
            <ul>
                ${navItems}
            </ul>
        </details>
    </nav>`;
  }

  /**
   * Generate structured data for SEO
   */
  private generateStructuredData(documentContent: DocumentContent, options: ExportOptions): string {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": documentContent.document.title,
      "wordCount": documentContent.document.metadata.wordCount,
      "genre": documentContent.document.genre,
      "keywords": documentContent.document.tags.join(', '),
      "dateCreated": documentContent.document.createdAt,
      "dateModified": documentContent.document.updatedAt,
      "datePublished": new Date().toISOString(),
      "inLanguage": "en-US",
      "isAccessibleForFree": true
    };

    return `<script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
    </script>`;
  }

  /**
   * Generate JavaScript for enhanced functionality
   */
  private generateJavaScript(options: ExportOptions): string {
    return `
    <script>
        // Print functionality
        function printDocument() {
            window.print();
        }
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Add keyboard shortcut for printing (Ctrl+P or Cmd+P)
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                printDocument();
            }
        });
        
        // Update page title with reading progress
        let lastScrollY = 0;
        const originalTitle = document.title;
        
        function updateReadingProgress() {
            const scrollY = window.scrollY;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = Math.round((scrollY / documentHeight) * 100);
            
            if (progress > 0 && progress < 100) {
                document.title = \`(\${progress}%) \${originalTitle}\`;
            } else {
                document.title = originalTitle;
            }
            
            lastScrollY = scrollY;
        }
        
        // Throttled scroll handler
        let ticking = false;
        function handleScroll() {
            if (!ticking) {
                requestAnimationFrame(updateReadingProgress);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', handleScroll, { passive: true });
    </script>`;
  }

  /**
   * Generate chapter ID for navigation
   */
  private generateChapterId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Generate document description
   */
  private generateDescription(documentContent: DocumentContent): string {
    const content = documentContent.chapters
      ? documentContent.chapters[0]?.content || documentContent.document.content
      : documentContent.document.content;
    
    // Extract first sentence or first 160 characters
    const firstSentence = content.match(/^[^.!?]*[.!?]/);
    if (firstSentence) {
      return this.stripHTML(firstSentence[0]).substring(0, 160);
    }
    
    return this.stripHTML(content).substring(0, 160) + '...';
  }

  /**
   * Strip HTML tags from text
   */
  private stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Escape HTML entities
   */
  private escapeHTML(text: string): string {
    const div = { innerHTML: text } as any;
    return div.textContent || div.innerText || "";
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
        exportFormat: 'html',
        totalWords,
        exportOptions: options
      },
      author: authorInfo ? {
        name: authorInfo.name,
        email: authorInfo.email
      } : undefined,
      formatting: {
        fontSize: options.fontSize || 16,
        fontFamily: options.fontFamily || 'Georgia, serif',
        lineSpacing: options.lineSpacing || 1.6,
        margins: options.margins || { top: 20, right: 20, bottom: 20, left: 20 },
        pageSize: options.pageSize || 'A4'
      }
    };
  }

  /**
   * Export multiple documents as batch HTML
   */
  public async exportBatch(
    documents: DocumentContent[],
    options: ExportOptions,
    template: ExportTemplate = 'manuscript',
    authorInfo?: { name: string; email?: string }
  ): Promise<HTMLExportResult> {
    try {
      logger.info('Starting batch HTML export', {
        documentCount: documents.length,
        template
      });

      // Create combined document structure
      const combinedDocument = this.createCombinedDocument(documents);
      
      // Use regular export with combined data
      const result = await this.export(combinedDocument, options, template, authorInfo);
      
      // Update filename for batch
      const filename = this.generateBatchFilename(documents.length, template);

      logger.info('Batch HTML export completed successfully', {
        documentCount: documents.length,
        fileSize: `${(result.content.length / 1024).toFixed(2)} KB`
      });

      return {
        ...result,
        filename
      };
    } catch (error) {
      logger.error('Batch HTML export failed', {
        documentCount: documents.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Batch HTML export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create combined document from multiple documents
   */
  private createCombinedDocument(documents: DocumentContent[]): DocumentContent {
    const combinedDocument = {
      ...documents[0].document,
      title: `Batch Export - ${documents.length} Documents`,
      content: documents.map(doc => `<h1>${doc.document.title}</h1>\n${doc.document.content}`).join('\n\n'),
      metadata: {
        ...documents[0].document.metadata,
        wordCount: documents.reduce((sum, doc) => sum + doc.document.metadata.wordCount, 0)
      },
      tags: [...new Set(documents.flatMap(doc => doc.document.tags))],
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
      images: allImages.length > 0 ? allImages : undefined
    };
  }

  /**
   * Calculate HTML metadata
   */
  private calculateMetadata(html: string): {
    wordCount: number;
    characterCount: number;
    elementCount: number;
  } {
    const textContent = this.stripHTML(html);
    const wordCount = textContent.trim().split(/\s+/).length;
    const characterCount = html.length;
    const elementCount = (html.match(/<[^>]+>/g) || []).length;

    return {
      wordCount,
      characterCount,
      elementCount
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
    return `${cleanTitle}-${template}-${timestamp}.html`;
  }

  /**
   * Generate batch filename
   */
  private generateBatchFilename(documentCount: number, template: ExportTemplate): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `batch-export-${documentCount}-docs-${template}-${timestamp}.html`;
  }
}