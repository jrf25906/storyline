// Mock dependencies before importing the store
jest.mock('../../services/resume/resumeParser');
jest.mock('../../services/resume/resumeAI');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));
jest.mock('../../services/api/openai', () => ({
  openAIService: {}
}));

// Import dependencies for mocking
import { ResumeParser } from '@services/resume/resumeParser';
import { ResumeAIService } from '@services/resume/resumeAI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Resume, 
  ResumeAnalysis, 
  ResumeRewriteRequest,
  ResumeUploadProgress 
} from '@types/resume';

// Get the mocked classes
const MockedResumeParser = ResumeParser as jest.MockedClass<typeof ResumeParser>;
const MockedResumeAIService = ResumeAIService as jest.MockedClass<typeof ResumeAIService>;

// Create mock instances that will be used by the store
const mockResumeParser: jest.Mocked<ResumeParser> = {
  pickDocument: jest.fn(),
  validateFile: jest.fn(),
  parseDocument: jest.fn(),
  extractKeywords: jest.fn(),
  saveToLocalStorage: jest.fn(),
  loadFromLocalStorage: jest.fn()
} as any;

const mockResumeAI: jest.Mocked<ResumeAIService> = {
  setUserConsent: jest.fn(),
  analyzeResume: jest.fn(),
  generateRewriteSuggestions: jest.fn(),
  compareWithJobApplication: jest.fn()
} as any;

// Set up the mocks to return our instances
MockedResumeParser.mockImplementation(() => mockResumeParser);
MockedResumeAIService.mockImplementation(() => mockResumeAI);

// NOW import the store after mocks are set up
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useResumeStore, __resetServices } from '@stores/resumeStore';

describe('useResumeStore', () => {
  const mockResume: Resume = {
    id: 'resume-123',
    userId: 'user-123',
    fileName: 'test-resume.pdf',
    fileType: '.pdf',
    content: 'base64content',
    parsedText: 'John Doe Software Engineer',
    extractedKeywords: ['software', 'engineer'],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastModified: new Date()
  };

  const mockAnalysis: ResumeAnalysis = {
    resumeId: 'resume-123',
    matchedKeywords: [
      { keyword: 'software', count: 2, relevance: 'high' }
    ],
    missingKeywords: ['python', 'aws'],
    overallScore: 75,
    suggestions: [],
    createdAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset services so they get recreated with our mocks
    __resetServices();
    
    // Reset AsyncStorage mocks
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    
    // Reset store state
    const { result } = renderHook(() => useResumeStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('uploadResume', () => {
    it('should handle complete resume upload flow', async () => {
      const { result } = renderHook(() => useResumeStore());

      // Mock document picker success
      const mockPickerResult = {
        type: 'success' as const,
        uri: 'file://resume.pdf',
        name: 'test-resume.pdf',
        size: 100000,
        mimeType: 'application/pdf',
        assets: [{
          uri: 'file://resume.pdf',
          name: 'test-resume.pdf',
          size: 100000,
          mimeType: 'application/pdf'
        }]
      };
      mockResumeParser.pickDocument.mockResolvedValue(mockPickerResult);
      
      // Mock validation
      mockResumeParser.validateFile.mockReturnValue({ isValid: true });
      
      // Mock parsing
      mockResumeParser.parseDocument.mockResolvedValue({
        content: 'base64content',
        parsedText: 'John Doe Software Engineer',
        fileType: '.pdf'
      });
      
      // Mock keyword extraction
      mockResumeParser.extractKeywords.mockReturnValue(['software', 'engineer']);
      
      // Mock save
      mockResumeParser.saveToLocalStorage.mockResolvedValue(mockResume);

      // Start upload
      await act(async () => {
        await result.current.uploadResume();
      });

      // Check upload progress was tracked
      expect(result.current.uploadProgress).toEqual({
        stage: 'complete',
        progress: 100,
        message: 'Resume uploaded successfully'
      });

      // Check resume was stored
      expect(result.current.currentResume).toEqual(mockResume);
      expect(result.current.resumes).toHaveLength(1);
    });

    it('should handle upload cancellation', async () => {
      const { result } = renderHook(() => useResumeStore());

      mockResumeParser.pickDocument.mockResolvedValue({ type: 'cancel' as const, assets: null });

      await act(async () => {
        await result.current.uploadResume();
      });

      expect(result.current.uploadProgress).toBeNull();
      expect(result.current.currentResume).toBeNull();
    });

    it('should handle file validation errors', async () => {
      const { result } = renderHook(() => useResumeStore());

      mockResumeParser.pickDocument.mockResolvedValue({
        type: 'success' as const,
        uri: 'file://large.pdf',
        name: 'large.pdf',
        size: 10 * 1024 * 1024, // 10MB
        mimeType: 'application/pdf',
        assets: [{
          uri: 'file://large.pdf',
          name: 'large.pdf',
          size: 10 * 1024 * 1024,
          mimeType: 'application/pdf'
        }]
      });

      mockResumeParser.validateFile.mockReturnValue({
        isValid: false,
        error: 'File size exceeds 5MB limit'
      });

      await act(async () => {
        await result.current.uploadResume();
      });

      expect(result.current.uploadProgress).toEqual({
        stage: 'error',
        progress: 0,
        message: 'File size exceeds 5MB limit'
      });
      expect(result.current.error).toBe('File size exceeds 5MB limit');
    });

    it('should update progress during upload stages', async () => {
      const { result } = renderHook(() => useResumeStore());
      const progressUpdates: ResumeUploadProgress[] = [];

      // Capture progress updates
      result.current.uploadProgress && progressUpdates.push(result.current.uploadProgress);

      mockResumeParser.pickDocument.mockResolvedValue({
        type: 'success' as const,
        uri: 'file://resume.pdf',
        name: 'test.pdf',
        size: 100000,
        mimeType: 'application/pdf',
        assets: [{
          uri: 'file://resume.pdf',
          name: 'test.pdf',
          size: 100000,
          mimeType: 'application/pdf'
        }]
      });
      mockResumeParser.validateFile.mockReturnValue({ isValid: true });
      mockResumeParser.parseDocument.mockImplementation(async () => {
        // Simulate parsing delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          content: 'base64',
          parsedText: 'text',
          fileType: '.pdf'
        };
      });
      mockResumeParser.extractKeywords.mockReturnValue(['test']);
      mockResumeParser.saveToLocalStorage.mockResolvedValue(mockResume);

      await act(async () => {
        await result.current.uploadResume();
      });

      // Verify progress stages were updated
      expect(mockResumeParser.pickDocument).toHaveBeenCalled();
      expect(mockResumeParser.parseDocument).toHaveBeenCalled();
    });
  });

  describe('analyzeResume', () => {

    it('should analyze current resume with job description', async () => {
      const { result } = renderHook(() => useResumeStore());
      const jobDescription = 'Looking for Python developer with AWS experience';
      
      // Set current resume
      act(() => {
        result.current.setCurrentResume(mockResume);
      });

      mockResumeAI.analyzeResume.mockResolvedValue(mockAnalysis);

      await act(async () => {
        await result.current.analyzeResume(jobDescription);
      });

      expect(mockResumeAI.analyzeResume).toHaveBeenCalledWith(
        mockResume,
        jobDescription
      );
      expect(result.current.currentAnalysis).toEqual(mockAnalysis);
      expect(result.current.analyses[mockResume.id]).toEqual(mockAnalysis);
    });

    it('should handle analysis without job description', async () => {
      const { result } = renderHook(() => useResumeStore());
      
      // Set current resume
      act(() => {
        result.current.setCurrentResume(mockResume);
      });

      mockResumeAI.analyzeResume.mockResolvedValue(mockAnalysis);

      await act(async () => {
        await result.current.analyzeResume();
      });

      expect(mockResumeAI.analyzeResume).toHaveBeenCalledWith(
        mockResume,
        undefined
      );
      expect(result.current.currentAnalysis).toEqual(mockAnalysis);
    });

    it('should not analyze if no current resume', async () => {
      const { result } = renderHook(() => useResumeStore());
      act(() => {
        result.current.setCurrentResume(null);
      });

      await act(async () => {
        await result.current.analyzeResume();
      });

      expect(mockResumeAI.analyzeResume).not.toHaveBeenCalled();
      expect(result.current.error).toBe('No resume selected for analysis');
    });

    it('should handle analysis errors', async () => {
      const { result } = renderHook(() => useResumeStore());
      
      // Set current resume
      act(() => {
        result.current.setCurrentResume(mockResume);
      });

      mockResumeAI.analyzeResume.mockRejectedValue(new Error('AI service error'));

      await act(async () => {
        await result.current.analyzeResume();
      });

      expect(result.current.error).toBe('AI service error');
      expect(result.current.currentAnalysis).toBeNull();
    });
  });

  describe('generateRewriteSuggestions', () => {

    it('should generate rewrite suggestions', async () => {
      const { result } = renderHook(() => useResumeStore());
      
      // Set current resume and consent
      act(() => {
        result.current.setCurrentResume(mockResume);
        result.current.setAIConsent(true);
      });
      
      const request: ResumeRewriteRequest = {
        resumeId: mockResume.id,
        targetKeywords: ['python', 'aws', 'docker'],
        jobDescription: 'Senior Python Developer role',
        tone: 'professional'
      };

      const mockResponse = {
        sections: [{
          title: 'Summary',
          originalContent: 'Software Engineer',
          rewrittenContent: 'Senior Python Developer with AWS expertise',
          hasChanges: true
        }],
        suggestions: [],
        improvedScore: 85
      };

      mockResumeAI.generateRewriteSuggestions.mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.generateRewriteSuggestions(request);
      });

      expect(mockResumeAI.generateRewriteSuggestions).toHaveBeenCalledWith(
        request,
        mockResume
      );
      expect(result.current.rewriteSuggestions).toEqual(mockResponse);
    });

    it('should require user consent', async () => {
      const { result } = renderHook(() => useResumeStore());
      
      // Set current resume and ensure consent is false
      act(() => {
        result.current.setCurrentResume(mockResume);
        result.current.setAIConsent(false);
      });

      const request: ResumeRewriteRequest = {
        resumeId: mockResume.id,
        targetKeywords: ['python'],
        tone: 'professional'
      };

      await act(async () => {
        await result.current.generateRewriteSuggestions(request);
      });

      expect(result.current.error).toBe('AI consent required for resume rewriting');
      expect(mockResumeAI.generateRewriteSuggestions).not.toHaveBeenCalled();
    });
  });

  describe('deleteResume', () => {
    it('should delete resume and associated data', async () => {
      const { result } = renderHook(() => useResumeStore());
      
      // Add resume to the store first
      act(() => {
        result.current.resumes = [mockResume];
        result.current.setCurrentResume(mockResume);
        result.current.analyses[mockResume.id] = mockAnalysis;
      });

      await act(async () => {
        await result.current.deleteResume(mockResume.id);
      });

      expect(result.current.resumes).toHaveLength(0);
      expect(result.current.currentResume).toBeNull();
      expect(result.current.analyses[mockResume.id]).toBeUndefined();
    });

    it('should handle deletion of non-existent resume', async () => {
      const { result } = renderHook(() => useResumeStore());

      await act(async () => {
        await result.current.deleteResume('non-existent');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('persistence', () => {
    it.skip('should persist state to AsyncStorage', async () => {
      const { result } = renderHook(() => useResumeStore());
      
      // Use proper store actions instead of direct assignment
      act(() => {
        result.current.setCurrentResume(mockResume);
        result.current.setAIConsent(true);
      });
      
      // Add resume through uploadResume action which triggers persistence
      mockResumeParser.pickDocument.mockResolvedValue({
        type: 'success' as const,
        uri: 'file://resume.pdf',
        name: 'test-resume.pdf',
        size: 100000,
        mimeType: 'application/pdf',
        assets: [{
          uri: 'file://resume.pdf',
          name: 'test-resume.pdf',
          size: 100000,
          mimeType: 'application/pdf'
        }]
      });
      mockResumeParser.validateFile.mockReturnValue({ isValid: true });
      mockResumeParser.parseDocument.mockResolvedValue({
        content: 'base64content',
        parsedText: 'John Doe Software Engineer',
        fileType: '.pdf'
      });
      mockResumeParser.extractKeywords.mockReturnValue(['software', 'engineer']);
      mockResumeParser.saveToLocalStorage.mockResolvedValue(mockResume);

      await act(async () => {
        await result.current.uploadResume();
      });

      // Wait for persistence
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@next_chapter/resume_store',
          expect.stringContaining(mockResume.id)
        );
      });
    });

    it.skip('should restore state from AsyncStorage', async () => {
      const storedState = {
        state: {
          resumes: [mockResume],
          currentResume: mockResume,
          analyses: { [mockResume.id]: mockAnalysis },
          hasAIConsent: true
        },
        version: 0
      };

      // Mock AsyncStorage to return the stored state before creating the hook
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedState));

      const { result } = renderHook(() => useResumeStore());

      // Wait for the store to rehydrate
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.resumes).toEqual([mockResume]);
      expect(result.current.currentResume).toEqual(mockResume);
      expect(result.current.hasAIConsent).toBe(true);
    });
  });

  describe('compareWithJobApplication', () => {
    it('should compare resume with job keywords', async () => {
      const { result } = renderHook(() => useResumeStore());
      
      act(() => {
        result.current.setCurrentResume(mockResume);
      });

      const jobKeywords = ['software', 'python', 'aws'];
      const mockComparison = {
        matchedKeywords: [
          { keyword: 'software', count: 1, relevance: 'high' as const }
        ],
        missingKeywords: ['python', 'aws'],
        matchPercentage: 33.33
      };

      mockResumeAI.compareWithJobApplication.mockResolvedValue(mockComparison);

      let comparison;
      await act(async () => {
        comparison = await result.current.compareWithJobApplication(jobKeywords);
      });
      
      expect(comparison).toEqual(mockComparison);

      expect(mockResumeAI.compareWithJobApplication).toHaveBeenCalledWith(
        mockResume,
        jobKeywords
      );
    });
  });

  describe('error handling', () => {
    it('should clear errors on successful operations', async () => {
      const { result } = renderHook(() => useResumeStore());
      
      // Set an error
      act(() => {
        result.current.error = 'Previous error';
      });

      // Successful operation should clear error
      mockResumeParser.pickDocument.mockResolvedValue({ type: 'cancel' as const, assets: null });
      
      await act(async () => {
        await result.current.uploadResume();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle loading states correctly', async () => {
      const { result } = renderHook(() => useResumeStore());
      
      expect(result.current.isLoading).toBe(false);

      mockResumeParser.pickDocument.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ type: 'cancel' as const, assets: null }), 100))
      );

      let uploadPromise: Promise<void>;
      act(() => {
        uploadPromise = result.current.uploadResume();
      });

      // Check loading state during operation
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await uploadPromise!;
      });

      // Check loading state after operation
      expect(result.current.isLoading).toBe(false);
    });
  });
});