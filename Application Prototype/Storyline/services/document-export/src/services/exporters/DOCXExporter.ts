import * as officegen from 'officegen';
import { ExportOptions, DOCXExportOptions } from '@storyline/shared-types';
import { DocumentContent } from '../MemoryService';
import { TemplateService, TemplateData } from '../TemplateService';
import { logger } from '../../utils/logger';
import { Readable } from 'stream';

export interface DOCXExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
  metadata: {
    wordCount: number;
    pages: number;
    characters: number;
  };
}

export class DOCXExporter {
  private templateService: TemplateService;

  constructor() {
    this.templateService = TemplateService.getInstance();
  }

  /**
   * Export document to DOCX format
   */
  public async export(
    documentContent: DocumentContent,
    options: ExportOptions,
    authorInfo?: { name: string; email?: string }
  ): Promise<DOCXExportResult> {
    try {
      logger.info('Starting DOCX export', {
        documentId: documentContent.document.id,
        title: documentContent.document.title,
        wordCount: documentContent.document.metadata.wordCount
      });

      // Create DOCX document
      const docx = officegen('docx');
      
      // Configure document properties
      this.configureDocumentProperties(docx, documentContent, options, authorInfo);
      
      // Add content based on template
      await this.addContent(docx, documentContent, options, authorInfo);
      
      // Generate buffer
      const buffer = await this.generateBuffer(docx);
      
      // Calculate metadata
      const metadata = this.calculateMetadata(documentContent, buffer);
      
      const filename = this.generateFilename(documentContent.document.title);
      
      logger.info('DOCX export completed successfully', {
        documentId: documentContent.document.id,
        fileSize: `${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
        wordCount: metadata.wordCount
      });

      return {
        buffer,
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata
      };
    } catch (error) {
      logger.error('DOCX export failed', {
        documentId: documentContent.document.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`DOCX export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Configure document properties
   */
  private configureDocumentProperties(
    docx: any,
    documentContent: DocumentContent,
    options: ExportOptions,
    authorInfo?: { name: string; email?: string }
  ): void {
    const docxOptions = options.docxOptions || {} as DOCXExportOptions;
    
    // Set document properties
    docx.setDocTitle(documentContent.document.title);
    
    if (authorInfo?.name || docxOptions.creator) {
      docx.setDocCreator(authorInfo?.name || docxOptions.creator);
    }
    
    if (docxOptions.description) {
      docx.setDocSubject(docxOptions.description);
    }
    
    if (docxOptions.keywords?.length) {
      docx.setDocKeywords(docxOptions.keywords.join(', '));
    }
    
    if (docxOptions.category) {
      docx.setDocCategory(docxOptions.category);
    }
    
    if (docxOptions.comments) {
      docx.setDocComments(docxOptions.comments);
    }

    // Configure page settings
    this.configurePageSettings(docx, options);
    
    // Configure styles
    this.configureStyles(docx, options);
  }

  /**
   * Configure page settings
   */
  private configurePageSettings(docx: any, options: ExportOptions): void {
    const pageSettings: any = {};
    
    // Page size
    if (options.pageSize) {
      switch (options.pageSize) {
        case 'A4':
          pageSettings.width = 595;
          pageSettings.height = 842;
          break;
        case 'A5':
          pageSettings.width = 420;
          pageSettings.height = 595;
          break;
        case 'Letter':
          pageSettings.width = 612;
          pageSettings.height = 792;
          break;
        case 'Legal':
          pageSettings.width = 612;
          pageSettings.height = 1008;
          break;
      }
    }
    
    // Margins (convert from mm to points: 1mm = 2.834645669 points)
    if (options.margins) {
      const { top, right, bottom, left } = options.margins;
      pageSettings.margins = {
        top: Math.round(top * 2.834645669),
        right: Math.round(right * 2.834645669),
        bottom: Math.round(bottom * 2.834645669),
        left: Math.round(left * 2.834645669)
      };
    }
    
    if (Object.keys(pageSettings).length > 0) {
      docx.setDocPageSettings(pageSettings);
    }
  }

  /**
   * Configure document styles
   */
  private configureStyles(docx: any, options: ExportOptions): void {
    // Default paragraph style
    const paragraphStyle: any = {};
    
    if (options.fontFamily) {
      paragraphStyle.font_face = options.fontFamily;
    }
    
    if (options.fontSize) {
      paragraphStyle.font_size = options.fontSize;
    }
    
    if (options.lineSpacing) {
      paragraphStyle.line_spacing = options.lineSpacing;
    }
    
    // Apply default paragraph style
    if (Object.keys(paragraphStyle).length > 0) {
      docx.setDefaultParagraphStyle(paragraphStyle);
    }
    
    // Configure heading styles
    this.configureHeadingStyles(docx, options);
  }

  /**
   * Configure heading styles
   */
  private configureHeadingStyles(docx: any, options: ExportOptions): void {
    const baseSize = options.fontSize || 12;
    
    // Title style
    docx.setTitleStyle({
      font_face: options.fontFamily || 'Times New Roman',
      font_size: Math.round(baseSize * 2),
      bold: true,
      align: 'center'
    });
    
    // Heading styles
    for (let level = 1; level <= 6; level++) {
      const size = Math.round(baseSize * (1.5 - (level - 1) * 0.1));
      docx.setHeadingStyle(level, {
        font_face: options.fontFamily || 'Times New Roman',
        font_size: size,
        bold: true,
        spacing_before: level === 1 ? 24 : 12,
        spacing_after: 6
      });
    }
  }

  /**
   * Add content to the document
   */
  private async addContent(
    docx: any,
    documentContent: DocumentContent,
    options: ExportOptions,
    authorInfo?: { name: string; email?: string }
  ): Promise<void> {
    // Add title page if requested
    if (options.template === 'manuscript' || options.template === 'book') {
      this.addTitlePage(docx, documentContent, authorInfo);
    }
    
    // Add main content
    if (documentContent.chapters && documentContent.chapters.length > 0) {
      // Document has chapters
      for (const [index, chapter] of documentContent.chapters.entries()) {
        if (index > 0 && options.chapterBreaks) {
          docx.putPageBreak();
        }
        
        this.addChapter(docx, chapter, index, options);
      }
    } else {
      // Single document content
      this.addPlainContent(docx, documentContent.document.content, options);
    }
    
    // Add appendices
    if (options.includeCharacters && documentContent.document.characters?.length) {
      this.addCharactersSection(docx, documentContent.document.characters);
    }
    
    if (options.includeOutline && documentContent.document.outline?.length) {
      this.addOutlineSection(docx, documentContent.document.outline);
    }
  }

  /**
   * Add title page
   */
  private addTitlePage(
    docx: any,
    documentContent: DocumentContent,
    authorInfo?: { name: string; email?: string }
  ): void {
    // Title
    const titleParagraph = docx.createP();
    titleParagraph.addText(documentContent.document.title, {
      font_size: 24,
      bold: true,
      align: 'center'
    });
    
    // Author
    if (authorInfo?.name) {
      const authorParagraph = docx.createP();
      authorParagraph.addText(`by ${authorInfo.name}`, {
        font_size: 16,
        align: 'center'
      });
    }
    
    // Genre
    if (documentContent.document.genre) {
      const genreParagraph = docx.createP();
      genreParagraph.addText(documentContent.document.genre, {
        font_size: 12,
        italic: true,
        align: 'center'
      });
    }
    
    // Word count
    const wordCountParagraph = docx.createP();
    wordCountParagraph.addText(`${documentContent.document.metadata.wordCount} words`, {
      font_size: 12,
      align: 'center'
    });
    
    // Page break after title page
    docx.putPageBreak();
  }

  /**
   * Add chapter content
   */
  private addChapter(docx: any, chapter: any, index: number, options: ExportOptions): void {
    // Chapter title
    if (chapter.title) {
      const titleParagraph = docx.createP();
      
      if (options.template === 'book') {
        titleParagraph.addText(`Chapter ${index + 1}`, {
          font_size: (options.fontSize || 12) * 1.5,
          bold: true,
          align: 'center'
        });
        
        const subtitleParagraph = docx.createP();
        subtitleParagraph.addText(chapter.title, {
          font_size: (options.fontSize || 12) * 1.2,
          italic: true,
          align: 'center'
        });
      } else {
        titleParagraph.addText(chapter.title, {
          font_size: (options.fontSize || 12) * 1.3,
          bold: true,
          align: 'center'
        });
      }
    }
    
    // Chapter content
    this.addPlainContent(docx, chapter.content, options);
  }

  /**
   * Add plain text content with basic formatting
   */
  private addPlainContent(docx: any, content: string, options: ExportOptions): void {
    // Split content into paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    
    for (const paragraphText of paragraphs) {
      const paragraph = docx.createP();
      
      // Apply basic formatting options
      const textOptions: any = {};
      
      if (options.fontFamily) {
        textOptions.font_face = options.fontFamily;
      }
      
      if (options.fontSize) {
        textOptions.font_size = options.fontSize;
      }
      
      // Add text with basic HTML-like formatting support
      this.addFormattedText(paragraph, paragraphText, textOptions);
    }
  }

  /**
   * Add formatted text with basic markup support
   */
  private addFormattedText(paragraph: any, text: string, baseOptions: any): void {
    // Simple regex-based formatting (basic implementation)
    // In a real implementation, you'd want a proper HTML/Markdown parser
    
    let processedText = text;
    
    // Handle bold text
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, (match, content) => {
      paragraph.addText(content, { ...baseOptions, bold: true });
      return '';
    });
    
    // Handle italic text
    processedText = processedText.replace(/\*(.*?)\*/g, (match, content) => {
      paragraph.addText(content, { ...baseOptions, italic: true });
      return '';
    });
    
    // Add remaining text
    if (processedText.trim()) {
      paragraph.addText(processedText, baseOptions);
    }
  }

  /**
   * Add characters section
   */
  private addCharactersSection(docx: any, characters: any[]): void {
    docx.putPageBreak();
    
    const titleParagraph = docx.createP();
    titleParagraph.addText('Characters', {
      font_size: 18,
      bold: true,
      align: 'center'
    });
    
    for (const character of characters) {
      const nameParagraph = docx.createP();
      nameParagraph.addText(character.name, {
        font_size: 14,
        bold: true
      });
      
      if (character.description) {
        const descParagraph = docx.createP();
        descParagraph.addText(character.description);
      }
      
      if (character.traits?.length) {
        const traitsParagraph = docx.createP();
        traitsParagraph.addText(`Traits: ${character.traits.join(', ')}`, {
          italic: true
        });
      }
    }
  }

  /**
   * Add outline section
   */
  private addOutlineSection(docx: any, outline: any[]): void {
    docx.putPageBreak();
    
    const titleParagraph = docx.createP();
    titleParagraph.addText('Outline', {
      font_size: 18,
      bold: true,
      align: 'center'
    });
    
    for (const item of outline) {
      const itemParagraph = docx.createP();
      const indent = '  '.repeat(item.level - 1);
      itemParagraph.addText(`${indent}${item.title}`, {
        font_size: 12 - (item.level - 1)
      });
    }
  }

  /**
   * Generate buffer from DOCX document
   */
  private generateBuffer(docx: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      docx.generate(Readable.from([]), {
        finalize: (writtenBytes: number) => {
          resolve(Buffer.concat(chunks));
        },
        error: (error: Error) => {
          reject(error);
        }
      });
      
      docx.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
    });
  }

  /**
   * Calculate document metadata
   */
  private calculateMetadata(documentContent: DocumentContent, buffer: Buffer): {
    wordCount: number;
    pages: number;
    characters: number;
  } {
    const content = documentContent.chapters
      ? documentContent.chapters.map(c => c.content).join(' ')
      : documentContent.document.content;
    
    const wordCount = content.trim().split(/\s+/).length;
    const characters = content.length;
    
    // Rough page estimation (250 words per page)
    const pages = Math.max(1, Math.ceil(wordCount / 250));
    
    return {
      wordCount,
      pages,
      characters
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
    return `${cleanTitle}-${timestamp}.docx`;
  }
}