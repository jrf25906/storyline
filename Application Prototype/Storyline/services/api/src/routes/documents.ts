import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import * as documentController from '../controllers/documentController';

const router = Router();

// Get all documents for user
router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['title', 'updatedAt', 'createdAt', 'wordCount']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('type').optional().isIn(['fiction', 'memoir', 'non-fiction', 'poetry', 'screenplay', 'other']),
  query('search').optional().trim(),
  asyncHandler(documentController.getDocuments)
);

// Get single document
router.get('/:id',
  param('id').isMongoId(),
  asyncHandler(documentController.getDocument)
);

// Create document
router.post('/',
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('type').isIn(['fiction', 'memoir', 'non-fiction', 'poetry', 'screenplay', 'other']),
  body('content').optional(),
  body('tags').optional().isArray(),
  asyncHandler(documentController.createDocument)
);

// Update document
router.put('/:id',
  param('id').isMongoId(),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional(),
  body('tags').optional().isArray(),
  asyncHandler(documentController.updateDocument)
);

// Delete document
router.delete('/:id',
  param('id').isMongoId(),
  asyncHandler(documentController.deleteDocument)
);

// Document outline
router.get('/:id/outline',
  param('id').isMongoId(),
  asyncHandler(documentController.getDocumentOutline)
);

// Document versions
router.get('/:id/versions',
  param('id').isMongoId(),
  asyncHandler(documentController.getDocumentVersions)
);

router.get('/:id/versions/:versionId',
  param('id').isMongoId(),
  param('versionId').isMongoId(),
  asyncHandler(documentController.getDocumentVersion)
);

// Export document
router.post('/:id/export',
  param('id').isMongoId(),
  body('format').isIn(['docx', 'pdf', 'txt', 'markdown', 'epub']),
  asyncHandler(documentController.exportDocument)
);

// Share document
router.post('/:id/share',
  param('id').isMongoId(),
  body('emails').isArray(),
  body('emails.*').isEmail(),
  body('permission').isIn(['view', 'comment', 'edit']),
  asyncHandler(documentController.shareDocument)
);

// Character management
router.get('/:id/characters',
  param('id').isMongoId(),
  asyncHandler(documentController.getCharacters)
);

router.post('/:id/characters',
  param('id').isMongoId(),
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim(),
  asyncHandler(documentController.createCharacter)
);

export default router;