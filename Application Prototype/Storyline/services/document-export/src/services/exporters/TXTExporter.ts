import { ExportOptions } from '@storyline/shared-types';
import { DocumentContent } from '../MemoryService';
import { logger } from '../../utils/logger';

export interface TXTExportResult {
  content: string;
  filename: string;
  contentType: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    lineCount: number;
    encoding: string;
  };
}

export class TXTExporter {
  /**
   * Export document to plain text format
   */
  public async export(
    documentContent: DocumentContent,
    options: ExportOptions,
    authorInfo?: { name: string; email?: string }
  ): Promise<TXTExportResult> {
    try {
      logger.info('Starting TXT export', {
        documentId: documentContent.document.id,
        title: documentContent.document.title,
        wordCount: documentContent.document.metadata.wordCount
      });

      let text = '';
      const lineWidth = options.lineSpacing ? Math.floor(80 * options.lineSpacing) : 80;

      // Add header information
      if (options.includeMetadata) {
        text += this.generateHeader(documentContent, authorInfo, lineWidth);
      }

      // Add title
      text += this.centerText(documentContent.document.title.toUpperCase(), lineWidth) + '\n\n';

      // Add author info
      if (authorInfo?.name) {
        text += this.centerText(`by ${authorInfo.name}`, lineWidth) + '\n\n';
      }

      // Add separator
      text += '='.repeat(lineWidth) + '\n\n';

      // Add main content
      if (documentContent.chapters && documentContent.chapters.length > 0) {
        // Document has chapters
        for (const [index, chapter] of documentContent.chapters.entries()) {
          if (index > 0) {
            text += '\n\n' + '='.repeat(lineWidth) + '\n\n';
          }
          
          text += this.formatChapter(chapter, index, options, lineWidth);
        }
      } else {
        // Single document content
        text += this.formatContent(documentContent.document.content, options, lineWidth);
      }

      // Add appendices
      if (options.includeCharacters && documentContent.document.characters?.length) {
        text += '\n\n' + '='.repeat(lineWidth) + '\n\n';
        text += this.formatCharacters(documentContent.document.characters, lineWidth);
      }

      if (options.includeOutline && documentContent.document.outline?.length) {
        text += '\n\n' + '='.repeat(lineWidth) + '\n\n';
        text += this.formatOutline(documentContent.document.outline, lineWidth);
      }

      // Add footer
      if (options.includeMetadata) {
        text += '\n\n' + '='.repeat(lineWidth) + '\n\n';
        text += this.generateFooter(documentContent, lineWidth);
      }

      // Calculate metadata
      const metadata = this.calculateMetadata(text);
      const filename = this.generateFilename(documentContent.document.title);

      logger.info('TXT export completed successfully', {
        documentId: documentContent.document.id,
        wordCount: metadata.wordCount,
        lines: metadata.lineCount,
        size: `${(text.length / 1024).toFixed(2)} KB`
      });

      return {
        content: text,
        filename,
        contentType: 'text/plain',
        metadata
      };
    } catch (error) {
      logger.error('TXT export failed', {
        documentId: documentContent.document.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`TXT export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate header with metadata
   */
  private generateHeader(
    documentContent: DocumentContent,
    authorInfo?: { name: string; email?: string },
    lineWidth: number = 80
  ): string {
    let header = '';
    
    header += this.centerText('DOCUMENT INFORMATION', lineWidth) + '\n';
    header += '-'.repeat(lineWidth) + '\n\n';
    
    if (authorInfo?.name) {
      header += this.formatLine('Author:', authorInfo.name, lineWidth) + '\n';
    }
    
    if (authorInfo?.email) {
      header += this.formatLine('Email:', authorInfo.email, lineWidth) + '\n';
    }
    
    if (documentContent.document.genre) {
      header += this.formatLine('Genre:', documentContent.document.genre, lineWidth) + '\n';
    }
    
    if (documentContent.document.tags.length > 0) {
      header += this.formatLine('Tags:', documentContent.document.tags.join(', '), lineWidth) + '\n';
    }
    
    header += this.formatLine('Word Count:', documentContent.document.metadata.wordCount.toLocaleString(), lineWidth) + '\n';
    header += this.formatLine('Created:', new Date(documentContent.document.createdAt).toLocaleDateString(), lineWidth) + '\n';
    header += this.formatLine('Updated:', new Date(documentContent.document.updatedAt).toLocaleDateString(), lineWidth) + '\n';
    header += this.formatLine('Exported:', new Date().toLocaleDateString(), lineWidth) + '\n';
    
    header += '\n' + '='.repeat(lineWidth) + '\n\n';
    
    return header;
  }

  /**
   * Generate footer with export information
   */
  private generateFooter(documentContent: DocumentContent, lineWidth: number = 80): string {
    let footer = '';
    
    footer += this.centerText('EXPORT SUMMARY', lineWidth) + '\n';
    footer += '-'.repeat(lineWidth) + '\n\n';
    
    footer += this.formatLine('Total Words:', documentContent.document.metadata.wordCount.toLocaleString(), lineWidth) + '\n';
    footer += this.formatLine('Total Characters:', documentContent.document.metadata.characterCount.toLocaleString(), lineWidth) + '\n';
    footer += this.formatLine('Reading Time:', `${documentContent.document.metadata.readingTime} minutes`, lineWidth) + '\n';
    
    if (documentContent.chapters) {
      footer += this.formatLine('Chapters:', documentContent.chapters.length.toString(), lineWidth) + '\n';
    }
    
    if (documentContent.document.characters) {
      footer += this.formatLine('Characters:', documentContent.document.characters.length.toString(), lineWidth) + '\n';
    }
    
    footer += this.formatLine('Export Format:', 'Plain Text (.txt)', lineWidth) + '\n';
    footer += this.formatLine('Generated by:', 'Storyline Document Export Service', lineWidth) + '\n';
    
    return footer;
  }

  /**
   * Format a chapter for plain text
   */
  private formatChapter(chapter: any, index: number, options: ExportOptions, lineWidth: number): string {
    let chapterText = '';

    // Chapter title
    if (chapter.title) {
      const chapterHeader = `CHAPTER ${index + 1}: ${chapter.title.toUpperCase()}`;
      chapterText += this.centerText(chapterHeader, lineWidth) + '\n\n';
    } else {
      const chapterHeader = `CHAPTER ${index + 1}`;
      chapterText += this.centerText(chapterHeader, lineWidth) + '\n\n';
    }

    // Chapter content
    chapterText += this.formatContent(chapter.content, options, lineWidth);

    return chapterText;
  }

  /**
   * Format content with plain text conversion
   */
  private formatContent(content: string, options: ExportOptions, lineWidth: number): string {
    // Strip HTML tags and convert to plain text
    let plainText = this.stripHTML(content);
    
    // Handle special formatting
    plainText = this.handleSpecialFormatting(plainText);
    
    // Wrap text to specified width
    const wrappedText = this.wrapText(plainText, lineWidth);
    
    return wrappedText;
  }

  /**
   * Strip HTML tags and convert to plain text
   */
  private stripHTML(html: string): string {
    // Convert common HTML elements to plain text equivalents
    let text = html;
    
    // Headers to uppercase with spacing
    text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n' + '-'.repeat(20) + '\n');
    
    // Paragraphs
    text = text.replace(/<p[^>]*>/gi, '\n\n');
    text = text.replace(/<\/p>/gi, '');
    
    // Line breaks
    text = text.replace(/<br\s*\/?>/gi, '\n');
    
    // Lists
    text = text.replace(/<ul[^>]*>/gi, '\n');
    text = text.replace(/<\/ul>/gi, '\n');
    text = text.replace(/<ol[^>]*>/gi, '\n');
    text = text.replace(/<\/ol>/gi, '\n');
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
    
    // Emphasis - convert to uppercase
    text = text.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, (match, tag, content) => content.toUpperCase());
    text = text.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*');
    
    // Blockquotes
    text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
      return '\n' + content.split('\n').map((line: string) => '    ' + line.trim()).join('\n') + '\n';
    });
    
    // Links - show URL in parentheses
    text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)');
    
    // Images - show alt text or filename
    text = text.replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, '[Image: $1]');
    text = text.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '[Image: $1]');
    
    // Remove all remaining HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&nbsp;/g, ' ');
    
    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+$/gm, ''); // Remove trailing spaces
    
    return text.trim();
  }

  /**
   * Handle special formatting for plain text
   */
  private handleSpecialFormatting(text: string): string {
    // Convert common typographic elements
    text = text.replace(/—/g, '--'); // Em dash
    text = text.replace(/–/g, '-');  // En dash
    text = text.replace(/[""]/g, '"'); // Smart quotes
    text = text.replace(/['']/g, "'"); // Smart apostrophes
    text = text.replace(/…/g, '...'); // Ellipsis
    
    return text;
  }

  /**
   * Wrap text to specified width
   */
  private wrapText(text: string, width: number): string {
    const paragraphs = text.split(/\n\s*\n/);
    const wrappedParagraphs = paragraphs.map(paragraph => {
      if (paragraph.trim() === '') return '';
      
      // Don't wrap lines that are already formatted (like headers)
      if (paragraph.includes('---') || paragraph.startsWith('    ')) {
        return paragraph;
      }
      
      const words = paragraph.trim().split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        if (currentLine.length + word.length + 1 <= width) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines.join('\n');
    });
    
    return wrappedParagraphs.join('\n\n');
  }

  /**
   * Center text within specified width
   */
  private centerText(text: string, width: number): string {
    if (text.length >= width) return text;
    
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text;
  }

  /**
   * Format a line with label and value
   */
  private formatLine(label: string, value: string, width: number): string {
    const maxValueWidth = width - label.length - 2; // -2 for ': '
    let displayValue = value;
    
    if (displayValue.length > maxValueWidth) {
      displayValue = displayValue.substring(0, maxValueWidth - 3) + '...';
    }
    
    return `${label} ${displayValue}`;
  }

  /**
   * Format characters section
   */
  private formatCharacters(characters: any[], lineWidth: number): string {
    let charactersSection = this.centerText('CHARACTER NOTES', lineWidth) + '\n';
    charactersSection += '-'.repeat(lineWidth) + '\n\n';

    for (const character of characters) {
      charactersSection += character.name.toUpperCase() + '\n';
      charactersSection += '-'.repeat(character.name.length) + '\n';
      
      if (character.description) {
        charactersSection += this.wrapText(character.description, lineWidth) + '\n';
      }
      
      if (character.traits && character.traits.length > 0) {
        charactersSection += '\nTraits: ' + character.traits.join(', ') + '\n';
      }

      if (character.relationships && character.relationships.length > 0) {
        charactersSection += '\nRelationships:\n';
        for (const rel of character.relationships) {
          charactersSection += `  ${rel.type}: ${rel.description || 'No description'}\n`;
        }
      }
      
      charactersSection += '\n';
    }

    return charactersSection;
  }

  /**
   * Format outline section
   */
  private formatOutline(outline: any[], lineWidth: number): string {
    let outlineSection = this.centerText('DOCUMENT OUTLINE', lineWidth) + '\n';
    outlineSection += '-'.repeat(lineWidth) + '\n\n';

    for (const item of outline) {
      const indent = '  '.repeat(item.level - 1);
      const bullet = item.level === 1 ? '•' : '◦';
      outlineSection += `${indent}${bullet} ${item.title}\n`;
    }

    return outlineSection + '\n';
  }

  /**
   * Export multiple documents as batch
   */
  public async exportBatch(
    documents: DocumentContent[],
    options: ExportOptions,
    authorInfo?: { name: string; email?: string }
  ): Promise<TXTExportResult> {
    try {
      logger.info('Starting batch TXT export', {
        documentCount: documents.length
      });

      const lineWidth = options.lineSpacing ? Math.floor(80 * options.lineSpacing) : 80;
      let batchText = '';

      // Add batch header
      batchText += this.centerText('BATCH DOCUMENT EXPORT', lineWidth) + '\n';
      batchText += '='.repeat(lineWidth) + '\n\n';
      
      if (authorInfo?.name) {
        batchText += this.formatLine('Author:', authorInfo.name, lineWidth) + '\n';
      }
      
      batchText += this.formatLine('Documents:', documents.length.toString(), lineWidth) + '\n';
      batchText += this.formatLine('Exported:', new Date().toLocaleString(), lineWidth) + '\n\n';

      // Add table of contents
      batchText += this.centerText('TABLE OF CONTENTS', lineWidth) + '\n';
      batchText += '-'.repeat(lineWidth) + '\n\n';
      documents.forEach((doc, index) => {
        batchText += `${(index + 1).toString().padStart(2)}. ${doc.document.title}\n`;
      });
      batchText += '\n' + '='.repeat(lineWidth) + '\n\n';

      // Add each document
      for (const [index, doc] of documents.entries()) {
        if (index > 0) {
          batchText += '\n\n' + '='.repeat(lineWidth) + '\n\n';
        }

        // Document header
        batchText += this.centerText(`DOCUMENT ${index + 1}: ${doc.document.title.toUpperCase()}`, lineWidth) + '\n\n';

        if (doc.document.genre) {
          batchText += this.formatLine('Genre:', doc.document.genre, lineWidth) + '\n';
        }

        if (doc.document.tags.length > 0) {
          batchText += this.formatLine('Tags:', doc.document.tags.join(', '), lineWidth) + '\n';
        }

        batchText += this.formatLine('Word Count:', doc.document.metadata.wordCount.toLocaleString(), lineWidth) + '\n\n';
        batchText += '-'.repeat(lineWidth) + '\n\n';

        // Document content
        if (doc.chapters && doc.chapters.length > 0) {
          for (const chapter of doc.chapters) {
            batchText += this.formatChapter(chapter, 0, options, lineWidth) + '\n\n';
          }
        } else {
          batchText += this.formatContent(doc.document.content, options, lineWidth) + '\n\n';
        }
      }

      const metadata = this.calculateMetadata(batchText);
      const filename = this.generateBatchFilename(documents.length);

      logger.info('Batch TXT export completed successfully', {
        documentCount: documents.length,
        wordCount: metadata.wordCount,
        lines: metadata.lineCount,
        size: `${(batchText.length / 1024).toFixed(2)} KB`
      });

      return {
        content: batchText,
        filename,
        contentType: 'text/plain',
        metadata
      };
    } catch (error) {
      logger.error('Batch TXT export failed', {
        documentCount: documents.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Batch TXT export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate text metadata
   */
  private calculateMetadata(content: string): {
    wordCount: number;
    characterCount: number;
    lineCount: number;
    encoding: string;
  } {
    const wordCount = content.trim().split(/\s+/).length;
    const characterCount = content.length;
    const lineCount = content.split('\n').length;

    return {
      wordCount,
      characterCount,
      lineCount,
      encoding: 'UTF-8'
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
    return `${cleanTitle}-${timestamp}.txt`;
  }

  /**
   * Generate batch filename
   */
  private generateBatchFilename(documentCount: number): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `batch-export-${documentCount}-docs-${timestamp}.txt`;
  }
}