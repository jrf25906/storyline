import express from 'express';
import client from './chroma';
import EmbeddingPipeline from './embedding';
import Graph from './graph';
import Hybrid from './hybrid';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.post('/memory/semantic', async (req, res) => {
  const { content, metadata } = req.body;

  if (!content) {
    return res.status(400).send({ error: 'Content is required' });
  }

  try {
    const embedding = await EmbeddingPipeline.generateEmbedding(content);
    const collection = await client.getOrCreateCollection({ name: 'storyline' });

    await collection.add({
      ids: [metadata?.id || new Date().toISOString()],
      embeddings: [embedding],
      metadatas: [metadata],
      documents: [content],
    });

    res.status(201).send({ message: 'Content added to memory' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to add content to memory' });
  }
});

app.get('/memory/semantic', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).send({ error: 'Query is required' });
  }

  try {
    const embedding = await EmbeddingPipeline.generateEmbedding(query as string);
    const collection = await client.getCollection({ name: 'storyline' });

    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: 5,
    });

    res.status(200).send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to retrieve content from memory' });
  }
});

app.post('/memory/graph', async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).send({ error: 'Content is required' });
  }

  try {
    await Graph.addConversation(content);
    res.status(201).send({ message: 'Conversation added to graph' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to add conversation to graph' });
  }
});

app.get('/memory/graph', async (req, res) => {
  const { entity } = req.query;

  if (!entity) {
    return res.status(400).send({ error: 'Entity is required' });
  }

  try {
    const results = await Graph.getRelatedEntities(entity as string);
    res.status(200).send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to retrieve related entities' });
  }
});

app.get('/memory/query', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).send({ error: 'Query is required' });
  }

  try {
    const results = await Hybrid.query(query as string);
    res.status(200).send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to retrieve content from memory' });
  }
});

app.listen(port, () => {
  console.log(`Memory service listening on port ${port}`);
});
