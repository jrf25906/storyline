import { CharacterAnalysisService } from '../../src/services/CharacterAnalysisService';
import { AIProviderService } from '../../src/services/AIProviderService';
import { CharacterRole, CharacterArcType } from '../../src/types';

jest.mock('../../src/services/AIProviderService');

describe('CharacterAnalysisService', () => {
  let characterService: CharacterAnalysisService;
  let mockAIProvider: jest.Mocked<AIProviderService>;

  beforeEach(() => {
    mockAIProvider = new AIProviderService() as jest.Mocked<AIProviderService>;
    characterService = new CharacterAnalysisService(mockAIProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeCharacters', () => {
    const sampleContent = `
      Sarah was a determined young woman who had spent her entire life in the small village of Millhaven.
      She worked at her father's bakery, but dreamed of adventure beyond the rolling hills.
      When the mysterious merchant Marcus arrived with tales of ancient treasures, Sarah's curiosity was piqued.
      Despite her father's protests, she decided to join Marcus on his quest.
      Along the way, she discovered not only hidden courage but also that Marcus had been testing her all along.
      He was actually a wizard who had been searching for someone worthy to inherit his magical knowledge.
      Sarah returned home transformed, not just by her adventure, but by the magical abilities she had gained.
    `;

    it('should identify and analyze characters', async () => {
      // Mock character identification
      mockAIProvider.generateCompletion
        .mockResolvedValueOnce(JSON.stringify(['Sarah', 'Marcus']))
        // Mock individual character analysis for Sarah
        .mockResolvedValueOnce(JSON.stringify({
          name: 'Sarah',
          role: 'protagonist',
          arc: {
            type: 'positive',
            stages: [
              {
                name: 'Ordinary World',
                position: 10,
                completed: true,
                description: 'Working at bakery, dreaming of adventure'
              }
            ],
            completion: 85,
            clarity: 90,
            motivation: 'Seeking adventure and purpose',
            stakes: 'Personal growth and magical inheritance',
            obstacles: ['Father\'s disapproval', 'Unknown dangers']
          },
          development: {
            growth: 85,
            believability: 90,
            agency: 88,
            complexity: 75
          },
          consistency: 92,
          screenTime: 80,
          emotionalJourney: {
            startingEmotion: 'restless',
            endingEmotion: 'empowered',
            keyEmotionalBeats: [
              {
                position: 25,
                emotion: 'excited',
                intensity: 75,
                trigger: 'Meeting Marcus'
              }
            ],
            authenticity: 85
          }
        }))
        // Mock individual character analysis for Marcus
        .mockResolvedValueOnce(JSON.stringify({
          name: 'Marcus',
          role: 'mentor',
          arc: {
            type: 'flat',
            stages: [],
            completion: 70,
            clarity: 80,
            motivation: 'Finding worthy successor',
            stakes: 'Passing on magical knowledge',
            obstacles: ['Maintaining disguise']
          },
          development: {
            growth: 40,
            believability: 85,
            agency: 90,
            complexity: 80
          },
          consistency: 88,
          screenTime: 40,
          emotionalJourney: {
            startingEmotion: 'searching',
            endingEmotion: 'satisfied',
            keyEmotionalBeats: [],
            authenticity: 80
          }
        }))
        // Mock relationship analysis
        .mockResolvedValueOnce(JSON.stringify([
          {
            character1: 'Sarah',
            character2: 'Marcus',
            type: 'mentor',
            strength: 85,
            development: 90,
            conflict: false
          }
        ]));

      const result = await characterService.analyzeCharacters(
        sampleContent,
        'user123',
        'project456'
      );

      expect(result).toHaveLength(2);
      
      const sarah = result.find(char => char.name === 'Sarah');
      expect(sarah).toBeDefined();
      expect(sarah!.role).toBe(CharacterRole.PROTAGONIST);
      expect(sarah!.arc.type).toBe(CharacterArcType.POSITIVE);
      expect(sarah!.development.growth).toBe(85);
      expect(sarah!.relationships).toHaveLength(1);
      expect(sarah!.relationships[0].targetCharacter).toBe('Marcus');

      const marcus = result.find(char => char.name === 'Marcus');
      expect(marcus).toBeDefined();
      expect(marcus!.role).toBe('mentor');
      expect(marcus!.arc.type).toBe(CharacterArcType.FLAT);
    });

    it('should handle no characters found', async () => {
      mockAIProvider.generateCompletion.mockResolvedValueOnce(JSON.stringify([]));

      const result = await characterService.analyzeCharacters(sampleContent);

      expect(result).toHaveLength(0);
    });

    it('should handle AI provider errors', async () => {
      mockAIProvider.generateCompletion.mockRejectedValue(new Error('AI service down'));

      await expect(characterService.analyzeCharacters(sampleContent))
        .rejects.toThrow('AI service down');
    });

    it('should handle malformed character identification response', async () => {
      mockAIProvider.generateCompletion.mockResolvedValueOnce('not valid json');

      const result = await characterService.analyzeCharacters(sampleContent);

      expect(result).toHaveLength(0);
    });

    it('should handle malformed individual character analysis', async () => {
      mockAIProvider.generateCompletion
        .mockResolvedValueOnce(JSON.stringify(['Sarah']))
        .mockResolvedValueOnce('invalid json');

      const result = await characterService.analyzeCharacters(sampleContent);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sarah');
      expect(result[0].role).toBe(CharacterRole.MINOR); // fallback
      expect(result[0].arc.motivation).toBe('Analysis failed');
    });
  });

  describe('analyzeCharacterVoices', () => {
    it('should analyze character voice distinctiveness', async () => {
      const characters = ['Sarah', 'Marcus'];
      
      mockAIProvider.generateCompletion.mockResolvedValueOnce(JSON.stringify([
        {
          character: 'Sarah',
          distinctiveness: 75,
          consistency: 80,
          examples: ['"I want to see what\'s beyond these hills!"', '"This is my chance!"']
        },
        {
          character: 'Marcus',
          distinctiveness: 85,
          consistency: 90,
          examples: ['"Young one, adventure calls to those who dare."', '"Wisdom comes to those who seek it."']
        }
      ]));

      const result = await characterService.analyzeCharacterVoices('sample content', characters);

      expect(result).toHaveLength(2);
      expect(result[0].character).toBe('Sarah');
      expect(result[0].distinctiveness).toBe(75);
      expect(result[1].character).toBe('Marcus');
      expect(result[1].distinctiveness).toBe(85);
    });

    it('should handle voice analysis errors', async () => {
      mockAIProvider.generateCompletion.mockRejectedValue(new Error('Analysis failed'));

      const result = await characterService.analyzeCharacterVoices('content', ['Sarah']);

      expect(result).toHaveLength(1);
      expect(result[0].distinctiveness).toBe(50); // fallback
      expect(result[0].consistency).toBe(50);
      expect(result[0].examples).toEqual([]);
    });
  });

  describe('getCharacterRecommendations', () => {
    it('should generate recommendations for weak character development', async () => {
      const mockAnalysis = {
        id: 'char1',
        name: 'Sarah',
        role: CharacterRole.PROTAGONIST,
        arc: {
          type: CharacterArcType.POSITIVE,
          stages: [],
          completion: 45,
          clarity: 50,
          motivation: 'Unclear motivation',
          stakes: 'Low stakes',
          obstacles: []
        },
        development: {
          growth: 40,
          believability: 50,
          agency: 30,
          complexity: 35
        },
        relationships: [],
        consistency: 60,
        screenTime: 70,
        emotionalJourney: {
          startingEmotion: 'neutral',
          endingEmotion: 'neutral',
          keyEmotionalBeats: [],
          authenticity: 45
        }
      };

      mockAIProvider.generateCompletion.mockResolvedValueOnce(JSON.stringify([
        'Clarify Sarah\'s primary motivation for the story',
        'Increase her agency by having her make key decisions',
        'Develop more complex internal conflicts',
        'Add obstacles that test her character growth'
      ]));

      const recommendations = await characterService.getCharacterRecommendations(
        mockAnalysis,
        'sample content'
      );

      expect(recommendations).toHaveLength(4);
      expect(recommendations[0]).toContain('motivation');
      expect(recommendations[1]).toContain('agency');
    });
  });

  describe('checkCharacterConsistency', () => {
    it('should identify consistency issues', async () => {
      mockAIProvider.generateCompletion.mockResolvedValueOnce(JSON.stringify([
        {
          issue: 'Character changes eye color from blue to brown',
          location: 'Chapter 3 vs Chapter 7',
          severity: 'medium'
        },
        {
          issue: 'Personality shift without explanation',
          location: 'Middle section',
          severity: 'high'
        }
      ]));

      const result = await characterService.checkCharacterConsistency('content', 'Sarah');

      expect(result).toHaveLength(2);
      expect(result[0].issue).toContain('eye color');
      expect(result[0].severity).toBe('medium');
      expect(result[1].severity).toBe('high');
    });

    it('should handle no consistency issues', async () => {
      mockAIProvider.generateCompletion.mockResolvedValueOnce(JSON.stringify([]));

      const result = await characterService.checkCharacterConsistency('content', 'Sarah');

      expect(result).toHaveLength(0);
    });
  });
});