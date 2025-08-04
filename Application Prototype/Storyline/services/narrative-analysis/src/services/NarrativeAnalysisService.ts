import {
  NarrativeAnalysis,
  AnalysisRequest,
  AnalysisResponse,
  AnalysisConfig,
  StoryFramework,
  CulturalFramework,
  CulturalStoryType,
  WritingSuggestion,
  SuggestionType,
  Priority,
  SuggestionCategory,
  CoherenceScore,
  Inconsistency,
  InconsistencyType,
} from '../types';
import { getAnalysisConfig, culturalGuidelines } from '../config/analysis';
import { logger, logAnalysisMetrics, logCulturalSensitivity } from '../utils/logger';
import { AIProviderService } from './AIProviderService';
import { StructureAnalysisService } from './StructureAnalysisService';
import { CharacterAnalysisService } from './CharacterAnalysisService';
import { ThemeAnalysisService } from './ThemeAnalysisService';
import { WritingCraftService } from './WritingCraftService';
import { TraumaInformedService } from './TraumaInformedService';

/**
 * Main orchestrator service for comprehensive narrative analysis
 * Coordinates all analysis services and provides unified results
 */
export class NarrativeAnalysisService {
  private aiProvider: AIProviderService;
  private structureService: StructureAnalysisService;
  private characterService: CharacterAnalysisService;
  private themeService: ThemeAnalysisService;
  private craftService: WritingCraftService;
  private traumaService: TraumaInformedService;
  private config: any;

  constructor() {
    this.config = getAnalysisConfig();
    
    // Initialize AI provider
    this.aiProvider = new AIProviderService({
      openaiApiKey: process.env.OPENAI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      defaultProvider: this.config.ai.defaultProvider,
      fallbackEnabled: this.config.ai.fallbackEnabled,
    });

    // Initialize analysis services
    this.structureService = new StructureAnalysisService(this.aiProvider);
    this.characterService = new CharacterAnalysisService(this.aiProvider);
    this.themeService = new ThemeAnalysisService(this.aiProvider);
    this.craftService = new WritingCraftService(this.aiProvider);
    this.traumaService = new TraumaInformedService(this.aiProvider, {
      crisisKeywords: this.config.traumaInformed.crisisKeywords,
      gentleThreshold: this.config.traumaInformed.gentleResponseThreshold,
      professionalThreshold: this.config.traumaInformed.professionalResourceThreshold,
      crisisThreshold: this.config.traumaInformed.crisisResponseThreshold,
    });

    logger.info('Narrative Analysis Service initialized', {
      aiProvider: this.config.ai.defaultProvider,
      traumaInformedEnabled: this.config.traumaInformed.enabled,
      culturalSensitivityEnabled: this.config.cultural.sensitivityChecking,
    });
  }

  /**
   * Perform comprehensive narrative analysis
   */
  async analyzeNarrative(request: AnalysisRequest): Promise<AnalysisResponse> {
    const startTime = Date.now();
    const analysisId = `analysis_${Date.now()}_${Math.random()}`;

    try {
      // Validate request
      this.validateRequest(request);

      // Check content length
      if (request.content.length > this.config.performance.maxContentLength) {
        throw new Error('Content exceeds maximum length limit');
      }

      // Check for trauma-informed considerations first
      let traumaAnalysis = null;
      if (this.config.traumaInformed.enabled) {
        traumaAnalysis = await this.traumaService.analyzeForTrauma(
          request.content,
          request.userId,
          request.projectId
        );

        // If crisis intervention is needed, return immediately with supportive response
        if (traumaAnalysis.requiresIntervention && traumaAnalysis.severity === 'crisis') {
          return this.createCrisisResponse(analysisId, traumaAnalysis, startTime);
        }
      }

      // Perform parallel analysis across all dimensions
      const [
        structureAnalysis,
        characterAnalysis,
        themeAnalysis,
        craftAnalysis,
        coherenceAnalysis,
        culturalAnalysis,
      ] = await Promise.all([
        this.structureService.analyzeStructure(
          request.content,
          request.config.framework,
          request.userId,
          request.projectId
        ),
        this.characterService.analyzeCharacters(
          request.content,
          request.userId,
          request.projectId
        ),
        this.themeService.analyzeThemes(
          request.content,
          request.userId,
          request.projectId
        ),
        this.craftService.analyzeWritingCraft(
          request.content,
          request.userId,
          request.projectId
        ),
        this.analyzeStoryCoherence(request.content),
        this.analyzeCulturalFramework(request.content, request.config),
      ]);

      // Generate comprehensive suggestions
      const suggestions = await this.generateComprehensiveSuggestions(
        request.content,
        {
          structure: structureAnalysis,
          characters: characterAnalysis,
          themes: themeAnalysis,
          craft: craftAnalysis,
          coherence: coherenceAnalysis,
          cultural: culturalAnalysis,
        },
        traumaAnalysis
      );

      // Create complete analysis
      const analysis: NarrativeAnalysis = {
        id: analysisId,
        userId: request.userId,
        projectId: request.projectId,
        timestamp: new Date(),
        storyCoherence: coherenceAnalysis,
        characterDevelopment: characterAnalysis,
        plotStructure: structureAnalysis,
        pacing: await this.craftService.analyzePacing(request.content),
        themeIntegration: themeAnalysis,
        writingCraft: craftAnalysis,
        culturalFramework: culturalAnalysis,
        suggestions,
        traumaInformedNotes: traumaAnalysis?.notes,
      };

      const processingTime = Date.now() - startTime;

      // Log successful analysis
      logAnalysisMetrics({
        analysisId,
        userId: request.userId,
        projectId: request.projectId,
        processingTime,
        contentLength: request.content.length,
        framework: request.config.framework.toString(),
        success: true,
      });

      return {
        success: true,
        analysis,
        processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Narrative analysis failed', {
        analysisId,
        userId: request.userId,
        projectId: request.projectId,
        error: errorMessage,
        processingTime,
      });

      // Log failed analysis
      logAnalysisMetrics({
        analysisId,
        userId: request.userId,
        projectId: request.projectId,
        processingTime,
        contentLength: request.content.length,
        framework: request.config.framework?.toString() || 'unknown',
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        processingTime,
      };
    }
  }

  /**
   * Analyze story coherence across all elements
   */
  private async analyzeStoryCoherence(content: string): Promise<CoherenceScore> {
    const prompt = `
Analyze the overall coherence of this story content. Evaluate:

1. Character consistency (0-100): Are characters consistent in personality, behavior, and voice?
2. Plot consistency (0-100): Does the plot make logical sense without contradictions?
3. Setting consistency (0-100): Is the world/setting internally consistent?
4. Voice consistency (0-100): Is the narrative voice consistent throughout?
5. Timeline consistency (0-100): Does the chronology make sense?

Also identify any specific inconsistencies you notice.

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "character": 0-100,
  "plot": 0-100,
  "setting": 0-100,
  "voice": 0-100,
  "timeline": 0-100,
  "inconsistencies": [
    {
      "type": "character|plot|setting|voice|timeline|style",
      "description": "Description of the inconsistency",
      "locations": ["general location 1", "general location 2"],
      "severity": "low|medium|high"
    }
  ]
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 1000,
        temperature: 0.2,
      });

      const analysis = JSON.parse(response);
      
      const coherenceScore: CoherenceScore = {
        overall: Math.round((
          analysis.character + 
          analysis.plot + 
          analysis.setting + 
          analysis.voice + 
          analysis.timeline
        ) / 5),
        character: analysis.character,
        plot: analysis.plot,
        setting: analysis.setting,
        voice: analysis.voice,
        timeline: analysis.timeline,
        inconsistencies: analysis.inconsistencies.map((inc: any) => ({
          type: inc.type as InconsistencyType,
          description: inc.description,
          locations: [{ paragraph: 1 }], // Simplified location
          severity: inc.severity as Priority,
        })),
      };

      return coherenceScore;

    } catch (error) {
      logger.error('Coherence analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        overall: 50,
        character: 50,
        plot: 50,
        setting: 50,
        voice: 50,
        timeline: 50,
        inconsistencies: [],
      };
    }
  }

  /**
   * Analyze cultural framework and sensitivity
   */
  private async analyzeCulturalFramework(
    content: string,
    config: AnalysisConfig
  ): Promise<CulturalFramework> {
    const prompt = `
Analyze this content for cultural storytelling elements and sensitivity. Identify:

1. Primary cultural storytelling type (if any):
   - Western Linear (beginning, middle, end with conflict)
   - Kishōtenketsu (Japanese 4-act without central conflict)
   - Circular Narrative (stories that return to beginning)
   - Episodic (series of connected episodes)
   - Oral Tradition (features of spoken storytelling)
   - Mythological (archetypal or mythic structures)
   - Indigenous (community-centered, land-connected)
   - Eastern Philosophical (balance, harmony, cyclical thinking)

2. Cultural characteristics present
3. Any cultural adaptations or blending
4. Sensitivity considerations

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "type": "western_linear|kishoten_ketsu|circular_narrative|episodic|oral_tradition|mythological|indigenous|eastern_philosophical",
  "origin": "Cultural origin or tradition",
  "characteristics": ["characteristic1", "characteristic2"],
  "adaptations": ["adaptation1", "adaptation2"],
  "sensitivityNotes": ["note1", "note2"]
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 600,
        temperature: 0.2,
      });

      const analysis = JSON.parse(response);
      
      // Log cultural sensitivity check if needed
      if (config.culturalSensitivity && analysis.sensitivityNotes.length > 0) {
        logCulturalSensitivity({
          userId: config.userId || 'unknown',
          projectId: config.projectId || 'unknown',
          culturalFramework: analysis.type,
          flags: analysis.sensitivityNotes,
          severity: 'low', // Default severity
        });
      }

      return {
        type: analysis.type as CulturalStoryType,
        origin: analysis.origin,
        characteristics: analysis.characteristics,
        adaptations: analysis.adaptations,
        sensitivityNotes: analysis.sensitivityNotes,
      };

    } catch (error) {
      logger.error('Cultural framework analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        type: CulturalStoryType.WESTERN_LINEAR,
        origin: 'Unknown',
        characteristics: [],
        adaptations: [],
        sensitivityNotes: [],
      };
    }
  }

  /**
   * Generate comprehensive suggestions from all analysis dimensions
   */
  private async generateComprehensiveSuggestions(
    content: string,
    analyses: {
      structure: any;
      characters: any[];
      themes: any;
      craft: any;
      coherence: CoherenceScore;
      cultural: CulturalFramework;
    },
    traumaAnalysis: any
  ): Promise<WritingSuggestion[]> {
    const suggestions: WritingSuggestion[] = [];

    // Add trauma-informed suggestions first (highest priority)
    if (traumaAnalysis?.suggestions) {
      suggestions.push(...traumaAnalysis.suggestions);
    }

    // Structure suggestions
    if (analyses.structure.adherence < 70) {
      suggestions.push({
        id: `struct_${Date.now()}`,
        type: SuggestionType.STRUCTURE,
        priority: Priority.HIGH,
        category: SuggestionCategory.STORY_STRUCTURE,
        title: 'Strengthen Story Structure',
        description: `Your story shows ${analyses.structure.adherence}% adherence to ${analyses.structure.framework} structure. Consider reviewing the key beats and ensuring they're clearly present.`,
        traumaInformed: false,
        culturallySensitive: true,
      });
    }

    // Character suggestions
    const weakCharacters = analyses.characters.filter(char => 
      char.development.growth < 60 || char.consistency < 70
    );
    
    if (weakCharacters.length > 0) {
      suggestions.push({
        id: `char_${Date.now()}`,
        type: SuggestionType.CHARACTER,
        priority: Priority.HIGH,
        category: SuggestionCategory.CHARACTER_DEVELOPMENT,
        title: 'Enhance Character Development',
        description: `${weakCharacters.length} character(s) could benefit from stronger development or consistency. Focus on clear motivations and consistent behavior patterns.`,
        traumaInformed: false,
        culturallySensitive: true,
      });
    }

    // Theme suggestions
    if (analyses.themes.integration < 60) {
      suggestions.push({
        id: `theme_${Date.now()}`,
        type: SuggestionType.THEME,
        priority: Priority.MEDIUM,
        category: SuggestionCategory.STORY_STRUCTURE,
        title: 'Improve Theme Integration',
        description: 'Your themes could be more tightly woven into the story. Look for opportunities to reinforce themes through character actions, dialogue, and plot events.',
        traumaInformed: false,
        culturallySensitive: true,
      });
    }

    // Writing craft suggestions
    if (analyses.craft.prose.clarity < 70) {
      suggestions.push({
        id: `craft_${Date.now()}`,
        type: SuggestionType.CRAFT,
        priority: Priority.MEDIUM,
        category: SuggestionCategory.WRITING_CRAFT,
        title: 'Enhance Prose Clarity',
        description: 'Focus on making your prose clearer and more direct. Consider simplifying complex sentences and ensuring each sentence serves a clear purpose.',
        traumaInformed: false,
        culturallySensitive: true,
      });
    }

    // Coherence suggestions
    if (analyses.coherence.overall < 70) {
      const problemAreas = [];
      if (analyses.coherence.character < 70) problemAreas.push('character consistency');
      if (analyses.coherence.plot < 70) problemAreas.push('plot logic');
      if (analyses.coherence.setting < 70) problemAreas.push('setting consistency');
      
      suggestions.push({
        id: `coherence_${Date.now()}`,
        type: SuggestionType.STRUCTURE,
        priority: Priority.HIGH,
        category: SuggestionCategory.STORY_STRUCTURE,
        title: 'Address Story Inconsistencies',
        description: `Review your story for inconsistencies in: ${problemAreas.join(', ')}. These elements need to remain consistent throughout your narrative.`,
        traumaInformed: false,
        culturallySensitive: true,
      });
    }

    // Cultural sensitivity suggestions
    if (analyses.cultural.sensitivityNotes.length > 0) {
      suggestions.push({
        id: `cultural_${Date.now()}`,
        type: SuggestionType.CULTURAL,
        priority: Priority.MEDIUM,
        category: SuggestionCategory.CULTURAL_SENSITIVITY,
        title: 'Cultural Sensitivity Review',
        description: 'Consider reviewing your cultural representations for authenticity and sensitivity. Research and consultation with cultural experts can enhance your story.',
        traumaInformed: false,
        culturallySensitive: true,
      });
    }

    // Sort suggestions by priority
    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Create crisis response for trauma situations
   */
  private createCrisisResponse(
    analysisId: string,
    traumaAnalysis: any,
    startTime: number
  ): AnalysisResponse {
    return {
      success: true,
      analysis: {
        id: analysisId,
        userId: 'crisis_user',
        projectId: 'crisis_project',
        timestamp: new Date(),
        storyCoherence: { overall: 0, character: 0, plot: 0, setting: 0, voice: 0, timeline: 0, inconsistencies: [] },
        characterDevelopment: [],
        plotStructure: {
          framework: StoryFramework.THREE_ACT,
          detected: { framework: StoryFramework.THREE_ACT, confidence: 0, keyBeats: [], missing: [] },
          adherence: 0,
          pacing: { setup: 0, confrontation: 0, resolution: 0, balanced: false, recommendations: [] },
          acts: [],
          plotPoints: [],
          conflicts: [],
        },
        pacing: {
          overall: 'balanced' as any,
          scenes: [],
          tension: { points: [], peaks: [], valleys: [], overall: 0 },
          dialogue: { naturalness: 0, characterVoice: 0, subtext: 0, purpose: 0, balance: 0 },
          action: { clarity: 0, pacing: 0, stakes: 0, choreography: 0 },
          recommendations: [],
        },
        themeIntegration: {
          primaryTheme: 'Support and Safety',
          subthemes: [],
          development: [],
          integration: 100,
          consistency: 100,
          symbolism: [],
          metaphors: [],
        },
        writingCraft: {
          voice: { consistency: 0, distinctiveness: 0, authenticity: 0, characterVoices: [] },
          style: { sentenceVariety: 0, vocabularyRichness: 0, readability: 0, genreAppropriate: 0 },
          prose: { clarity: 0, flow: 0, imagery: 0, rhythm: 0 },
          dialogue: { naturalness: 0, subtext: 0, characterDifferentiation: 0, purpose: 0 },
          description: { vividness: 0, balance: 0, sensoryDetails: 0, relevance: 0 },
          pointOfView: { consistency: 0, effectiveness: 0, violations: [] },
          tense: { primary: 'present', consistency: 0, violations: [] },
          showVsTell: { showPercentage: 0, tellPercentage: 0, balance: 0, improvements: [] },
        },
        culturalFramework: {
          type: CulturalStoryType.WESTERN_LINEAR,
          origin: 'Support Framework',
          characteristics: ['Supportive', 'Safe', 'Understanding'],
          adaptations: [],
          sensitivityNotes: [],
        },
        suggestions: traumaAnalysis.suggestions,
        traumaInformedNotes: traumaAnalysis.notes,
      },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Validate analysis request
   */
  private validateRequest(request: AnalysisRequest): void {
    if (!request.userId) {
      throw new Error('User ID is required');
    }
    
    if (!request.projectId) {
      throw new Error('Project ID is required');
    }
    
    if (!request.content || request.content.trim().length === 0) {
      throw new Error('Content is required');
    }
    
    if (request.content.length < 100) {
      throw new Error('Content too short for meaningful analysis (minimum 100 characters)');
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: Date;
  }> {
    const services = {
      aiProvider: false,
      structure: true,
      character: true,
      theme: true,
      craft: true,
      trauma: true,
    };

    // Test AI provider connectivity
    try {
      services.aiProvider = await this.aiProvider.testProvider(this.config.ai.defaultProvider);
    } catch (error) {
      logger.error('AI provider health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices >= totalServices * 0.7) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services,
      timestamp: new Date(),
    };
  }
}