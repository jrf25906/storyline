import OpenAI from 'openai';
import { VectorStorageService } from './VectorStorageService';
import { GraphStorageService } from './GraphStorageService';
import { contradictionConfig } from '../config/memory';
import {
  ExtendedMemory,
  ContradictionDetectionResult,
  EnhancedContradiction,
  ContradictionSuggestion,
  MemoryVersion
} from '../types';
import { logger } from '../utils/logger';

/**
 * Service for detecting and managing contradictions in memory evolution
 */
export class ContradictionService {
  private openaiClient: OpenAI;
  private vectorService: VectorStorageService;
  private graphService: GraphStorageService;

  constructor(vectorService: VectorStorageService, graphService: GraphStorageService) {
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.vectorService = vectorService;
    this.graphService = graphService;
  }

  /**
   * Detect contradictions in a new memory against existing memories
   */
  async detectContradictions(newMemory: ExtendedMemory): Promise<ContradictionDetectionResult> {
    try {
      const startTime = Date.now();

      // Find similar memories for comparison
      const similarMemories = await this.vectorService.findSimilarMemories(
        newMemory,
        contradictionConfig.similarityThreshold,
        10
      );

      if (similarMemories.length === 0) {
        return {
          contradictions: [],
          confidence: 1.0,
          suggestions: [],
        };
      }

      const contradictions: EnhancedContradiction[] = [];

      // Check each similar memory for contradictions
      for (const similarMemory of similarMemories) {
        const memoryContradictions = await this.analyzeMemoryPair(newMemory, similarMemory);
        contradictions.push(...memoryContradictions);
      }

      // Filter contradictions by confidence threshold
      const filteredContradictions = contradictions.filter(
        c => c.confidence >= contradictionConfig.confidenceThreshold
      );

      // Generate suggestions for handling contradictions
      const suggestions = await this.generateSuggestions(newMemory, filteredContradictions);

      const detectionTime = Date.now() - startTime;

      logger.debug('Contradiction detection completed', {
        memoryId: newMemory.id,
        userId: newMemory.userId,
        similarMemoriesChecked: similarMemories.length,
        contradictionsFound: filteredContradictions.length,
        detectionTime,
      });

      return {
        contradictions: filteredContradictions,
        confidence: this.calculateOverallConfidence(filteredContradictions),
        suggestions,
      };

    } catch (error) {
      logger.error('Failed to detect contradictions:', error, {
        memoryId: newMemory.id,
        userId: newMemory.userId,
      });
      throw error;
    }
  }

  /**
   * Analyze a pair of memories for contradictions
   */
  private async analyzeMemoryPair(
    newMemory: ExtendedMemory,
    existingMemory: ExtendedMemory
  ): Promise<EnhancedContradiction[]> {
    const contradictions: EnhancedContradiction[] = [];

    // Check for timeline contradictions
    const timelineContradiction = this.checkTimelineContradiction(newMemory, existingMemory);
    if (timelineContradiction) {
      contradictions.push(timelineContradiction);
    }

    // Check for emotional tone contradictions
    const emotionalContradiction = await this.checkEmotionalContradiction(newMemory, existingMemory);
    if (emotionalContradiction) {
      contradictions.push(emotionalContradiction);
    }

    // Check for factual contradictions using AI
    const factualContradictions = await this.checkFactualContradictions(newMemory, existingMemory);
    contradictions.push(...factualContradictions);

    // Check for character behavior contradictions
    const characterContradictions = await this.checkCharacterContradictions(newMemory, existingMemory);
    contradictions.push(...characterContradictions);

    return contradictions;
  }

  /**
   * Check for timeline contradictions
   */
  private checkTimelineContradiction(
    newMemory: ExtendedMemory,
    existingMemory: ExtendedMemory
  ): EnhancedContradiction | null {
    const newVersion = newMemory.versions[newMemory.versions.length - 1];
    const existingVersion = existingMemory.versions[existingMemory.versions.length - 1];

    if (!newVersion || !existingVersion) return null;

    // Look for explicit temporal references that contradict
    const timeKeywords = ['before', 'after', 'during', 'when', 'while', 'then', 'first', 'last'];
    const newHasTime = timeKeywords.some(keyword => 
      newMemory.content.toLowerCase().includes(keyword)
    );
    const existingHasTime = timeKeywords.some(keyword => 
      existingMemory.content.toLowerCase().includes(keyword)
    );

    if (newHasTime && existingHasTime) {
      // Use simple heuristic for timeline contradiction
      const timeDiff = Math.abs(newMemory.timestamp.getTime() - existingMemory.timestamp.getTime());
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      if (daysDiff > contradictionConfig.timeWindowDays) {
        return {
          memoryId: existingMemory.id,
          type: 'timeline',
          description: `Timeline inconsistency detected between memories created ${daysDiff.toFixed(0)} days apart`,
          severity: 'medium',
          confidence: 0.7,
          affectedMemories: [newMemory.id, existingMemory.id],
          narrativeImpact: 'neutral',
          suggestions: [],
        };
      }
    }

    return null;
  }

  /**
   * Check for emotional tone contradictions
   */
  private async checkEmotionalContradiction(
    newMemory: ExtendedMemory,
    existingMemory: ExtendedMemory
  ): Promise<EnhancedContradiction | null> {
    const newVersion = newMemory.versions[newMemory.versions.length - 1];
    const existingVersion = existingMemory.versions[existingMemory.versions.length - 1];

    if (!newVersion?.emotionalTone || !existingVersion?.emotionalTone) return null;

    // Define emotional tone categories and their relationships
    const emotionalCategories = {
      positive: ['joy', 'happiness', 'love', 'gratitude', 'peace', 'contentment'],
      negative: ['sadness', 'anger', 'fear', 'grief', 'anxiety', 'despair'],
      neutral: ['acceptance', 'reflection', 'understanding', 'curiosity'],
    };

    const getEmotionalCategory = (tone: string) => {
      const lowerTone = tone.toLowerCase();
      if (emotionalCategories.positive.some(e => lowerTone.includes(e))) return 'positive';
      if (emotionalCategories.negative.some(e => lowerTone.includes(e))) return 'negative';
      return 'neutral';
    };

    const newCategory = getEmotionalCategory(newVersion.emotionalTone);
    const existingCategory = getEmotionalCategory(existingVersion.emotionalTone);

    // Check for significant emotional shift
    if ((newCategory === 'positive' && existingCategory === 'negative') ||
        (newCategory === 'negative' && existingCategory === 'positive')) {
      
      const timeDiff = Math.abs(newMemory.timestamp.getTime() - existingMemory.timestamp.getTime());
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      return {
        memoryId: existingMemory.id,
        type: 'emotion',
        description: `Significant emotional shift from ${existingVersion.emotionalTone} to ${newVersion.emotionalTone}`,
        severity: daysDiff < 7 ? 'high' : 'medium',
        confidence: 0.8,
        affectedMemories: [newMemory.id, existingMemory.id],
        narrativeImpact: 'positive', // Emotional evolution is often positive for memoir
        suggestions: [],
      };
    }

    return null;
  }

  /**
   * Check for factual contradictions using AI
   */
  private async checkFactualContradictions(
    newMemory: ExtendedMemory,
    existingMemory: ExtendedMemory
  ): Promise<EnhancedContradiction[]> {
    try {
      const prompt = `
        Analyze these two memory excerpts for factual contradictions:

        Memory 1 (${existingMemory.timestamp.toISOString()}):
        "${existingMemory.content}"

        Memory 2 (${newMemory.timestamp.toISOString()}):
        "${newMemory.content}"

        Identify any factual contradictions between these memories. Consider:
        - Contradictory statements about events, people, or places
        - Inconsistent details about the same experience
        - Conflicting information about relationships or circumstances

        Respond in JSON format:
        {
          "contradictions": [
            {
              "type": "fact|character|setting",
              "description": "Brief description of the contradiction",
              "severity": "low|medium|high",
              "confidence": 0.0-1.0,
              "evidence": "Specific quotes or details that contradict"
            }
          ]
        }

        If no contradictions are found, return {"contradictions": []}.
      `;

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"contradictions": []}');
      const contradictions: EnhancedContradiction[] = [];

      for (const contradiction of result.contradictions) {
        contradictions.push({
          memoryId: existingMemory.id,
          type: contradiction.type,
          description: contradiction.description,
          severity: contradiction.severity,
          confidence: contradiction.confidence,
          affectedMemories: [newMemory.id, existingMemory.id],
          narrativeImpact: 'negative', // Factual contradictions typically need resolution
          suggestions: [],
        });
      }

      return contradictions;

    } catch (error) {
      logger.warn('Failed to check factual contradictions with AI:', error);
      return [];
    }
  }

  /**
   * Check for character behavior contradictions
   */
  private async checkCharacterContradictions(
    newMemory: ExtendedMemory,
    existingMemory: ExtendedMemory
  ): Promise<EnhancedContradiction[]> {
    const newVersion = newMemory.versions[newMemory.versions.length - 1];
    const existingVersion = existingMemory.versions[existingMemory.versions.length - 1];

    if (!newVersion?.narrativeElements.characters_mentioned ||
        !existingVersion?.narrativeElements.characters_mentioned) {
      return [];
    }

    // Find common characters
    const commonCharacters = newVersion.narrativeElements.characters_mentioned.filter(char =>
      existingVersion.narrativeElements.characters_mentioned?.includes(char)
    );

    if (commonCharacters.length === 0) return [];

    try {
      const prompt = `
        Analyze these two memories for character behavior contradictions:

        Memory 1: "${existingMemory.content}"
        Memory 2: "${newMemory.content}"

        Common characters: ${commonCharacters.join(', ')}

        Look for inconsistencies in:
        - Character personality or behavior patterns
        - Relationships between characters
        - Character motivations or reactions

        Respond in JSON format with any contradictions found.
      `;

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 800,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"contradictions": []}');
      const contradictions: EnhancedContradiction[] = [];

      for (const contradiction of result.contradictions) {
        contradictions.push({
          memoryId: existingMemory.id,
          type: 'character',
          description: contradiction.description,
          severity: contradiction.severity || 'medium',
          confidence: contradiction.confidence || 0.6,
          affectedMemories: [newMemory.id, existingMemory.id],
          narrativeImpact: 'neutral',
          suggestions: [],
        });
      }

      return contradictions;

    } catch (error) {
      logger.warn('Failed to check character contradictions:', error);
      return [];
    }
  }

  /**
   * Generate suggestions for handling contradictions
   */
  private async generateSuggestions(
    newMemory: ExtendedMemory,
    contradictions: EnhancedContradiction[]
  ): Promise<ContradictionSuggestion[]> {
    if (contradictions.length === 0) return [];

    try {
      const prompt = `
        Given these memory contradictions, suggest how to handle them in a memoir context:

        New Memory: "${newMemory.content}"
        
        Contradictions:
        ${contradictions.map(c => `- ${c.type}: ${c.description}`).join('\n')}

        For each contradiction, suggest one of these actions:
        - replace: Replace the old memory with the new understanding
        - layer: Keep both perspectives and explain the evolution
        - explore: Investigate the difference further with the user
        - merge: Combine insights from both memories
        - ignore: The contradiction doesn't impact the narrative

        Respond in JSON format:
        {
          "suggestions": [
            {
              "action": "replace|layer|explore|merge|ignore",
              "reason": "Why this action is recommended",
              "confidence": 0.0-1.0,
              "narrativeImprovement": "How this helps the memoir"
            }
          ]
        }
      `;

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return result.suggestions;

    } catch (error) {
      logger.warn('Failed to generate contradiction suggestions:', error);

      // Provide default suggestions based on contradiction types
      return contradictions.map(c => ({
        action: c.type === 'emotion' ? 'layer' : 'explore',
        reason: `Default suggestion for ${c.type} contradiction`,
        confidence: 0.5,
        narrativeImprovement: 'Allows for deeper exploration of memory evolution',
      }));
    }
  }

  /**
   * Calculate overall confidence for contradiction detection
   */
  private calculateOverallConfidence(contradictions: EnhancedContradiction[]): number {
    if (contradictions.length === 0) return 1.0;

    const avgConfidence = contradictions.reduce((sum, c) => sum + c.confidence, 0) / contradictions.length;
    const severityMultiplier = contradictions.some(c => c.severity === 'high') ? 1.2 : 1.0;
    
    return Math.min(avgConfidence * severityMultiplier, 1.0);
  }

  /**
   * Resolve a contradiction by updating memory versions
   */
  async resolveContradiction(
    memoryId: string,
    contradictionId: string,
    resolution: 'replace' | 'layer' | 'merge',
    newContent?: string
  ): Promise<void> {
    try {
      // This would typically update the memory with resolution information
      // Implementation depends on how contradictions are stored and tracked
      
      logger.info('Contradiction resolved', {
        memoryId,
        contradictionId,
        resolution,
      });

    } catch (error) {
      logger.error('Failed to resolve contradiction:', error, {
        memoryId,
        contradictionId,
        resolution,
      });
      throw error;
    }
  }

  /**
   * Get contradiction statistics for a user
   */
  async getContradictionStats(userId: string): Promise<any> {
    try {
      // This would query the database for contradiction statistics
      // For now, return placeholder data
      
      return {
        totalContradictions: 0,
        resolvedContradictions: 0,
        pendingContradictions: 0,
        contradictionTypes: {
          emotion: 0,
          fact: 0,
          character: 0,
          timeline: 0,
        },
      };

    } catch (error) {
      logger.error('Failed to get contradiction stats:', error, {
        userId,
      });
      throw error;
    }
  }
}