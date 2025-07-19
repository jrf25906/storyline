/**
 * Integration test to verify AI service setup
 */

import { CoachService } from '@services/ai/coachService';
import { COACH_PROMPTS, EMOTIONAL_TRIGGERS } from '@services/ai/coachPrompts';
import { APIKeyManager } from '@services/ai/apiKeyManager';

describe('AI Service Integration', () => {
  describe('Service Initialization', () => {
    it('should initialize CoachService singleton', () => {
      const instance1 = CoachService.getInstance();
      const instance2 = CoachService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Prompt Configuration', () => {
    it('should have all required coach tones', () => {
      expect(Object.keys(COACH_PROMPTS)).toEqual(['hype', 'pragmatist', 'toughLove']);
    });

    it('should have emotional triggers properly configured', () => {
      expect(EMOTIONAL_TRIGGERS.hype).toBeDefined();
      expect(EMOTIONAL_TRIGGERS.toughLove).toBeDefined();
      expect(Array.isArray(EMOTIONAL_TRIGGERS.hype)).toBe(true);
      expect(Array.isArray(EMOTIONAL_TRIGGERS.toughLove)).toBe(true);
    });
  });

  describe('API Key Management', () => {
    it('should validate API key format', () => {
      expect(APIKeyManager.validateKeyFormat('sk-1234567890')).toBe(true);
      expect(APIKeyManager.validateKeyFormat('invalid-key')).toBe(false);
      expect(APIKeyManager.validateKeyFormat('')).toBe(false);
    });
  });

  describe('Tone Detection Logic', () => {
    const testCases = [
      // Hype tone triggers
      { message: 'I feel hopeless about this job search', expectedTone: 'hype' },
      { message: "I'm completely lost and don't know what to do", expectedTone: 'hype' },
      { message: 'I feel like such a failure', expectedTone: 'hype' },
      { message: "I'm so burnt out from applying", expectedTone: 'hype' },
      
      // Tough-love tone triggers
      { message: "I'm too lazy to apply today", expectedTone: 'toughLove' },
      { message: 'They screwed me over at my last job', expectedTone: 'toughLove' },
      { message: 'No one will hire me because the system is rigged', expectedTone: 'toughLove' },
      { message: 'This is all a waste of time', expectedTone: 'toughLove' },
      
      // Pragmatist tone (default)
      { message: 'Can you help me update my resume?', expectedTone: 'pragmatist' },
      { message: "What's the best way to network?", expectedTone: 'pragmatist' },
      { message: 'I need interview tips', expectedTone: 'pragmatist' },
    ];

    it.each(testCases)('should detect $expectedTone tone for "$message"', ({ message, expectedTone }) => {
      // This test verifies the tone detection logic matches expected behavior
      const lowerMessage = message.toLowerCase();
      let detectedTone: 'hype' | 'toughLove' | 'pragmatist' = 'pragmatist';
      
      for (const trigger of EMOTIONAL_TRIGGERS.hype) {
        if (lowerMessage.includes(trigger)) {
          detectedTone = 'hype';
          break;
        }
      }
      
      if (detectedTone === 'pragmatist') {
        for (const trigger of EMOTIONAL_TRIGGERS.toughLove) {
          if (lowerMessage.includes(trigger)) {
            detectedTone = 'toughLove';
            break;
          }
        }
      }
      
      expect(detectedTone).toBe(expectedTone);
    });
  });

  describe('Coach Prompt Accuracy', () => {
    it('should meet 85% tone detection accuracy target', () => {
      const testMessages = [
        // Clear hype cases
        { message: 'I feel completely hopeless', expected: 'hype', weight: 1 },
        { message: "I'm so lost and confused", expected: 'hype', weight: 1 },
        { message: "I'm worthless", expected: 'hype', weight: 1 },
        { message: 'What a failure I am', expected: 'hype', weight: 1 },
        { message: "I'm burnt out", expected: 'hype', weight: 1 },
        
        // Clear tough-love cases
        { message: "I'm being lazy", expected: 'toughLove', weight: 1 },
        { message: 'They screwed me', expected: 'toughLove', weight: 1 },
        { message: 'No one will hire me', expected: 'toughLove', weight: 1 },
        { message: 'This is rigged against me', expected: 'toughLove', weight: 1 },
        
        // Edge cases (partial weight)
        { message: "I'm tired but hopeful", expected: 'pragmatist', weight: 0.5 },
        { message: "It's hard but I'm trying", expected: 'pragmatist', weight: 0.5 },
      ];
      
      let correctDetections = 0;
      let totalWeight = 0;
      
      testMessages.forEach(({ message, expected, weight }) => {
        const lowerMessage = message.toLowerCase();
        let detected: string = 'pragmatist';
        
        for (const trigger of EMOTIONAL_TRIGGERS.hype) {
          if (lowerMessage.includes(trigger)) {
            detected = 'hype';
            break;
          }
        }
        
        if (detected === 'pragmatist') {
          for (const trigger of EMOTIONAL_TRIGGERS.toughLove) {
            if (lowerMessage.includes(trigger)) {
              detected = 'toughLove';
              break;
            }
          }
        }
        
        if (detected === expected) {
          correctDetections += weight;
        }
        totalWeight += weight;
      });
      
      const accuracy = (correctDetections / totalWeight) * 100;
      expect(accuracy).toBeGreaterThanOrEqual(85);
    });
  });
});