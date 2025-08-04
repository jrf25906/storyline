import { Router } from 'express';
import { AnalysisController } from '../controllers/AnalysisController';
import { 
  asyncHandler, 
  validateContent, 
  validateUser, 
  traumaInformedHandler 
} from '../middleware/errorHandler';
import { 
  authenticate, 
  optionalAuthenticate, 
  validateProjectOwnership 
} from '../middleware/auth';
import { 
  analysisRateLimit, 
  healthRateLimit, 
  defaultRateLimit,
  burstProtection,
  contentSizeRateLimit 
} from '../middleware/rateLimiter';

/**
 * Create analysis routes
 */
export const createAnalysisRoutes = (): Router => {
  const router = Router();
  const controller = new AnalysisController();

  /**
   * POST /analyze
   * Perform comprehensive narrative analysis
   * 
   * Body:
   * - content: string (required) - The narrative content to analyze
   * - projectId: string (required) - Project identifier
   * - userId: string (required if not authenticated) - User identifier
   * - config: AnalysisConfig (optional) - Analysis configuration
   * - metadata: object (optional) - Additional metadata
   */
  router.post('/analyze',
    // Rate limiting and security
    analysisRateLimit,
    burstProtection,
    contentSizeRateLimit(1000000), // 1MB per minute
    
    // Authentication (optional for backwards compatibility)
    optionalAuthenticate,
    
    // Trauma-informed handling
    traumaInformedHandler,
    
    // Validation
    validateContent,
    validateUser,
    validateProjectOwnership,
    
    // Handler
    asyncHandler(controller.analyze)
  );

  /**
   * GET /analysis/:analysisId
   * Retrieve a specific analysis by ID
   */
  router.get('/analysis/:analysisId',
    defaultRateLimit,
    authenticate,
    asyncHandler(controller.getAnalysis)
  );

  /**
   * GET /history
   * Get user's analysis history
   * 
   * Query params:
   * - projectId: string (optional) - Filter by project
   * - limit: number (optional, default: 10) - Number of results
   * - offset: number (optional, default: 0) - Pagination offset
   */
  router.get('/history',
    defaultRateLimit,
    authenticate,
    asyncHandler(controller.getAnalysisHistory)
  );

  /**
   * DELETE /analysis/:analysisId
   * Delete a specific analysis
   */
  router.delete('/analysis/:analysisId',
    defaultRateLimit,
    authenticate,
    asyncHandler(controller.deleteAnalysis)
  );

  /**
   * GET /health
   * Service health check
   */
  router.get('/health',
    healthRateLimit,
    asyncHandler(controller.getHealth)
  );

  /**
   * GET /capabilities
   * Get service capabilities and supported features
   */
  router.get('/capabilities',
    healthRateLimit,
    asyncHandler(controller.getCapabilities)
  );

  /**
   * POST /validate
   * Validate content before analysis
   * 
   * Body:
   * - content: string (required) - Content to validate
   */
  router.post('/validate',
    defaultRateLimit,
    validateContent,
    asyncHandler(controller.validateContent)
  );

  return router;
};

/**
 * Create health check routes (separate from main analysis routes)
 */
export const createHealthRoutes = (): Router => {
  const router = Router();
  const controller = new AnalysisController();

  /**
   * GET /
   * Basic service information
   */
  router.get('/', (req, res) => {
    res.json({
      service: 'Storyline Narrative Analysis Service',
      version: process.env.npm_package_version || '1.0.0',
      description: 'Story structure detection, character development tracking, and writing craft analysis',
      endpoints: {
        analyze: 'POST /api/analyze',
        health: 'GET /api/health',
        capabilities: 'GET /api/capabilities',
        validate: 'POST /api/validate',
        history: 'GET /api/history',
      },
      documentation: '/api/docs',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /ping
   * Simple ping endpoint
   */
  router.get('/ping', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * GET /health/detailed
   * Detailed health check with component status
   */
  router.get('/health/detailed',
    healthRateLimit,
    asyncHandler(controller.getHealth)
  );

  return router;
};