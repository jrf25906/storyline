import Hybrid from '../hybrid';
import client from '../chroma';
import Graph from '../graph';
import EmbeddingPipeline from '../embedding';

// Mock external dependencies
jest.mock('../chroma');
jest.mock('../graph');
jest.mock('../embedding', () => ({
  __esModule: true,
  default: {
    generateEmbedding: jest.fn((text) => Promise.resolve(Array(384).fill(0.1))),
  },
}));

describe('Hybrid', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock ChromaDB client methods
    (client.getCollection as jest.Mock).mockResolvedValue({
      query: jest.fn().mockResolvedValue({ ids: ['sem1'], documents: ['semantic result'] }),
    });

    // Mock Graph client methods
    (Graph.getRelatedEntities as jest.Mock).mockResolvedValue(['related entity']);
  });

  it('should throw an error for a query exceeding complexity limit', async () => {
    const longQuery = 'a'.repeat(501);
    await expect(Hybrid.query(longQuery)).rejects.toThrow('Query is too complex');
  });

  it('should route a narrative query to the graph and return results', async () => {
    const narrativeQuery = 'who is John?';
    const results = await Hybrid.query(narrativeQuery);

    expect(Graph.getRelatedEntities).toHaveBeenCalledWith('John');
    expect(client.getCollection).not.toHaveBeenCalled();
    expect(results).toEqual(['related entity']);
  });

  it('should route a semantic query to chroma and return results', async () => {
    const semanticQuery = 'what is the meaning of life?';
    const results = await Hybrid.query(semanticQuery);

    expect(EmbeddingPipeline.default.generateEmbedding).toHaveBeenCalledWith(semanticQuery);
    expect(client.getCollection).toHaveBeenCalledWith({ name: 'storyline' });
    expect(results).toEqual({ ids: ['sem1'], documents: ['semantic result'] });
    expect(Graph.getRelatedEntities).not.toHaveBeenCalled();
  });

  it('should return null if narrative query has no entities', async () => {
    (Graph.getRelatedEntities as jest.Mock).mockResolvedValue([]); // Mock no entities found
    const results = await Hybrid.query('who is nobody?');
    expect(results).toBeNull();
  });

  it('should return null if semantic query returns no results', async () => {
    (client.getCollection as jest.Mock).mockResolvedValue({
      query: jest.fn().mockResolvedValue({ ids: [], documents: [] }),
    });
    const results = await Hybrid.query('non-existent query');
    expect(results).toEqual({ ids: [], documents: [] });
  });
});