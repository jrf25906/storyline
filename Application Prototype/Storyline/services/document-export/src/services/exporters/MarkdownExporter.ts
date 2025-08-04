import { ExportOptions } from '@storyline/shared-types';
import { DocumentContent } from '../MemoryService';
import { logger } from '../../utils/logger';

export interface MarkdownExportResult {
  content: string;
  filename: string;
  contentType: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    lineCount: number;
  };
}

export class MarkdownExporter {
  /**
   * Export document to Markdown format
   */
  public async export(
    documentContent: DocumentContent,
    options: ExportOptions,
    authorInfo?: { name: string; email?: string }
  ): Promise<MarkdownExportResult> {
    try {
      logger.info('Starting Markdown export', {
        documentId: documentContent.document.id,
        title: documentContent.document.title,
        wordCount: documentContent.document.metadata.wordCount
      });

      let markdown = '';

      // Add front matter if requested
      if (options.includeMetadata) {
        markdown += this.generateFrontMatter(documentContent, authorInfo);
      }

      // Add title
      markdown += `# ${documentContent.document.title}\n\n`;

      // Add author info
      if (authorInfo?.name) {
        markdown += `**Author:** ${authorInfo.name}\n\n`;
      }

      // Add genre and tags
      if (documentContent.document.genre) {
        markdown += `**Genre:** ${documentContent.document.genre}\n\n`;
      }

      if (documentContent.document.tags.length > 0) {
        markdown += `**Tags:** ${documentContent.document.tags.join(', ')}\n\n`;
      }

      // Add word count
      if (options.includeMetadata) {
        markdown += `**Word Count:** ${documentContent.document.metadata.wordCount}\n\n`;
        markdown += `---\n\n`;
      }

      // Add main content
      if (documentContent.chapters && documentContent.chapters.length > 0) {
        // Document has chapters
        for (const [index, chapter] of documentContent.chapters.entries()) {
          if (index > 0) {
            markdown += '\n\n';
          }
          
          markdown += this.formatChapter(chapter, index, options);
        }
      } else {
        // Single document content
        markdown += this.formatContent(documentContent.document.content);
      }

      // Add appendices
      if (options.includeCharacters && documentContent.document.characters?.length) {
        markdown += '\n\n' + this.formatCharacters(documentContent.document.characters);
      }

      if (options.includeOutline && documentContent.document.outline?.length) {
        markdown += '\n\n' + this.formatOutline(documentContent.document.outline);
      }

      // Calculate metadata
      const metadata = this.calculateMetadata(markdown);
      const filename = this.generateFilename(documentContent.document.title);

      logger.info('Markdown export completed successfully', {
        documentId: documentContent.document.id,
        wordCount: metadata.wordCount,
        lines: metadata.lineCount
      });

      return {
        content: markdown,
        filename,
        contentType: 'text/markdown',
        metadata
      };
    } catch (error) {
      logger.error('Markdown export failed', {
        documentId: documentContent.document.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Markdown export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate YAML front matter
   */
  private generateFrontMatter(
    documentContent: DocumentContent,
    authorInfo?: { name: string; email?: string }
  ): string {
    const frontMatter = [
      '---',
      `title: "${documentContent.document.title}"`,
    ];

    if (authorInfo?.name) {
      frontMatter.push(`author: "${authorInfo.name}"`);
    }

    if (documentContent.document.genre) {
      frontMatter.push(`genre: "${documentContent.document.genre}"`);
    }

    if (documentContent.document.tags.length > 0) {
      frontMatter.push(`tags: [${documentContent.document.tags.map(tag => `"${tag}"`).join(', ')}]`);
    }

    frontMatter.push(`wordCount: ${documentContent.document.metadata.wordCount}`);
    frontMatter.push(`created: "${documentContent.document.createdAt}"`);
    frontMatter.push(`updated: "${documentContent.document.updatedAt}"`);
    frontMatter.push(`exported: "${new Date().toISOString()}"`);
    frontMatter.push('---\n');

    return frontMatter.join('\n') + '\n';
  }

  /**
   * Format a chapter for Markdown
   */
  private formatChapter(chapter: any, index: number, options: ExportOptions): string {
    let chapterMd = '';

    // Chapter title
    if (chapter.title) {
      chapterMd += `## Chapter ${index + 1}: ${chapter.title}\n\n`;
    } else {
      chapterMd += `## Chapter ${index + 1}\n\n`;
    }

    // Chapter content
    chapterMd += this.formatContent(chapter.content);

    return chapterMd;
  }

  /**
   * Format content with basic HTML to Markdown conversion
   */
  private formatContent(content: string): string {
    let formatted = content;

    // Convert HTML headings to Markdown
    formatted = formatted.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1');
    formatted = formatted.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1');
    formatted = formatted.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1');
    formatted = formatted.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1');
    formatted = formatted.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1');
    formatted = formatted.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1');

    // Convert HTML formatting to Markdown
    formatted = formatted.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    formatted = formatted.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    formatted = formatted.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    formatted = formatted.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    formatted = formatted.replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__');

    // Convert links
    formatted = formatted.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convert images
    formatted = formatted.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
    formatted = formatted.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');

    // Convert blockquotes
    formatted = formatted.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
      return content.split('\n').map((line: string) => `> ${line.trim()}`).join('\n');
    });

    // Convert lists
    formatted = formatted.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1').trim();
    });

    formatted = formatted.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1`).trim();
    });

    // Convert code blocks
    formatted = formatted.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```');
    formatted = formatted.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Convert line breaks
    formatted = formatted.replace(/<br\s*\/?>/gi, '\n');

    // Convert paragraphs
    formatted = formatted.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n');

    // Clean up remaining HTML tags
    formatted = formatted.replace(/<[^>]*>/g, '');

    // Clean up extra whitespace
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    formatted = formatted.replace(/[ \t]+$/gm, ''); // Remove trailing spaces

    return formatted.trim();
  }

  /**
   * Format characters section
   */
  private formatCharacters(characters: any[]): string {
    let charactersSection = '## Characters\n\n';

    for (const character of characters) {
      charactersSection += `### ${character.name}\n\n`;
      
      if (character.description) {
        charactersSection += `${character.description}\n\n`;
      }
      
      if (character.traits && character.traits.length > 0) {
        charactersSection += `**Traits:** ${character.traits.join(', ')}\n\n`;
      }

      if (character.relationships && character.relationships.length > 0) {
        charactersSection += '**Relationships:**\n\n';
        for (const rel of character.relationships) {
          charactersSection += `- ${rel.type}: ${rel.description || 'No description'}\n`;
        }
        charactersSection += '\n';
      }
    }

    return charactersSection;
  }

  /**
   * Format outline section
   */
  private formatOutline(outline: any[]): string {
    let outlineSection = '## Outline\n\n';

    for (const item of outline) {
      const indent = '  '.repeat(item.level - 1);
      const prefix = item.level === 1 ? '-' : '*';
      outlineSection += `${indent}${prefix} ${item.title}\n`;
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
  ): Promise<MarkdownExportResult> {
    try {
      logger.info('Starting batch Markdown export', {
        documentCount: documents.length
      });

      let batchMarkdown = '';

      // Add batch header
      batchMarkdown += `# Batch Export - ${documents.length} Documents\n\n`;
      
      if (authorInfo?.name) {
        batchMarkdown += `**Author:** ${authorInfo.name}\n\n`;
      }

      batchMarkdown += `**Exported:** ${new Date().toLocaleString()}\n\n`;
      batchMarkdown += `---\n\n`;

      // Add table of contents
      batchMarkdown += '## Table of Contents\n\n';
      documents.forEach((doc, index) => {
        batchMarkdown += `${index + 1}. [${doc.document.title}](#${this.slugify(doc.document.title)})\n`;
      });
      batchMarkdown += '\n---\n\n';

      // Add each document
      for (const [index, doc] of documents.entries()) {
        if (index > 0) {
          batchMarkdown += '\n\n---\n\n';
        }

        // Document header
        batchMarkdown += `# ${doc.document.title} {#${this.slugify(doc.document.title)}}\n\n`;

        if (doc.document.genre) {
          batchMarkdown += `**Genre:** ${doc.document.genre}\n\n`;
        }

        if (doc.document.tags.length > 0) {
          batchMarkdown += `**Tags:** ${doc.document.tags.join(', ')}\n\n`;
        }

        batchMarkdown += `**Word Count:** ${doc.document.metadata.wordCount}\n\n`;

        // Document content
        if (doc.chapters && doc.chapters.length > 0) {
          for (const chapter of doc.chapters) {
            batchMarkdown += this.formatChapter(chapter, 0, options) + '\n\n';
          }
        } else {
          batchMarkdown += this.formatContent(doc.document.content) + '\n\n';
        }
      }

      const metadata = this.calculateMetadata(batchMarkdown);
      const filename = this.generateBatchFilename(documents.length);

      logger.info('Batch Markdown export completed successfully', {
        documentCount: documents.length,
        wordCount: metadata.wordCount,
        lines: metadata.lineCount
      });

      return {
        content: batchMarkdown,
        filename,
        contentType: 'text/markdown',
        metadata
      };
    } catch (error) {
      logger.error('Batch Markdown export failed', {
        documentCount: documents.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Batch Markdown export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert string to URL-friendly slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Calculate markdown metadata
   */
  private calculateMetadata(content: string): {
    wordCount: number;
    characterCount: number;
    lineCount: number;
  } {
    const wordCount = content.trim().split(/\s+/).length;
    const characterCount = content.length;
    const lineCount = content.split('\n').length;

    return {
      wordCount,
      characterCount,
      lineCount
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
    return `${cleanTitle}-${timestamp}.md`;
  }

  /**
   * Generate batch filename
   */
  private generateBatchFilename(documentCount: number): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `batch-export-${documentCount}-docs-${timestamp}.md`;
  }
}