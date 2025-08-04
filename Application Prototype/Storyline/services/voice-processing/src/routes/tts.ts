import { Router } from 'express';
import OpenAI from 'openai';
import { S3Service } from '../services/S3Service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const s3Service = S3Service.getInstance();

// Initialize OpenAI if available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Text-to-speech conversion
router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice, speed, format } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    if (!openai) {
      return res.status(503).json({ error: 'TTS service not configured' });
    }

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice || 'alloy',
      input: text,
      speed: speed || 1.0
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Generate unique filename
    const filename = `tts-${uuidv4()}.mp3`;
    const key = s3Service.generateKey(userId, filename);
    
    // Upload to S3
    const s3Path = await s3Service.uploadFile(
      key,
      buffer,
      'audio/mpeg',
      {
        userId,
        voice: voice || 'alloy',
        textLength: text.length.toString()
      }
    );

    // Get signed URL
    const signedUrl = await s3Service.getSignedUrl(key, 3600);

    logger.info(`TTS audio generated: ${filename}`);

    res.json({
      audioUrl: signedUrl,
      s3Path,
      duration: Math.ceil(text.length / 150), // Rough estimate
      voice: voice || 'alloy',
      format: 'mp3'
    });
  } catch (error) {
    logger.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

// Get available voices
router.get('/voices', (req, res) => {
  res.json({
    voices: [
      {
        id: 'alloy',
        name: 'Alloy',
        gender: 'neutral',
        language: 'en-US',
        description: 'Neutral and balanced voice'
      },
      {
        id: 'echo',
        name: 'Echo',
        gender: 'male',
        language: 'en-US',
        description: 'Male voice with clarity'
      },
      {
        id: 'fable',
        name: 'Fable',
        gender: 'neutral',
        language: 'en-US',
        description: 'Expressive British accent'
      },
      {
        id: 'onyx',
        name: 'Onyx',
        gender: 'male',
        language: 'en-US',
        description: 'Deep male voice'
      },
      {
        id: 'nova',
        name: 'Nova',
        gender: 'female',
        language: 'en-US',
        description: 'Female voice with warmth'
      },
      {
        id: 'shimmer',
        name: 'Shimmer',
        gender: 'female',
        language: 'en-US',
        description: 'Soft female voice'
      }
    ]
  });
});

// Preview TTS (shorter text)
router.post('/preview', async (req, res) => {
  try {
    const { text, voice } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!text || text.length > 100) {
      return res.status(400).json({ 
        error: 'Text required (max 100 characters for preview)' 
      });
    }

    if (!openai) {
      return res.status(503).json({ error: 'TTS service not configured' });
    }

    // Generate preview
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice || 'alloy',
      input: text
    });

    // Convert to base64 for inline playback
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64Audio = buffer.toString('base64');

    res.json({
      audio: `data:audio/mp3;base64,${base64Audio}`,
      voice: voice || 'alloy',
      textLength: text.length
    });
  } catch (error) {
    logger.error('TTS preview error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

export default router;