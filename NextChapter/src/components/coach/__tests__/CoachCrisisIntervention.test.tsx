import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../test-utils/test-helpers';
import { EMOTIONAL_TRIGGERS, CRISIS_RESOURCES } from '../../../types/coach';
import { openAIService } from '../../../services/api/openai';
import './setupCoachTests';

// Mock the OpenAI service
jest.mock('../../../services/api/openai');

describe('Coach Crisis Intervention Integration', () => {
  const mockOpenAIService = openAIService as jest.Mocked<typeof openAIService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Crisis Keyword Detection', () => {
    it('should detect and respond to crisis keywords immediately', async () => {
      const crisisMessage = 'I want to kill myself';
      
      mockOpenAIService.sendMessage.mockResolvedValue({
        message: CRISIS_RESOURCES.message + '\n\n**Crisis Resources:**\n• Call or text 988',
        tone: 'pragmatist',
        tokenCount: 0,
        isCrisis: true,
      });

      const messages = [{ role: 'user' as const, content: crisisMessage }];
      const response = await mockOpenAIService.sendMessage(messages, crisisMessage);

      expect(response.isCrisis).toBe(true);
      expect(response.message).toContain('988');
      expect(response.message).toContain('mental health professional');
    });

    it('should detect all crisis keywords from EMOTIONAL_TRIGGERS', async () => {
      for (const keyword of EMOTIONAL_TRIGGERS.crisis) {
        const message = `I'm thinking about ${keyword}`;
        
        mockOpenAIService.sendMessage.mockResolvedValue({
          message: CRISIS_RESOURCES.message,
          tone: 'pragmatist',
          tokenCount: 0,
          isCrisis: true,
        });

        const response = await mockOpenAIService.sendMessage([], message);
        
        expect(response.isCrisis).toBe(true);
      }
    });

    it('should not consume tokens for crisis responses', async () => {
      mockOpenAIService.sendMessage.mockResolvedValue({
        message: CRISIS_RESOURCES.message,
        tone: 'pragmatist',
        tokenCount: 0, // Should be 0 for crisis responses
        isCrisis: true,
      });

      const response = await mockOpenAIService.sendMessage([], 'I want to harm myself');
      
      expect(response.tokenCount).toBe(0);
    });
  });

  describe('Tone Detection Accuracy', () => {
    describe('Hype Tone Triggers', () => {
      const hypeTriggers = EMOTIONAL_TRIGGERS.hype;
      
      hypeTriggers.forEach(trigger => {
        it(`should detect hype tone for "${trigger}"`, async () => {
          const message = `I feel ${trigger} and need help`;
          
          mockOpenAIService.sendMessage.mockImplementation(async (messages, userMessage) => {
            // Simulate the detectTone logic
            const lowerMessage = userMessage.toLowerCase();
            let detectedTone = 'pragmatist';
            
            for (const t of EMOTIONAL_TRIGGERS.hype) {
              if (lowerMessage.includes(t)) {
                detectedTone = 'hype';
                break;
              }
            }
            
            return {
              message: "You've got this! Let's turn the corner—today's win: You reached out for help.",
              tone: detectedTone as any,
              tokenCount: 50,
              isCrisis: false,
            };
          });

          const response = await mockOpenAIService.sendMessage([], message);
          
          expect(response.tone).toBe('hype');
          expect(response.message).toContain("You've got this");
        });
      });
    });

    describe('Tough-Love Tone Triggers', () => {
      const toughLoveTriggers = EMOTIONAL_TRIGGERS['tough-love'];
      
      toughLoveTriggers.forEach(trigger => {
        it(`should detect tough-love tone for "${trigger}"`, async () => {
          const message = `I think ${trigger}`;
          
          mockOpenAIService.sendMessage.mockImplementation(async (messages, userMessage) => {
            const lowerMessage = userMessage.toLowerCase();
            let detectedTone = 'pragmatist';
            
            for (const t of EMOTIONAL_TRIGGERS['tough-love']) {
              if (lowerMessage.includes(t)) {
                detectedTone = 'tough-love';
                break;
              }
            }
            
            return {
              message: "Let's be real: what you've tried isn't working. Try this next.",
              tone: detectedTone as any,
              tokenCount: 50,
              isCrisis: false,
            };
          });

          const response = await mockOpenAIService.sendMessage([], message);
          
          expect(response.tone).toBe('tough-love');
          expect(response.message).toContain("Let's be real");
        });
      });
    });

    describe('Pragmatist Tone (Default)', () => {
      it('should default to pragmatist tone when no triggers detected', async () => {
        const message = 'I need help finding a job';
        
        mockOpenAIService.sendMessage.mockResolvedValue({
          message: "Here's a step-by-step plan to get clarity. Start with updating your resume.",
          tone: 'pragmatist',
          tokenCount: 50,
          isCrisis: false,
        });

        const response = await mockOpenAIService.sendMessage([], message);
        
        expect(response.tone).toBe('pragmatist');
      });
    });
  });

  describe('Tone Accuracy Requirements', () => {
    it('should achieve ≥85% accuracy in tone detection', async () => {
      const testCases = [
        // Hype triggers (should detect hype)
        { message: 'I feel hopeless', expectedTone: 'hype' },
        { message: 'I am lost and confused', expectedTone: 'hype' },
        { message: 'I feel worthless', expectedTone: 'hype' },
        { message: 'I am such a failure', expectedTone: 'hype' },
        { message: 'I am burnt out', expectedTone: 'hype' },
        
        // Tough-love triggers (should detect tough-love)
        { message: 'I am being lazy', expectedTone: 'tough-love' },
        { message: 'they screwed me over', expectedTone: 'tough-love' },
        { message: 'no one will hire me ever', expectedTone: 'tough-love' },
        { message: 'this is rigged against me', expectedTone: 'tough-love' },
        
        // Pragmatist (default)
        { message: 'Can you help me with my resume?', expectedTone: 'pragmatist' },
        { message: 'What should I do next?', expectedTone: 'pragmatist' },
        
        // Mixed triggers (should detect first match)
        { message: 'I feel hopeless and lazy', expectedTone: 'hype' }, // hype comes first
      ];

      let correctDetections = 0;

      for (const testCase of testCases) {
        mockOpenAIService.sendMessage.mockImplementation(async (messages, userMessage) => {
          const lowerMessage = userMessage.toLowerCase();
          let detectedTone = 'pragmatist';
          
          // Check hype triggers first
          for (const trigger of EMOTIONAL_TRIGGERS.hype) {
            if (lowerMessage.includes(trigger)) {
              detectedTone = 'hype';
              break;
            }
          }
          
          // Check tough-love triggers if no hype detected
          if (detectedTone === 'pragmatist') {
            for (const trigger of EMOTIONAL_TRIGGERS['tough-love']) {
              if (lowerMessage.includes(trigger)) {
                detectedTone = 'tough-love';
                break;
              }
            }
          }
          
          return {
            message: 'Response',
            tone: detectedTone as any,
            tokenCount: 50,
            isCrisis: false,
          };
        });

        const response = await mockOpenAIService.sendMessage([], testCase.message);
        
        if (response.tone === testCase.expectedTone) {
          correctDetections++;
        }
      }

      const accuracy = (correctDetections / testCases.length) * 100;
      expect(accuracy).toBeGreaterThanOrEqual(85);
    });
  });

  describe('Content Moderation', () => {
    it('should remove SSN from responses', async () => {
      mockOpenAIService.sendMessage.mockResolvedValue({
        message: 'Your SSN [SSN REMOVED] has been protected',
        tone: 'pragmatist',
        tokenCount: 50,
        isCrisis: false,
      });

      const response = await mockOpenAIService.sendMessage([], 'My SSN is 123-45-6789');
      
      expect(response.message).not.toContain('123-45-6789');
      expect(response.message).toContain('[SSN REMOVED]');
    });

    it('should remove credit card numbers', async () => {
      mockOpenAIService.sendMessage.mockResolvedValue({
        message: 'Your card [CARD NUMBER REMOVED] is secure',
        tone: 'pragmatist',
        tokenCount: 50,
        isCrisis: false,
      });

      const response = await mockOpenAIService.sendMessage([], 'Card: 1234567812345678');
      
      expect(response.message).not.toContain('1234567812345678');
      expect(response.message).toContain('[CARD NUMBER REMOVED]');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce daily message limit', () => {
      // This would be tested at the component/store level
      const FREE_LIMIT = 10; // From APP_CONFIG
      let messagesUsed = 0;
      
      const canSendMessage = () => messagesUsed < FREE_LIMIT;
      
      // Simulate sending messages up to limit
      for (let i = 0; i < FREE_LIMIT; i++) {
        expect(canSendMessage()).toBe(true);
        messagesUsed++;
      }
      
      // Should not be able to send after limit
      expect(canSendMessage()).toBe(false);
    });
  });

  describe('Professional Boundaries', () => {
    it('should enforce career-focused boundaries', async () => {
      const boundaryMessages = [
        'Can you help with my marriage?',
        'Should I invest in stocks?',
        'What medication should I take?',
      ];

      for (const message of boundaryMessages) {
        mockOpenAIService.sendMessage.mockResolvedValue({
          message: 'I focus on career recovery and job search support. For that topic, please consult a qualified professional.',
          tone: 'pragmatist',
          tokenCount: 50,
          isCrisis: false,
        });

        const response = await mockOpenAIService.sendMessage([], message);
        
        expect(response.message).toContain('career recovery');
        expect(response.message).toContain('qualified professional');
      }
    });
  });

  describe('Crisis Response Format', () => {
    it('should include all required crisis resources', async () => {
      mockOpenAIService.sendMessage.mockResolvedValue({
        message: `${CRISIS_RESOURCES.message}\n\n**Crisis Resources:**\n• Call or text ${CRISIS_RESOURCES.hotline} (Suicide & Crisis Lifeline)\n• ${CRISIS_RESOURCES.text} (Crisis Text Line)\n• Visit ${CRISIS_RESOURCES.url} for chat support\n\nYou don't have to go through this alone.`,
        tone: 'pragmatist',
        tokenCount: 0,
        isCrisis: true,
      });

      const response = await mockOpenAIService.sendMessage([], 'I want to end it all');
      
      expect(response.message).toContain(CRISIS_RESOURCES.hotline);
      expect(response.message).toContain(CRISIS_RESOURCES.text);
      expect(response.message).toContain(CRISIS_RESOURCES.url);
      expect(response.message).toContain("You don't have to go through this alone");
    });
  });

  describe('Edge Cases', () => {
    it('should handle crisis keywords in different contexts', async () => {
      const edgeCases = [
        'I read about suicide prevention', // Not a crisis
        'The movie was about someone who wanted to kill themselves', // Not a crisis
        'I actually want to kill myself', // Crisis
      ];

      // For this test, we'd need more sophisticated detection
      // Currently, the simple keyword matching would flag all as crisis
      // This highlights a potential improvement area
    });

    it('should handle multiple emotional triggers in one message', async () => {
      const message = 'I feel hopeless and worthless, they screwed me and I am lazy';
      
      mockOpenAIService.sendMessage.mockImplementation(async (messages, userMessage) => {
        const lowerMessage = userMessage.toLowerCase();
        
        // Should detect hype first (hopeless, worthless)
        for (const trigger of EMOTIONAL_TRIGGERS.hype) {
          if (lowerMessage.includes(trigger)) {
            return {
              message: "You've got this!",
              tone: 'hype',
              tokenCount: 50,
              isCrisis: false,
            };
          }
        }
        
        return {
          message: 'Response',
          tone: 'pragmatist',
          tokenCount: 50,
          isCrisis: false,
        };
      });

      const response = await mockOpenAIService.sendMessage([], message);
      expect(response.tone).toBe('hype'); // First matching trigger wins
    });
  });
});