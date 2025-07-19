import { CoachService } from '@services/ai/coachService';
import { 
  createMockAIService,
  createMockChatService,
  createMockStorageService,
  createMockAnalyticsService,
  serviceErrors,
  ServiceResult,
  buildCoachMessage,
  buildUser,
} from '@test-utils';
import { CoachTone } from '@types';

describe('CoachService with Service Interfaces', () => {
  let coachService: CoachService;
  let mockAI: ReturnType<typeof createMockAIService>;
  let mockChat: ReturnType<typeof createMockChatService>;
  let mockStorage: ReturnType<typeof createMockStorageService>;
  let mockAnalytics: ReturnType<typeof createMockAnalyticsService>;

  beforeEach(() => {
    // Create mock services
    mockAI = createMockAIService();
    mockChat = createMockChatService();
    mockStorage = createMockStorageService();
    mockAnalytics = createMockAnalyticsService();

    // Initialize coach service with mocks
    coachService = new CoachService({
      ai: mockAI,
      chat: mockChat,
      storage: mockStorage,
      analytics: mockAnalytics,
    });
  });

  describe('Message Sending', () => {
    it('should send message with appropriate tone based on emotional state', async () => {
      const userMessage = "I'm feeling completely lost and worthless";
      const user = buildUser();

      // Mock emotion detection
      mockChat.detectEmotion.mockResolvedValue(
        ServiceResult.success({ emotion: 'despair', confidence: 0.9 })
      );

      // Mock AI response
      mockAI.generateText.mockResolvedValue(
        ServiceResult.success({
          text: "I hear you, and what you're feeling is valid. You've got this - let's turn this corner together.",
          tokens: 50,
        })
      );

      // Mock chat service response
      const expectedResponse = buildCoachMessage({
        content: "I hear you, and what you're feeling is valid. You've got this - let's turn this corner together.",
        tone: 'hype',
        emotionalState: 'despair',
      });

      mockChat.sendMessage.mockResolvedValue(ServiceResult.success(expectedResponse));

      const result = await coachService.sendMessage(userMessage, user);

      expect(result.isSuccess).toBe(true);
      expect(result.value?.tone).toBe('hype'); // Should use hype tone for despair
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'coach_message_sent',
        expect.objectContaining({
          tone: 'hype',
          emotionalState: 'despair',
        })
      );
    });

    it('should handle AI service failures gracefully', async () => {
      const userMessage = 'Help me with my job search';
      const user = buildUser();

      mockChat.detectEmotion.mockResolvedValue(
        ServiceResult.success({ emotion: 'neutral', confidence: 0.8 })
      );

      mockAI.generateText.mockResolvedValue(
        ServiceResult.failure(serviceErrors.rateLimit())
      );

      const result = await coachService.sendMessage(userMessage, user);

      expect(result.isSuccess).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMIT');
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'coach_error',
        expect.objectContaining({
          error: 'RATE_LIMIT',
        })
      );
    });

    it('should fall back to pragmatist tone when emotion detection fails', async () => {
      const userMessage = 'What should I do next?';
      const user = buildUser();

      mockChat.detectEmotion.mockResolvedValue(
        ServiceResult.failure(serviceErrors.unknown())
      );

      mockAI.generateText.mockResolvedValue(
        ServiceResult.success({
          text: "Let's break this down step by step...",
          tokens: 40,
        })
      );

      const expectedResponse = buildCoachMessage({
        content: "Let's break this down step by step...",
        tone: 'pragmatist',
        emotionalState: 'unknown',
      });

      mockChat.sendMessage.mockResolvedValue(ServiceResult.success(expectedResponse));

      const result = await coachService.sendMessage(userMessage, user);

      expect(result.isSuccess).toBe(true);
      expect(result.value?.tone).toBe('pragmatist');
    });
  });

  describe('Tone Selection', () => {
    const testCases = [
      {
        emotion: 'hopeless',
        expectedTone: 'hype' as CoachTone,
        description: 'should use hype tone for hopeless emotion',
      },
      {
        emotion: 'angry',
        expectedTone: 'tough-love' as CoachTone,
        description: 'should use tough-love tone for angry emotion',
      },
      {
        emotion: 'neutral',
        expectedTone: 'pragmatist' as CoachTone,
        description: 'should use pragmatist tone for neutral emotion',
      },
    ];

    testCases.forEach(({ emotion, expectedTone, description }) => {
      it(description, async () => {
        const userMessage = 'Test message';
        const user = buildUser();

        mockChat.detectEmotion.mockResolvedValue(
          ServiceResult.success({ emotion, confidence: 0.85 })
        );

        mockAI.generateText.mockResolvedValue(
          ServiceResult.success({ text: 'Response', tokens: 30 })
        );

        const response = buildCoachMessage({ tone: expectedTone });
        mockChat.sendMessage.mockResolvedValue(ServiceResult.success(response));

        const result = await coachService.sendMessage(userMessage, user);

        expect(result.value?.tone).toBe(expectedTone);
      });
    });
  });

  describe('Content Moderation', () => {
    it('should reject inappropriate user messages', async () => {
      const inappropriateMessage = 'Some inappropriate content here';
      const user = buildUser();

      mockAI.moderateContent.mockResolvedValue(
        ServiceResult.success({
          isSafe: false,
          flags: ['violence', 'harassment'],
        })
      );

      const result = await coachService.sendMessage(inappropriateMessage, user);

      expect(result.isSuccess).toBe(false);
      expect(result.error?.code).toBe('CONTENT_VIOLATION');
      expect(mockChat.sendMessage).not.toHaveBeenCalled();
    });

    it('should filter AI responses that fail moderation', async () => {
      const userMessage = 'Normal message';
      const user = buildUser();

      mockChat.detectEmotion.mockResolvedValue(
        ServiceResult.success({ emotion: 'neutral', confidence: 0.8 })
      );

      // First AI attempt returns inappropriate content
      mockAI.generateText
        .mockResolvedValueOnce(
          ServiceResult.success({
            text: 'Inappropriate AI response',
            tokens: 30,
          })
        )
        .mockResolvedValueOnce(
          ServiceResult.success({
            text: 'Safe AI response',
            tokens: 35,
          })
        );

      mockAI.moderateContent
        .mockResolvedValueOnce(
          ServiceResult.success({ isSafe: true, flags: [] }) // User message is safe
        )
        .mockResolvedValueOnce(
          ServiceResult.success({ isSafe: false, flags: ['inappropriate'] }) // First AI response is not
        )
        .mockResolvedValueOnce(
          ServiceResult.success({ isSafe: true, flags: [] }) // Second AI response is safe
        );

      const response = buildCoachMessage({ content: 'Safe AI response' });
      mockChat.sendMessage.mockResolvedValue(ServiceResult.success(response));

      const result = await coachService.sendMessage(userMessage, user);

      expect(result.isSuccess).toBe(true);
      expect(result.value?.content).toBe('Safe AI response');
      expect(mockAI.generateText).toHaveBeenCalledTimes(2);
    });
  });

  describe('Conversation Management', () => {
    it('should load conversation history on initialization', async () => {
      const history = [
        buildCoachMessage({ role: 'user', content: 'Hello' }),
        buildCoachMessage({ role: 'assistant', content: 'Hi there!' }),
      ];

      mockChat.getConversation.mockResolvedValue(
        ServiceResult.success(history)
      );

      const result = await coachService.loadConversationHistory();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(history);
      expect(mockStorage.get).toHaveBeenCalledWith('@next_chapter/coach_conversation');
    });

    it('should clear conversation and storage', async () => {
      mockChat.clearConversation.mockResolvedValue(ServiceResult.success(undefined));
      mockStorage.remove.mockResolvedValue(ServiceResult.success(undefined));

      const result = await coachService.clearConversation();

      expect(result.isSuccess).toBe(true);
      expect(mockChat.clearConversation).toHaveBeenCalled();
      expect(mockStorage.remove).toHaveBeenCalledWith('@next_chapter/coach_conversation');
      expect(mockAnalytics.track).toHaveBeenCalledWith('coach_conversation_cleared', {});
    });
  });

  describe('Crisis Detection', () => {
    const crisisKeywords = [
      'want to die',
      'kill myself',
      'end it all',
      'no point in living',
    ];

    crisisKeywords.forEach(keyword => {
      it(`should detect crisis indicator: "${keyword}"`, async () => {
        const user = buildUser();

        mockChat.detectEmotion.mockResolvedValue(
          ServiceResult.success({ emotion: 'crisis', confidence: 0.95 })
        );

        const result = await coachService.sendMessage(
          `I just ${keyword}`,
          user
        );

        expect(result.isSuccess).toBe(true);
        expect(result.value?.isCrisis).toBe(true);
        expect(result.value?.crisisResources).toBeDefined();
        expect(mockAnalytics.track).toHaveBeenCalledWith(
          'crisis_detected',
          expect.any(Object)
        );
      });
    });

    it('should include crisis resources in response', async () => {
      const userMessage = "I don't want to live anymore";
      const user = buildUser();

      mockChat.detectEmotion.mockResolvedValue(
        ServiceResult.success({ emotion: 'crisis', confidence: 0.98 })
      );

      mockAI.generateText.mockResolvedValue(
        ServiceResult.success({
          text: "I'm deeply concerned about what you're sharing...",
          tokens: 40,
        })
      );

      const response = buildCoachMessage({
        content: "I'm deeply concerned about what you're sharing...",
        isCrisis: true,
        crisisResources: [
          {
            name: 'National Suicide Prevention Lifeline',
            phone: '988',
            available: '24/7',
          },
        ],
      });

      mockChat.sendMessage.mockResolvedValue(ServiceResult.success(response));

      const result = await coachService.sendMessage(userMessage, user);

      expect(result.value?.crisisResources).toHaveLength(1);
      expect(result.value?.crisisResources?.[0].phone).toBe('988');
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const user = buildUser();

      // Simulate reaching rate limit
      for (let i = 0; i < 10; i++) {
        mockChat.detectEmotion.mockResolvedValue(
          ServiceResult.success({ emotion: 'neutral', confidence: 0.8 })
        );
        mockAI.generateText.mockResolvedValue(
          ServiceResult.success({ text: `Response ${i}`, tokens: 30 })
        );
        mockChat.sendMessage.mockResolvedValue(
          ServiceResult.success(buildCoachMessage())
        );

        await coachService.sendMessage(`Message ${i}`, user);
      }

      // 11th message should be rate limited
      const result = await coachService.sendMessage('One more message', user);

      expect(result.isSuccess).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMIT');
    });

    it('should track token usage', async () => {
      const user = buildUser();

      mockChat.detectEmotion.mockResolvedValue(
        ServiceResult.success({ emotion: 'neutral', confidence: 0.8 })
      );

      mockAI.generateText.mockResolvedValue(
        ServiceResult.success({ text: 'Response', tokens: 150 })
      );

      mockChat.sendMessage.mockResolvedValue(
        ServiceResult.success(buildCoachMessage())
      );

      await coachService.sendMessage('Test', user);

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'coach_tokens_used',
        expect.objectContaining({
          tokens: 150,
        })
      );
    });
  });
});