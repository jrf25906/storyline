import { Request, Response } from 'express';
import { NarrativeAnalysisService } from '../services/NarrativeAnalysisService';
import { 
  AnalysisRequest, 
  AnalysisConfig, 
  StoryFramework, 
  AnalysisDepth, 
  AIProvider 
} from '../types';
import { logger, logUserAction } from '../utils/logger';
import { AuthenticatedRequest, extractUserContext } from '../middleware/auth';
import { NarrativeAnalysisError, ErrorTypes } from '../middleware/errorHandler';

/**
 * Controller for narrative analysis endpoints
 */
export class AnalysisController {
  private narrativeService: NarrativeAnalysisService;

  constructor() {
    this.narrativeService = new NarrativeAnalysisService();
    logger.info('AnalysisController initialized');
  }

  /**
   * Perform comprehensive narrative analysis
   */
  analyze = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { userId, userRole, isAuthenticated } = extractUserContext(req);

    try {
      const {
        content,
        projectId,
        config = {},
        metadata = {},
      } = req.body;

      // Log user action
      logUserAction({
        userId,
        action: 'narrative_analysis_requested',
        projectId,
        metadata: {
          contentLength: content.length,
          framework: config.framework,
          depth: config.depth,
          traumaInformed: config.traumaInformed,
        },
      });

      // Build analysis configuration
      const analysisConfig: AnalysisConfig = {
        framework: this.parseFramework(config.framework) || StoryFramework.THREE_ACT,
        culturalSensitivity: config.culturalSensitivity !== false, // Default to true
        traumaInformed: config.traumaInformed !== false, // Default to true
        realTime: config.realTime === true,
        depth: this.parseDepth(config.depth) || AnalysisDepth.STANDARD,
        aiProvider: this.parseAIProvider(config.aiProvider) || AIProvider.OPENAI,
      };

      // Create analysis request
      const analysisRequest: AnalysisRequest = {
        userId,
        projectId,
        content,
        config: analysisConfig,
        metadata: {
          ...metadata,
          userRole,
          isAuthenticated,
          requestTime: new Date().toISOString(),
        },
      };

      // Perform analysis
      const result = await this.narrativeService.analyzeNarrative(analysisRequest);

      // Log completion
      logUserAction({
        userId,
        action: 'narrative_analysis_completed',
        projectId,
        metadata: {
          success: result.success,
          processingTime: result.processingTime,
          analysisId: result.analysis?.id,
        },
      });

      res.json({
        ...result,
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Analysis request failed', {
        userId,
        projectId: req.body.projectId,
        error: errorMessage,
        processingTime,
      });

      // Log failed action
      logUserAction({
        userId,
        action: 'narrative_analysis_failed',
        projectId: req.body.projectId,
        metadata: {
          error: errorMessage,
          processingTime,
        },
      });

      throw error;
    }
  };

  /**
   * Get analysis by ID
   */
  getAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { analysisId } = req.params;
    const { userId } = extractUserContext(req);

    try {
      // TODO: Implement analysis retrieval from database
      // For now, return a placeholder response
      
      logUserAction({
        userId,
        action: 'analysis_retrieved',
        metadata: { analysisId },
      });

      res.json({
        success: true,
        message: 'Analysis retrieval not yet implemented',
        analysisId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Failed to retrieve analysis', {
        analysisId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  /**
   * Get user's analysis history
   */
  getAnalysisHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { userId } = extractUserContext(req);
    const { projectId, limit = 10, offset = 0 } = req.query;

    try {
      // TODO: Implement analysis history retrieval from database
      
      logUserAction({
        userId,
        action: 'analysis_history_requested',
        projectId: projectId as string,
        metadata: { limit, offset },
      });

      res.json({
        success: true,
        message: 'Analysis history retrieval not yet implemented',
        data: {
          analyses: [],
          total: 0,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Failed to retrieve analysis history', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  /**
   * Delete analysis
   */
  deleteAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { analysisId } = req.params;
    const { userId } = extractUserContext(req);

    try {
      // TODO: Implement analysis deletion from database
      
      logUserAction({
        userId,
        action: 'analysis_deleted',
        metadata: { analysisId },
      });

      res.json({
        success: true,
        message: 'Analysis deleted successfully',
        analysisId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Failed to delete analysis', {
        analysisId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  /**
   * Get service health status
   */
  getHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.narrativeService.getHealthStatus();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json({
        ...health,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      });

    } catch (error) {
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Get supported frameworks and configurations
   */
  getCapabilities = async (req: Request, res: Response): Promise<void> => {
    try {
      const capabilities = {
        frameworks: Object.values(StoryFramework),
        culturalTypes: [
          'western_linear',
          'kishoten_ketsu',
          'circular_narrative',
          'episodic',
          'oral_tradition',
          'mythological',
          'indigenous',
          'eastern_philosophical',
        ],
        analysisDepths: Object.values(AnalysisDepth),
        aiProviders: Object.values(AIProvider),
        features: {
          storyStructureAnalysis: true,
          characterDevelopment: true,
          themeAnalysis: true,
          writingCraftAnalysis: true,
          traumaInformedAnalysis: true,
          culturalSensitivity: true,
          realTimeAnalysis: false, // Not yet implemented
          batchAnalysis: true,
        },
        limits: {
          maxContentLength: parseInt(process.env.MAX_CONTENT_LENGTH || '500000'),
          minContentLength: 100,
          maxAnalysesPerMinute: 10,
          maxConcurrentAnalyses: 5,
        },
      };

      res.json({
        success: true,
        data: capabilities,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Capabilities request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  /**
   * Validate content before analysis
   */
  validateContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { content } = req.body;

      if (!content) {
        throw new NarrativeAnalysisError(
          'Content is required',
          400,
          ErrorTypes.VALIDATION_ERROR
        );
      }

      const trimmedContent = content.trim();
      const wordCount = trimmedContent.split(/\s+/).length;
      const characterCount = trimmedContent.length;
      const estimatedTokens = Math.ceil(characterCount / 4);

      const validation = {
        valid: true,
        issues: [] as string[],
        warnings: [] as string[],
        stats: {
          characterCount,
          wordCount,
          estimatedTokens,
        },
      };

      // Check minimum length
      if (characterCount < 100) {
        validation.valid = false;
        validation.issues.push('Content too short for meaningful analysis (minimum 100 characters)');
      }

      // Check maximum length
      const maxLength = parseInt(process.env.MAX_CONTENT_LENGTH || '500000');
      if (characterCount > maxLength) {
        validation.valid = false;
        validation.issues.push(`Content exceeds maximum length of ${maxLength} characters`);
      }

      // Check for very short content that might still analyze but with limited insights
      if (characterCount < 500 && characterCount >= 100) {
        validation.warnings.push('Short content may result in limited analysis insights');
      }

      // Check for very long content that might timeout
      if (characterCount > 100000) {
        validation.warnings.push('Large content may take longer to analyze');
      }

      res.json({
        success: true,
        data: validation,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Content validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  /**
   * Parse framework from string input
   */
  private parseFramework(framework?: string): StoryFramework | undefined {
    if (!framework) return undefined;
    
    const frameworkMap: Record<string, StoryFramework> = {
      'three_act': StoryFramework.THREE_ACT,
      'three-act': StoryFramework.THREE_ACT,
      'heros_journey': StoryFramework.HEROS_JOURNEY,
      'hero-journey': StoryFramework.HEROS_JOURNEY,
      'save_the_cat': StoryFramework.SAVE_THE_CAT,
      'save-the-cat': StoryFramework.SAVE_THE_CAT,
      'kishotenketsu': StoryFramework.KISHOTENKETSU,
      'freytags_pyramid': StoryFramework.FREYTAGS_PYRAMID,
      'freytag': StoryFramework.FREYTAGS_PYRAMID,
      'seven_point': StoryFramework.SEVEN_POINT,
      'seven-point': StoryFramework.SEVEN_POINT,
      'fichtean_curve': StoryFramework.FICHTEAN_CURVE,
      'fichtean': StoryFramework.FICHTEAN_CURVE,
    };

    return frameworkMap[framework.toLowerCase()] || Object.values(StoryFramework).find(
      f => f.toLowerCase() === framework.toLowerCase()
    );
  }

  /**
   * Parse analysis depth from string input
   */
  private parseDepth(depth?: string): AnalysisDepth | undefined {
    if (!depth) return undefined;
    
    return Object.values(AnalysisDepth).find(
      d => d.toLowerCase() === depth.toLowerCase()
    );
  }

  /**
   * Parse AI provider from string input
   */
  private parseAIProvider(provider?: string): AIProvider | undefined {
    if (!provider) return undefined;
    
    return Object.values(AIProvider).find(
      p => p.toLowerCase() === provider.toLowerCase()
    );
  }
}