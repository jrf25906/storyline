import {
  ThemeAnalysis,
  ThemeDevelopment,
  SymbolismAnalysis,
  MetaphorAnalysis,
} from '../types';
import { logger } from '../utils/logger';
import { AIProviderService } from './AIProviderService';

/**
 * Service for analyzing themes, symbolism, and metaphors in narrative content
 * Focuses on thematic coherence, development, and integration
 */
export class ThemeAnalysisService {
  private aiProvider: AIProviderService;

  constructor(aiProvider: AIProviderService) {
    this.aiProvider = aiProvider;
  }

  /**
   * Analyze themes in the story content
   */
  async analyzeThemes(
    content: string,
    userId?: string,
    projectId?: string
  ): Promise<ThemeAnalysis> {
    try {
      const [themeIdentification, symbolism, metaphors] = await Promise.all([
        this.identifyAndAnalyzeThemes(content),
        this.analyzeSymbolism(content),
        this.analyzeMetaphors(content),
      ]);

      const analysis: ThemeAnalysis = {
        primaryTheme: themeIdentification.primaryTheme,
        subthemes: themeIdentification.subthemes,
        development: themeIdentification.development,
        integration: themeIdentification.integration,
        consistency: themeIdentification.consistency,
        symbolism,
        metaphors,
      };

      logger.info('Theme analysis completed', {
        primaryTheme: analysis.primaryTheme,
        subthemeCount: analysis.subthemes.length,
        integration: analysis.integration,
        contentLength: content.length,
        userId,
        projectId,
      });

      return analysis;

    } catch (error) {
      logger.error('Theme analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: content.length,
      });
      throw error;
    }
  }

  /**
   * Identify and analyze theme development
   */
  private async identifyAndAnalyzeThemes(content: string): Promise<{
    primaryTheme: string;
    subthemes: string[];
    development: ThemeDevelopment[];
    integration: number;
    consistency: number;
  }> {
    const prompt = `
Analyze the themes in this story content. Identify:

1. Primary Theme: The main thematic message or central idea
2. Subthemes: Secondary themes that support or complement the primary theme
3. Theme Development: How each theme is introduced, developed, and resolved
4. Integration: How well themes are woven into the story (0-100)
5. Consistency: How consistently themes are maintained (0-100)

For each theme, identify:
- Where it's first introduced (position 0-100 in story)
- Key development points throughout the story
- Where/how it's resolved or concluded
- Overall strength of the theme (0-100)

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "primaryTheme": "Main theme description",
  "subthemes": ["subtheme1", "subtheme2"],
  "development": [
    {
      "theme": "Theme name",
      "introduction": 0-100,
      "development": [25, 50, 75],
      "resolution": 90,
      "strength": 0-100
    }
  ],
  "integration": 0-100,
  "consistency": 0-100
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 1000,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Theme identification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        primaryTheme: 'Unable to identify primary theme',
        subthemes: [],
        development: [],
        integration: 50,
        consistency: 50,
      };
    }
  }

  /**
   * Analyze symbolism in the story
   */
  private async analyzeSymbolism(content: string): Promise<SymbolismAnalysis[]> {
    const prompt = `
Identify and analyze symbolism in this story content. Look for:

1. Objects, places, or concepts that represent something beyond their literal meaning
2. Recurring symbols and their significance
3. Cultural or universal symbols
4. How effectively each symbol serves the story

For each symbol identified:
- The symbol itself
- What it represents/means
- How frequently it appears
- How effective it is (0-100)
- Cultural context if relevant

Content:
${content.substring(0, 4000)}...

Respond with JSON array:
[
  {
    "symbol": "Symbol name/description",
    "meaning": "What it represents",
    "frequency": number_of_appearances,
    "effectiveness": 0-100,
    "culturalContext": "Cultural significance if applicable"
  }
]`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 800,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Symbolism analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return [];
    }
  }

  /**
   * Analyze metaphors and figurative language
   */
  private async analyzeMetaphors(content: string): Promise<MetaphorAnalysis[]> {
    const prompt = `
Identify and analyze metaphors and figurative language in this story content. Look for:

1. Direct metaphors (A is B)
2. Extended metaphors that run through sections
3. Similes and comparisons
4. Figurative language that enhances meaning

For each metaphor/figurative element:
- The metaphor itself
- How effective it is (0-100)
- How original/creative it is (0-100)
- How clear the meaning is (0-100)

Content:
${content.substring(0, 4000)}...

Respond with JSON array:
[
  {
    "metaphor": "The metaphor or figurative language",
    "effectiveness": 0-100,
    "originality": 0-100,
    "clarity": 0-100
  }
]`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 600,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Metaphor analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return [];
    }
  }

  /**
   * Analyze theme consistency throughout the story
   */
  async analyzeThemeConsistency(
    content: string,
    primaryTheme: string
  ): Promise<{
    consistencyScore: number;
    inconsistencies: Array<{
      location: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  }> {
    const prompt = `
Analyze how consistently the theme "${primaryTheme}" is maintained throughout this story.
Look for:

1. Places where the theme is strongly supported
2. Places where the theme seems to be contradicted or undermined  
3. Missing opportunities to reinforce the theme
4. Overall consistency score (0-100)

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "consistencyScore": 0-100,
  "inconsistencies": [
    {
      "location": "General location in story",
      "issue": "Description of the inconsistency",
      "severity": "low|medium|high"
    }
  ]
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 600,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Theme consistency analysis failed', {
        theme: primaryTheme,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        consistencyScore: 50,
        inconsistencies: [],
      };
    }
  }

  /**
   * Suggest theme enhancement opportunities
   */
  async suggestThemeEnhancements(
    analysis: ThemeAnalysis,
    content: string
  ): Promise<string[]> {
    const prompt = `
Based on this theme analysis, suggest specific ways to enhance the thematic elements:

Theme Analysis:
- Primary Theme: ${analysis.primaryTheme}
- Subthemes: ${analysis.subthemes.join(', ')}
- Integration Score: ${analysis.integration}%
- Consistency Score: ${analysis.consistency}%
- Number of Symbols: ${analysis.symbolism.length}
- Number of Metaphors: ${analysis.metaphors.length}

Provide 3-5 specific, actionable suggestions for:
1. Strengthening theme integration
2. Adding meaningful symbolism
3. Improving thematic consistency
4. Enhancing metaphorical language

Respond with JSON array of strings.`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 600,
        temperature: 0.3,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Theme enhancement suggestions failed', {
        primaryTheme: analysis.primaryTheme,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return [
        'Consider adding more concrete symbols that represent your primary theme.',
        'Look for opportunities to weave thematic elements into dialogue.',
        'Ensure character actions consistently support the main theme.',
      ];
    }
  }

  /**
   * Analyze cultural themes and sensitivity
   */
  async analyzeCulturalThemes(
    content: string,
    culturalContext?: string
  ): Promise<{
    culturalThemes: string[];
    sensitivityScore: number;
    concerns: string[];
    recommendations: string[];
  }> {
    const prompt = `
Analyze this content for cultural themes and sensitivity. Consider:

1. Cultural themes present in the story
2. How sensitively cultural elements are handled (0-100)
3. Any potential cultural concerns or stereotypes
4. Recommendations for improving cultural sensitivity

${culturalContext ? `Cultural Context: ${culturalContext}` : ''}

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "culturalThemes": ["theme1", "theme2"],
  "sensitivityScore": 0-100,
  "concerns": ["concern1", "concern2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 800,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Cultural theme analysis failed', {
        culturalContext,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        culturalThemes: [],
        sensitivityScore: 75,
        concerns: [],
        recommendations: ['Consider consulting cultural experts for sensitive themes.'],
      };
    }
  }

  /**
   * Track theme evolution across multiple content sections
   */
  async trackThemeEvolution(
    contentSections: Array<{ section: string; content: string }>,
    primaryTheme: string
  ): Promise<Array<{
    section: string;
    themeStrength: number;
    development: string;
    consistency: number;
  }>> {
    const analyses = await Promise.all(
      contentSections.map(async (section) => {
        const prompt = `
Analyze how the theme "${primaryTheme}" is presented in this section of the story:

Section: ${section.section}
Content:
${section.content.substring(0, 2000)}...

Evaluate:
1. Theme strength in this section (0-100)
2. How the theme is developed here
3. Consistency with previous treatment (0-100)

Respond with JSON:
{
  "themeStrength": 0-100,
  "development": "Description of theme development",
  "consistency": 0-100
}`;

        try {
          const response = await this.aiProvider.generateCompletion(prompt, {
            maxTokens: 300,
            temperature: 0.2,
          });

          const analysis = JSON.parse(response);
          return {
            section: section.section,
            ...analysis,
          };

        } catch (error) {
          logger.error('Section theme analysis failed', {
            section: section.section,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          return {
            section: section.section,
            themeStrength: 50,
            development: 'Analysis failed',
            consistency: 50,
          };
        }
      })
    );

    logger.info('Theme evolution tracking completed', {
      sections: contentSections.length,
      primaryTheme,
    });

    return analyses;
  }
}