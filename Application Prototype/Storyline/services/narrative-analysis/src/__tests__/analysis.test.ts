import { analyzeStory, analyzeTextCraft } from '../analysis';
import * as memoryClient from '../memoryClient';
import TextStatistics from 'text-statistics';

// Mock external dependencies
jest.mock('../memoryClient');
jest.mock('text-statistics');

describe('Narrative Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock memory client responses
    (memoryClient.queryMemory as jest.Mock).mockResolvedValue(
      `This is a story about John, who met Jane in Paris. John was happy, but then he lost his job. Jane helped him find a new one, and they lived happily ever after.`
    );
    (memoryClient.getGraphEntities as jest.Mock).mockImplementation((entity) => {
      if (entity === 'John') return ['Jane', 'Paris'];
      return [];
    });

    // Mock TextStatistics methods
    (TextStatistics as jest.Mock).mockImplementation(() => ({
      fleschKincaid: jest.fn().mockReturnValue(70.5),
      gunningFog: jest.fn().mockReturnValue(8.2),
      colemanLiau: jest.fn().mockReturnValue(10.1),
      smog: jest.fn().mockReturnValue(9.5),
      automatedReadabilityIndex: jest.fn().mockReturnValue(7.8),
    }));
  });

  describe('analyzeStory', () => {
    it('should analyze a story and return character and structure analysis', async () => {
      const storyId = 'test-story-1';
      const analysis = await analyzeStory(storyId);

      expect(analysis).toBeDefined();
      expect(analysis.storyId).toBe(storyId);
      expect(analysis.characterAnalysis).toBeDefined();
      expect(analysis.structureAnalysis).toBeDefined();

      // Character Arc Tracking assertions
      expect(analysis.characterAnalysis.protagonist).toBe('John');
      expect(analysis.characterAnalysis.emotionalJourney).toBe('Starts happy, faces challenge, finds happiness');
      expect(analysis.characterAnalysis.relationships).toEqual(['Jane', 'Paris']);

      // Story Structure Detection assertions
      expect(analysis.structureAnalysis.incitingIncident).toBe('John lost his job.');
      expect(analysis.structureAnalysis.risingAction).toBe('Jane helped him find a new one.');
      expect(analysis.structureAnalysis.climax).toBe('They lived happily ever after.');
      expect(analysis.structureAnalysis.threeActStructure.act1).toBe('Introduction of John and Jane in Paris.');
    });

    it('should handle empty story content gracefully', async () => {
      (memoryClient.queryMemory as jest.Mock).mockResolvedValue('');
      const storyId = 'empty-story';
      const analysis = await analyzeStory(storyId);

      expect(analysis).toBeDefined();
      expect(analysis.storyId).toBe(storyId);
      // Expect default or empty analysis for character and structure
      expect(analysis.characterAnalysis.protagonist).toBeUndefined(); // Or null/empty based on actual implementation
    });
  });

  describe('analyzeTextCraft', () => {
    it('should analyze text for readability scores', async () => {
      const text = 'This is a simple sentence.';
      const analysis = await analyzeTextCraft(text);

      expect(TextStatistics).toHaveBeenCalledWith(text);
      expect(analysis.readability).toBeDefined();
      expect(analysis.readability.fleschKincaid).toBe(70.5);
      expect(analysis.readability.gunningFog).toBe(8.2);
    });

    it('should return placeholder style and tone analysis', async () => {
      const text = 'This is a test for style and tone.';
      const analysis = await analyzeTextCraft(text);

      expect(analysis.styleTone).toBeDefined();
      expect(analysis.styleTone.style).toBe('neutral');
      expect(analysis.styleTone.tone).toBe('informative');
      expect(analysis.styleTone.sentiment).toBe('neutral');
    });

    it('should handle empty text for craft analysis', async () => {
      const text = '';
      const analysis = await analyzeTextCraft(text);

      expect(analysis.readability).toBeDefined();
      expect(analysis.styleTone).toBeDefined();
      // Expect specific values for empty text, e.g., 0 or NaN for scores
      expect(analysis.readability.fleschKincaid).toBe(70.5); // Mocked value
    });
  });
});