import {
  CharacterAnalysis,
  CharacterRole,
  CharacterArc,
  CharacterArcType,
  CharacterDevelopment,
  CharacterRelationship,
  RelationshipType,
  EmotionalArc,
  EmotionalBeat,
  ArcStage,
  CharacterVoiceAnalysis,
} from '../types';
import { logger } from '../utils/logger';
import { AIProviderService } from './AIProviderService';

/**
 * Service for analyzing character development, relationships, and arcs
 * Focuses on character consistency, growth, and authenticity
 */
export class CharacterAnalysisService {
  private aiProvider: AIProviderService;

  constructor(aiProvider: AIProviderService) {
    this.aiProvider = aiProvider;
  }

  /**
   * Analyze all characters in the story content
   */
  async analyzeCharacters(
    content: string,
    userId?: string,
    projectId?: string
  ): Promise<CharacterAnalysis[]> {
    try {
      // First, identify all characters
      const characters = await this.identifyCharacters(content);
      
      // Analyze each character in detail
      const analyses = await Promise.all(
        characters.map(character => this.analyzeIndividualCharacter(content, character))
      );

      // Analyze relationships between characters
      const enhancedAnalyses = await this.analyzeCharacterRelationships(content, analyses);

      logger.info('Character analysis completed', {
        charactersFound: characters.length,
        contentLength: content.length,
        userId,
        projectId,
      });

      return enhancedAnalyses;

    } catch (error) {
      logger.error('Character analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: content.length,
      });
      throw error;
    }
  }

  /**
   * Identify all characters in the content
   */
  private async identifyCharacters(content: string): Promise<string[]> {
    const prompt = `
Identify all named characters in this story content. Include:
- Main characters (protagonist, antagonist, major supporting)
- Minor characters who have names and speaking roles
- Don't include background characters or unnamed people

Content:
${content.substring(0, 4000)}...

Respond with JSON array of character names only:
["Character Name 1", "Character Name 2", ...]`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 300,
        temperature: 0.1,
      });

      const characters = JSON.parse(response);
      return Array.isArray(characters) ? characters : [];

    } catch (error) {
      logger.error('Character identification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Analyze individual character in detail
   */
  private async analyzeIndividualCharacter(
    content: string,
    characterName: string
  ): Promise<CharacterAnalysis> {
    const prompt = `
Analyze the character "${characterName}" in this story content. Provide detailed analysis including:

1. Character Role (protagonist, antagonist, deuteragonist, supporting, minor, narrator)
2. Character Arc Type (positive, negative, flat, complex, fall, corruption, redemption)  
3. Character Development scores (0-100 for growth, believability, agency, complexity)
4. Character consistency throughout the story (0-100)
5. Approximate screen time (what percentage of the story features this character)
6. Emotional journey (starting emotion, ending emotion, key emotional beats)
7. Character arc stages and completion
8. Motivation, stakes, and obstacles

Content:
${content.substring(0, 5000)}...

Focus specifically on "${characterName}" and respond with JSON:
{
  "name": "${characterName}",
  "role": "protagonist|antagonist|deuteragonist|supporting|minor|narrator",
  "arc": {
    "type": "positive|negative|flat|complex|fall|corruption|redemption",
    "stages": [
      {
        "name": "Stage name",
        "position": 0-100,
        "completed": true/false,
        "description": "What happens in this stage"
      }
    ],
    "completion": 0-100,
    "clarity": 0-100,
    "motivation": "Character's primary motivation",
    "stakes": "What the character has to gain/lose",
    "obstacles": ["obstacle1", "obstacle2"]
  },
  "development": {
    "growth": 0-100,
    "believability": 0-100,
    "agency": 0-100,
    "complexity": 0-100
  },
  "consistency": 0-100,
  "screenTime": 0-100,
  "emotionalJourney": {
    "startingEmotion": "emotion",
    "endingEmotion": "emotion",
    "keyEmotionalBeats": [
      {
        "position": 0-100,
        "emotion": "emotion",
        "intensity": 0-100,
        "trigger": "what caused this emotion"
      }
    ],
    "authenticity": 0-100
  }
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 1200,
        temperature: 0.2,
      });

      const analysis = JSON.parse(response);
      
      return {
        id: `char_${Date.now()}_${Math.random()}`,
        name: characterName,
        role: analysis.role as CharacterRole,
        arc: analysis.arc as CharacterArc,
        development: analysis.development as CharacterDevelopment,
        relationships: [], // Will be filled in by relationship analysis
        consistency: analysis.consistency,
        screenTime: analysis.screenTime,
        emotionalJourney: analysis.emotionalJourney as EmotionalArc,
      };

    } catch (error) {
      logger.error('Individual character analysis failed', {
        character: characterName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return minimal character analysis on failure
      return {
        id: `char_${Date.now()}_${Math.random()}`,
        name: characterName,
        role: CharacterRole.MINOR,
        arc: {
          type: CharacterArcType.FLAT,
          stages: [],
          completion: 50,
          clarity: 50,
          motivation: 'Analysis failed',
          stakes: 'Unknown',
          obstacles: [],
        },
        development: {
          growth: 50,
          believability: 50,
          agency: 50,
          complexity: 50,
        },
        relationships: [],
        consistency: 50,
        screenTime: 10,
        emotionalJourney: {
          startingEmotion: 'neutral',
          endingEmotion: 'neutral',
          keyEmotionalBeats: [],
          authenticity: 50,
        },
      };
    }
  }

  /**
   * Analyze relationships between characters
   */
  private async analyzeCharacterRelationships(
    content: string,
    characters: CharacterAnalysis[]
  ): Promise<CharacterAnalysis[]> {
    if (characters.length < 2) {
      return characters;
    }

    const characterNames = characters.map(c => c.name);
    
    const prompt = `
Analyze the relationships between these characters in the story:
${characterNames.join(', ')}

For each meaningful relationship, identify:
1. Type of relationship (family, romantic, friendship, mentor, enemy, ally, rival, colleague)
2. Strength of relationship (0-100)
3. How the relationship develops over the story (0-100)
4. Whether there's conflict in the relationship

Content:
${content.substring(0, 4000)}...

Respond with JSON array of relationships:
[
  {
    "character1": "Character Name",
    "character2": "Character Name", 
    "type": "family|romantic|friendship|mentor|enemy|ally|rival|colleague",
    "strength": 0-100,
    "development": 0-100,
    "conflict": true/false
  }
]`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 800,
        temperature: 0.2,
      });

      const relationships = JSON.parse(response);

      // Add relationships to character analyses
      const updatedCharacters = characters.map(character => {
        const characterRelationships: CharacterRelationship[] = relationships
          .filter((rel: any) => 
            rel.character1 === character.name || rel.character2 === character.name
          )
          .map((rel: any) => ({
            targetCharacter: rel.character1 === character.name ? rel.character2 : rel.character1,
            type: rel.type as RelationshipType,
            strength: rel.strength,
            development: rel.development,
            conflict: rel.conflict,
          }));

        return {
          ...character,
          relationships: characterRelationships,
        };
      });

      return updatedCharacters;

    } catch (error) {
      logger.error('Character relationship analysis failed', {
        characterCount: characters.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return characters; // Return original analyses without relationships
    }
  }

  /**
   * Analyze character voice consistency and distinctiveness
   */
  async analyzeCharacterVoices(
    content: string,
    characters: string[]
  ): Promise<CharacterVoiceAnalysis[]> {
    const prompt = `
Analyze how distinctly each character speaks in this story. For each character, evaluate:

1. Voice distinctiveness (0-100): How unique is their speaking style?
2. Voice consistency (0-100): Do they speak the same way throughout?
3. Provide examples of their distinctive speech patterns

Characters to analyze: ${characters.join(', ')}

Content:
${content.substring(0, 4000)}...

Respond with JSON array:
[
  {
    "character": "Character Name",
    "distinctiveness": 0-100,
    "consistency": 0-100,
    "examples": ["Quote showing their voice", "Another example"]
  }
]`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 1000,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Character voice analysis failed', {
        characters: characters.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return characters.map(character => ({
        character,
        distinctiveness: 50,
        consistency: 50,
        examples: [],
      }));
    }
  }

  /**
   * Get character development recommendations
   */
  async getCharacterRecommendations(
    analysis: CharacterAnalysis,
    content: string
  ): Promise<string[]> {
    const prompt = `
Based on this character analysis, provide specific recommendations for improving "${analysis.name}":

Character Analysis:
- Role: ${analysis.role}
- Arc Type: ${analysis.arc.type}
- Arc Completion: ${analysis.arc.completion}%
- Character Growth: ${analysis.development.growth}%
- Believability: ${analysis.development.believability}%
- Agency: ${analysis.development.agency}%
- Consistency: ${analysis.consistency}%
- Screen Time: ${analysis.screenTime}%

Provide 3-5 specific, actionable recommendations for improving this character.
Focus on the areas with the lowest scores first.

Respond with JSON array of strings.`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 600,
        temperature: 0.3,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Character recommendations failed', {
        character: analysis.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return [
        'Unable to generate specific recommendations due to analysis error.',
        'Consider reviewing the character\'s motivation and obstacles.',
        'Ensure the character has clear agency in driving the plot forward.',
      ];
    }
  }

  /**
   * Analyze character arc progression throughout the story
   */
  async analyzeCharacterArcProgression(
    content: string,
    characterName: string
  ): Promise<ArcStage[]> {
    const prompt = `
Trace the character arc progression for "${characterName}" throughout this story.
Identify the key stages of their development and where they occur in the story.

Common arc stages to look for:
- Initial state/status quo
- Inciting incident affecting character
- First change/reaction
- Commitment to new path
- Progress and setbacks
- Crisis/dark moment
- Final transformation
- New equilibrium

Content:
${content.substring(0, 4000)}...

For each stage found, provide:
- Stage name
- Position in story (0-100%)
- Whether it's completed/present
- Description of what happens

Respond with JSON array of arc stages.`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 800,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Character arc progression analysis failed', {
        character: characterName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return [
        {
          name: 'Initial State',
          position: 10,
          completed: true,
          description: 'Character introduction (analysis failed)',
        },
      ];
    }
  }

  /**
   * Check for character consistency issues
   */
  async checkCharacterConsistency(
    content: string,
    characterName: string
  ): Promise<Array<{ issue: string; location: string; severity: 'low' | 'medium' | 'high' }>> {
    const prompt = `
Check for consistency issues with the character "${characterName}" throughout this story.
Look for:

1. Personality contradictions
2. Inconsistent behavior patterns
3. Conflicting motivations
4. Speech pattern changes
5. Skill/knowledge inconsistencies
6. Physical description contradictions

Content:
${content.substring(0, 4000)}...

For each inconsistency found, provide:
- Description of the issue
- Where it occurs (general location)
- Severity (low, medium, high)

Respond with JSON array of consistency issues.`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 600,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Character consistency check failed', {
        character: characterName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return [];
    }
  }
}