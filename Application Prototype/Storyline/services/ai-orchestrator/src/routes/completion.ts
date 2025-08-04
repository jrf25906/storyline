import { Router } from 'express';
import { getProvider, getDefaultProvider, listProviders } from '../providers';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schema
const completionSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  provider: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

// One-off completion
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const body = completionSchema.parse(req.body);
    
    // Get provider
    const provider = body.provider ? 
      getProvider(body.provider) : 
      getDefaultProvider();
    
    if (!provider) {
      return res.status(503).json({ 
        error: 'No AI provider available',
        availableProviders: listProviders()
      });
    }
    
    // Handle streaming if requested
    if (body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      try {
        for await (const chunk of provider.stream({
          ...body,
          userId
        })) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
        res.end();
      }
    } else {
      // Regular completion
      const response = await provider.complete({
        ...body,
        userId
      });
      
      res.json(response);
    }
  } catch (error) {
    logger.error('Completion error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to generate completion' });
  }
});

// Count tokens
router.post('/tokens', async (req, res) => {
  try {
    const { text, provider: providerName } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string required' });
    }
    
    const provider = providerName ? 
      getProvider(providerName) : 
      getDefaultProvider();
    
    if (!provider) {
      return res.status(503).json({ error: 'No AI provider available' });
    }
    
    const tokenCount = await provider.countTokens(text);
    
    res.json({
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      tokenCount,
      provider: provider.name
    });
  } catch (error) {
    logger.error('Token count error:', error);
    res.status(500).json({ error: 'Failed to count tokens' });
  }
});

// Get available providers
router.get('/providers', (req, res) => {
  const providers = listProviders();
  const providerDetails = providers.map(name => {
    const provider = getProvider(name);
    return {
      name,
      models: provider?.models || [],
      isDefault: getDefaultProvider()?.name === name
    };
  });
  
  res.json(providerDetails);
});

// Health check for providers
router.get('/health', async (req, res) => {
  const providers = listProviders();
  const health: Record<string, boolean> = {};
  
  for (const name of providers) {
    const provider = getProvider(name);
    if (provider) {
      health[name] = await provider.isHealthy();
    }
  }
  
  const allHealthy = Object.values(health).every(h => h);
  
  res.status(allHealthy ? 200 : 503).json({
    healthy: allHealthy,
    providers: health
  });
});

export default router;