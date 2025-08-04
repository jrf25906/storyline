import EmbeddingPipeline from '../embedding';

describe('EmbeddingPipeline', () => {
  it('should generate an embedding for a given text', async () => {
    const embedding = await EmbeddingPipeline.generateEmbedding('Hello, world!');
    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(384); // all-MiniLM-L6-v2 generates 384-dimensional embeddings
  });
});
