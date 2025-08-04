import request from 'supertest';
import express from 'express';
import client from '../chroma';

// Mock the chroma client
jest.mock('../chroma', () => ({
  getOrCreateCollection: jest.fn().mockResolvedValue({
    add: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ ids: [], embeddings: [], metadatas: [], documents: [] }),
  }),
  getCollection: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue({ ids: [], embeddings: [], metadatas: [], documents: [] }),
  }),
}));

describe('Memory API', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // You'll need to import and use your routes here
    // For example: import memoryRoutes from '../routes';
    // app.use(memoryRoutes);
  });

  it('should add content to memory', async () => {
    const response = await request(app)
      .post('/memory/semantic')
      .send({ content: 'This is a test' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Content added to memory');
  });

  it('should retrieve content from memory', async () => {
    const response = await request(app)
      .get('/memory/semantic')
      .query({ query: 'test' });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });
});
