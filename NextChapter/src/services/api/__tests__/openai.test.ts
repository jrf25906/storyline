import { openAIService } from '@services/api/openai';
import { EMOTIONAL_TRIGGERS } from '@types/coach';

describe('OpenAIService', () => {
  describe('detectTone', () => {
    it('should detect hype tone for hopeless messages', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "You've got this! Every rejection brings you closer to your next opportunity." } }],
          usage: { total_tokens: 100 },
        }),
      };
      
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const response = await openAIService.sendMessage(
        [],
        'I feel so hopeless about finding a job'
      );
      
      expect(response.tone).toBe('hype');
      expect(response.isCrisis).toBe(false);
    });

    it('should detect tough-love tone for blame messages', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Let's be real: blaming others won't get you hired. Focus on what you can control." } }],
          usage: { total_tokens: 100 },
        }),
      };
      
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const response = await openAIService.sendMessage(
        [],
        "They screwed me over, it's not fair"
      );
      
      expect(response.tone).toBe('tough-love');
      expect(response.isCrisis).toBe(false);
    });

    it('should default to pragmatist tone', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Here's a practical approach: start with updating your resume today." } }],
          usage: { total_tokens: 100 },
        }),
      };
      
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const response = await openAIService.sendMessage(
        [],
        'I need help with my job search strategy'
      );
      
      expect(response.tone).toBe('pragmatist');
      expect(response.isCrisis).toBe(false);
    });
  });

  describe('crisis detection', () => {
    it('should detect crisis keywords and return crisis response', async () => {
      const response = await openAIService.sendMessage(
        [],
        'I want to end it all'
      );
      
      expect(response.isCrisis).toBe(true);
      expect(response.message).toContain('988');
      expect(response.message).toContain('Crisis Resources');
      expect(response.tokenCount).toBe(0);
    });

    it('should not make API call for crisis messages', async () => {
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy;
      
      await openAIService.sendMessage(
        [],
        "I'm thinking about suicide"
      );
      
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('content moderation', () => {
    it('should remove SSN patterns from responses', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Your SSN 123-45-6789 should not be shared.' } }],
          usage: { total_tokens: 100 },
        }),
      };
      
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const response = await openAIService.sendMessage(
        [],
        'How do I handle background checks?'
      );
      
      expect(response.message).toContain('[SSN REMOVED]');
      expect(response.message).not.toContain('123-45-6789');
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });
      
      await expect(
        openAIService.sendMessage([], 'Test message')
      ).rejects.toThrow('OpenAI API error: 429');
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(
        openAIService.sendMessage([], 'Test message')
      ).rejects.toThrow('Network error');
    });
  });
});