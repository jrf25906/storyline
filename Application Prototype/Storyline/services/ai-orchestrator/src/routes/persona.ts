import { Router } from 'express';
import { PersonaManager } from '../services/PersonaManager';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const personaManager = PersonaManager.getInstance();

// Get all personas
router.get('/', async (req, res) => {
  try {
    const personas = await personaManager.getAllPersonas();
    res.json(personas);
  } catch (error) {
    logger.error('Get personas error:', error);
    res.status(500).json({ error: 'Failed to get personas' });
  }
});

// Get persona by ID
router.get('/:personaId', async (req, res) => {
  try {
    const { personaId } = req.params;
    const persona = await personaManager.getPersona(personaId);
    
    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }
    
    res.json(persona);
  } catch (error) {
    logger.error('Get persona error:', error);
    res.status(500).json({ error: 'Failed to get persona' });
  }
});

// Select persona for context
router.post('/select', async (req, res) => {
  try {
    const { context } = req.body;
    
    if (!context || typeof context !== 'object') {
      return res.status(400).json({ error: 'Context object required' });
    }
    
    const personaId = await personaManager.selectPersonaForContext(context);
    const persona = await personaManager.getPersona(personaId);
    
    res.json({
      selectedPersonaId: personaId,
      persona
    });
  } catch (error) {
    logger.error('Select persona error:', error);
    res.status(500).json({ error: 'Failed to select persona' });
  }
});

// Get default persona
router.get('/default', async (req, res) => {
  try {
    const defaultId = personaManager.getDefaultPersonaId();
    const persona = await personaManager.getPersona(defaultId);
    
    res.json({
      defaultPersonaId: defaultId,
      persona
    });
  } catch (error) {
    logger.error('Get default persona error:', error);
    res.status(500).json({ error: 'Failed to get default persona' });
  }
});

export default router;