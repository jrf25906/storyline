/**
 * Tests for OpenAI Coach Adapter
 */

import { OpenAICoachAdapter } from '@services/adapters/ai/OpenAICoachAdapter';
import { IChatCompletionService } from '@services/interfaces/ai/IAIService';
import { IStorageService } from '@services/interfaces/data/IStorageService';
import { ok, err } from '@services/interfaces/common/result';
import { ExternalServiceError } from '@services/interfaces/common/errors';

// Mock implementations
const mockChatService: jest.Mocked<IChatCompletionService> = {
  complete: jest.fn(),
  stream: jest.fn(),
  countTokens: jest.fn(),
  setModel: jest.fn(),
  getModel: jest.fn().mockReturnValue('gpt-4o-mini'),
  isConfigured: jest.fn().mockReturnValue(true),
  validateConfiguration: jest.fn().mockResolvedValue(ok(true)),
  getUsage: jest.fn(),
  getRemainingQuota: jest.fn(),
};

const mockStorageService: jest.Mocked<IStorageService> = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(ok(undefined)),
  remove: jest.fn().mockResolvedValue(ok(undefined)),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  getSecureItem: jest.fn(),
  setSecureItem: jest.fn(),
  removeSecureItem: jest.fn(),
  hasSecureItem: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  deleteFile: jest.fn(),
  exists: jest.fn(),
  getInfo: jest.fn(),
  makeDirectory: jest.fn(),
  readDirectory: jest.fn(),
  copyFile: jest.fn(),
  moveFile: jest.fn(),
  pickDocument: jest.fn(),
  saveDocument: jest.fn(),
  getDocumentText: jest.fn(),
  deleteDocument: jest.fn(),
  getUsedSpace: jest.fn(),
  getAvailableSpace: jest.fn(),
  getTotalSpace: jest.fn(),
  isStorageLow: jest.fn(),
  onStorageChange: jest.fn(),
  clearExpiredData: jest.fn(),
  optimizeStorage: jest.fn(),
};

describe('OpenAICoachAdapter', () => {
  let adapter: OpenAICoachAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new OpenAICoachAdapter(mockChatService, mockStorageService, false);
  });

  describe('sendMessage', () => {
    const mockContext = {
      userId: 'user123',
      userName: 'John',
      daysSinceLayoff: 15,
      currentTaskDay: 5,
    };

    it('should send a message and receive a coach response', async () => {
      // Mock successful AI response
      mockChatService.complete.mockResolvedValueOnce(
        ok({
          content: "You've got this! Let's focus on one small step today.",
          role: 'assistant',
          tokensUsed: 50,
          finishReason: 'stop',
          model: 'gpt-4o-mini',
        })
      );

      // Mock storage for conversation history
      mockStorageService.get.mockResolvedValue(ok([]));

      const result = await adapter.sendMessage("I'm feeling lost", mockContext);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.message).toContain("You've got this");
        expect(result.value.tone).toBe('hype');
        expect(result.value.emotionalState.primary).toBe('discouraged');
      }
    });

    it('should detect crisis keywords and return crisis response', async () => {
      const result = await adapter.sendMessage(
        'I want to end it all',
        mockContext
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.requiresProfessionalHelp).toBe(true);
        expect(result.value.message).toContain('988');
        expect(result.value.resources).toHaveLength(2);
      }
    });

    it('should enforce message limits for free users', async () => {
      // Mock that user has already sent 10 messages today
      mockStorageService.get.mockResolvedValueOnce(ok(10));

      const result = await adapter.sendMessage('Hello', mockContext);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('EXTERNAL_SERVICE_ERROR');
        expect(result.error.message).toContain('Daily message limit reached');
      }
    });

    it('should use cached response when AI service fails', async () => {
      // Mock AI service failure
      mockChatService.complete.mockResolvedValueOnce(
        err(new ExternalServiceError('OpenAI', 'Service unavailable'))
      );

      // Mock storage for conversation history
      mockStorageService.get.mockResolvedValue(ok([]));

      const result = await adapter.sendMessage("I'm feeling lost", mockContext);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.message).toContain('one step at a time');
      }
    });
  });

  describe('detectEmotionalState', () => {
    it('should detect discouraged emotional state', async () => {
      const result = await adapter.detectEmotionalState(
        'I feel so hopeless and worthless'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.primary).toBe('discouraged');
        expect(result.value.triggers).toContain('hopeless');
        expect(result.value.triggers).toContain('worthless');
        expect(result.value.requiresSupport).toBe(true);
      }
    });

    it('should detect deflecting emotional state', async () => {
      const result = await adapter.detectEmotionalState(
        'They screwed me over, this is so unfair'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.primary).toBe('deflecting');
        expect(result.value.triggers).toContain('they screwed me');
        expect(result.value.requiresSupport).toBe(true);
      }
    });

    it('should detect neutral state for regular messages', async () => {
      const result = await adapter.detectEmotionalState(
        'What should I do next?'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.primary).toBe('neutral');
        expect(result.value.requiresSupport).toBe(false);
      }
    });
  });

  describe('selectTone', () => {
    it('should select hype tone for discouraged state', () => {
      const tone = adapter.selectTone({
        primary: 'discouraged',
        confidence: 0.8,
        triggers: ['hopeless'],
        requiresSupport: true,
      });

      expect(tone).toBe('hype');
    });

    it('should select tough-love tone for deflecting state', () => {
      const tone = adapter.selectTone({
        primary: 'deflecting',
        confidence: 0.7,
        triggers: ['lazy'],
        requiresSupport: true,
      });

      expect(tone).toBe('tough-love');
    });

    it('should select pragmatist tone for neutral state', () => {
      const tone = adapter.selectTone({
        primary: 'neutral',
        confidence: 0.5,
        triggers: [],
        requiresSupport: false,
      });

      expect(tone).toBe('pragmatist');
    });
  });

  describe('conversation management', () => {
    it('should save and retrieve conversation history', async () => {
      const mockConversations = [
        {
          id: 'conv123',
          userId: 'user123',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockStorageService.get.mockResolvedValueOnce(ok(mockConversations));

      const result = await adapter.getConversationHistory('user123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockConversations);
      }
    });

    it('should clear conversation history', async () => {
      const result = await adapter.clearConversationHistory('user123');

      expect(result.isOk()).toBe(true);
      expect(mockStorageService.remove).toHaveBeenCalledWith(
        '@next_chapter/coach/conversation/user123'
      );
    });
  });

  describe('usage tracking', () => {
    it('should track message count', async () => {
      mockStorageService.get.mockResolvedValueOnce(ok(5));

      const result = await adapter.getMessageCount('user123', 'day');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(5);
      }
    });

    it('should calculate remaining messages for free users', async () => {
      mockStorageService.get.mockResolvedValueOnce(ok(7));

      const result = await adapter.getRemainingMessages('user123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(3); // 10 - 7
      }
    });

    it('should return unlimited messages for pro users', async () => {
      const proAdapter = new OpenAICoachAdapter(
        mockChatService,
        mockStorageService,
        true
      );

      const result = await proAdapter.getRemainingMessages('user123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(Number.MAX_SAFE_INTEGER);
      }
    });
  });

  describe('resume analysis', () => {
    it('should analyze resume and return structured analysis', async () => {
      const mockAnalysis = {
        overallScore: 75,
        strengths: ['Strong technical skills', 'Good education'],
        weaknesses: ['Lacks quantifiable achievements'],
        keywordMatch: {
          matched: ['JavaScript', 'React'],
          missing: ['TypeScript', 'Node.js'],
          score: 60,
        },
        sections: {
          summary: {
            present: true,
            quality: 'good',
            suggestions: ['Add more specific achievements'],
          },
          experience: {
            present: true,
            quality: 'fair',
            suggestions: ['Quantify your impact'],
          },
          skills: {
            present: true,
            quality: 'excellent',
            suggestions: [],
          },
          education: {
            present: true,
            quality: 'good',
            suggestions: [],
          },
          achievements: {
            present: false,
            quality: 'poor',
            suggestions: ['Add an achievements section'],
          },
        },
        aiInsights: 'Focus on quantifying your impact and achievements',
      };

      mockChatService.complete.mockResolvedValueOnce(
        ok({
          content: JSON.stringify(mockAnalysis),
          role: 'assistant',
          tokensUsed: 200,
          finishReason: 'stop',
          model: 'gpt-4o-mini',
        })
      );

      const result = await adapter.analyzeResume(
        'Sample resume text',
        'Software Engineer'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockAnalysis);
      }
    });

    it('should rewrite resume sections', async () => {
      mockChatService.complete.mockResolvedValueOnce(
        ok({
          content: 'Improved section text with better keywords and impact',
          role: 'assistant',
          tokensUsed: 100,
          finishReason: 'stop',
          model: 'gpt-4o-mini',
        })
      );

      const result = await adapter.rewriteSection(
        'Original section text',
        'experience',
        'Product Manager'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('Improved section text');
      }
    });
  });

  describe('getCachedResponses', () => {
    it('should return predefined cached responses', async () => {
      const result = await adapter.getCachedResponses();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0]).toHaveProperty('trigger');
        expect(result.value[0]).toHaveProperty('response');
        expect(result.value[0]).toHaveProperty('tone');
        expect(result.value[0]).toHaveProperty('category');
      }
    });
  });
});