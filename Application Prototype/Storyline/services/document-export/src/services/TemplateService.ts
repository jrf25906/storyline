import Handlebars from 'handlebars';
import { ExportTemplate, ExportOptions, ExportFormat } from '@storyline/shared-types';
import { DocumentContent } from './MemoryService';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TemplateData {
  document: DocumentContent['document'];
  chapters?: DocumentContent['chapters'];
  images?: DocumentContent['images'];
  metadata: {
    exportedAt: Date;
    exportFormat: ExportFormat;
    pageCount?: number;
    totalWords: number;
    exportOptions: ExportOptions;
  };
  author?: {
    name: string;
    email?: string;
    bio?: string;
  };
  formatting: {
    fontSize: number;
    fontFamily: string;
    lineSpacing: number;
    margins: ExportOptions['margins'];
    pageSize: ExportOptions['pageSize'];
  };
}

export interface CompiledTemplate {
  html: string;
  css: string;
  metadata: Record<string, any>;
}

export class TemplateService {
  private static instance: TemplateService;
  private templates: Map<string, { template: HandlebarsTemplateDelegate; css: string }> = new Map();
  private templateCache: Map<string, CompiledTemplate> = new Map();
  private readonly templateDir: string;

  private constructor() {
    this.templateDir = path.join(__dirname, '../templates');
    this.registerHelpers();
  }

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  /**
   * Initialize template service and load built-in templates
   */
  public async initialize(): Promise<void> {
    try {
      await this.loadBuiltInTemplates();
      logger.info('Template service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize template service', { error });
      throw error;
    }
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date: Date, format: string = 'YYYY-MM-DD') => {
      if (!date) return '';
      const d = new Date(date);
      
      switch (format) {
        case 'long':
          return d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'short':
          return d.toLocaleDateString('en-US');
        default:
          return d.toISOString().split('T')[0];
      }
    });

    // Word count helper
    Handlebars.registerHelper('wordCount', (text: string) => {
      if (!text) return 0;
      return text.trim().split(/\s+/).length;
    });

    // Chapter number helper
    Handlebars.registerHelper('chapterNumber', (index: number, style: string = 'numeric') => {
      const num = index + 1;
      switch (style) {
        case 'roman':
          return this.toRoman(num);
        case 'alphabetic':
          return String.fromCharCode(64 + num); // A, B, C...
        default:
          return num.toString();
      }
    });

    // Conditional helper
    Handlebars.registerHelper('if_eq', (a: any, b: any, options: any) => {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    // Text truncation helper
    Handlebars.registerHelper('truncate', (text: string, length: number = 100) => {
      if (!text || text.length <= length) return text;
      return text.substring(0, length).trim() + '...';
    });

    // Join array helper
    Handlebars.registerHelper('join', (array: any[], separator: string = ', ') => {
      if (!Array.isArray(array)) return '';
      return array.join(separator);
    });
  }

  /**
   * Convert number to Roman numerals
   */
  private toRoman(num: number): string {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    
    let result = '';
    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += numerals[i];
        num -= values[i];
      }
    }
    return result;
  }

  /**
   * Load built-in templates from the templates directory
   */
  private async loadBuiltInTemplates(): Promise<void> {
    const templateTypes = ['manuscript', 'book', 'screenplay', 'academic', 'blog'];
    
    for (const templateType of templateTypes) {
      try {
        const templatePath = path.join(this.templateDir, `${templateType}.hbs`);
        const cssPath = path.join(this.templateDir, `${templateType}.css`);
        
        const [templateContent, cssContent] = await Promise.all([
          fs.readFile(templatePath, 'utf-8').catch(() => this.getDefaultTemplate(templateType)),
          fs.readFile(cssPath, 'utf-8').catch(() => this.getDefaultCSS(templateType))
        ]);

        const template = Handlebars.compile(templateContent);
        this.templates.set(templateType, { template, css: cssContent });
        
        logger.debug(`Loaded template: ${templateType}`);
      } catch (error) {
        logger.warn(`Failed to load template: ${templateType}`, { error });
      }
    }
  }

  /**
   * Compile template with data
   */
  public async compileTemplate(
    templateType: ExportTemplate,
    data: TemplateData,
    customTemplate?: string,
    customCSS?: string
  ): Promise<CompiledTemplate> {
    try {
      const cacheKey = `${templateType}-${JSON.stringify(data.formatting)}-${customTemplate ? 'custom' : 'builtin'}`;
      
      // Check cache first
      if (this.templateCache.has(cacheKey)) {
        logger.debug('Template cache hit', { templateType, cacheKey });
        return this.templateCache.get(cacheKey)!;
      }

      let template: HandlebarsTemplateDelegate;
      let css: string;

      if (customTemplate) {
        // Use custom template
        template = Handlebars.compile(customTemplate);
        css = customCSS || this.getDefaultCSS(templateType);
      } else {
        // Use built-in template
        const builtInTemplate = this.templates.get(templateType);
        if (!builtInTemplate) {
          throw new Error(`Template not found: ${templateType}`);
        }
        template = builtInTemplate.template;
        css = builtInTemplate.css;
      }

      // Compile template with data
      const html = template(data);
      
      // Apply formatting options to CSS
      const processedCSS = this.processCSSWithOptions(css, data.exportOptions);

      const result: CompiledTemplate = {
        html,
        css: processedCSS,
        metadata: {
          templateType,
          compiledAt: new Date(),
          wordCount: data.metadata.totalWords,
          formatting: data.formatting
        }
      };

      // Cache result (with TTL)
      this.templateCache.set(cacheKey, result);
      
      // Clean cache periodically
      if (this.templateCache.size > 100) {
        this.cleanCache();
      }

      logger.info('Template compiled successfully', {
        templateType,
        wordCount: data.metadata.totalWords,
        chapters: data.chapters?.length || 0
      });

      return result;
    } catch (error) {
      logger.error('Failed to compile template', { templateType, error });
      throw error;
    }
  }

  /**
   * Process CSS with export options
   */
  private processCSSWithOptions(css: string, options: ExportOptions): string {
    let processedCSS = css;

    // Apply font settings
    if (options.fontFamily) {
      processedCSS = processedCSS.replace(/font-family:\s*[^;]+;/gi, `font-family: ${options.fontFamily};`);
    }

    if (options.fontSize) {
      processedCSS = processedCSS.replace(/font-size:\s*[^;]+;/gi, `font-size: ${options.fontSize}px;`);
    }

    // Apply line spacing
    if (options.lineSpacing) {
      processedCSS = processedCSS.replace(/line-height:\s*[^;]+;/gi, `line-height: ${options.lineSpacing};`);
    }

    // Apply margins
    if (options.margins) {
      const { top, right, bottom, left } = options.margins;
      const marginRule = `margin: ${top}mm ${right}mm ${bottom}mm ${left}mm;`;
      processedCSS = processedCSS.replace(/@page\s*{[^}]*}/gi, (match) => {
        return match.replace(/}$/, ` ${marginRule}}`);
      });
    }

    // Add custom CSS
    if (options.customCSS) {
      processedCSS += '\n\n/* Custom CSS */\n' + options.customCSS;
    }

    return processedCSS;
  }

  /**
   * Clean template cache
   */
  private cleanCache(): void {
    // Simple LRU-like cleanup - remove oldest 50% of entries
    const entries = Array.from(this.templateCache.entries());
    const keepCount = Math.floor(entries.length / 2);
    
    this.templateCache.clear();
    entries.slice(-keepCount).forEach(([key, value]) => {
      this.templateCache.set(key, value);
    });
    
    logger.debug(`Template cache cleaned, kept ${keepCount} entries`);
  }

  /**
   * Get default template for format
   */
  private getDefaultTemplate(templateType: string): string {
    const templates = {
      manuscript: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{document.title}}</title>
</head>
<body>
    <div class="manuscript">
        <header class="title-page">
            <h1>{{document.title}}</h1>
            {{#if author.name}}<p class="author">by {{author.name}}</p>{{/if}}
            <p class="word-count">{{metadata.totalWords}} words</p>
        </header>
        
        {{#if chapters}}
            {{#each chapters}}
            <div class="chapter">
                <h2 class="chapter-title">{{title}}</h2>
                <div class="chapter-content">{{{content}}}</div>
            </div>
            {{/each}}
        {{else}}
            <div class="content">{{{document.content}}}</div>
        {{/if}}
        
        {{#if document.characters}}
        <div class="characters">
            <h2>Characters</h2>
            {{#each document.characters}}
            <div class="character">
                <h3>{{name}}</h3>
                {{#if description}}<p>{{description}}</p>{{/if}}
            </div>
            {{/each}}
        </div>
        {{/if}}
    </div>
</body>
</html>`,
      
      book: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{document.title}}</title>
</head>
<body>
    <div class="book">
        <div class="title-page">
            <h1 class="book-title">{{document.title}}</h1>
            {{#if author.name}}<p class="author">{{author.name}}</p>{{/if}}
        </div>
        
        {{#if chapters}}
            {{#each chapters}}
            <div class="chapter" id="chapter-{{@index}}">
                <h1 class="chapter-number">Chapter {{chapterNumber @index}}</h1>
                <h2 class="chapter-title">{{title}}</h2>
                <div class="chapter-content">{{{content}}}</div>
            </div>
            {{/each}}
        {{else}}
            <div class="content">{{{document.content}}}</div>
        {{/if}}
    </div>
</body>
</html>`,
      
      screenplay: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{document.title}}</title>
</head>
<body>
    <div class="screenplay">
        <div class="title-page">
            <h1>{{document.title}}</h1>
            {{#if author.name}}<p class="author">Written by<br>{{author.name}}</p>{{/if}}
        </div>
        
        <div class="script-content">{{{document.content}}}</div>
    </div>
</body>
</html>`,

      academic: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{document.title}}</title>
</head>
<body>
    <div class="academic-paper">
        <header class="paper-header">
            <h1>{{document.title}}</h1>
            {{#if author.name}}<p class="author">{{author.name}}</p>{{/if}}
            <p class="date">{{formatDate metadata.exportedAt 'long'}}</p>
        </header>
        
        <div class="abstract">
            <h2>Abstract</h2>
            <p>{{truncate document.content 500}}</p>
        </div>
        
        <div class="content">{{{document.content}}}</div>
    </div>
</body>
</html>`,

      blog: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{document.title}}</title>
</head>
<body>
    <article class="blog-post">
        <header class="post-header">
            <h1>{{document.title}}</h1>
            {{#if author.name}}<p class="author">By {{author.name}}</p>{{/if}}
            <p class="date">{{formatDate metadata.exportedAt 'long'}}</p>
            {{#if document.tags}}<p class="tags">Tags: {{join document.tags}}</p>{{/if}}
        </header>
        
        <div class="post-content">{{{document.content}}}</div>
    </article>
</body>
</html>`
    };

    return templates[templateType as keyof typeof templates] || templates.manuscript;
  }

  /**
   * Get default CSS for format
   */
  private getDefaultCSS(templateType: string): string {
    const styles = {
      manuscript: `
        @page { margin: 1in; }
        .manuscript { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 2; }
        .title-page { text-align: center; margin-bottom: 2in; }
        .title-page h1 { font-size: 24pt; font-weight: bold; }
        .chapter-title { page-break-before: always; text-align: center; font-size: 14pt; }
        .chapter-content { text-align: left; text-indent: 0.5in; }
        p { margin-bottom: 12pt; }`,
      
      book: `
        @page { margin: 0.75in; }
        .book { font-family: Georgia, serif; font-size: 11pt; line-height: 1.5; }
        .title-page { text-align: center; page-break-after: always; }
        .chapter { page-break-before: always; }
        .chapter-number { font-size: 18pt; text-align: center; margin-bottom: 24pt; }
        .chapter-title { font-size: 14pt; text-align: center; font-style: italic; }`,
      
      screenplay: `
        @page { margin: 1in 1.5in 1in 1in; }
        .screenplay { font-family: 'Courier New', monospace; font-size: 12pt; line-height: 1; }
        .title-page { text-align: center; }
        .script-content { margin-top: 1in; }`,
      
      academic: `
        @page { margin: 1in; }
        .academic-paper { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 2; }
        .paper-header { text-align: center; margin-bottom: 2em; }
        .abstract { margin-bottom: 2em; }
        h1, h2, h3 { font-weight: bold; }`,
      
      blog: `
        .blog-post { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .post-header { margin-bottom: 2em; border-bottom: 1px solid #eee; padding-bottom: 1em; }
        .post-header h1 { font-size: 2.5em; margin-bottom: 0.5em; }
        .author, .date, .tags { color: #666; font-size: 0.9em; }`
    };

    return styles[templateType as keyof typeof styles] || styles.manuscript;
  }
}