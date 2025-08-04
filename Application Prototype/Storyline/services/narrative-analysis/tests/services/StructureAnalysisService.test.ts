import { StructureAnalysisService } from '../../src/services/StructureAnalysisService';
import { AIProviderService } from '../../src/services/AIProviderService';
import { StoryFramework } from '../../src/types';

// Mock the AI Provider Service
jest.mock('../../src/services/AIProviderService');

describe('StructureAnalysisService', () => {
  let structureService: StructureAnalysisService;
  let mockAIProvider: jest.Mocked<AIProviderService>;

  beforeEach(() => {
    mockAIProvider = new AIProviderService() as jest.Mocked<AIProviderService>;
    structureService = new StructureAnalysisService(mockAIProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeStructure', () => {
    const sampleContent = `
      Once upon a time, there was a young woman named Sarah who lived in a small village.
      She had always dreamed of adventure, but her life was quiet and predictable.
      One day, a mysterious stranger arrived in town with news of a treasure hidden in the nearby mountains.
      Sarah decided to join the quest, despite the dangers.
      After many challenges and trials, she discovered not only the treasure but also her own courage.
      She returned home transformed, ready to embrace whatever adventures life might bring.
    `;

    it('should analyze structure with default framework', async () => {
      // Mock AI provider responses
      mockAIProvider.generateCompletion
        .mockResolvedValueOnce('Three-Act Structure') // framework detection
        .mockResolvedValueOnce(JSON.stringify({ // framework adherence
          confidence: 85,
          keyBeats: [
            { name: 'Hook', position: 5, present: true, strength: 90 },
            { name: 'Inciting Incident', position: 25, present: true, strength: 85 }
          ],
          missing: []
        }))
        .mockResolvedValueOnce(JSON.stringify([ // act analysis
          {
            act: 1,
            startPosition: 0,
            endPosition: 25,
            purpose: 'Setup and introduction',
            effectiveness: 85,
            keyEvents: ['Character introduction', 'Inciting incident']
          }
        ]))
        .mockResolvedValueOnce(JSON.stringify([ // plot points
          {
            type: 'inciting_incident',
            position: 25,
            description: 'Mysterious stranger arrives with treasure news',
            importance: 90,
            connected: true
          }
        ]))
        .mockResolvedValueOnce(JSON.stringify([ // conflicts
          {
            type: 'person_vs_self',
            intensity: 75,
            resolution: 'resolved',
            characters: ['Sarah'],
            escalation: [25, 50, 75]
          }
        ]))
        .mockResolvedValueOnce(JSON.stringify({ // structure pacing
          setup: 25,
          confrontation: 50,
          resolution: 25,
          balanced: true,
          recommendations: ['Good pacing overall']
        }));

      const result = await structureService.analyzeStructure(
        sampleContent,
        undefined,
        'user123',
        'project456'
      );

      expect(result).toBeDefined();
      expect(result.framework).toBe(StoryFramework.THREE_ACT);
      expect(result.adherence).toBe(85);
      expect(result.acts).toHaveLength(1);
      expect(result.plotPoints).toHaveLength(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.pacing.balanced).toBe(true);
    });

    it('should analyze structure with specified framework', async () => {
      mockAIProvider.generateCompletion
        .mockResolvedValueOnce(JSON.stringify({
          confidence: 75,
          keyBeats: [],
          missing: ['Call to Adventure']
        }))
        .mockResolvedValueOnce(JSON.stringify([]))
        .mockResolvedValueOnce(JSON.stringify([]))
        .mockResolvedValueOnce(JSON.stringify([]))
        .mockResolvedValueOnce(JSON.stringify({
          setup: 30,
          confrontation: 40,
          resolution: 30,
          balanced: false,
          recommendations: ['Consider adjusting pacing']
        }));

      const result = await structureService.analyzeStructure(
        sampleContent,
        StoryFramework.HEROS_JOURNEY
      );

      expect(result.framework).toBe(StoryFramework.HEROS_JOURNEY);
      expect(result.adherence).toBe(75);
    });

    it('should handle AI provider errors gracefully', async () => {
      mockAIProvider.generateCompletion.mockRejectedValue(new Error('AI service unavailable'));

      await expect(structureService.analyzeStructure(sampleContent))
        .rejects.toThrow('AI service unavailable');
    });

    it('should handle malformed AI responses', async () => {
      mockAIProvider.generateCompletion
        .mockResolvedValueOnce('Three-Act Structure')
        .mockResolvedValueOnce('invalid json response')
        .mockResolvedValueOnce(JSON.stringify([]))
        .mockResolvedValueOnce(JSON.stringify([]))
        .mockResolvedValueOnce(JSON.stringify([]))
        .mockResolvedValueOnce(JSON.stringify({
          setup: 25,
          confrontation: 50,
          resolution: 25,
          balanced: true,
          recommendations: []
        }));

      const result = await structureService.analyzeStructure(sampleContent);

      expect(result).toBeDefined();
      expect(result.detected.confidence).toBe(30); // Fallback value
    });
  });

  describe('getFrameworkRecommendations', () => {
    it('should generate recommendations for low adherence', async () => {
      const mockAnalysis = {
        framework: StoryFramework.THREE_ACT,
        detected: {
          framework: StoryFramework.THREE_ACT,
          confidence: 45,
          keyBeats: [],
          missing: ['Plot Point 1', 'Climax']
        },
        adherence: 45,
        pacing: {
          setup: 40,
          confrontation: 30,
          resolution: 30,
          balanced: false,
          recommendations: []
        },
        acts: [],
        plotPoints: [],
        conflicts: []
      };

      mockAIProvider.generateCompletion.mockResolvedValueOnce(JSON.stringify([
        'Add a clear Plot Point 1 to launch the main conflict',
        'Strengthen the climax with higher stakes',
        'Balance the pacing between acts'
      ]));

      const recommendations = await structureService.getFrameworkRecommendations(
        mockAnalysis,
        'sample content'
      );

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0]).toContain('Plot Point 1');
    });

    it('should handle AI errors in recommendations', async () => {
      const mockAnalysis = {
        framework: StoryFramework.THREE_ACT,
        detected: {
          framework: StoryFramework.THREE_ACT,
          confidence: 45,
          keyBeats: [],
          missing: []
        },
        adherence: 45,
        pacing: {
          setup: 25,
          confrontation: 50,
          resolution: 25,
          balanced: true,
          recommendations: []
        },
        acts: [],
        plotPoints: [],
        conflicts: []
      };

      mockAIProvider.generateCompletion.mockRejectedValue(new Error('AI error'));

      const recommendations = await structureService.getFrameworkRecommendations(
        mockAnalysis,
        'content'
      );

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0]).toContain('Unable to generate');
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', async () => {
      await expect(structureService.analyzeStructure(''))
        .rejects.toThrow();
    });

    it('should handle very short content', async () => {
      const shortContent = 'A short story.';
      
      mockAIProvider.generateCompletion
        .mockResolvedValueOnce('Three-Act Structure')
        .mockResolvedValue(JSON.stringify({
          confidence: 20,
          keyBeats: [],
          missing: ['Most structural elements']
        }));

      const result = await structureService.analyzeStructure(shortContent);
      expect(result.adherence).toBeLessThan(50);
    });

    it('should handle unsupported framework gracefully', async () => {
      const invalidFramework = 'invalid_framework' as StoryFramework;
      
      await expect(structureService.analyzeStructure('content', invalidFramework))
        .rejects.toThrow('Unsupported framework');
    });
  });
});