import { pipeline } from '@xenova/transformers';

class EmbeddingPipeline {
  private static instance: any;

  static async getInstance() {
    if (!this.instance) {
      this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return this.instance;
  }

  static async generateEmbedding(text: string) {
    const extractor = await this.getInstance();
    const result = await extractor(text, { pooling: 'mean', normalize: true });
    return result.data;
  }
}

export default EmbeddingPipeline;
