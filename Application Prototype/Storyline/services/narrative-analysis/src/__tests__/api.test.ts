import request from 'supertest';
import express from 'express';
import { analyzeStory } from '../analysis';

// Mock the analyzeStory function
jest.mock('../analysis', () => ({
  analyzeStory: jest.fn().mockImplementation((storyId) => {
    if (storyId === 'test-story-1') {
      return {
        storyId: 'test-story-1',
        characterAnalysis: { protagonist: 'Mock John' },
        structureAnalysis: { incitingIncident: 'Mock Incident' },
      };
    }
    throw new Error('Story not found');
  }),
}));

const app = express();
app.use(express.json());

// Import and use your routes here
import { Request, Response } from 'express';

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.get('/analysis/story/:storyId', async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    const analysis = await analyzeStory(storyId);
    res.status(200).send(analysis);
  } catch (error) {
    console.error('Error analyzing story:', error);
    res.status(500).send({ error: 'Failed to analyze story' });
  }
});

app.get('/analysis/story/:storyId/characters', async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    const analysis = await analyzeStory(storyId);
    res.status(200).send(analysis.characterAnalysis);
  } catch (error) {
    console.error('Error analyzing characters:', error);
    res.status(500).send({ error: 'Failed to analyze characters' });
  }
});

app.get('/analysis/story/:storyId/structure', async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    const analysis = await analyzeStory(storyId);
    res.status(200).send(analysis.structureAnalysis);
  } catch (error) {
    console.error('Error analyzing structure:', error);
    res.status(500).send({ error: 'Failed to analyze structure' });
  }
});

describe('Narrative Analysis API', () => {
  it('should return 200 for health check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('OK');
  });

  it('should analyze a story', async () => {
    const res = await request(app).get('/analysis/story/test-story-1');
    expect(res.statusCode).toEqual(200);
    expect(res.body.storyId).toEqual('test-story-1');
  });

  it('should get character analysis', async () => {
    const res = await request(app).get('/analysis/story/test-story-1/characters');
    expect(res.statusCode).toEqual(200);
    expect(res.body.protagonist).toEqual('Mock John');
  });

  it('should get structure analysis', async () => {
    const res = await request(app).get('/analysis/story/test-story-1/structure');
    expect(res.statusCode).toEqual(200);
    expect(res.body.incitingIncident).toEqual('Mock Incident');
  });
});
