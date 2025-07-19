import { 
  COACH_PROMPTS, 
  EMOTIONAL_TRIGGERS, 
  CRISIS_KEYWORDS,
  BOUNDARY_KEYWORDS 
} from '@services/ai/coachPrompts';

describe('Coach Prompts', () => {
  describe('COACH_PROMPTS', () => {
    it('should have all required tones', () => {
      expect(COACH_PROMPTS.hype).toBeDefined();
      expect(COACH_PROMPTS.pragmatist).toBeDefined();
      expect(COACH_PROMPTS.toughLove).toBeDefined();
    });

    it('should have system prompts for each tone', () => {
      expect(COACH_PROMPTS.hype.systemPrompt).toContain('energetic');
      expect(COACH_PROMPTS.pragmatist.systemPrompt).toContain('practical');
      expect(COACH_PROMPTS.toughLove.systemPrompt).toContain('direct');
    });

    it('should have example responses for each tone', () => {
      expect(COACH_PROMPTS.hype.exampleResponses).toHaveLength(3);
      expect(COACH_PROMPTS.pragmatist.exampleResponses).toHaveLength(3);
      expect(COACH_PROMPTS.toughLove.exampleResponses).toHaveLength(3);
    });

    it('should maintain professional boundaries in all prompts', () => {
      Object.values(COACH_PROMPTS).forEach(prompt => {
        expect(prompt.systemPrompt).toContain('professional boundaries');
        expect(prompt.systemPrompt).toContain('career');
      });
    });

    it('should protect financial data in all prompts', () => {
      Object.values(COACH_PROMPTS).forEach(prompt => {
        expect(prompt.systemPrompt).toContain('financial data private');
      });
    });
  });

  describe('EMOTIONAL_TRIGGERS', () => {
    it('should have comprehensive hype triggers', () => {
      const hypeTriggers = EMOTIONAL_TRIGGERS.hype;
      expect(hypeTriggers).toContain('hopeless');
      expect(hypeTriggers).toContain('lost');
      expect(hypeTriggers).toContain('worthless');
      expect(hypeTriggers).toContain('failure');
      expect(hypeTriggers).toContain('burnt out');
    });

    it('should have comprehensive tough-love triggers', () => {
      const toughLoveTriggers = EMOTIONAL_TRIGGERS.toughLove;
      expect(toughLoveTriggers).toContain('lazy');
      expect(toughLoveTriggers).toContain('they screwed me');
      expect(toughLoveTriggers).toContain('no one will hire me');
      expect(toughLoveTriggers).toContain('this is rigged');
    });

    it('should not have overlapping triggers', () => {
      const hypeTriggers = new Set(EMOTIONAL_TRIGGERS.hype);
      const toughLoveTriggers = new Set(EMOTIONAL_TRIGGERS.toughLove);
      
      const overlap = [...hypeTriggers].filter(trigger => 
        toughLoveTriggers.has(trigger)
      );
      
      expect(overlap).toHaveLength(0);
    });
  });

  describe('CRISIS_KEYWORDS', () => {
    it('should include critical crisis indicators', () => {
      expect(CRISIS_KEYWORDS).toContain('suicide');
      expect(CRISIS_KEYWORDS).toContain('kill myself');
      expect(CRISIS_KEYWORDS).toContain('end it all');
      expect(CRISIS_KEYWORDS).toContain('harm myself');
    });

    it('should be lowercase for consistent matching', () => {
      CRISIS_KEYWORDS.forEach(keyword => {
        expect(keyword).toBe(keyword.toLowerCase());
      });
    });
  });

  describe('BOUNDARY_KEYWORDS', () => {
    it('should include various boundary topics', () => {
      expect(BOUNDARY_KEYWORDS).toContain('relationship advice');
      expect(BOUNDARY_KEYWORDS).toContain('medical');
      expect(BOUNDARY_KEYWORDS).toContain('therapy');
      expect(BOUNDARY_KEYWORDS).toContain('legal advice');
    });

    it('should be lowercase for consistent matching', () => {
      BOUNDARY_KEYWORDS.forEach(keyword => {
        expect(keyword).toBe(keyword.toLowerCase());
      });
    });
  });

  describe('Tone Examples', () => {
    it('hype examples should be energetic and encouraging', () => {
      COACH_PROMPTS.hype.exampleResponses.forEach(response => {
        const hasEncouragingPhrase = 
          response.includes("You've got this") ||
          response.includes('momentum') ||
          response.includes('Yes!');
        expect(hasEncouragingPhrase).toBe(true);
      });
    });

    it('pragmatist examples should be structured and practical', () => {
      COACH_PROMPTS.pragmatist.exampleResponses.forEach(response => {
        const hasStructuredPhrase = 
          response.includes('step-by-step') ||
          response.includes("Let's break") ||
          response.includes('Start with');
        expect(hasStructuredPhrase).toBe(true);
      });
    });

    it('tough-love examples should be direct and challenging', () => {
      COACH_PROMPTS.toughLove.exampleResponses.forEach(response => {
        const hasDirectPhrase = 
          response.includes("Let's be real") ||
          response.includes('excuse') ||
          response.includes('Brutal honesty');
        expect(hasDirectPhrase).toBe(true);
      });
    });
  });
});