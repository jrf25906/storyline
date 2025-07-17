import { SecureOpenAIService } from '../openaiSecure';
import { EnvironmentService } from '../../security/environment';

// Mock fetch
global.fetch = jest.fn();

// Mock environment service
jest.mock('../../security/environment');

describe('SecureOpenAIService', () => {
  let secureOpenAI: SecureOpenAIService;
  let mockEnvironmentService: jest.Mocked<EnvironmentService>;

  beforeEach(() => {
    mockEnvironmentService = {
      getOpenAIConfig: jest.fn(),
      isInitialized: jest.fn(),
      initialize: jest.fn(),
    } as any;

    secureOpenAI = new SecureOpenAIService(mockEnvironmentService);
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('sendMessage', () => {
    const mockMessages = [
      { role: 'user' as const, content: 'I feel hopeless about finding a job' },
    ];

    it('should send message with secure API key', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'secure-openai-key',
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: "You've got this! Let's turn this around.",
              },
            },
          ],
          usage: {
            total_tokens: 50,
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await secureOpenAI.sendMessage(mockMessages, 'hype');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer secure-openai-key',
          }),
        })
      );

      expect(result).toEqual({
        message: "You've got this! Let's turn this around.",
        tone: 'hype',
        tokenCount: 50,
      });
    });

    it('should auto-initialize if not initialized', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(false);
      mockEnvironmentService.initialize.mockResolvedValue();
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'secure-openai-key',
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 30 },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await secureOpenAI.sendMessage(mockMessages);

      expect(mockEnvironmentService.initialize).toHaveBeenCalled();
    });

    it('should never include financial data in prompts', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'secure-openai-key',
      });

      const sensitiveMessages = [
        {
          role: 'user' as const,
          content: 'My bank account has $5000 and my SSN is 123-45-6789',
        },
      ];

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 30 },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await secureOpenAI.sendMessage(sensitiveMessages);

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );

      // Check that financial data was redacted
      expect(callBody.messages[1].content).not.toContain('$5000');
      expect(callBody.messages[1].content).not.toContain('123-45-6789');
      expect(callBody.messages[1].content).toContain('[REDACTED]');
    });

    it('should handle API errors gracefully', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'secure-openai-key',
      });

      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(secureOpenAI.sendMessage(mockMessages)).rejects.toThrow(
        'OpenAI API error: 429'
      );
    });

    it('should implement rate limiting', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'secure-openai-key',
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 30 },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Reset rate limit and set to just before limit
      secureOpenAI.resetRateLimit();
      
      // Simulate reaching rate limit
      for (let i = 0; i < 10; i++) {
        secureOpenAI.resetRateLimit(); // Reset timing to avoid rapid fire check
        await secureOpenAI.sendMessage(mockMessages);
      }

      // 11th request should be rate limited
      // Manually set the count to 10 and proper timestamp to trigger daily limit
      (secureOpenAI as any).dailyMessageCount = 10;
      (secureOpenAI as any).lastMessageTime = Date.now() - 3000; // 3 seconds ago to avoid rapid fire
      
      await expect(secureOpenAI.sendMessage(mockMessages)).rejects.toThrow(
        'Rate limit exceeded. Please try again later.'
      );
    });

    it('should detect and handle crisis keywords', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'secure-openai-key',
      });

      const crisisMessages = [
        {
          role: 'user' as const,
          content: 'I want to end it all',
        },
      ];

      const result = await secureOpenAI.sendMessage(crisisMessages);

      // Should return crisis response without calling API
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.message).toContain('crisis support');
      expect(result.message).toContain('988');
    });

    it('should apply content moderation', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'secure-openai-key',
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Response with inappropriate content [expletive]',
              },
            },
          ],
          usage: { total_tokens: 30 },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await secureOpenAI.sendMessage(mockMessages);

      // Should filter inappropriate content
      expect(result.message).not.toContain('[expletive]');
    });
  });

  describe('detectTone', () => {
    it('should detect hype tone triggers', async () => {
      const message = "I feel hopeless and like I'm a failure";
      const tone = await secureOpenAI.detectTone(message);
      expect(tone).toBe('hype');
    });

    it('should detect tough-love tone triggers', async () => {
      const message = "They screwed me over, this is rigged";
      const tone = await secureOpenAI.detectTone(message);
      expect(tone).toBe('tough-love');
    });

    it('should default to pragmatist tone', async () => {
      const message = "I need help updating my resume";
      const tone = await secureOpenAI.detectTone(message);
      expect(tone).toBe('pragmatist');
    });
  });

  describe('validateApiKey', () => {
    it('should validate API key format', async () => {
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'sk-proj-abcdef123456789012345678901234567890',
      });

      const isValid = await secureOpenAI.validateApiKey();
      expect(isValid).toBe(true);
    });

    it('should reject invalid API key format', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'invalid-key',
      });

      const isValid = await secureOpenAI.validateApiKey();
      expect(isValid).toBe(false);
    });

    it('should handle missing API key', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: '',
      });

      const isValid = await secureOpenAI.validateApiKey();
      expect(isValid).toBe(false);
    });
  });

  describe('Token management', () => {
    it('should track token usage', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'secure-openai-key',
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 100 },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await secureOpenAI.sendMessage([
        { role: 'user' as const, content: 'Test' },
      ]);

      const usage = await secureOpenAI.getTokenUsage();
      expect(usage.dailyTokens).toBe(100);
    });

    it('should enforce token limits', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getOpenAIConfig.mockResolvedValue({
        apiKey: 'secure-openai-key',
      });

      // Set high token usage
      await secureOpenAI.setTokenUsage(3900);

      const longMessage = 'x'.repeat(13000); // Would exceed 4000 token limit
      
      await expect(
        secureOpenAI.sendMessage([
          { role: 'user' as const, content: longMessage },
        ])
      ).rejects.toThrow('Message too long. Please shorten your message.');
    });
  });
});