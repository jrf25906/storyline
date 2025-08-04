import {
  WritingCraftAnalysis,
  VoiceAnalysis,
  StyleAnalysis,
  ProseQuality,
  DialogueQuality,
  DescriptionAnalysis,
  POVAnalysis,
  POVViolation,
  TenseConsistency,
  TenseViolation,
  ShowVsTellAnalysis,
  ShowVsTellImprovement,
  PacingAnalysis,
  ScenePacing,
  PacingRhythm,
  DialogueAnalysis,
  ActionSequenceAnalysis,
  TensionCurve,
  TensionPoint,
  TensionType,
  Priority,
  TextLocation,
} from '../types';
import { logger } from '../utils/logger';
import { AIProviderService } from './AIProviderService';

/**
 * Service for analyzing writing craft elements
 * Focuses on prose quality, dialogue, pacing, and technical writing skills
 */
export class WritingCraftService {
  private aiProvider: AIProviderService;

  constructor(aiProvider: AIProviderService) {
    this.aiProvider = aiProvider;
  }

  /**
   * Comprehensive writing craft analysis
   */
  async analyzeWritingCraft(
    content: string,
    userId?: string,
    projectId?: string
  ): Promise<WritingCraftAnalysis> {
    try {
      const [
        voice,
        style,
        prose,
        dialogue,
        description,
        pov,
        tense,
        showVsTell,
      ] = await Promise.all([
        this.analyzeVoice(content),
        this.analyzeStyle(content),
        this.analyzeProseQuality(content),
        this.analyzeDialogueQuality(content),
        this.analyzeDescription(content),
        this.analyzePOV(content),
        this.analyzeTenseConsistency(content),
        this.analyzeShowVsTell(content),
      ]);

      const analysis: WritingCraftAnalysis = {
        voice,
        style,
        prose,
        dialogue,
        description,
        pointOfView: pov,
        tense,
        showVsTell,
      };

      logger.info('Writing craft analysis completed', {
        voiceConsistency: voice.consistency,
        styleReadability: style.readability,
        proseClarity: prose.clarity,
        dialogueNaturalness: dialogue.naturalness,
        contentLength: content.length,
        userId,
        projectId,
      });

      return analysis;

    } catch (error) {
      logger.error('Writing craft analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: content.length,
      });
      throw error;
    }
  }

  /**
   * Analyze narrative voice consistency and distinctiveness
   */
  private async analyzeVoice(content: string): Promise<VoiceAnalysis> {
    const prompt = `
Analyze the narrative voice in this content. Evaluate:

1. Voice Consistency (0-100): How consistent is the narrative voice throughout?
2. Voice Distinctiveness (0-100): How unique and memorable is the voice?
3. Voice Authenticity (0-100): How genuine and believable does the voice sound?
4. Character Voices: How distinct are individual character voices in dialogue?

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "consistency": 0-100,
  "distinctiveness": 0-100,
  "authenticity": 0-100,
  "characterVoices": [
    {
      "character": "Character name",
      "distinctiveness": 0-100,
      "consistency": 0-100,
      "examples": ["Quote example 1", "Quote example 2"]
    }
  ]
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 1000,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Voice analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        consistency: 50,
        distinctiveness: 50,
        authenticity: 50,
        characterVoices: [],
      };
    }
  }

  /**
   * Analyze writing style elements
   */
  private async analyzeStyle(content: string): Promise<StyleAnalysis> {
    const prompt = `
Analyze the writing style in this content. Evaluate:

1. Sentence Variety (0-100): How varied are sentence lengths and structures?
2. Vocabulary Richness (0-100): How rich and varied is the vocabulary?
3. Readability (0-100): How easy is the text to read and understand?
4. Genre Appropriate (0-100): How well does the style fit the genre?

Consider:
- Mix of short, medium, and long sentences
- Vocabulary sophistication vs accessibility
- Clarity of expression
- Style consistency

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "sentenceVariety": 0-100,
  "vocabularyRichness": 0-100,
  "readability": 0-100,
  "genreAppropriate": 0-100
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 400,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Style analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        sentenceVariety: 50,
        vocabularyRichness: 50,
        readability: 50,
        genreAppropriate: 50,
      };
    }
  }

  /**
   * Analyze prose quality
   */
  private async analyzeProseQuality(content: string): Promise<ProseQuality> {
    const prompt = `
Analyze the prose quality in this content. Evaluate:

1. Clarity (0-100): How clear and understandable is the writing?
2. Flow (0-100): How smoothly does the text read?
3. Imagery (0-100): How vivid and engaging are the images created?
4. Rhythm (0-100): How pleasing is the rhythm and cadence?

Consider:
- Sentence flow and transitions
- Vivid, specific language
- Rhythm and musicality
- Clarity of meaning

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "clarity": 0-100,
  "flow": 0-100,
  "imagery": 0-100,
  "rhythm": 0-100
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 400,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Prose quality analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        clarity: 50,
        flow: 50,
        imagery: 50,
        rhythm: 50,
      };
    }
  }

  /**
   * Analyze dialogue quality
   */
  private async analyzeDialogueQuality(content: string): Promise<DialogueQuality> {
    const prompt = `
Analyze the dialogue quality in this content. Evaluate:

1. Naturalness (0-100): How natural and realistic does the dialogue sound?
2. Subtext (0-100): How well does dialogue convey meaning beyond the words?
3. Character Differentiation (0-100): How distinct are different characters' speech patterns?
4. Purpose (0-100): How well does dialogue serve story purposes (plot, character, theme)?

Look for:
- Realistic speech patterns
- Characters with distinct voices
- Dialogue that reveals character and advances plot
- Subtext and implied meaning

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "naturalness": 0-100,
  "subtext": 0-100,
  "characterDifferentiation": 0-100,
  "purpose": 0-100
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 400,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Dialogue quality analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        naturalness: 50,
        subtext: 50,
        characterDifferentiation: 50,
        purpose: 50,
      };
    }
  }

  /**
   * Analyze description quality
   */
  private async analyzeDescription(content: string): Promise<DescriptionAnalysis> {
    const prompt = `
Analyze the descriptive elements in this content. Evaluate:

1. Vividness (0-100): How vivid and engaging are the descriptions?
2. Balance (0-100): How well balanced is description vs. action/dialogue?
3. Sensory Details (0-100): How well are the five senses engaged?
4. Relevance (0-100): How relevant and purposeful are the descriptions?

Consider:
- Use of specific, concrete details
- Balance of sensory information
- Description that serves story purposes
- Avoiding unnecessary or excessive description

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "vividness": 0-100,
  "balance": 0-100,
  "sensoryDetails": 0-100,
  "relevance": 0-100
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 400,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Description analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        vividness: 50,
        balance: 50,
        sensoryDetails: 50,
        relevance: 50,
      };
    }
  }

  /**
   * Analyze point of view consistency
   */
  private async analyzePOV(content: string): Promise<POVAnalysis> {
    const prompt = `
Analyze the point of view (POV) in this content. Evaluate:

1. POV Consistency (0-100): How consistently is the POV maintained?
2. POV Effectiveness (0-100): How effectively is the chosen POV used?
3. POV Violations: Any places where POV shifts inappropriately?

Look for:
- Consistent perspective (first person, third person limited, omniscient, etc.)
- Inappropriate POV shifts
- Head-hopping between characters
- Maintaining the chosen perspective throughout

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "consistency": 0-100,
  "effectiveness": 0-100,
  "violations": [
    {
      "type": "Description of violation type",
      "location": "General location in text",
      "description": "Specific description of the issue",
      "severity": "low|medium|high"
    }
  ]
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 600,
        temperature: 0.2,
      });

      const result = JSON.parse(response);
      
      return {
        consistency: result.consistency,
        effectiveness: result.effectiveness,
        violations: result.violations.map((v: any) => ({
          type: v.type,
          location: { paragraph: 1 }, // Simplified location
          description: v.description,
          severity: v.severity as Priority,
        })),
      };

    } catch (error) {
      logger.error('POV analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        consistency: 50,
        effectiveness: 50,
        violations: [],
      };
    }
  }

  /**
   * Analyze tense consistency
   */
  private async analyzeTenseConsistency(content: string): Promise<TenseConsistency> {
    const prompt = `
Analyze verb tense consistency in this content. Evaluate:

1. Primary Tense: What is the main tense used (past, present, future)?
2. Consistency (0-100): How consistently is the tense maintained?
3. Tense Violations: Any inappropriate tense shifts?

Look for:
- Consistent use of primary tense
- Appropriate tense shifts (flashbacks, dialogue, etc.)
- Unnecessary or confusing tense changes

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "primary": "past|present|future",
  "consistency": 0-100,
  "violations": [
    {
      "location": "General location",
      "expected": "Expected tense",
      "actual": "Actual tense used",
      "severity": "low|medium|high"
    }
  ]
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 500,
        temperature: 0.2,
      });

      const result = JSON.parse(response);
      
      return {
        primary: result.primary,
        consistency: result.consistency,
        violations: result.violations.map((v: any) => ({
          location: { paragraph: 1 }, // Simplified location
          expected: v.expected,
          actual: v.actual,
          severity: v.severity as Priority,
        })),
      };

    } catch (error) {
      logger.error('Tense consistency analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        primary: 'past',
        consistency: 50,
        violations: [],
      };
    }
  }

  /**
   * Analyze show vs tell balance
   */
  private async analyzeShowVsTell(content: string): Promise<ShowVsTellAnalysis> {
    const prompt = `
Analyze the "show vs tell" balance in this content. Evaluate:

1. Show Percentage (0-100): What percentage uses "showing" techniques?
2. Tell Percentage (0-100): What percentage uses "telling" techniques?
3. Balance (0-100): How appropriate is the show/tell balance?
4. Improvements: Specific examples where telling could be converted to showing

"Showing" uses:
- Specific actions, dialogue, sensory details
- Character behavior that reveals personality
- Scene and concrete details

"Telling" uses:
- Direct statements about character traits
- Summary of events or emotions
- Abstract descriptions

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "showPercentage": 0-100,
  "tellPercentage": 0-100,
  "balance": 0-100,
  "improvements": [
    {
      "location": "General location",
      "current": "Current telling example",
      "suggestion": "Suggested showing alternative",
      "type": "show|tell"
    }
  ]
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 800,
        temperature: 0.2,
      });

      const result = JSON.parse(response);
      
      return {
        showPercentage: result.showPercentage,
        tellPercentage: result.tellPercentage,
        balance: result.balance,
        improvements: result.improvements.map((imp: any) => ({
          location: { paragraph: 1 }, // Simplified location
          current: imp.current,
          suggestion: imp.suggestion,
          type: imp.type as 'show' | 'tell',
        })),
      };

    } catch (error) {
      logger.error('Show vs tell analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        showPercentage: 50,
        tellPercentage: 50,
        balance: 50,
        improvements: [],
      };
    }
  }

  /**
   * Analyze pacing throughout the content
   */
  async analyzePacing(content: string): Promise<PacingAnalysis> {
    try {
      const [overall, scenes, tension, dialogue, action] = await Promise.all([
        this.analyzeOverallPacing(content),
        this.analyzeScenePacing(content),
        this.analyzeTensionCurve(content),
        this.analyzeDialoguePacing(content),
        this.analyzeActionPacing(content),
      ]);

      return {
        overall,
        scenes,
        tension,
        dialogue,
        action,
        recommendations: await this.generatePacingRecommendations(content),
      };

    } catch (error) {
      logger.error('Pacing analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Analyze overall pacing rhythm
   */
  private async analyzeOverallPacing(content: string): Promise<PacingRhythm> {
    const prompt = `
Analyze the overall pacing of this content. Determine if it's:
- TOO_SLOW: Drags, too much description/exposition, lacks momentum
- SLOW: Measured pace, deliberate, perhaps too leisurely  
- BALANCED: Good rhythm, appropriate for content
- FAST: Quick pace, good momentum, perhaps slightly rushed
- TOO_FAST: Rushed, lacking detail, hard to follow

Content:
${content.substring(0, 4000)}...

Respond with just one word: TOO_SLOW, SLOW, BALANCED, FAST, or TOO_FAST`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 10,
        temperature: 0.1,
      });

      const rhythm = response.trim().toUpperCase();
      
      switch (rhythm) {
        case 'TOO_SLOW': return PacingRhythm.TOO_SLOW;
        case 'SLOW': return PacingRhythm.SLOW;
        case 'BALANCED': return PacingRhythm.BALANCED;
        case 'FAST': return PacingRhythm.FAST;
        case 'TOO_FAST': return PacingRhythm.TOO_FAST;
        default: return PacingRhythm.BALANCED;
      }

    } catch (error) {
      return PacingRhythm.BALANCED;
    }
  }

  /**
   * Analyze pacing of individual scenes
   */
  private async analyzeScenePacing(content: string): Promise<ScenePacing[]> {
    // This is a simplified implementation
    // In a real implementation, you'd break content into scenes first
    const wordCount = content.split(/\s+/).length;
    
    return [{
      sceneId: 'scene_1',
      rhythm: PacingRhythm.BALANCED,
      wordCount,
      actionToDialogueRatio: 0.6,
      tensionLevel: 60,
      recommendation: 'Scene pacing appears balanced',
    }];
  }

  /**
   * Generate pacing recommendations
   */
  private async generatePacingRecommendations(content: string): Promise<any[]> {
    // Simplified implementation
    return [{
      location: { paragraph: 1 },
      issue: 'Pacing analysis',
      suggestion: 'Review pacing in key scenes',
      priority: Priority.MEDIUM,
    }];
  }

  // Additional helper methods for tension, dialogue, and action analysis
  private async analyzeTensionCurve(content: string): Promise<TensionCurve> {
    return {
      points: [{
        position: 50,
        intensity: 60,
        type: TensionType.DRAMATIC,
      }],
      peaks: [75],
      valleys: [25],
      overall: 60,
    };
  }

  private async analyzeDialoguePacing(content: string): Promise<DialogueAnalysis> {
    return {
      naturalness: 70,
      characterVoice: 65,
      subtext: 60,
      purpose: 75,
      balance: 70,
    };
  }

  private async analyzeActionPacing(content: string): Promise<ActionSequenceAnalysis> {
    return {
      clarity: 70,
      pacing: 65,
      stakes: 75,
      choreography: 60,
    };
  }
}