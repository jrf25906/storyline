import { 
  StoryFramework, 
  StructureAnalysis, 
  DetectedStructure, 
  ActAnalysis, 
  PlotPoint, 
  ConflictAnalysis,
  StructuralBeat,
  StructurePacing,
  PlotPointType,
  ConflictType,
  ConflictResolution
} from '../types';
import { frameworkConfigs } from '../config/analysis';
import { logger, logAnalysisMetrics } from '../utils/logger';
import { AIProviderService } from './AIProviderService';

/**
 * Service for analyzing story structure across multiple frameworks
 * Supports Western linear structures and cultural alternatives
 */
export class StructureAnalysisService {
  private aiProvider: AIProviderService;

  constructor(aiProvider: AIProviderService) {
    this.aiProvider = aiProvider;
  }

  /**
   * Analyze story structure using specified or auto-detected framework
   */
  async analyzeStructure(
    content: string,
    framework?: StoryFramework,
    userId?: string,
    projectId?: string
  ): Promise<StructureAnalysis> {
    const startTime = Date.now();
    
    try {
      // Auto-detect framework if not specified
      const detectedFramework = framework || await this.detectFramework(content);
      
      // Get framework-specific analysis
      const [structure, acts, plotPoints, conflicts, pacing] = await Promise.all([
        this.analyzeFrameworkAdherence(content, detectedFramework),
        this.analyzeActs(content, detectedFramework),
        this.identifyPlotPoints(content, detectedFramework),
        this.analyzeConflicts(content),
        this.analyzeStructurePacing(content, detectedFramework),
      ]);

      const analysis: StructureAnalysis = {
        framework: detectedFramework,
        detected: structure,
        adherence: structure.confidence,
        pacing,
        acts,
        plotPoints,
        conflicts,
      };

      // Log metrics
      if (userId && projectId) {
        logAnalysisMetrics({
          analysisId: `struct_${Date.now()}`,
          userId,
          projectId,
          processingTime: Date.now() - startTime,
          contentLength: content.length,
          framework: detectedFramework,
          success: true,
        });
      }

      return analysis;

    } catch (error) {
      logger.error('Structure analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        framework,
        contentLength: content.length,
      });

      if (userId && projectId) {
        logAnalysisMetrics({
          analysisId: `struct_${Date.now()}`,
          userId,
          projectId,
          processingTime: Date.now() - startTime,
          contentLength: content.length,
          framework: framework || 'unknown',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      throw error;
    }
  }

  /**
   * Auto-detect the most likely story framework
   */
  private async detectFramework(content: string): Promise<StoryFramework> {
    const prompt = `
Analyze this story content and identify which narrative framework it most closely follows.
Consider these frameworks:
- Three-Act Structure (Setup, Confrontation, Resolution)
- Hero's Journey (Campbell's monomyth)
- Save the Cat! (15-beat structure)
- Kishōtenketsu (Japanese 4-act structure without conflict)
- Freytag's Pyramid (exposition, rising action, climax, falling action, resolution)
- Seven-Point Structure (Hook, Plot Turn 1, Pinch Point 1, Midpoint, Pinch Point 2, Plot Turn 2, Resolution)

Content to analyze:
${content.substring(0, 3000)}...

Respond with only the framework name that best matches.`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 50,
        temperature: 0.1,
      });

      // Map response to framework enum
      const frameworkMap: Record<string, StoryFramework> = {
        'three-act': StoryFramework.THREE_ACT,
        'three act': StoryFramework.THREE_ACT,
        'hero\'s journey': StoryFramework.HEROS_JOURNEY,
        'heros journey': StoryFramework.HEROS_JOURNEY,
        'save the cat': StoryFramework.SAVE_THE_CAT,
        'kishōtenketsu': StoryFramework.KISHOTENKETSU,
        'kishotenketsu': StoryFramework.KISHOTENKETSU,
        'freytag': StoryFramework.FREYTAGS_PYRAMID,
        'seven-point': StoryFramework.SEVEN_POINT,
        'seven point': StoryFramework.SEVEN_POINT,
      };

      const detected = frameworkMap[response.toLowerCase()] || StoryFramework.THREE_ACT;
      
      logger.info('Framework auto-detected', {
        detected,
        contentLength: content.length,
      });

      return detected;

    } catch (error) {
      logger.warn('Framework detection failed, using default', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return StoryFramework.THREE_ACT;
    }
  }

  /**
   * Analyze adherence to specific framework
   */
  private async analyzeFrameworkAdherence(
    content: string,
    framework: StoryFramework
  ): Promise<DetectedStructure> {
    const config = frameworkConfigs[framework];
    if (!config) {
      throw new Error(`Unsupported framework: ${framework}`);
    }

    const prompt = this.buildFrameworkPrompt(content, framework, config);
    
    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 1000,
        temperature: 0.2,
      });

      const analysis = JSON.parse(response);
      
      return {
        framework,
        confidence: analysis.confidence || 50,
        keyBeats: analysis.keyBeats || [],
        missing: analysis.missing || [],
      };

    } catch (error) {
      logger.error('Framework adherence analysis failed', {
        framework,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return minimal structure on failure
      return {
        framework,
        confidence: 30,
        keyBeats: [],
        missing: ['Analysis failed'],
      };
    }
  }

  /**
   * Build framework-specific analysis prompt
   */
  private buildFrameworkPrompt(
    content: string,
    framework: StoryFramework,
    config: any
  ): string {
    const basePrompt = `Analyze this story content for adherence to the ${framework} structure.`;
    
    switch (framework) {
      case StoryFramework.THREE_ACT:
        return `${basePrompt}

Look for these key elements:
- Act 1 (Setup, ~25%): Hook, Inciting Incident, Plot Point 1
- Act 2 (Confrontation, ~50%): Development, Midpoint, Plot Point 2  
- Act 3 (Resolution, ~25%): Climax, Resolution

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "confidence": 0-100,
  "keyBeats": [
    {"name": "Hook", "position": 0-100, "present": true/false, "strength": 0-100},
    {"name": "Inciting Incident", "position": 0-100, "present": true/false, "strength": 0-100}
  ],
  "missing": ["list of missing elements"]
}`;

      case StoryFramework.HEROS_JOURNEY:
        return `${basePrompt}

Look for these stages of the Hero's Journey:
1. Ordinary World
2. Call to Adventure
3. Refusal of the Call
4. Meeting the Mentor
5. Crossing the First Threshold
6. Tests, Allies, and Enemies
7. Approach to the Inmost Cave
8. Ordeal
9. Reward
10. The Road Back
11. Resurrection
12. Return with the Elixir

Content:
${content.substring(0, 4000)}...

Respond with JSON analyzing which stages are present and their effectiveness.`;

      case StoryFramework.KISHOTENKETSU:
        return `${basePrompt}

This is a Japanese narrative structure with four parts:
- Ki (Introduction): Establish characters and setting
- Sho (Development): Develop the situation  
- Ten (Twist): Present an unexpected development
- Ketsu (Conclusion): Bring everything together

Note: This structure typically does NOT rely on conflict as the primary driver.

Content:
${content.substring(0, 4000)}...

Respond with JSON analyzing the presence of each part and noting whether conflict-driven or harmony-focused.`;

      default:
        return `${basePrompt}

Content:
${content.substring(0, 4000)}...

Analyze the structural elements present and provide JSON response.`;
    }
  }

  /**
   * Analyze act structure
   */
  private async analyzeActs(
    content: string,
    framework: StoryFramework
  ): Promise<ActAnalysis[]> {
    const prompt = `
Analyze the act structure of this story content. Identify:
1. Where each act begins and ends (as percentage of total story)
2. The primary purpose of each act
3. Key events in each act
4. How effectively each act serves its purpose

Framework: ${framework}

Content:
${content.substring(0, 4000)}...

Respond with JSON array of acts:
[
  {
    "act": 1,
    "startPosition": 0,
    "endPosition": 25,
    "purpose": "Setup and introduction",
    "effectiveness": 0-100,
    "keyEvents": ["Event 1", "Event 2"]
  }
]`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 800,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Act analysis failed', {
        framework,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return default structure on failure
      return [
        {
          act: 1,
          startPosition: 0,
          endPosition: 25,
          purpose: 'Setup',
          effectiveness: 50,
          keyEvents: ['Analysis failed'],
        },
      ];
    }
  }

  /**
   * Identify plot points in the story
   */
  private async identifyPlotPoints(
    content: string,
    framework: StoryFramework
  ): Promise<PlotPoint[]> {
    const prompt = `
Identify the major plot points in this story content:

Key plot points to look for:
- Hook/Opening
- Inciting Incident
- Plot Point 1 (First turning point)
- Midpoint
- Plot Point 2 (Second turning point)  
- Climax
- Resolution

For each plot point found, provide:
- Type of plot point
- Position in story (0-100%)
- Description of what happens
- How important it is to the story (0-100)
- Whether it connects well to other plot points

Content:
${content.substring(0, 4000)}...

Respond with JSON array of plot points.`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 1000,
        temperature: 0.2,
      });

      const plotPoints = JSON.parse(response);
      
      return plotPoints.map((point: any) => ({
        id: `plot_${Date.now()}_${Math.random()}`,
        type: point.type as PlotPointType,
        position: point.position,
        description: point.description,
        importance: point.importance,
        connected: point.connected,
      }));

    } catch (error) {
      logger.error('Plot point identification failed', {
        framework,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return [];
    }
  }

  /**
   * Analyze conflicts in the story
   */
  private async analyzeConflicts(content: string): Promise<ConflictAnalysis[]> {
    const prompt = `
Analyze the conflicts present in this story. Look for:

Types of conflict:
- Person vs Person (external interpersonal conflict)
- Person vs Self (internal psychological conflict)
- Person vs Society (conflict with social norms/institutions)
- Person vs Nature (conflict with natural forces)
- Person vs Technology (conflict with technology/machines)
- Person vs Fate/Supernatural (conflict with destiny/supernatural forces)

For each conflict:
- Type of conflict
- Intensity level (0-100)
- Characters involved
- How/if it gets resolved
- How the conflict escalates throughout the story

Content:
${content.substring(0, 4000)}...

Respond with JSON array of conflicts.`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 800,
        temperature: 0.2,
      });

      const conflicts = JSON.parse(response);
      
      return conflicts.map((conflict: any) => ({
        type: conflict.type as ConflictType,
        intensity: conflict.intensity,
        resolution: conflict.resolution as ConflictResolution,
        characters: conflict.characters || [],
        escalation: conflict.escalation || [],
      }));

    } catch (error) {
      logger.error('Conflict analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return [];
    }
  }

  /**
   * Analyze structure pacing
   */
  private async analyzeStructurePacing(
    content: string,
    framework: StoryFramework
  ): Promise<StructurePacing> {
    const prompt = `
Analyze the pacing of story structure elements:

1. What percentage of the story is devoted to setup/exposition?
2. What percentage is devoted to rising action/confrontation?
3. What percentage is devoted to climax and resolution?
4. Are these percentages appropriate for the ${framework} framework?
5. What pacing improvements would you recommend?

Content:
${content.substring(0, 4000)}...

Respond with JSON:
{
  "setup": 0-100,
  "confrontation": 0-100,
  "resolution": 0-100,
  "balanced": true/false,
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 400,
        temperature: 0.2,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Structure pacing analysis failed', {
        framework,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return reasonable defaults
      return {
        setup: 25,
        confrontation: 50,
        resolution: 25,
        balanced: true,
        recommendations: ['Analysis failed - unable to provide recommendations'],
      };
    }
  }

  /**
   * Get framework-specific recommendations
   */
  async getFrameworkRecommendations(
    analysis: StructureAnalysis,
    content: string
  ): Promise<string[]> {
    const prompt = `
Based on this structural analysis of a ${analysis.framework} story, provide specific recommendations for improvement:

Analysis:
- Framework adherence: ${analysis.adherence}%
- Missing elements: ${analysis.detected.missing.join(', ')}
- Act balance: Setup ${analysis.pacing.setup}%, Confrontation ${analysis.pacing.confrontation}%, Resolution ${analysis.pacing.resolution}%

Provide 3-5 specific, actionable recommendations for improving the story structure.
Focus on the most impactful changes first.

Respond with JSON array of strings.`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 600,
        temperature: 0.3,
      });

      return JSON.parse(response);

    } catch (error) {
      logger.error('Framework recommendations failed', {
        framework: analysis.framework,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return [
        'Unable to generate specific recommendations due to analysis error.',
        'Consider reviewing the basic structure elements of your chosen framework.',
      ];
    }
  }
}