import { ExportService } from '../src/services/ExportService';
import { MemoryService } from '../src/services/MemoryService';
import { StorageService } from '../src/services/StorageService';
import { TemplateService } from '../src/services/TemplateService';

// Mock dependencies
jest.mock('../src/services/MemoryService');
jest.mock('../src/services/StorageService');
jest.mock('../src/services/TemplateService');
jest.mock('../src/services/exporters/DOCXExporter');
jest.mock('../src/services/exporters/PDFExporter');
jest.mock('../src/services/exporters/EPUBExporter');
jest.mock('../src/services/exporters/MarkdownExporter');
jest.mock('../src/services/exporters/HTMLExporter');
jest.mock('../src/services/exporters/TXTExporter');

describe('ExportService', () => {
  let exportService: ExportService;
  let mockMemoryService: jest.Mocked<MemoryService>;
  let mockStorageService: jest.Mocked<StorageService>;
  let mockTemplateService: jest.Mocked<TemplateService>;

  const mockDocumentContent = {
    document: {
      id: 'doc-123',
      userId: 'user-456',
      title: 'Test Document',
      content: '<p>This is a test document content.</p>',
      type: 'fiction' as const,
      genre: 'Fantasy',
      tags: ['test', 'fiction'],
      metadata: {
        wordCount: 100,
        characterCount: 500,
        readingTime: 1,
        completionPercentage: 100
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      lastAccessedAt: new Date('2024-01-02')
    },
    chapters: [{
      id: 'chapter-1',
      title: 'Chapter 1: The Beginning',
      content: '<p>Once upon a time...</p>',
      order: 1,
      wordCount: 50
    }],
    images: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get singleton instance
    exportService = ExportService.getInstance();
    
    // Setup mocks
    mockMemoryService = MemoryService.getInstance() as jest.Mocked<MemoryService>;
    mockStorageService = StorageService.getInstance() as jest.Mocked<StorageService>;
    mockTemplateService = TemplateService.getInstance() as jest.Mocked<TemplateService>;

    // Mock implementations
    mockMemoryService.getDocument.mockResolvedValue(mockDocumentContent);
    mockStorageService.uploadFile.mockResolvedValue('storage-key-123');
    mockStorageService.generateDownloadUrl.mockResolvedValue('https://example.com/download/file.pdf');
    mockTemplateService.initialize.mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('should initialize all services successfully', async () => {
      mockStorageService.initialize.mockResolvedValue(undefined);
      mockTemplateService.initialize.mockResolvedValue(undefined);

      await exportService.initialize();

      expect(mockStorageService.initialize).toHaveBeenCalled();
      expect(mockTemplateService.initialize).toHaveBeenCalled();
    });

    it('should throw error if initialization fails', async () => {
      mockStorageService.initialize.mockRejectedValue(new Error('Storage initialization failed'));

      await expect(exportService.initialize()).rejects.toThrow('Storage initialization failed');
    });
  });

  describe('exportDocument', () => {
    beforeEach(async () => {
      mockStorageService.initialize.mockResolvedValue(undefined);
      await exportService.initialize();
    });

    it('should export document successfully', async () => {
      const result = await exportService.exportDocument(
        'doc-123',
        'user-456',
        'pdf',
        'manuscript',
        {},
        { name: 'Test Author' }
      );

      expect(result).toHaveProperty('exportId');
      expect(result).toHaveProperty('format', 'pdf');
      expect(result).toHaveProperty('downloadUrl');
      expect(result).toHaveProperty('downloadExpiresAt');
      expect(result).toHaveProperty('fileSize');
      expect(result).toHaveProperty('metadata');

      expect(mockMemoryService.getDocument).toHaveBeenCalledWith('doc-123', 'user-456');
      expect(mockStorageService.uploadFile).toHaveBeenCalled();
      expect(mockStorageService.generateDownloadUrl).toHaveBeenCalled();
    });

    it('should handle export failures gracefully', async () => {
      mockMemoryService.getDocument.mockRejectedValue(new Error('Document not found'));

      await expect(
        exportService.exportDocument('doc-123', 'user-456', 'pdf')
      ).rejects.toThrow('Document not found');
    });

    it('should validate export format', async () => {
      await expect(
        exportService.exportDocument('doc-123', 'user-456', 'invalid' as any)
      ).rejects.toThrow('Unsupported export format');
    });
  });

  describe('exportBatchDocuments', () => {
    beforeEach(async () => {
      mockStorageService.initialize.mockResolvedValue(undefined);
      await exportService.initialize();
      
      mockMemoryService.getDocuments.mockResolvedValue([mockDocumentContent]);
    });

    it('should export batch documents successfully', async () => {
      const result = await exportService.exportBatchDocuments(
        ['doc-123', 'doc-456'],
        'user-456',
        'pdf',
        'manuscript',
        {},
        { name: 'Test Author' }
      );

      expect(result).toHaveProperty('exportId');
      expect(result).toHaveProperty('format', 'pdf');
      expect(result).toHaveProperty('downloadUrl');
      expect(result.metadata).toHaveProperty('batchExport', true);

      expect(mockMemoryService.getDocuments).toHaveBeenCalledWith(['doc-123', 'doc-456'], 'user-456');
    });

    it('should handle empty document list', async () => {
      mockMemoryService.getDocuments.mockResolvedValue([]);

      await expect(
        exportService.exportBatchDocuments(['doc-123'], 'user-456', 'pdf')
      ).rejects.toThrow('No documents found for export');
    });

    it('should reject unsupported batch formats', async () => {
      await expect(
        exportService.exportBatchDocuments(['doc-123'], 'user-456', 'docx')
      ).rejects.toThrow('Batch DOCX export not yet implemented');
    });
  });

  describe('getAvailableFormats', () => {
    it('should return all supported formats', () => {
      const formats = exportService.getAvailableFormats();
      
      expect(formats).toContain('docx');
      expect(formats).toContain('pdf');
      expect(formats).toContain('epub');
      expect(formats).toContain('markdown');
      expect(formats).toContain('html');
      expect(formats).toContain('txt');
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return all supported templates', () => {
      const templates = exportService.getAvailableTemplates();
      
      expect(templates).toContain('manuscript');
      expect(templates).toContain('book');
      expect(templates).toContain('screenplay');
      expect(templates).toContain('academic');
      expect(templates).toContain('blog');
    });
  });

  describe('validateExportOptions', () => {
    it('should validate PDF options correctly', () => {
      const validOptions = {
        pdfOptions: {
          scale: 1.0,
          orientation: 'portrait' as const
        }
      };

      const result = exportService.validateExportOptions('pdf', validOptions);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid PDF scale', () => {
      const invalidOptions = {
        pdfOptions: {
          scale: 5.0 // Invalid scale
        }
      };

      const result = exportService.validateExportOptions('pdf', invalidOptions);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PDF scale must be between 0.1 and 2.0');
    });

    it('should validate EPUB ISBN format', () => {
      const invalidOptions = {
        epubOptions: {
          isbn: 'invalid-isbn'
        }
      };

      const result = exportService.validateExportOptions('epub', invalidOptions);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid ISBN format');
    });

    it('should validate font size range', () => {
      const invalidOptions = {
        fontSize: 100 // Too large
      };

      const result = exportService.validateExportOptions('pdf', invalidOptions);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Font size must be between 8 and 72 points');
    });

    it('should validate line spacing range', () => {
      const invalidOptions = {
        lineSpacing: 5.0 // Too large
      };

      const result = exportService.validateExportOptions('pdf', invalidOptions);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Line spacing must be between 0.5 and 3.0');
    });

    it('should validate margin ranges', () => {
      const invalidOptions = {
        margins: {
          top: -5,
          right: 150,
          bottom: 25,
          left: 25
        }
      };

      const result = exportService.validateExportOptions('pdf', invalidOptions);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Margins must be between 0 and 100mm');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all services are working', async () => {
      mockMemoryService.healthCheck.mockResolvedValue(true);

      const health = await exportService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.services.memory).toBe(true);
      expect(health.exporters.pdf).toBe(true);
    });

    it('should return degraded status when some services fail', async () => {
      mockMemoryService.healthCheck.mockResolvedValue(false);

      const health = await exportService.healthCheck();

      expect(health.status).toBe('degraded');
      expect(health.services.memory).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired exports', async () => {
      const result = await exportService.cleanup();

      expect(result).toHaveProperty('cleanedFiles');
      expect(result).toHaveProperty('errors');
      expect(typeof result.cleanedFiles).toBe('number');
      expect(typeof result.errors).toBe('number');
    });
  });
});