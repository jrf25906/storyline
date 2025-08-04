import {
  TraumaInformedNote,
  TraumaType,
  TreatmentSeverity,
  WritingSuggestion,
  SuggestionType,
  Priority,
  SuggestionCategory,
} from '../types';
import { traumaInformedResponses } from '../config/analysis';
import { logger, logTraumaIntervention } from '../utils/logger';
import { AIProviderService } from './AIProviderService';

/**
 * Service for trauma-informed analysis and response
 * Provides safe, supportive feedback for sensitive content
 */
export class TraumaInformedService {
  private aiProvider: AIProviderService;
  private crisisKeywords: string[];
  private gentleThreshold: number;
  private professionalThreshold: number;
  private crisisThreshold: number;

  constructor(
    aiProvider: AIProviderService,
    config: {
      crisisKeywords: string[];
      gentleThreshold: number;
      professionalThreshold: number;
      crisisThreshold: number;
    }
  ) {
    this.aiProvider = aiProvider;
    this.crisisKeywords = config.crisisKeywords;
    this.gentleThreshold = config.gentleThreshold;
    this.professionalThreshold = config.professionalThreshold;
    this.crisisThreshold = config.crisisThreshold;
  }

  /**
   * Analyze content for trauma-informed considerations
   */
  async analyzeForTrauma(
    content: string,
    userId: string,
    projectId: string
  ): Promise<{
    notes: TraumaInformedNote[];
    suggestions: WritingSuggestion[];
    requiresIntervention: boolean;
    severity: TreatmentSeverity;
  }> {
    try {
      // Check for crisis indicators first
      const crisisCheck = await this.checkForCrisisIndicators(content);
      
      // Analyze emotional processing needs
      const emotionalAnalysis = await this.analyzeEmotionalProcessing(content);
      
      // Generate trauma-informed suggestions
      const suggestions = await this.generateTraumaInformedSuggestions(
        content,
        crisisCheck.severity,
        emotionalAnalysis
      );

      // Determine overall severity and intervention needs
      const overallSeverity = this.determineOverallSeverity(
        crisisCheck.severity,
        emotionalAnalysis.severity
      );

      const requiresIntervention = overallSeverity !== TreatmentSeverity.GENTLE;

      // Log intervention if needed
      if (requiresIntervention) {
        logTraumaIntervention({
          userId,
          projectId,
          severity: overallSeverity,
          triggers: [...crisisCheck.triggers, ...emotionalAnalysis.triggers],
          responseType: this.getResponseType(overallSeverity),
          resourcesProvided: overallSeverity === TreatmentSeverity.PROFESSIONAL || 
                           overallSeverity === TreatmentSeverity.CRISIS,
        });
      }

      return {
        notes: [...crisisCheck.notes, ...emotionalAnalysis.notes],
        suggestions,
        requiresIntervention,
        severity: overallSeverity,
      };

    } catch (error) {
      logger.error('Trauma-informed analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        projectId,
      });

      // Return safe defaults on error
      return {
        notes: [{
          id: `trauma_${Date.now()}`,
          type: TraumaType.EMOTIONAL_PROCESSING,
          severity: TreatmentSeverity.GENTLE,
          suggestion: 'Analysis temporarily unavailable. Please reach out if you need support.',
          professionalRecommendation: false,
        }],
        suggestions: [],
        requiresIntervention: false,
        severity: TreatmentSeverity.GENTLE,
      };
    }
  }

  /**
   * Check for crisis indicators
   */
  private async checkForCrisisIndicators(content: string): Promise<{
    severity: TreatmentSeverity;
    triggers: string[];
    notes: TraumaInformedNote[];
  }> {
    // First, check for explicit crisis keywords
    const keywordMatches = this.crisisKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    if (keywordMatches.length > 0) {
      logger.warn('Crisis keywords detected', {
        keywords: keywordMatches,
        contentLength: content.length,
      });

      return {
        severity: TreatmentSeverity.CRISIS,
        triggers: keywordMatches,
        notes: [{
          id: `crisis_${Date.now()}`,
          type: TraumaType.CRISIS_INDICATION,
          severity: TreatmentSeverity.CRISIS,
          suggestion: traumaInformedResponses.crisis.acknowledgment,
          resources: [
            'National Suicide Prevention Lifeline: 988',
            'Crisis Text Line: Text HOME to 741741',
            'International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/',
          ],
          professionalRecommendation: true,
        }],
      };
    }

    // Use AI to detect subtle crisis indicators
    const prompt = `
Analyze this content for subtle indicators of emotional crisis or immediate safety concerns.
Look for indirect expressions of:
- Suicidal ideation
- Self-harm thoughts
- Feelings of hopelessness
- Crisis situations

Rate the crisis level from 0-100 where:
- 0-30: No immediate concerns
- 31-60: Some emotional distress
- 61-80: Concerning content, professional support recommended
- 81-100: Crisis level, immediate intervention needed

Content:
${content.substring(0, 3000)}...

Respond with JSON:
{
  "crisisLevel": 0-100,
  "indicators": ["specific concerning phrases or themes"],
  "reasoning": "Brief explanation of assessment"
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 400,
        temperature: 0.1,
      });

      const analysis = JSON.parse(response);
      const severity = this.scoresToSeverity(analysis.crisisLevel);

      const notes: TraumaInformedNote[] = [];
      if (analysis.crisisLevel > 30) {
        notes.push({
          id: `crisis_${Date.now()}`,
          type: TraumaType.CRISIS_INDICATION,
          severity,
          suggestion: this.getResponseForSeverity(severity),
          resources: severity === TreatmentSeverity.CRISIS || 
                    severity === TreatmentSeverity.PROFESSIONAL ? 
            ['National Suicide Prevention Lifeline: 988'] : undefined,
          professionalRecommendation: severity === TreatmentSeverity.PROFESSIONAL || 
                                     severity === TreatmentSeverity.CRISIS,
        });
      }

      return {
        severity,
        triggers: analysis.indicators || [],
        notes,
      };

    } catch (error) {
      logger.error('Crisis indicator analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        severity: TreatmentSeverity.GENTLE,
        triggers: [],
        notes: [],
      };
    }
  }

  /**
   * Analyze emotional processing needs
   */
  private async analyzeEmotionalProcessing(content: string): Promise<{
    severity: TreatmentSeverity;
    triggers: string[];
    notes: TraumaInformedNote[];
  }> {
    const prompt = `
Analyze this content for emotional processing indicators. Look for:
- Processing of difficult experiences
- Traumatic memories or events
- Emotional overwhelm
- Need for gentle support
- Therapeutic writing process

Rate the emotional intensity from 0-100 where:
- 0-30: Light emotional content
- 31-60: Moderate emotional processing
- 61-80: Intense emotional work
- 81-100: Deep trauma processing

Identify:
- Emotional themes being processed
- Level of support needed
- Whether professional resources might be helpful

Content:
${content.substring(0, 3000)}...

Respond with JSON:
{
  "emotionalIntensity": 0-100,
  "themes": ["theme1", "theme2"],
  "supportNeeded": "gentle|moderate|professional",
  "reasoning": "Brief explanation"
}`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 500,
        temperature: 0.2,
      });

      const analysis = JSON.parse(response);
      const severity = this.scoresToSeverity(analysis.emotionalIntensity);

      const notes: TraumaInformedNote[] = [];
      if (analysis.emotionalIntensity > 30) {
        notes.push({
          id: `emotional_${Date.now()}`,
          type: TraumaType.EMOTIONAL_PROCESSING,
          severity,
          suggestion: this.getEmotionalProcessingSuggestion(severity, analysis.themes),
          professionalRecommendation: severity === TreatmentSeverity.PROFESSIONAL,
        });
      }

      return {
        severity,
        triggers: analysis.themes || [],
        notes,
      };

    } catch (error) {
      logger.error('Emotional processing analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        severity: TreatmentSeverity.GENTLE,
        triggers: [],
        notes: [],
      };
    }
  }

  /**
   * Generate trauma-informed writing suggestions
   */
  private async generateTraumaInformedSuggestions(
    content: string,
    crisisSeverity: TreatmentSeverity,
    emotionalAnalysis: any
  ): Promise<WritingSuggestion[]> {
    if (crisisSeverity === TreatmentSeverity.CRISIS) {
      // For crisis situations, focus on safety rather than writing craft
      return [{
        id: `trauma_sugg_${Date.now()}`,
        type: SuggestionType.TRAUMA_INFORMED,
        priority: Priority.CRITICAL,
        category: SuggestionCategory.EMOTIONAL_SAFETY,
        title: 'Your Safety Comes First',
        description: 'Your wellbeing is more important than any writing project. Please consider reaching out for support.',
        traumaInformed: true,
        culturallySensitive: true,
      }];
    }

    const prompt = `
Based on this emotional content analysis, provide trauma-informed writing suggestions:

Emotional Intensity: ${emotionalAnalysis.emotionalIntensity}
Themes: ${emotionalAnalysis.themes?.join(', ') || 'none identified'}
Severity: ${crisisSeverity}

Provide 2-3 gentle, supportive suggestions that:
1. Acknowledge the courage it takes to write about difficult experiences
2. Offer techniques for emotional safety while writing
3. Suggest pacing and self-care strategies
4. Maintain respect for the user's process

Make suggestions trauma-informed, empowering, and supportive.

Respond with JSON array:
[
  {
    "title": "Suggestion title",
    "description": "Detailed description",
    "priority": "low|medium|high",
    "category": "emotional_safety"
  }
]`;

    try {
      const response = await this.aiProvider.generateCompletion(prompt, {
        maxTokens: 800,
        temperature: 0.3,
      });

      const suggestions = JSON.parse(response);
      
      return suggestions.map((sugg: any) => ({
        id: `trauma_sugg_${Date.now()}_${Math.random()}`,
        type: SuggestionType.TRAUMA_INFORMED,
        priority: sugg.priority as Priority,
        category: SuggestionCategory.EMOTIONAL_SAFETY,
        title: sugg.title,
        description: sugg.description,
        traumaInformed: true,
        culturallySensitive: true,
      }));

    } catch (error) {
      logger.error('Trauma-informed suggestions generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return [{
        id: `trauma_sugg_${Date.now()}`,
        type: SuggestionType.TRAUMA_INFORMED,
        priority: Priority.MEDIUM,
        category: SuggestionCategory.EMOTIONAL_SAFETY,
        title: 'Writing with Care',
        description: 'Remember to be gentle with yourself as you write about difficult experiences. Take breaks when needed.',
        traumaInformed: true,
        culturallySensitive: true,
      }];
    }
  }

  /**
   * Determine overall severity from multiple factors
   */
  private determineOverallSeverity(
    crisisSeverity: TreatmentSeverity,
    emotionalSeverity: TreatmentSeverity
  ): TreatmentSeverity {
    // Crisis always takes precedence
    if (crisisSeverity === TreatmentSeverity.CRISIS) {
      return TreatmentSeverity.CRISIS;
    }

    // Professional if either indicates professional need
    if (crisisSeverity === TreatmentSeverity.PROFESSIONAL || 
        emotionalSeverity === TreatmentSeverity.PROFESSIONAL) {
      return TreatmentSeverity.PROFESSIONAL;
    }

    // Moderate if either is moderate
    if (crisisSeverity === TreatmentSeverity.MODERATE || 
        emotionalSeverity === TreatmentSeverity.MODERATE) {
      return TreatmentSeverity.MODERATE;
    }

    return TreatmentSeverity.GENTLE;
  }

  /**
   * Convert numeric scores to severity levels
   */
  private scoresToSeverity(score: number): TreatmentSeverity {
    if (score >= this.crisisThreshold) {
      return TreatmentSeverity.CRISIS;
    } else if (score >= this.professionalThreshold) {
      return TreatmentSeverity.PROFESSIONAL;
    } else if (score >= this.gentleThreshold) {
      return TreatmentSeverity.MODERATE;
    } else {
      return TreatmentSeverity.GENTLE;
    }
  }

  /**
   * Get appropriate response for severity level
   */
  private getResponseForSeverity(severity: TreatmentSeverity): string {
    switch (severity) {
      case TreatmentSeverity.CRISIS:
        return traumaInformedResponses.crisis.acknowledgment;
      case TreatmentSeverity.PROFESSIONAL:
        return traumaInformedResponses.professional.acknowledgment;
      case TreatmentSeverity.MODERATE:
        return traumaInformedResponses.moderate.acknowledgment;
      default:
        return traumaInformedResponses.gentle.acknowledgment;
    }
  }

  /**
   * Get response type for logging
   */
  private getResponseType(severity: TreatmentSeverity): string {
    switch (severity) {
      case TreatmentSeverity.CRISIS:
        return 'crisis_intervention';
      case TreatmentSeverity.PROFESSIONAL:
        return 'professional_referral';
      case TreatmentSeverity.MODERATE:
        return 'moderate_support';
      default:
        return 'gentle_acknowledgment';
    }
  }

  /**
   * Get emotional processing suggestion based on severity and themes
   */
  private getEmotionalProcessingSuggestion(
    severity: TreatmentSeverity,
    themes: string[]
  ): string {
    const baseMessage = 'Writing can be a powerful way to process experiences. ';
    
    switch (severity) {
      case TreatmentSeverity.PROFESSIONAL:
        return baseMessage + 'Given the intensity of what you\'re exploring, professional support might be valuable alongside your writing process.';
      case TreatmentSeverity.MODERATE:
        return baseMessage + 'Remember to pace yourself and take care of your emotional wellbeing while writing about these experiences.';
      default:
        return baseMessage + 'This is a safe space to explore your thoughts and feelings through writing.';
    }
  }

  /**
   * Check if content requires immediate intervention
   */
  async requiresImmediateIntervention(content: string): Promise<boolean> {
    const crisisCheck = await this.checkForCrisisIndicators(content);
    return crisisCheck.severity === TreatmentSeverity.CRISIS;
  }

  /**
   * Generate supportive resources based on content
   */
  async generateSupportiveResources(
    severity: TreatmentSeverity,
    themes: string[]
  ): Promise<string[]> {
    const resources: string[] = [];

    if (severity === TreatmentSeverity.CRISIS) {
      resources.push(
        'National Suicide Prevention Lifeline: 988',
        'Crisis Text Line: Text HOME to 741741',
        'International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/'
      );
    } else if (severity === TreatmentSeverity.PROFESSIONAL) {
      resources.push(
        'Psychology Today Therapist Finder: https://www.psychologytoday.com/us/therapists',
        'SAMHSA National Helpline: 1-800-662-HELP',
        'National Alliance on Mental Illness: https://www.nami.org/help'
      );
    } else if (severity === TreatmentSeverity.MODERATE) {
      resources.push(
        'Mindfulness and self-care techniques',
        'Writing therapy resources and guided exercises',
        'Support groups for writers processing difficult experiences'
      );
    }

    // Add theme-specific resources
    if (themes.includes('grief') || themes.includes('loss')) {
      resources.push('GriefShare support groups: https://www.griefshare.org/');
    }

    if (themes.includes('trauma') || themes.includes('abuse')) {
      resources.push('RAINN National Sexual Assault Hotline: 1-800-656-HOPE');
    }

    return resources;
  }
}