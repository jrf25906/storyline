import * as EPub from 'epub-gen';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ExportOptions, EPUBExportOptions } from '@storyline/shared-types';
import { DocumentContent } from '../MemoryService';
import { TemplateService, TemplateData } from '../TemplateService';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface EPUBExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
  metadata: {
    chapterCount: number;
    wordCount: number;
    fileSize: number;
    isbn?: string;
  };
}

interface EPUBChapter {
  title: string;
  content: string;
  filename?: string;
  beforeToc?: boolean;
  excludeFromToc?: boolean;
}

export class EPUBExporter {
  private templateService: TemplateService;
  private tempDir: string;

  constructor() {
    this.templateService = TemplateService.getInstance();
    this.tempDir = path.join(__dirname, '../../../temp');
  }

  /**
   * Export document to EPUB format
   */
  public async export(
    documentContent: DocumentContent,
    options: ExportOptions,
    authorInfo?: { name: string; email?: string }
  ): Promise<EPUBExportResult> {
    try {
      logger.info('Starting EPUB export', {
        documentId: documentContent.document.id,
        title: documentContent.document.title,
        wordCount: documentContent.document.metadata.wordCount
      });

      // Ensure temp directory exists
      await this.ensureTempDir();

      // Prepare EPUB options
      const epubOptions = this.prepareEPUBOptions(documentContent, options, authorInfo);
      
      // Prepare chapters
      const chapters = await this.prepareChapters(documentContent, options, authorInfo);
      
      // Generate EPUB
      const buffer = await this.generateEPUB(epubOptions, chapters);
      
      // Calculate metadata
      const metadata = this.calculateMetadata(documentContent, chapters, buffer);
      
      const filename = this.generateFilename(documentContent.document.title);
      
      logger.info('EPUB export completed successfully', {
        documentId: documentContent.document.id,
        fileSize: `${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
        chapters: chapters.length
      });

      return {
        buffer,
        filename,
        contentType: 'application/epub+zip',
        metadata
      };
    } catch (error) {
      logger.error('EPUB export failed', {
        documentId: documentContent.document.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`EPUB export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure temp directory exists
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * Prepare EPUB generation options
   */
  private prepareEPUBOptions(
    documentContent: DocumentContent,
    options: ExportOptions,
    authorInfo?: { name: string; email?: string }
  ): any {
    const epubOptions = options.epubOptions || {} as EPUBExportOptions;
    
    const epubConfig: any = {
      title: documentContent.document.title,
      author: authorInfo?.name || epubOptions.author || 'Unknown Author',
      publisher: epubOptions.publisher || 'Storyline',
      description: epubOptions.description || this.generateDescription(documentContent),
      cover: epubOptions.coverImage,
      lang: epubOptions.language || 'en',
      tocTitle: 'Table of Contents',
      appendChapterTitles: true,
      date: new Date().toISOString(),
      css: this.generateEPUBCSS(options),
      fonts: this.getFonts(options),
      verbose: false,
    };

    // Add optional metadata
    if (epubOptions.isbn) {
      epubConfig.isbn = epubOptions.isbn;
    }

    if (epubOptions.subject && epubOptions.subject.length > 0) {
      epubConfig.subject = epubOptions.subject.join(', ');
    }

    if (epubOptions.rights) {
      epubConfig.rights = epubOptions.rights;
    }

    if (documentContent.document.genre) {
      epubConfig.genre = documentContent.document.genre;
    }

    // Set cover image if provided
    if (documentContent.images && documentContent.images.length > 0) {
      const coverImage = documentContent.images.find(img => 
        img.caption?.toLowerCase().includes('cover') || 
        img.filename.toLowerCase().includes('cover')
      );
      if (coverImage && !epubConfig.cover) {
        epubConfig.cover = coverImage.url;
      }
    }

    return epubConfig;
  }

  /**
   * Generate description from document content
   */
  private generateDescription(documentContent: DocumentContent): string {
    const content = documentContent.chapters
      ? documentContent.chapters[0]?.content || documentContent.document.content
      : documentContent.document.content;
    
    // Strip HTML and get first paragraph
    const plainText = content.replace(/<[^>]*>/g, '');
    const firstParagraph = plainText.split('\n\n')[0];
    
    return firstParagraph.length > 300 
      ? firstParagraph.substring(0, 297) + '...'
      : firstParagraph;
  }

  /**
   * Generate CSS for EPUB
   */
  private generateEPUBCSS(options: ExportOptions): string {
    const fontSize = options.fontSize || 16;
    const fontFamily = options.fontFamily || 'Georgia, serif';
    const lineHeight = options.lineSpacing || 1.6;

    return `
      body {
        font-family: ${fontFamily};
        font-size: ${fontSize}px;
        line-height: ${lineHeight};
        margin: 0;
        padding: 1em;
        text-align: justify;
        hyphens: auto;
        -webkit-hyphens: auto;
        -moz-hyphens: auto;
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: ${fontFamily};
        font-weight: bold;
        text-align: left;
        page-break-after: avoid;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }

      h1 {
        font-size: 1.8em;
        text-align: center;
        margin-bottom: 1em;
      }

      h2 {
        font-size: 1.5em;
      }

      h3 {
        font-size: 1.3em;
      }

      p {
        margin: 0 0 1em 0;
        text-indent: 1.2em;
        orphans: 2;
        widows: 2;
      }

      p:first-child,
      h1 + p,
      h2 + p,
      h3 + p,
      h4 + p,
      h5 + p,
      h6 + p,
      .no-indent {
        text-indent: 0;
      }

      .chapter-title {
        text-align: center;
        font-size: 1.5em;
        font-weight: bold;
        margin: 2em 0 1em 0;
        page-break-before: always;
      }

      .scene-break {
        text-align: center;
        margin: 2em 0;
        font-size: 1.2em;
      }

      blockquote {
        margin: 1em 0;
        padding: 0 2em;
        font-style: italic;
        border-left: 3px solid #ccc;
      }

      em, i {
        font-style: italic;
      }

      strong, b {
        font-weight: bold;
      }

      .centered {
        text-align: center;
        text-indent: 0;
      }

      .right-aligned {
        text-align: right;
        text-indent: 0;
      }

      .character-list {
        margin: 1em 0;
      }

      .character-name {
        font-weight: bold;
        margin-top: 1em;
      }

      .character-description {
        margin-left: 1em;
        font-style: italic;
      }

      /* Table of Contents styling */
      .toc-item {
        margin: 0.5em 0;
      }

      .toc-chapter {
        font-weight: bold;
      }

      /* Print optimizations */
      @media print {
        body {
          font-size: 12pt;
        }
        
        .chapter-title {
          page-break-before: always;
        }
      }

      ${options.customCSS || ''}
    `;
  }

  /**
   * Get fonts for EPUB (if custom fonts are specified)
   */
  private getFonts(options: ExportOptions): string[] {
    // For now, return empty array. In a real implementation,
    // you might want to include custom font files
    return [];
  }

  /**
   * Prepare chapters for EPUB generation
   */
  private async prepareChapters(
    documentContent: DocumentContent,
    options: ExportOptions,
    authorInfo?: { name: string; email?: string }
  ): Promise<EPUBChapter[]> {
    const chapters: EPUBChapter[] = [];

    // Add title page
    if (options.template === 'book' || options.template === 'manuscript') {
      chapters.push({
        title: 'Title Page',
        content: await this.generateTitlePage(documentContent, authorInfo),
        beforeToc: true,
        excludeFromToc: true
      });
    }

    // Add copyright page
    if (options.epubOptions?.rights) {
      chapters.push({
        title: 'Copyright',
        content: this.generateCopyrightPage(documentContent, options.epubOptions),
        beforeToc: true,
        excludeFromToc: true
      });
    }

    // Add main content
    if (documentContent.chapters && documentContent.chapters.length > 0) {
      // Document has chapters
      for (const [index, chapter] of documentContent.chapters.entries()) {
        const chapterContent = await this.formatChapterContent(chapter, index, options);
        chapters.push({
          title: chapter.title || `Chapter ${index + 1}`,
          content: chapterContent,
          filename: `chapter-${index + 1}.xhtml`
        });
      }
    } else {
      // Single document - split into logical chapters if possible
      const autoChapters = this.autoSplitIntoChapters(documentContent.document.content);
      
      if (autoChapters.length > 1) {
        autoChapters.forEach((chapterContent, index) => {
          chapters.push({
            title: `Chapter ${index + 1}`,
            content: chapterContent,
            filename: `chapter-${index + 1}.xhtml`
          });
        });
      } else {
        chapters.push({
          title: documentContent.document.title,
          content: this.formatContent(documentContent.document.content),
          filename: 'content.xhtml'
        });
      }
    }

    // Add appendices
    if (options.includeCharacters && documentContent.document.characters?.length) {
      chapters.push({
        title: 'Characters',
        content: this.formatCharacters(documentContent.document.characters),
        filename: 'characters.xhtml'
      });
    }

    if (options.includeOutline && documentContent.document.outline?.length) {
      chapters.push({
        title: 'Outline',
        content: this.formatOutline(documentContent.document.outline),
        filename: 'outline.xhtml'
      });
    }

    return chapters;
  }

  /**
   * Generate title page HTML
   */
  private async generateTitlePage(
    documentContent: DocumentContent,
    authorInfo?: { name: string; email?: string }
  ): Promise<string> {
    let titlePage = '<div class="title-page">';
    
    titlePage += `<h1 class="book-title centered">${documentContent.document.title}</h1>`;
    
    if (documentContent.document.genre) {
      titlePage += `<p class="genre centered">${documentContent.document.genre}</p>`;
    }
    
    if (authorInfo?.name) {
      titlePage += `<p class="author centered">by ${authorInfo.name}</p>`;
    }
    
    titlePage += '</div>';
    
    return titlePage;
  }

  /**
   * Generate copyright page HTML
   */
  private generateCopyrightPage(
    documentContent: DocumentContent,
    epubOptions: EPUBExportOptions
  ): string {
    let copyrightPage = '<div class="copyright-page">';
    
    copyrightPage += `<h2>Copyright</h2>`;
    
    if (epubOptions.rights) {
      copyrightPage += `<p>${epubOptions.rights}</p>`;
    }
    
    if (epubOptions.isbn) {
      copyrightPage += `<p>ISBN: ${epubOptions.isbn}</p>`;
    }
    
    if (epubOptions.publisher) {
      copyrightPage += `<p>Published by ${epubOptions.publisher}</p>`;
    }
    
    copyrightPage += `<p>Created: ${new Date(documentContent.document.createdAt).getFullYear()}</p>`;
    copyrightPage += `<p>Generated by Storyline Document Export Service</p>`;
    
    copyrightPage += '</div>';
    
    return copyrightPage;
  }

  /**
   * Format chapter content for EPUB
   */
  private async formatChapterContent(
    chapter: any,
    index: number,
    options: ExportOptions
  ): Promise<string> {
    let content = '';
    
    // Chapter title
    if (chapter.title) {
      content += `<h1 class="chapter-title">${chapter.title}</h1>`;
    }
    
    // Chapter content
    content += this.formatContent(chapter.content);
    
    return content;
  }

  /**
   * Format content for EPUB (clean HTML)
   */
  private formatContent(content: string): string {
    // Basic HTML cleanup and formatting
    let formatted = content;
    
    // Ensure paragraphs are properly wrapped
    formatted = formatted.replace(/\n\n+/g, '</p><p>');
    formatted = formatted.replace(/^/, '<p>');
    formatted = formatted.replace(/$/, '</p>');
    
    // Clean up empty paragraphs
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');
    
    // Ensure proper HTML structure
    formatted = formatted.replace(/<p><h([1-6])>/g, '</p><h$1>');
    formatted = formatted.replace(/<\/h([1-6])><\/p>/g, '</h$1><p>');
    
    // Scene breaks
    formatted = formatted.replace(/\*\s*\*\s*\*/g, '<p class="scene-break">***</p>');
    
    return formatted;
  }

  /**
   * Auto-split content into chapters based on headings
   */
  private autoSplitIntoChapters(content: string): string[] {
    // Split on major headings (h1, h2) or chapter markers
    const chapterMarkers = /(?:<h[12][^>]*>.*?<\/h[12]>|chapter\s+\d+|part\s+\d+)/gi;
    const matches = Array.from(content.matchAll(chapterMarkers));
    
    if (matches.length === 0) {
      return [content]; // No natural chapter breaks found
    }
    
    const chapters: string[] = [];
    let lastIndex = 0;
    
    for (const match of matches) {
      if (match.index !== undefined && match.index > lastIndex) {
        const chapterContent = content.substring(lastIndex, match.index);
        if (chapterContent.trim()) {
          chapters.push(chapterContent.trim());
        }
        lastIndex = match.index;
      }
    }
    
    // Add remaining content
    const remainingContent = content.substring(lastIndex);
    if (remainingContent.trim()) {
      chapters.push(remainingContent.trim());
    }
    
    return chapters.length > 1 ? chapters : [content];
  }

  /**
   * Format characters section
   */
  private formatCharacters(characters: any[]): string {
    let charactersHtml = '<div class="character-list">';
    charactersHtml += '<h1>Characters</h1>';
    
    for (const character of characters) {
      charactersHtml += `<div class="character">`;
      charactersHtml += `<h2 class="character-name">${character.name}</h2>`;
      
      if (character.description) {
        charactersHtml += `<p class="character-description">${character.description}</p>`;
      }
      
      if (character.traits && character.traits.length > 0) {
        charactersHtml += `<p><strong>Traits:</strong> ${character.traits.join(', ')}</p>`;
      }
      
      if (character.relationships && character.relationships.length > 0) {
        charactersHtml += '<p><strong>Relationships:</strong></p><ul>';
        for (const rel of character.relationships) {
          charactersHtml += `<li>${rel.type}: ${rel.description || 'No description'}</li>`;
        }
        charactersHtml += '</ul>';
      }
      
      charactersHtml += '</div>';
    }
    
    charactersHtml += '</div>';
    return charactersHtml;
  }

  /**
   * Format outline section
   */
  private formatOutline(outline: any[]): string {
    let outlineHtml = '<div class="outline">';
    outlineHtml += '<h1>Outline</h1><ul>';
    
    for (const item of outline) {
      const indent = '  '.repeat(item.level - 1);
      outlineHtml += `<li style="margin-left: ${(item.level - 1) * 20}px">${item.title}</li>`;
    }
    
    outlineHtml += '</ul></div>';
    return outlineHtml;
  }

  /**
   * Generate EPUB file
   */
  private async generateEPUB(epubOptions: any, chapters: EPUBChapter[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const tempFilePath = path.join(this.tempDir, `${uuidv4()}.epub`);
      
      const epubGenerator = new EPub(epubOptions, tempFilePath);
      
      // Add chapters
      chapters.forEach(chapter => {
        epubGenerator.addChapter(chapter.title, chapter.content, chapter.filename, chapter.beforeToc, chapter.excludeFromToc);
      });
      
      epubGenerator.generateEPUB()
        .then(async () => {
          try {
            const buffer = await fs.readFile(tempFilePath);
            
            // Clean up temp file
            try {
              await fs.unlink(tempFilePath);
            } catch (cleanupError) {
              logger.warn('Failed to clean up temp EPUB file', { tempFilePath, error: cleanupError });
            }
            
            resolve(buffer);
          } catch (readError) {
            reject(new Error(`Failed to read generated EPUB: ${readError}`));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Calculate EPUB metadata
   */
  private calculateMetadata(
    documentContent: DocumentContent,
    chapters: EPUBChapter[],
    buffer: Buffer
  ): {
    chapterCount: number;
    wordCount: number;
    fileSize: number;
    isbn?: string;
  } {
    const wordCount = documentContent.chapters
      ? documentContent.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
      : documentContent.document.metadata.wordCount;

    return {
      chapterCount: chapters.filter(c => !c.beforeToc && !c.excludeFromToc).length,
      wordCount,
      fileSize: buffer.length,
      isbn: documentContent.document.metadata.isbn
    };
  }

  /**
   * Export multiple documents as batch EPUB
   */
  public async exportBatch(
    documents: DocumentContent[],
    options: ExportOptions,
    authorInfo?: { name: string; email?: string }
  ): Promise<EPUBExportResult> {
    try {
      logger.info('Starting batch EPUB export', {
        documentCount: documents.length
      });

      // Create a combined document structure
      const combinedDocument = this.createCombinedDocument(documents);
      
      // Export as single EPUB
      const result = await this.export(combinedDocument, options, authorInfo);
      
      // Update filename for batch
      const filename = this.generateBatchFilename(documents.length);

      logger.info('Batch EPUB export completed successfully', {
        documentCount: documents.length,
        fileSize: `${(result.buffer.length / 1024 / 1024).toFixed(2)} MB`
      });

      return {
        ...result,
        filename
      };
    } catch (error) {
      logger.error('Batch EPUB export failed', {
        documentCount: documents.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Batch EPUB export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create combined document from multiple documents
   */
  private createCombinedDocument(documents: DocumentContent[]): DocumentContent {
    const combinedDocument = {
      ...documents[0].document,
      title: `Collection - ${documents.length} Stories`,
      content: documents.map(doc => `<h1>${doc.document.title}</h1>\n${doc.document.content}`).join('\n\n'),
      metadata: {
        ...documents[0].document.metadata,
        wordCount: documents.reduce((sum, doc) => sum + doc.document.metadata.wordCount, 0)
      },
      tags: [...new Set(documents.flatMap(doc => doc.document.tags))],
    };

    // Combine all chapters with document prefixes
    const allChapters = documents.flatMap((doc, docIndex) => {
      if (!doc.chapters) {
        // Create a single chapter from document content
        return [{
          id: `doc-${docIndex}-main`,
          title: doc.document.title,
          content: doc.document.content,
          order: docIndex,
          wordCount: doc.document.metadata.wordCount
        }];
      }
      
      return doc.chapters.map((chapter, chapterIndex) => ({
        ...chapter,
        title: `${doc.document.title} - ${chapter.title}`,
        order: docIndex * 1000 + chapterIndex // Ensure proper ordering
      }));
    });

    const allImages = documents.flatMap(doc => doc.images || []);

    return {
      document: combinedDocument,
      chapters: allChapters.length > 0 ? allChapters : undefined,
      images: allImages.length > 0 ? allImages : undefined
    };
  }

  /**
   * Generate filename
   */
  private generateFilename(title: string): string {
    const cleanTitle = title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    const timestamp = new Date().toISOString().split('T')[0];
    return `${cleanTitle}-${timestamp}.epub`;
  }

  /**
   * Generate batch filename
   */
  private generateBatchFilename(documentCount: number): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `collection-${documentCount}-stories-${timestamp}.epub`;
  }
}