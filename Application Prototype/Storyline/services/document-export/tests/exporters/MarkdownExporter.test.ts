import { MarkdownExporter } from '../../src/services/exporters/MarkdownExporter';

describe('MarkdownExporter', () => {
  let exporter: MarkdownExporter;

  const mockDocumentContent = {
    document: {
      id: 'doc-123',
      userId: 'user-456',
      title: 'Test Document',
      content: '<p>This is a <strong>test</strong> document with <em>formatting</em>.</p><p>Another paragraph.</p>',
      type: 'fiction' as const,
      genre: 'Fantasy',
      tags: ['test', 'fiction'],
      metadata: {
        wordCount: 15,
        characterCount: 80,
        readingTime: 1,
        completionPercentage: 100
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      lastAccessedAt: new Date('2024-01-02')
    },
    chapters: [
      {
        id: 'chapter-1',
        title: 'The Beginning',
        content: '<p>Once upon a time in a <strong>magical</strong> land...</p>',
        order: 1,
        wordCount: 10
      },
      {
        id: 'chapter-2',
        title: 'The Adventure',
        content: '<p>The hero embarked on an <em>epic</em> journey.</p>',
        order: 2,
        wordCount: 8
      }
    ],
    images: []
  };

  beforeEach(() => {
    exporter = new MarkdownExporter();
  });

  describe('export', () => {
    it('should export document with chapters to markdown', async () => {
      const result = await exporter.export(mockDocumentContent, {}, { name: 'Test Author' });

      expect(result.content).toContain('# Test Document');
      expect(result.content).toContain('**Author:** Test Author');
      expect(result.content).toContain('**Genre:** Fantasy');
      expect(result.content).toContain('**Tags:** test, fiction');
      expect(result.content).toContain('## Chapter 1: The Beginning');
      expect(result.content).toContain('## Chapter 2: The Adventure');
      expect(result.filename).toMatch(/test-document-\d{4}-\d{2}-\d{2}\.md/);
      expect(result.contentType).toBe('text/markdown');
    });

    it('should export single document without chapters', async () => {
      const singleDocContent = {
        ...mockDocumentContent,
        chapters: undefined
      };

      const result = await exporter.export(singleDocContent, {});

      expect(result.content).toContain('# Test Document');
      expect(result.content).toContain('This is a **test** document with *formatting*.');
      expect(result.content).toContain('Another paragraph.');
      expect(result.content).not.toContain('## Chapter');
    });

    it('should include metadata when requested', async () => {
      const result = await exporter.export(mockDocumentContent, { includeMetadata: true });

      expect(result.content).toContain('---');
      expect(result.content).toContain('title: "Test Document"');
      expect(result.content).toContain('wordCount: 15');
      expect(result.content).toContain('genre: "Fantasy"');
      expect(result.content).toContain('tags: ["test", "fiction"]');
    });

    it('should include characters when requested', async () => {
      const contentWithCharacters = {
        ...mockDocumentContent,
        document: {
          ...mockDocumentContent.document,
          characters: [
            {
              id: 'char-1',
              name: 'Hero',
              description: 'The main protagonist',
              traits: ['brave', 'kind'],
              relationships: [],
              appearances: [1]
            }
          ]
        }
      };

      const result = await exporter.export(contentWithCharacters, { includeCharacters: true });

      expect(result.content).toContain('## Characters');
      expect(result.content).toContain('### Hero');
      expect(result.content).toContain('The main protagonist');
      expect(result.content).toContain('**Traits:** brave, kind');
    });

    it('should include outline when requested', async () => {
      const contentWithOutline = {
        ...mockDocumentContent,
        document: {
          ...mockDocumentContent.document,
          outline: [
            { id: '1', title: 'Introduction', level: 1, position: 0, wordCount: 100 },
            { id: '2', title: 'Plot Point 1', level: 2, position: 100, wordCount: 200 }
          ]
        }
      };

      const result = await exporter.export(contentWithOutline, { includeOutline: true });

      expect(result.content).toContain('## Outline');
      expect(result.content).toContain('- Introduction');
      expect(result.content).toContain('  * Plot Point 1');
    });

    it('should convert HTML formatting to markdown', async () => {
      const htmlContent = {
        ...mockDocumentContent,
        document: {
          ...mockDocumentContent.document,
          content: `
            <h1>Main Title</h1>
            <h2>Subtitle</h2>
            <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
            <blockquote>This is a quote</blockquote>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <ol>
              <li>First</li>
              <li>Second</li>
            </ol>
            <a href="https://example.com">Link text</a>
            <img src="image.jpg" alt="Alt text" />
            <code>inline code</code>
            <pre><code>code block</code></pre>
          `
        },
        chapters: undefined
      };

      const result = await exporter.export(htmlContent, {});

      expect(result.content).toContain('# Main Title');
      expect(result.content).toContain('## Subtitle');
      expect(result.content).toContain('**bold text**');
      expect(result.content).toContain('*italic text*');
      expect(result.content).toContain('> This is a quote');
      expect(result.content).toContain('- Item 1');
      expect(result.content).toContain('- Item 2');
      expect(result.content).toContain('1. First');
      expect(result.content).toContain('2. Second');
      expect(result.content).toContain('[Link text](https://example.com)');
      expect(result.content).toContain('![Alt text](image.jpg)');
      expect(result.content).toContain('`inline code`');
      expect(result.content).toContain('```\ncode block\n```');
    });

    it('should calculate metadata correctly', async () => {
      const result = await exporter.export(mockDocumentContent, {});

      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(result.metadata.characterCount).toBeGreaterThan(0);
      expect(result.metadata.lineCount).toBeGreaterThan(0);
    });
  });

  describe('exportBatch', () => {
    it('should export multiple documents as batch', async () => {
      const document2 = {
        ...mockDocumentContent,
        document: {
          ...mockDocumentContent.document,
          id: 'doc-456',
          title: 'Second Document',
          content: '<p>This is the second document.</p>'
        }
      };

      const documents = [mockDocumentContent, document2];
      const result = await exporter.exportBatch(documents, {}, { name: 'Batch Author' });

      expect(result.content).toContain('# Batch Export - 2 Documents');
      expect(result.content).toContain('**Author:** Batch Author');
      expect(result.content).toContain('## Table of Contents');
      expect(result.content).toContain('1. [Test Document]');
      expect(result.content).toContain('2. [Second Document]');
      expect(result.content).toContain('# Test Document {#test-document}');
      expect(result.content).toContain('# Second Document {#second-document}');
      expect(result.filename).toMatch(/batch-export-2-docs-\d{4}-\d{2}-\d{2}\.md/);
    });

    it('should handle batch export with chapters', async () => {
      const documents = [mockDocumentContent];
      const result = await exporter.exportBatch(documents, {});

      expect(result.content).toContain('## Chapter 1: The Beginning');
      expect(result.content).toContain('## Chapter 2: The Adventure');
    });

    it('should include word counts in batch export', async () => {
      const documents = [mockDocumentContent];
      const result = await exporter.exportBatch(documents, {});

      expect(result.content).toContain('**Word Count:** 15');
    });
  });

  describe('edge cases', () => {
    it('should handle empty content gracefully', async () => {
      const emptyContent = {
        ...mockDocumentContent,
        document: {
          ...mockDocumentContent.document,
          content: '',
          metadata: { ...mockDocumentContent.document.metadata, wordCount: 0 }
        },
        chapters: undefined
      };

      const result = await exporter.export(emptyContent, {});

      expect(result.content).toContain('# Test Document');
      expect(result.metadata.wordCount).toBe(0);
    });

    it('should handle special characters in title', async () => {
      const specialTitleContent = {
        ...mockDocumentContent,
        document: {
          ...mockDocumentContent.document,
          title: 'Test & Document: "Special" Characters!'
        }
      };

      const result = await exporter.export(specialTitleContent, {});

      expect(result.content).toContain('# Test & Document: "Special" Characters!');
      expect(result.filename).toMatch(/test-document-special-characters-\d{4}-\d{2}-\d{2}\.md/);
    });

    it('should handle missing optional fields', async () => {
      const minimalContent = {
        document: {
          ...mockDocumentContent.document,
          genre: undefined,
          tags: [],
          characters: undefined,
          outline: undefined
        },
        chapters: undefined,
        images: []
      };

      const result = await exporter.export(minimalContent, {});

      expect(result.content).toContain('# Test Document');
      expect(result.content).not.toContain('**Genre:**');
      expect(result.content).not.toContain('**Tags:**');
    });
  });
});