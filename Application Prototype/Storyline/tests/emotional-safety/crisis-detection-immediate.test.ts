import { CrisisDetectionService } from '../../services/crisis-detection/src/CrisisDetectionService';
import { EmergencyResponseService } from '../../services/crisis-detection/src/EmergencyResponseService';

describe('CRITICAL: Crisis Detection - Immediate Implementation', () => {
  let crisisService: CrisisDetectionService;
  let emergencyService: EmergencyResponseService;

  beforeEach(() => {
    crisisService = new CrisisDetectionService();
    emergencyService = new EmergencyResponseService();
  });

  describe('Suicide Risk Detection', () => {
    const criticalPhrases = [
      'I want to end my life',
      'I have a plan to kill myself',
      'Nobody would care if I died',
      'I bought pills to overdose',
      'This is my suicide note'
    ];

    test.each(criticalPhrases)(
      'MUST detect critical phrase: "%s"',
      async (phrase) => {
        const result = await crisisService.analyze(phrase);
        
        expect(result.riskLevel).toBe('critical');
        expect(result.immediateAction).toBe(true);
        expect(result.response.type).toBe('crisis-intervention');
        expect(result.resources).toContainEqual(
          expect.objectContaining({
            type: 'hotline',
            number: '988',
            available: '24/7'
          })
        );
      }
    );

    test('MUST trigger emergency protocol for imminent risk', async () => {
      const content = 'I\'m going to do it tonight at midnight';
      const result = await crisisService.analyze(content);
      
      expect(result.riskLevel).toBe('imminent');
      expect(result.protocol).toBe('emergency');
      expect(result.actions).toContain('notify-emergency-contact');
      expect(result.actions).toContain('priority-human-review');
    });
  });

  describe('Self-Harm Detection', () => {
    test('detects self-harm indicators', async () => {
      const phrases = [
        'I cut myself again',
        'The pain helps me feel',
        'I deserve to hurt'
      ];

      for (const phrase of phrases) {
        const result = await crisisService.analyze(phrase);
        expect(result.category).toContain('self-harm');
        expect(result.supportLevel).toBe('high');
      }
    });
  });

  describe('Response Appropriateness', () => {
    test('NEVER dismisses or minimizes crisis', async () => {
      const response = await emergencyService.generateResponse({
        content: 'I feel like ending it all',
        riskLevel: 'high'
      });

      const forbidden = [
        'cheer up',
        'it\'s not that bad',
        'others have it worse',
        'just think positive',
        'you\'re overreacting'
      ];

      for (const phrase of forbidden) {
        expect(response.toLowerCase()).not.toContain(phrase);
      }
    });

    test('provides immediate support without forcing', async () => {
      const response = await emergencyService.generateResponse({
        content: 'I don\'t want to talk to anyone',
        riskLevel: 'moderate'
      });

      expect(response).toContain('I\'m here');
      expect(response).toContain('when you\'re ready');
      expect(response).not.toContain('you must');
      expect(response).not.toContain('you have to');
    });
  });
});
