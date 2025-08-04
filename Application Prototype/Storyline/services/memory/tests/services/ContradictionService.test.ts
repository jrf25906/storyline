import { ContradictionService } from '../../src/services/ContradictionService';
import { VectorStorageService } from '../../src/services/VectorStorageService';
import { GraphStorageService } from '../../src/services/GraphStorageService';
import { ExtendedMemory } from '../../src/types';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');
jest.mock('../../src/services/VectorStorageService');
jest.mock('../../src/services/GraphStorageService');

describe('ContradictionService', () => {
  let contradictionService: ContradictionService;
  let mockVectorService: jest.Mocked<VectorStorageService>;
  let mockGraphService: jest.Mocked<GraphStorageService>;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockMemory: ExtendedMemory = {
    id: 'memory-1',
    userId: 'user-123',
    content: 'I felt angry about the situation with my father.',
    embedding: [],
    type: 'emotion',
    documentIds: ['doc-1'],
    timestamp: new Date('2025-01-15'),
    relevance: 1.0,
    contradictions: [],
    versions: [{
      id: 'version-1',
      timestamp: new Date('2025-01-15'),
      emotionalTone: 'anger',
      content: 'I felt angry about the situation with my father.',
      context: 'current reflection',
      narrativeElements: {
        characters_mentioned: ['father'],
        theme: 'family_conflict',
        conflict_type: 'interpersonal',
      },
      confidence: 1.0,
    }],
    activeVersion: 'version-1',
    userPreference: 'latest',
    narrativeAnalysis: {
      character_development_stage: 'development',
      plot_progression: 0.6,
      theme_consistency: 0.8,
      emotional_arc: 'anger',
      story_coherence: 0.7,
    },
    privacyLevel: 'private',
    encryptionRequired: false,
  };

  const mockSimilarMemory: ExtendedMemory = {
    id: 'memory-2',
    userId: 'user-123',
    content: 'I felt grateful for my father\'s guidance during that time.',
    embedding: [],
    type: 'emotion',
    documentIds: ['doc-1'],
    timestamp: new Date('2025-01-01'),
    relevance: 0.9,
    contradictions: [],
    versions: [{
      id: 'version-2',
      timestamp: new Date('2025-01-01'),
      emotionalTone: 'gratitude',
      content: 'I felt grateful for my father\'s guidance during that time.',
      context: 'initial memory',
      narrativeElements: {
        characters_mentioned: ['father'],
        theme: 'family_support',
        conflict_type: undefined,
      },
      confidence: 1.0,
    }],
    activeVersion: 'version-2',
    userPreference: 'latest',
    narrativeAnalysis: {
      character_development_stage: 'introduction',
      plot_progression: 0.2,
      theme_consistency: 0.9,
      emotional_arc: 'gratitude',
      story_coherence: 0.8,
    },
    privacyLevel: 'private',
    encryptionRequired: false,
  };

  beforeEach(() => {
    mockVectorService = new VectorStorageService() as jest.Mocked<VectorStorageService>;
    mockGraphService = new GraphStorageService() as jest.Mocked<GraphStorageService>;
    mockOpenAI = new OpenAI() as jest.Mocked<OpenAI>;

    // Mock OpenAI constructor
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);

    contradictionService = new ContradictionService(mockVectorService, mockGraphService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectContradictions', () => {
    it('should detect no contradictions when no similar memories exist', async () => {
      mockVectorService.findSimilarMemories.mockResolvedValue([]);

      const result = await contradictionService.detectContradictions(mockMemory);

      expect(result.contradictions).toHaveLength(0);
      expect(result.confidence).toBe(1.0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should detect emotional contradictions', async () => {
      mockVectorService.findSimilarMemories.mockResolvedValue([mockSimilarMemory]);

      const result = await contradictionService.detectContradictions(mockMemory);

      expect(result.contradictions.length).toBeGreaterThan(0);
      
      const emotionalContradiction = result.contradictions.find(c => c.type === 'emotion');
      expect(emotionalContradiction).toBeDefined();
      expect(emotionalContradiction?.description).toContain('anger');
      expect(emotionalContradiction?.description).toContain('gratitude');
      expect(emotionalContradiction?.severity).toBe('high'); // Because memories are 14 days apart
    });

    it('should generate appropriate suggestions for contradictions', async () => {
      mockVectorService.findSimilarMemories.mockResolvedValue([mockSimilarMemory]);

      // Mock OpenAI response for suggestions
      const mockCompletion = {
        choices: [{
          message: {
            content: JSON.stringify({
              suggestions: [{
                action: 'layer',
                reason: 'The emotional evolution shows personal growth',
                confidence: 0.8,
                narrativeImprovement: 'Demonstrates the complexity of family relationships',
              }],
            }),
          },
        }],
      };
      
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue(mockCompletion),
        },
      } as any;

      const result = await contradictionService.detectContradictions(mockMemory);

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].action).toBe('layer');
      expect(result.suggestions[0].confidence).toBe(0.8);
    });

    it('should handle factual contradictions via AI analysis', async () => {
      const factualContradictoryMemory: ExtendedMemory = {
        ...mockSimilarMemory,
        content: 'My father was never there for me during that difficult time.',
        versions: [{
          ...mockSimilarMemory.versions[0],
          content: 'My father was never there for me during that difficult time.',
          emotionalTone: 'abandonment',
        }],
      };

      mockVectorService.findSimilarMemories.mockResolvedValue([factualContradictoryMemory]);

      // Mock OpenAI response for factual contradictions
      const mockFactualResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              contradictions: [{
                type: 'fact',
                description: 'Contradictory statements about father\'s presence',
                severity: 'high',
                confidence: 0.9,
                evidence: 'One memory says father provided guidance, another says he was never there',
              }],
            }),
          },
        }],
      };

      mockOpenAI.chat = {
        completions: {
          create: jest.fn()
            .mockResolvedValueOnce(mockFactualResponse) // For factual contradictions
            .mockResolvedValueOnce({ // For suggestions
              choices: [{
                message: {
                  content: JSON.stringify({
                    suggestions: [{
                      action: 'explore',
                      reason: 'Need to clarify the timeline and circumstances',
                      confidence: 0.7,
                      narrativeImprovement: 'Resolving this will strengthen narrative coherence',
                    }],
                  }),
                },
              }],
            }),
        },
      } as any;

      const result = await contradictionService.detectContradictions(mockMemory);

      const factualContradiction = result.contradictions.find(c => c.type === 'fact');
      expect(factualContradiction).toBeDefined();
      expect(factualContradiction?.confidence).toBe(0.9);
      expect(factualContradiction?.severity).toBe('high');
    });

    it('should handle character contradictions', async () => {
      const characterContradictoryMemory: ExtendedMemory = {
        ...mockSimilarMemory,
        content: 'My father was always aggressive and hostile during our conversations.',
        versions: [{
          ...mockSimilarMemory.versions[0],
          content: 'My father was always aggressive and hostile during our conversations.',
          narrativeElements: {
            characters_mentioned: ['father'],
            theme: 'family_conflict',
          },
        }],
      };

      mockVectorService.findSimilarMemories.mockResolvedValue([characterContradictoryMemory]);

      // Mock OpenAI response for character contradictions
      const mockCharacterResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              contradictions: [{
                type: 'character',
                description: 'Inconsistent portrayal of father\'s behavior',
                severity: 'medium',
                confidence: 0.75,
              }],
            }),
          },
        }],
      };

      mockOpenAI.chat = {
        completions: {
          create: jest.fn()
            .mockResolvedValueOnce({ choices: [{ message: { content: '{"contradictions": []}' } }] }) // Factual
            .mockResolvedValueOnce(mockCharacterResponse) // Character
            .mockResolvedValueOnce({ // Suggestions
              choices: [{
                message: {
                  content: JSON.stringify({
                    suggestions: [{
                      action: 'layer',
                      reason: 'Complex characters can have multiple facets',
                      confidence: 0.6,
                      narrativeImprovement: 'Shows character complexity',
                    }],
                  }),
                },
              }],
            }),
        },
      } as any;

      const result = await contradictionService.detectContradictions(mockMemory);

      const characterContradiction = result.contradictions.find(c => c.type === 'character');
      expect(characterContradiction).toBeDefined();
      expect(characterContradiction?.description).toContain('father');
    });

    it('should filter contradictions below confidence threshold', async () => {
      const lowConfidenceMemory: ExtendedMemory = {
        ...mockSimilarMemory,
        versions: [{
          ...mockSimilarMemory.versions[0],
          emotionalTone: 'mild_concern', // Less contradictory
        }],
      };

      mockVectorService.findSimilarMemories.mockResolvedValue([lowConfidenceMemory]);

      const result = await contradictionService.detectContradictions(mockMemory);

      // Should have fewer or no contradictions due to lower confidence
      expect(result.contradictions.length).toBeLessThanOrEqual(1);
    });

    it('should handle timeline contradictions', async () => {
      const timelineMemory: ExtendedMemory = {
        ...mockMemory,
        content: 'This happened before I was born, when my father was young.',
        timestamp: new Date('2025-01-20'), // 5 days later
      };

      const oldMemory: ExtendedMemory = {
        ...mockSimilarMemory,
        content: 'This was after I graduated college, during my father\'s later years.',
        timestamp: new Date('2024-12-01'), // Much earlier
      };

      mockVectorService.findSimilarMemories.mockResolvedValue([oldMemory]);

      const result = await contradictionService.detectContradictions(timelineMemory);

      const timelineContradiction = result.contradictions.find(c => c.type === 'timeline');
      expect(timelineContradiction).toBeDefined();
      expect(timelineContradiction?.description).toContain('Timeline inconsistency');
    });
  });

  describe('error handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockVectorService.findSimilarMemories.mockResolvedValue([mockSimilarMemory]);
      
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('OpenAI API error')),
        },
      } as any;

      const result = await contradictionService.detectContradictions(mockMemory);

      // Should still detect emotional contradictions (non-AI based)
      expect(result.contradictions.length).toBeGreaterThan(0);
      const emotionalContradiction = result.contradictions.find(c => c.type === 'emotion');
      expect(emotionalContradiction).toBeDefined();
    });

    it('should handle malformed AI responses', async () => {
      mockVectorService.findSimilarMemories.mockResolvedValue([mockSimilarMemory]);

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'invalid json response',
              },
            }],
          }),
        },
      } as any;

      const result = await contradictionService.detectContradictions(mockMemory);

      // Should still work with non-AI based contradiction detection
      expect(result).toBeDefined();
      expect(result.contradictions).toBeDefined();
    });
  });

  describe('resolveContradiction', () => {
    it('should resolve contradiction successfully', async () => {
      await expect(
        contradictionService.resolveContradiction('memory-1', 'contradiction-1', 'layer')
      ).resolves.not.toThrow();
    });
  });

  describe('getContradictionStats', () => {
    it('should return contradiction statistics', async () => {
      const stats = await contradictionService.getContradictionStats('user-123');

      expect(stats).toHaveProperty('totalContradictions');
      expect(stats).toHaveProperty('resolvedContradictions');
      expect(stats).toHaveProperty('pendingContradictions');
      expect(stats).toHaveProperty('contradictionTypes');
    });
  });
});