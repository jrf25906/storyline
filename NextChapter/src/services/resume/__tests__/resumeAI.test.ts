import { ResumeAIService } from '@services/resume/resumeAI';
import { OpenAIService } from '@services/api/openai';
import { 
  Resume, 
  ResumeAnalysis, 
  ResumeRewriteRequest,
  ResumeRewriteResponse,
  ResumeSuggestion 
} from '@types/resume';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../api/openai');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('ResumeAIService', () => {
  let resumeAIService: ResumeAIService;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    mockOpenAIService = new OpenAIService() as jest.Mocked<OpenAIService>;
    resumeAIService = new ResumeAIService(mockOpenAIService);
    jest.clearAllMocks();
    
    // Reset AsyncStorage mocks
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  describe('analyzeResume', () => {
    const mockResume: Resume = {
      id: 'resume-123',
      userId: 'user-123',
      fileName: 'test-resume.pdf',
      fileType: '.pdf',
      content: 'base64content',
      parsedText: 'John Doe\nSoftware Engineer\nExperience with React and Node.js',
      extractedKeywords: ['software engineer', 'react', 'node.js'],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastModified: new Date()
    };

    const jobDescription = `
      Looking for a Senior Frontend Developer with:
      - 5+ years React experience
      - TypeScript expertise
      - GraphQL knowledge
      - Team leadership experience
    `;

    it('should analyze resume against job description', async () => {
      const mockAnalysis = {
        matchedKeywords: [
          { keyword: 'react', count: 1, relevance: 'high' }
        ],
        missingKeywords: ['typescript', 'graphql', 'leadership'],
        overallScore: 65,
        suggestions: [
          {
            id: 'sug-1',
            type: 'keyword' as const,
            priority: 'high' as const,
            originalText: 'Experience with React and Node.js',
            suggestedText: 'Experience with React, TypeScript, and Node.js',
            reason: 'Add TypeScript to match job requirements',
            applied: false
          }
        ]
      };

      mockOpenAIService.analyzeChatContent.mockResolvedValue({
        analysis: mockAnalysis,
        tone: 'pragmatist'
      });

      const analysis = await resumeAIService.analyzeResume(mockResume, jobDescription);

      expect(mockOpenAIService.analyzeChatContent).toHaveBeenCalledWith(
        expect.stringContaining('Analyze this resume'),
        expect.objectContaining({
          systemPrompt: expect.stringContaining('resume analysis expert')
        })
      );

      expect(analysis).toMatchObject({
        resumeId: mockResume.id,
        matchedKeywords: mockAnalysis.matchedKeywords,
        missingKeywords: mockAnalysis.missingKeywords,
        overallScore: mockAnalysis.overallScore,
        suggestions: mockAnalysis.suggestions,
        createdAt: expect.any(Date)
      });
    });

    it('should handle analysis without job description', async () => {
      const mockGeneralAnalysis = {
        matchedKeywords: mockResume.extractedKeywords.map(k => ({
          keyword: k,
          count: 1,
          relevance: 'medium' as const
        })),
        missingKeywords: [],
        overallScore: 75,
        suggestions: [
          {
            id: 'sug-1',
            type: 'format' as const,
            priority: 'medium' as const,
            originalText: 'John Doe',
            suggestedText: 'John Doe | (555) 123-4567 | john.doe@email.com',
            reason: 'Add contact information to header',
            applied: false
          }
        ]
      };

      mockOpenAIService.analyzeChatContent.mockResolvedValue({
        analysis: mockGeneralAnalysis,
        tone: 'pragmatist'
      });

      const analysis = await resumeAIService.analyzeResume(mockResume);

      expect(analysis).toMatchObject({
        resumeId: mockResume.id,
        overallScore: 75,
        suggestions: expect.arrayContaining([
          expect.objectContaining({
            type: 'format',
            priority: 'medium'
          })
        ])
      });
    });

    it('should handle AI service errors gracefully', async () => {
      mockOpenAIService.analyzeChatContent.mockRejectedValue(
        new Error('OpenAI API error')
      );

      await expect(resumeAIService.analyzeResume(mockResume, jobDescription))
        .rejects.toThrow('Failed to analyze resume: OpenAI API error');
    });

    it('should enforce rate limiting', async () => {
      // Clear any existing rate limit data
      jest.clearAllMocks();
      
      // Mock AsyncStorage to return existing rate limit data with 10 requests already made
      const rateLimitData = {
        counts: { 'user-123': 10 },
        lastReset: new Date().toISOString()
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(rateLimitData));
      
      // Create a new instance to ensure clean state
      const freshService = new ResumeAIService(mockOpenAIService);
      
      // Wait for initial load to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // First call should be rate limited since we're already at the limit
      await expect(freshService.analyzeResume(mockResume))
        .rejects.toThrow('Rate limit exceeded. Please try again later.');
    });
  });

  describe('generateRewriteSuggestions', () => {
    const mockRequest: ResumeRewriteRequest = {
      resumeId: 'resume-123',
      targetKeywords: ['typescript', 'graphql', 'aws', 'docker'],
      jobDescription: 'Senior Full Stack Developer position...',
      tone: 'professional',
      focusAreas: ['technical skills', 'leadership experience']
    };

    const mockResume: Resume = {
      id: 'resume-123',
      userId: 'user-123',
      fileName: 'test-resume.pdf',
      fileType: '.pdf',
      content: 'base64content',
      parsedText: `
        John Doe
        Software Developer
        
        Experience:
        Developed web applications using React and Node.js
        
        Skills:
        JavaScript, React, Node.js, MongoDB
      `,
      extractedKeywords: ['software developer', 'react', 'node.js', 'javascript'],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastModified: new Date()
    };

    it('should generate rewrite suggestions with target keywords', async () => {
      // Set user consent first
      resumeAIService.setUserConsent(true);
      const mockResponse: ResumeRewriteResponse = {
        sections: [
          {
            title: 'Professional Summary',
            originalContent: 'Software Developer',
            rewrittenContent: 'Senior Full Stack Developer with expertise in TypeScript, GraphQL, and cloud technologies',
            hasChanges: true
          },
          {
            title: 'Experience',
            originalContent: 'Developed web applications using React and Node.js',
            rewrittenContent: 'Led development of scalable web applications using React with TypeScript, Node.js, GraphQL APIs, and AWS cloud services. Implemented containerized deployments with Docker.',
            hasChanges: true
          }
        ],
        suggestions: [
          {
            id: 'sug-1',
            type: 'keyword' as const,
            priority: 'high' as const,
            originalText: 'JavaScript, React, Node.js, MongoDB',
            suggestedText: 'TypeScript, JavaScript, React, Node.js, GraphQL, AWS, Docker, MongoDB',
            reason: 'Added missing keywords from job description',
            applied: false
          }
        ],
        improvedScore: 85
      };

      mockOpenAIService.generateResumeContent.mockResolvedValue(mockResponse);

      const result = await resumeAIService.generateRewriteSuggestions(mockRequest, mockResume);

      expect(mockOpenAIService.generateResumeContent).toHaveBeenCalledWith(
        expect.objectContaining({
          resume: expect.stringContaining('Software Developer'),
          targetKeywords: mockRequest.targetKeywords,
          jobDescription: mockRequest.jobDescription,
          tone: mockRequest.tone,
          focusAreas: mockRequest.focusAreas
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.improvedScore).toBeGreaterThan(0);
      expect(result.sections.some(s => s.hasChanges)).toBe(true);
    });

    it('should respect user consent before sending to AI', async () => {
      // Simulate user not consenting
      resumeAIService.setUserConsent(false);

      await expect(resumeAIService.generateRewriteSuggestions(mockRequest, mockResume))
        .rejects.toThrow('User consent required to process resume with AI');
    });

    it('should sanitize sensitive information before sending to AI', async () => {
      // Set user consent first
      resumeAIService.setUserConsent(true);
      const resumeWithPII: Resume = {
        ...mockResume,
        parsedText: `
          John Doe
          SSN: 123-45-6789
          Phone: (555) 123-4567
          Email: john.doe@email.com
          
          Experience at ABC Company
        `
      };

      mockOpenAIService.generateResumeContent.mockResolvedValue({
        sections: [],
        suggestions: [],
        improvedScore: 75
      });

      resumeAIService.setUserConsent(true);
      await resumeAIService.generateRewriteSuggestions(mockRequest, resumeWithPII);

      expect(mockOpenAIService.generateResumeContent).toHaveBeenCalledWith(
        expect.objectContaining({
          resume: expect.not.stringContaining('123-45-6789')
        })
      );
    });

    it('should handle different tone options', async () => {
      // Set user consent first
      resumeAIService.setUserConsent(true);
      const tones: Array<'professional' | 'creative' | 'technical'> = ['professional', 'creative', 'technical'];

      for (const tone of tones) {
        const request = { ...mockRequest, tone };
        mockOpenAIService.generateResumeContent.mockResolvedValue({
          sections: [],
          suggestions: [],
          improvedScore: 80
        });

        await resumeAIService.generateRewriteSuggestions(request, mockResume);

        expect(mockOpenAIService.generateResumeContent).toHaveBeenCalledWith(
          expect.objectContaining({ tone })
        );
      }
    });
  });

  describe('compareWithJobApplication', () => {
    const mockResume: Resume = {
      id: 'resume-123',
      userId: 'user-123',
      fileName: 'test-resume.pdf',
      fileType: '.pdf',
      content: 'base64content',
      parsedText: 'Experience with React, Node.js, and MongoDB',
      extractedKeywords: ['react', 'node.js', 'mongodb'],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastModified: new Date()
    };

    const jobKeywords = ['react', 'typescript', 'graphql', 'aws', 'docker'];

    it('should compare resume keywords with job requirements', async () => {
      const comparison = await resumeAIService.compareWithJobApplication(
        mockResume,
        jobKeywords
      );

      expect(comparison).toMatchObject({
        matchedKeywords: expect.arrayContaining([
          expect.objectContaining({
            keyword: 'react',
            relevance: 'high'
          })
        ]),
        missingKeywords: expect.arrayContaining(['typescript', 'graphql', 'aws', 'docker']),
        matchPercentage: 20 // 1 out of 5 keywords matched
      });
    });

    it('should calculate relevance scores correctly', async () => {
      const resumeWithMoreKeywords: Resume = {
        ...mockResume,
        extractedKeywords: ['react', 'typescript', 'aws']
      };

      const comparison = await resumeAIService.compareWithJobApplication(
        resumeWithMoreKeywords,
        jobKeywords
      );

      expect(comparison.matchPercentage).toBe(60); // 3 out of 5 keywords
      expect(comparison.matchedKeywords).toHaveLength(3);
      expect(comparison.missingKeywords).toHaveLength(2);
    });
  });

  describe('caching and performance', () => {
    it('should cache analysis results', async () => {
      const mockResume: Resume = {
        id: 'resume-123',
        userId: 'user-123',
        fileName: 'test.pdf',
        fileType: '.pdf',
        content: 'content',
        parsedText: 'cached test',
        extractedKeywords: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModified: new Date()
      };

      const mockAnalysis = {
        matchedKeywords: [],
        missingKeywords: [],
        overallScore: 75,
        suggestions: []
      };

      mockOpenAIService.analyzeChatContent.mockResolvedValue({
        analysis: mockAnalysis,
        tone: 'pragmatist'
      });

      // First call
      const result1 = await resumeAIService.analyzeResume(mockResume);
      
      // Second call should use cache
      const result2 = await resumeAIService.analyzeResume(mockResume);

      expect(mockOpenAIService.analyzeChatContent).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should invalidate cache when resume is updated', async () => {
      const baseTime = new Date('2025-01-01T00:00:00Z');
      const mockResume: Resume = {
        id: 'resume-123',
        userId: 'user-123',
        fileName: 'test.pdf',
        fileType: '.pdf',
        content: 'content',
        parsedText: 'original text',
        extractedKeywords: ['test'],
        createdAt: baseTime,
        updatedAt: baseTime,
        lastModified: baseTime
      };

      mockOpenAIService.analyzeChatContent.mockResolvedValue({
        analysis: { 
          matchedKeywords: [],
          missingKeywords: [],
          overallScore: 75,
          suggestions: []
        },
        tone: 'pragmatist'
      });

      // First analysis
      await resumeAIService.analyzeResume(mockResume);

      // Update resume with a different timestamp
      const updatedTime = new Date('2025-01-01T01:00:00Z');
      const updatedResume = {
        ...mockResume,
        parsedText: 'updated text',
        updatedAt: updatedTime
      };

      // Should make new API call due to different timestamp
      await resumeAIService.analyzeResume(updatedResume);

      expect(mockOpenAIService.analyzeChatContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling and validation', () => {
    it('should validate resume content before processing', async () => {
      const invalidResume: Resume = {
        id: 'resume-123',
        userId: 'user-123',
        fileName: 'empty.pdf',
        fileType: '.pdf',
        content: '',
        parsedText: '',
        extractedKeywords: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModified: new Date()
      };

      await expect(resumeAIService.analyzeResume(invalidResume))
        .rejects.toThrow('Resume content is empty');
    });

    it('should handle API timeout gracefully', async () => {
      mockOpenAIService.analyzeChatContent.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const mockResume: Resume = {
        id: 'resume-123',
        userId: 'user-123',
        fileName: 'test.pdf',
        fileType: '.pdf',
        content: 'content',
        parsedText: 'test content',
        extractedKeywords: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModified: new Date()
      };

      await expect(resumeAIService.analyzeResume(mockResume))
        .rejects.toThrow('Failed to analyze resume: Request timeout');
    });
  });
});