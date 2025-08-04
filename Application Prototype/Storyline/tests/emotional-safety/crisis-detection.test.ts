import { CrisisDetectionService } from '../../services/crisis-detection/src/CrisisDetectionService';
import { EmergencyResponseService } from '../../services/crisis-detection/src/EmergencyResponseService';

describe('CRITICAL: Crisis Detection System', () => {
  let crisisService: CrisisDetectionService;
  let emergencyService: EmergencyResponseService;

  beforeEach(() => {
    crisisService = new CrisisDetectionService();
    emergencyService = new EmergencyResponseService();
  });

  describe('Crisis Phrase Detection', () => {
    const criticalPhrases = [
      "I want to end it all",
      "I can't go on anymore",
      "There's no point in living",
      "I wish I wasn't here",
      "Everyone would be better off without me",
      "I'm thinking about ending my life",
      "I have a plan to hurt myself",
      "I don't want to wake up tomorrow"
    ];

    criticalPhrases.forEach(phrase => {
      it(`should detect crisis in: "${phrase}"`, async () => {
        const result = await crisisService.analyzeInput(phrase);
        expect(result.isCrisis).toBe(true);
        expect(result.severity).toBe('critical');
        expect(result.suggestedResponse).toBeDefined();
      });
    });

    const nonCrisisPhrases = [
      "I'm having a tough day",
      "I feel stressed about work",
      "I miss my family",
      "I'm disappointed with myself",
      "I feel lonely sometimes"
    ];

    nonCrisisPhrases.forEach(phrase => {
      it(`should NOT detect crisis in: "${phrase}"`, async () => {
        const result = await crisisService.analyzeInput(phrase);
        expect(result.isCrisis).toBe(false);
        expect(result.severity).toBe('none');
      });
    });
  });

  describe('Emergency Response', () => {
    it('should provide immediate support resources', async () => {
      const response = await emergencyService.getCrisisResources('US');
      
      expect(response).toHaveProperty('hotlines');
      expect(response.hotlines).toContainEqual(
        expect.objectContaining({
          name: '988 Suicide & Crisis Lifeline',
          number: '988',
          available: '24/7'
        })
      );
    });

    it('should provide location-specific resources', async () => {
      const usResources = await emergencyService.getCrisisResources('US');
      const ukResources = await emergencyService.getCrisisResources('UK');
      
      expect(usResources.hotlines[0].number).toBe('988');
      expect(ukResources.hotlines[0].number).toBe('116 123');
    });

    it('should trigger professional handoff for critical cases', async () => {
      const mockHandoff = jest.fn();
      emergencyService.onProfessionalHandoff = mockHandoff;

      await emergencyService.initiateHandoff({
        userId: 'test-user',
        severity: 'critical',
        context: 'User expressed immediate self-harm intent'
      });

      expect(mockHandoff).toHaveBeenCalledWith({
        userId: 'test-user',
        severity: 'critical',
        context: 'User expressed immediate self-harm intent'
      });
    });
  });

  describe('Response Timing', () => {
    it('should respond to crisis within 100ms', async () => {
      const start = Date.now();
      await crisisService.analyzeInput("I want to end my life");
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    it('should escalate to human support within 2 seconds', async () => {
      const start = Date.now();
      await emergencyService.escalateToHuman('test-user', 'critical');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('False Positive Prevention', () => {
    const contextualPhrases = [
      { input: "I want to end this chapter of my life", isCrisis: false },
      { input: "This movie makes me want to die laughing", isCrisis: false },
      { input: "I'm dying to see that concert", isCrisis: false },
      { input: "That workout killed me", isCrisis: false },
      { input: "I'd rather die than miss this opportunity", isCrisis: false }
    ];

    contextualPhrases.forEach(({ input, isCrisis }) => {
      it(`should correctly classify: "${input}" as crisis=${isCrisis}`, async () => {
        const result = await crisisService.analyzeInput(input);
        expect(result.isCrisis).toBe(isCrisis);
      });
    });
  });
});
