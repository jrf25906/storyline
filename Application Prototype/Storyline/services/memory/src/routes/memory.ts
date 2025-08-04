import { Router } from 'express';
import { MemoryController } from '../controllers/MemoryController';
import { MemoryService } from '../services/MemoryService';
import { authenticate, optionalAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Memory routes
 */
export function createMemoryRoutes(): Router {
  const router = Router();
  const memoryService = new MemoryService();
  const memoryController = new MemoryController(memoryService);

  // Apply rate limiting to all routes
  router.use(rateLimiter.middleware());

  // Store a new memory
  router.post('/', 
    authenticate,
    asyncHandler(memoryController.storeMemory.bind(memoryController))
  );

  // Search memories
  router.post('/search',
    authenticate,
    // Custom rate limit for search (more restrictive)
    rateLimiter.createCustomLimiter(20, 60, 60), // 20 requests per minute
    asyncHandler(memoryController.searchMemories.bind(memoryController))
  );

  // Get context for conversation
  router.get('/context',
    authenticate,
    asyncHandler(memoryController.getContext.bind(memoryController))
  );

  // Get narrative relationships
  router.get('/relationships',
    authenticate,
    asyncHandler(memoryController.getRelationships.bind(memoryController))
  );

  // Health check (public endpoint)
  router.get('/health',
    optionalAuth,
    asyncHandler(memoryController.getHealth.bind(memoryController))
  );

  // Get specific memory
  router.get('/:id',
    authenticate,
    asyncHandler(memoryController.getMemory.bind(memoryController))
  );

  // Update memory
  router.put('/:id',
    authenticate,
    asyncHandler(memoryController.updateMemory.bind(memoryController))
  );

  // Delete memory
  router.delete('/:id',
    authenticate,
    asyncHandler(memoryController.deleteMemory.bind(memoryController))
  );

  return router;
}