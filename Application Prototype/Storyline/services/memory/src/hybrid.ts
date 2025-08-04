import EmbeddingPipeline from './embedding';
import client from './chroma';
import Graph from './graph';
import nlp from 'compromise';

class Hybrid {
  static async query(query: string) {
    // 0. Analyze query complexity (placeholder)
    if (query.length > 500) { // A very basic complexity check
      throw new Error('Query is too complex');
    }

    // 1. Classify the query (this is a simplified example)
    const isNarrativeQuery = query.toLowerCase().includes('who') || query.toLowerCase().includes('where');

    // 2. Route the query
    if (isNarrativeQuery) {
      const entities = nlp(query).people().out('array');
      if (entities.length > 0) {
        return await Graph.getRelatedEntities(entities[0]);
      }
    } else {
      const embedding = await EmbeddingPipeline.generateEmbedding(query);
      const collection = await client.getCollection({ name: 'storyline' });
      return await collection.query({ queryEmbeddings: [embedding], nResults: 5 });
    }

    return null;
  }
}

export default Hybrid;
