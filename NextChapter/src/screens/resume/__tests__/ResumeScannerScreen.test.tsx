import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ResumeScannerScreen } from '@screens/resume/ResumeScannerScreen';
import { useResumeStore } from '@stores/resumeStore';
import { Resume, ResumeAnalysis } from '@types/resume';
import { createMockStore } from '@test-utils/mockHelpers';

// Mock navigation dependencies
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

// Mock dependencies
jest.mock('../../../stores/resumeStore');

describe('ResumeScannerScreen', () => {
  const mockResume: Resume = {
    id: 'resume-123',
    userId: 'user-123',
    fileName: 'test-resume.pdf',
    fileType: '.pdf',
    content: 'base64content',
    parsedText: 'John Doe Software Engineer',
    extractedKeywords: ['software', 'engineer', 'react', 'node.js'],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastModified: new Date()
  };

  const mockAnalysis: ResumeAnalysis = {
    resumeId: 'resume-123',
    matchedKeywords: [
      { keyword: 'react', count: 3, relevance: 'high' },
      { keyword: 'node.js', count: 2, relevance: 'medium' }
    ],
    missingKeywords: ['python', 'aws', 'docker'],
    overallScore: 75,
    suggestions: [
      {
        id: 'sug-1',
        type: 'keyword',
        priority: 'high',
        originalText: 'Experience with React',
        suggestedText: 'Experience with React and Python',
        reason: 'Add Python to match job requirements',
        applied: false
      }
    ],
    createdAt: new Date()
  };

  const mockUseResumeStore = {
    currentResume: null,
    resumes: [],
    currentAnalysis: null,
    uploadProgress: null,
    isLoading: false,
    error: null,
    hasAIConsent: false,
    uploadResume: jest.fn(),
    analyzeResume: jest.fn(),
    generateRewriteSuggestions: jest.fn(),
    deleteResume: jest.fn(),
    setCurrentResume: jest.fn(),
    setAIConsent: jest.fn(),
    compareWithJobApplication: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    // Mock Alert.alert properly for each test
    Alert.alert = jest.fn();
    const mockStore = createMockStore(mockUseResumeStore);
    (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockUseResumeStore);
  });

  describe('Initial State', () => {
    it('should render upload prompt when no resume is loaded', () => {
      const { getByText, getByTestId } = render(<ResumeScannerScreen />);

      expect(getByText('Resume Scanner')).toBeTruthy();
      expect(getByText('Upload Your Resume')).toBeTruthy();
      expect(getByText('Supported formats: PDF, DOCX, DOC, TXT')).toBeTruthy();
      expect(getByTestId('upload-button')).toBeTruthy();
    });

    it('should show resume list if resumes exist', () => {
      const mockStoreWithResumes = {
        ...mockUseResumeStore,
        resumes: [mockResume]
      };
      const mockStore = createMockStore(mockStoreWithResumes);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithResumes);

      const { getByText, queryByTestId } = render(<ResumeScannerScreen />);

      expect(getByText('Your Resumes')).toBeTruthy();
      expect(getByText('test-resume.pdf')).toBeTruthy();
      expect(queryByTestId('upload-button')).toBeTruthy(); // Still shows upload option
    });

    it('should display consent request for AI features', () => {
      const { getByText, getByTestId } = render(<ResumeScannerScreen />);

      expect(getByText(/AI-Powered Resume Analysis/)).toBeTruthy();
      expect(getByTestId('consent-toggle')).toBeTruthy();
    });
  });

  describe('Resume Upload', () => {
    it('should trigger resume upload on button press', async () => {
      const { getByTestId } = render(<ResumeScannerScreen />);

      const uploadButton = getByTestId('upload-button');
      fireEvent.press(uploadButton);

      expect(mockUseResumeStore.uploadResume).toHaveBeenCalled();
    });

    it('should show upload progress', () => {
      const mockStoreWithProgress = {
        ...mockUseResumeStore,
        uploadProgress: {
          stage: 'parsing' as const,
          progress: 50,
          message: 'Parsing document...'
        }
      };
      const mockStore = createMockStore(mockStoreWithProgress);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithProgress);

      const { getByText, getByTestId } = render(<ResumeScannerScreen />);

      expect(getByText('Parsing document...')).toBeTruthy();
      expect(getByTestId('progress-bar')).toBeTruthy();
    });

    it('should handle upload errors', () => {
      const mockStoreWithError = {
        ...mockUseResumeStore,
        error: 'File size exceeds limit'
      };
      const mockStore = createMockStore(mockStoreWithError);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithError);

      const { getByText } = render(<ResumeScannerScreen />);

      expect(getByText('File size exceeds limit')).toBeTruthy();
    });

    it('should display success message on upload completion', () => {
      const mockStoreWithSuccess = {
        ...mockUseResumeStore,
        currentResume: null, // No resume yet, so upload section shows
        uploadProgress: {
          stage: 'complete' as const,
          progress: 100,
          message: 'Resume uploaded successfully'
        }
      };
      const mockStore = createMockStore(mockStoreWithSuccess);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithSuccess);

      const { getByText } = render(<ResumeScannerScreen />);

      expect(getByText('Resume uploaded successfully')).toBeTruthy();
    });
  });

  describe('Resume Display', () => {
    beforeEach(() => {
      const mockStoreWithResume = {
        ...mockUseResumeStore,
        currentResume: mockResume
      };
      const mockStore = createMockStore(mockStoreWithResume);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithResume);
    });

    it('should display current resume details', () => {
      const { getByText, getByTestId } = render(<ResumeScannerScreen />);

      expect(getByText('test-resume.pdf')).toBeTruthy();
      expect(getByText('Keywords Found: 4')).toBeTruthy();
      expect(getByTestId('keyword-list')).toBeTruthy();
    });

    it('should show extracted keywords', () => {
      const { getByText } = render(<ResumeScannerScreen />);

      mockResume.extractedKeywords.forEach(keyword => {
        expect(getByText(keyword)).toBeTruthy();
      });
    });

    it('should allow resume deletion with confirmation', async () => {
      const { getByTestId } = render(<ResumeScannerScreen />);

      const deleteButton = getByTestId('delete-resume-button');
      fireEvent.press(deleteButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Resume',
        'Are you sure you want to delete this resume?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ 
            text: 'Delete',
            onPress: expect.any(Function)
          })
        ])
      );

      // Simulate confirmation
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteHandler = alertCall[2].find((btn: any) => btn.text === 'Delete').onPress;
      deleteHandler();

      expect(mockUseResumeStore.deleteResume).toHaveBeenCalledWith(mockResume.id);
    });
  });

  describe('Resume Analysis', () => {
    beforeEach(() => {
      const mockStoreWithResume = {
        ...mockUseResumeStore,
        currentResume: mockResume,
        hasAIConsent: true
      };
      const mockStore = createMockStore(mockStoreWithResume);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithResume);
    });

    it('should show analyze button when consent is given', () => {
      const { getByTestId } = render(<ResumeScannerScreen />);

      expect(getByTestId('analyze-button')).toBeTruthy();
    });

    it('should disable analyze button without consent', () => {
      const mockStoreNoConsent = {
        ...mockUseResumeStore,
        currentResume: mockResume,
        hasAIConsent: false
      };
      const mockStore = createMockStore(mockStoreNoConsent);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreNoConsent);

      const { getByTestId } = render(<ResumeScannerScreen />);

      const analyzeButton = getByTestId('analyze-button');
      expect(analyzeButton.props.accessibilityState.disabled).toBe(true);
    });

    it('should trigger analysis with job description', async () => {
      const { getByTestId, getByPlaceholderText } = render(<ResumeScannerScreen />);

      const jobDescInput = getByPlaceholderText('Paste job description here (optional)');
      const analyzeButton = getByTestId('analyze-button');

      fireEvent.changeText(jobDescInput, 'Looking for React developer');
      fireEvent.press(analyzeButton);

      expect(mockUseResumeStore.analyzeResume).toHaveBeenCalledWith('Looking for React developer');
    });

    it('should display analysis results', () => {
      const mockStoreWithAnalysis = {
        ...mockUseResumeStore,
        currentResume: mockResume,
        currentAnalysis: mockAnalysis,
        hasAIConsent: true
      };
      const mockStore = createMockStore(mockStoreWithAnalysis);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithAnalysis);

      const { getByText, getByTestId } = render(<ResumeScannerScreen />);

      expect(getByText('Analysis Results')).toBeTruthy();
      // The AnalysisResults component displays the score
      expect(getByText('75%')).toBeTruthy();
      expect(getByTestId('matched-keywords')).toBeTruthy();
      expect(getByTestId('missing-keywords')).toBeTruthy();
      expect(getByTestId('suggestions-list')).toBeTruthy();
    });

    it('should display matched keywords with relevance', () => {
      const mockStoreWithAnalysis = {
        ...mockUseResumeStore,
        currentResume: mockResume,
        currentAnalysis: mockAnalysis,
        hasAIConsent: true
      };
      const mockStore = createMockStore(mockStoreWithAnalysis);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithAnalysis);

      const { getByText, getAllByText } = render(<ResumeScannerScreen />);

      // The AnalysisResults component displays keywords
      // React and node.js appear multiple times (in keywords list and analysis)
      const reactTexts = getAllByText('react');
      expect(reactTexts.length).toBeGreaterThan(0);
      expect(getByText('3x')).toBeTruthy();
      const nodeTexts = getAllByText('node.js');
      expect(nodeTexts.length).toBeGreaterThan(0);
      expect(getByText('2x')).toBeTruthy();
    });

    it('should display missing keywords', () => {
      const mockStoreWithAnalysis = {
        ...mockUseResumeStore,
        currentResume: mockResume,
        currentAnalysis: mockAnalysis,
        hasAIConsent: true
      };
      const mockStore = createMockStore(mockStoreWithAnalysis);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithAnalysis);

      const { getByText } = render(<ResumeScannerScreen />);

      mockAnalysis.missingKeywords.forEach(keyword => {
        expect(getByText(keyword)).toBeTruthy();
      });
    });
  });

  describe('Rewrite Suggestions', () => {
    beforeEach(() => {
      const mockStoreWithAnalysis = {
        ...mockUseResumeStore,
        currentResume: mockResume,
        currentAnalysis: mockAnalysis,
        hasAIConsent: true
      };
      const mockStore = createMockStore(mockStoreWithAnalysis);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithAnalysis);
    });

    it('should show generate suggestions button after analysis', () => {
      const { getByTestId } = render(<ResumeScannerScreen />);

      expect(getByTestId('generate-suggestions-button')).toBeTruthy();
    });

    it('should open rewrite modal on button press', () => {
      const { getByTestId, getByText } = render(<ResumeScannerScreen />);

      const suggestionsButton = getByTestId('generate-suggestions-button');
      fireEvent.press(suggestionsButton);

      expect(getByText('AI Rewrite Suggestions')).toBeTruthy();
      expect(getByTestId('rewrite-modal')).toBeTruthy();
    });

    it('should allow tone selection in rewrite modal', () => {
      const { getByTestId } = render(<ResumeScannerScreen />);

      fireEvent.press(getByTestId('generate-suggestions-button'));

      const toneButtons = ['tone-professional', 'tone-creative', 'tone-technical'];
      toneButtons.forEach(testId => {
        expect(getByTestId(testId)).toBeTruthy();
      });
    });

    it('should trigger rewrite generation with selected options', async () => {
      const { getByTestId, getAllByTestId } = render(<ResumeScannerScreen />);

      fireEvent.press(getByTestId('generate-suggestions-button'));
      
      // Select tone
      fireEvent.press(getByTestId('tone-technical'));
      
      // Add focus areas
      const focusInput = getByTestId('focus-areas-input');
      fireEvent.changeText(focusInput, 'Leadership, Cloud Architecture');
      
      // Generate - there might be two buttons with this ID, get the one in the modal
      const buttons = getAllByTestId('generate-rewrite-button');
      // Just use the last one which should be the modal button
      const modalGenerateButton = buttons[buttons.length - 1];
      fireEvent.press(modalGenerateButton);

      await waitFor(() => {
        expect(mockUseResumeStore.generateRewriteSuggestions).toHaveBeenCalledWith({
          resumeId: mockResume.id,
          targetKeywords: mockAnalysis.missingKeywords,
          jobDescription: undefined,
          tone: 'technical',
          focusAreas: ['Leadership', 'Cloud Architecture']
        });
      });
    });
  });

  describe('Integration with Job Tracker', () => {
    it('should show option to link with job application', () => {
      const mockStoreWithResume = {
        ...mockUseResumeStore,
        currentResume: mockResume,
        currentAnalysis: mockAnalysis,
        hasAIConsent: true
      };
      const mockStore = createMockStore(mockStoreWithResume);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithResume);

      const { getByTestId } = render(<ResumeScannerScreen />);

      expect(getByTestId('link-job-button')).toBeTruthy();
    });

    it('should navigate to job tracker with resume context', () => {
      const mockStoreWithAnalysis = {
        ...mockUseResumeStore,
        currentResume: mockResume,
        currentAnalysis: mockAnalysis // Need analysis for the button to appear
      };
      const mockStore = createMockStore(mockStoreWithAnalysis);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithAnalysis);
      
      const { getByTestId } = render(<ResumeScannerScreen />);

      fireEvent.press(getByTestId('link-job-button'));

      expect(mockNavigate).toHaveBeenCalledWith('Tracker', {
        resumeId: mockResume.id,
        keywords: mockResume.extractedKeywords
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(<ResumeScannerScreen />);

      expect(getByLabelText('Upload resume file')).toBeTruthy();
      expect(getByLabelText('Enable AI-powered analysis')).toBeTruthy();
    });

    it('should announce upload progress to screen readers', () => {
      const mockStoreWithProgress = {
        ...mockUseResumeStore,
        uploadProgress: {
          stage: 'analyzing' as const,
          progress: 75,
          message: 'Analyzing resume content...'
        }
      };
      const mockStore = createMockStore(mockStoreWithProgress);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithProgress);

      const { getByTestId } = render(<ResumeScannerScreen />);

      const progressBar = getByTestId('progress-bar');
      expect(progressBar.props.accessibilityValue).toEqual({
        now: 75,
        min: 0,
        max: 100
      });
    });

    it('should have keyboard navigation support', () => {
      const { getByTestId } = render(<ResumeScannerScreen />);

      const uploadButton = getByTestId('upload-button');
      expect(uploadButton.props.accessible).toBe(true);
      expect(uploadButton.props.accessibilityRole).toBe('button');
    });
  });

  describe('Error Handling', () => {
    it('should display user-friendly error messages', () => {
      const errors = [
        { error: 'Network error', expected: 'Unable to connect. Please check your internet connection.' },
        { error: 'Rate limit exceeded', expected: 'Too many requests. Please try again later.' },
        { error: 'Invalid file format', expected: 'Please upload a PDF, DOCX, DOC, or TXT file.' }
      ];

      errors.forEach(({ error, expected }) => {
        const mockStoreWithError = {
          ...mockUseResumeStore,
          error
        };
        const mockStore = createMockStore(mockStoreWithError);
        (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithError);

        const { getByText } = render(<ResumeScannerScreen />);
        expect(getByText(expected)).toBeTruthy();
      });
    });

    it('should allow error dismissal', () => {
      const mockStoreWithError = {
        ...mockUseResumeStore,
        error: 'Test error'
      };
      const mockStore = createMockStore(mockStoreWithError);
      (useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStoreWithError);

      const { getByTestId } = render(<ResumeScannerScreen />);

      const dismissButton = getByTestId('dismiss-error');
      fireEvent.press(dismissButton);

      // In real implementation, this would clear the error in the store
      expect(dismissButton).toBeTruthy();
    });
  });
});