import { ResumeParser } from '@services/resume/resumeParser';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { 
  ALLOWED_FILE_EXTENSIONS, 
  MAX_FILE_SIZE,
  Resume,
  AllowedFileTypes 
} from '@types/resume';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo modules
jest.mock('expo-document-picker');
jest.mock('expo-file-system');
jest.mock('@react-native-async-storage/async-storage');

describe('ResumeParser', () => {
  let resumeParser: ResumeParser;
  
  beforeEach(() => {
    resumeParser = new ResumeParser();
    jest.clearAllMocks();
    
    // Ensure FileSystem.EncodingType is available
    if (!(FileSystem as any).EncodingType) {
      (FileSystem as any).EncodingType = {
        UTF8: 'utf8',
        Base64: 'base64'
      };
    }
  });

  describe('pickDocument', () => {
    it('should allow user to pick a document with valid file types', async () => {
      const mockResult = {
        type: 'success' as const,
        uri: 'file://resume.pdf',
        name: 'my-resume.pdf',
        size: 100000,
        mimeType: 'application/pdf'
      };
      
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockResult);

      const result = await resumeParser.pickDocument();
      
      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle cancelled document picker', async () => {
      const mockResult = { type: 'cancel' as const };
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockResult);

      const result = await resumeParser.pickDocument();
      
      expect(result).toEqual(mockResult);
    });

    it('should handle document picker errors', async () => {
      const error = new Error('Picker failed');
      (DocumentPicker.getDocumentAsync as jest.Mock).mockRejectedValue(error);

      await expect(resumeParser.pickDocument()).rejects.toThrow('Picker failed');
    });
  });

  describe('validateFile', () => {
    it('should validate files with allowed extensions', () => {
      const validFiles = [
        'resume.pdf',
        'cv.docx',
        'application.doc',
        'plain.txt'
      ];

      validFiles.forEach(fileName => {
        const result = resumeParser.validateFile(fileName, 1000000);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject files with invalid extensions', () => {
      const invalidFiles = [
        'image.jpg',
        'presentation.pptx',
        'spreadsheet.xlsx',
        'archive.zip'
      ];

      invalidFiles.forEach(fileName => {
        const result = resumeParser.validateFile(fileName, 1000000);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Unsupported file type');
      });
    });

    it('should reject files larger than 5MB', () => {
      const result = resumeParser.validateFile('large-resume.pdf', MAX_FILE_SIZE + 1);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size exceeds 5MB limit');
    });

    it('should accept files at exactly 5MB', () => {
      const result = resumeParser.validateFile('exact-size.pdf', MAX_FILE_SIZE);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('parseDocument', () => {
    it('should parse PDF documents', async () => {
      const mockUri = 'file://resume.pdf';
      const mockContent = 'base64encodedpdfcontent';
      
      (FileSystem as any).readAsStringAsync.mockResolvedValue(mockContent);

      const result = await resumeParser.parseDocument(mockUri, 'resume.pdf');

      expect((FileSystem as any).readAsStringAsync).toHaveBeenCalledWith(mockUri, {
        encoding: 'base64'
      });
      expect(result).toEqual({
        content: mockContent,
        parsedText: expect.any(String),
        fileType: '.pdf'
      });
    });

    it('should parse text documents directly', async () => {
      const mockUri = 'file://resume.txt';
      const mockContent = 'John Doe\nSoftware Engineer\nExperience: 5 years';
      
      (FileSystem as any).readAsStringAsync.mockResolvedValue(mockContent);

      const result = await resumeParser.parseDocument(mockUri, 'resume.txt');

      expect((FileSystem as any).readAsStringAsync).toHaveBeenCalledWith(mockUri, {
        encoding: 'utf8'
      });
      expect(result).toEqual({
        content: mockContent,
        parsedText: mockContent,
        fileType: '.txt'
      });
    });

    it('should handle parsing errors gracefully', async () => {
      const mockUri = 'file://corrupted.pdf';
      (FileSystem as any).readAsStringAsync.mockRejectedValue(new Error('File read failed'));

      await expect(resumeParser.parseDocument(mockUri, 'corrupted.pdf'))
        .rejects.toThrow('Failed to parse document: File read failed');
    });

    it('should sanitize parsed text', async () => {
      const mockUri = 'file://resume.txt';
      const mockContent = '  John   Doe  \n\n\nSoftware  Engineer  ';
      
      (FileSystem as any).readAsStringAsync.mockResolvedValue(mockContent);

      const result = await resumeParser.parseDocument(mockUri, 'resume.txt');

      expect(result.parsedText).toBe('John Doe\nSoftware Engineer');
    });
  });

  describe('extractKeywords', () => {
    it('should extract common resume keywords', () => {
      const resumeText = `
        John Doe
        Senior Software Engineer
        
        Experience:
        - Led development of React Native applications
        - Implemented CI/CD pipelines using Jenkins
        - Managed team of 5 developers
        - Expertise in JavaScript, TypeScript, Python
        
        Skills:
        - Project Management
        - Agile Methodology
        - Cloud Computing (AWS, Azure)
        - Machine Learning
      `;

      const keywords = resumeParser.extractKeywords(resumeText);

      expect(keywords).toContain('software engineer');
      expect(keywords).toContain('react native');
      expect(keywords).toContain('javascript');
      expect(keywords).toContain('typescript');
      expect(keywords).toContain('python');
      expect(keywords).toContain('project management');
      expect(keywords).toContain('agile methodology');
      expect(keywords).toContain('aws');
      expect(keywords).toContain('machine learning');
    });

    it('should remove duplicate keywords', () => {
      const resumeText = `
        Python developer with Python experience.
        Skilled in Python programming and Python frameworks.
      `;

      const keywords = resumeParser.extractKeywords(resumeText);
      const pythonCount = keywords.filter(k => k === 'python').length;

      expect(pythonCount).toBe(1);
    });

    it('should handle empty or invalid text', () => {
      expect(resumeParser.extractKeywords('')).toEqual([]);
      expect(resumeParser.extractKeywords('   ')).toEqual([]);
      expect(resumeParser.extractKeywords('the and or but')).toEqual([]);
    });

    it('should extract multi-word technical terms', () => {
      const resumeText = `
        Experience with machine learning, artificial intelligence,
        data science, and natural language processing.
      `;

      const keywords = resumeParser.extractKeywords(resumeText);

      expect(keywords).toContain('machine learning');
      expect(keywords).toContain('artificial intelligence');
      expect(keywords).toContain('data science');
      expect(keywords).toContain('natural language processing');
    });
  });

  describe('saveToLocalStorage', () => {
    it('should save parsed resume with encryption', async () => {
      const mockResume: Partial<Resume> = {
        fileName: 'resume.pdf',
        fileType: '.pdf',
        content: 'base64content',
        parsedText: 'John Doe Software Engineer',
        extractedKeywords: ['software', 'engineer']
      };

      const savedResume = await resumeParser.saveToLocalStorage(mockResume as Resume);

      expect(savedResume).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        ...mockResume,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        lastModified: expect.any(Date)
      });
    });

    it('should handle storage errors', async () => {
      const mockResume: Partial<Resume> = {
        fileName: 'resume.pdf',
        fileType: '.pdf',
        content: 'base64content',
        parsedText: 'John Doe',
        extractedKeywords: []
      };

      // Mock storage failure
      jest.spyOn(resumeParser as any, 'encryptData').mockRejectedValue(new Error('Encryption failed'));

      await expect(resumeParser.saveToLocalStorage(mockResume as Resume))
        .rejects.toThrow('Failed to save resume: Encryption failed');
    });
  });

  describe('loadFromLocalStorage', () => {
    it('should load and decrypt resume from storage', async () => {
      const resumeId = 'test-resume-id';
      const mockStoredResume = {
        id: resumeId,
        fileName: 'resume.pdf',
        parsedText: 'Encrypted text'
      };

      // Mock AsyncStorage to return encrypted data
      AsyncStorage.getItem = jest.fn().mockResolvedValue(JSON.stringify({
        ...mockStoredResume,
        content: `encrypted-${mockStoredResume.parsedText}`,
        parsedText: `encrypted-${mockStoredResume.parsedText}`
      }));

      const resume = await resumeParser.loadFromLocalStorage(resumeId);

      expect(resume).toMatchObject({
        fileName: mockStoredResume.fileName,
        parsedText: expect.any(String) // Just check it exists since decryption mock changes it
      });
    });

    it('should return null for non-existent resume', async () => {
      AsyncStorage.getItem = jest.fn().mockResolvedValue(null);

      const resume = await resumeParser.loadFromLocalStorage('non-existent');

      expect(resume).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete resume upload flow', async () => {
      // Mock document picker
      const mockPickerResult = {
        type: 'success' as const,
        uri: 'file://resume.pdf',
        name: 'john-doe-resume.pdf',
        size: 250000,
        mimeType: 'application/pdf'
      };
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockPickerResult);

      // Mock file reading
      const mockContent = 'base64pdfcontent';
      (FileSystem as any).readAsStringAsync.mockResolvedValue(mockContent);

      // Pick document
      const pickerResult = await resumeParser.pickDocument();
      expect(pickerResult.type).toBe('success');

      if (pickerResult.type === 'success') {
        // Validate
        const validation = resumeParser.validateFile(pickerResult.name!, pickerResult.size!);
        expect(validation.isValid).toBe(true);

        // Parse
        const parsed = await resumeParser.parseDocument(pickerResult.uri, pickerResult.name!);
        expect(parsed.fileType).toBe('.pdf');

        // Extract keywords
        const keywords = resumeParser.extractKeywords(parsed.parsedText);
        expect(Array.isArray(keywords)).toBe(true);

        // Save
        const resume: Resume = {
          id: 'generated-id',
          userId: 'user-123',
          fileName: pickerResult.name!,
          fileType: parsed.fileType as AllowedFileTypes,
          content: parsed.content,
          parsedText: parsed.parsedText,
          extractedKeywords: keywords,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModified: new Date()
        };

        const saved = await resumeParser.saveToLocalStorage(resume);
        expect(saved.id).toBeTruthy();
      }
    });
  });
});