import express from 'express';
import { analyzeStory, analyzeTextCraft } from './analysis';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/analysis/story/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    const analysis = await analyzeStory(storyId);
    res.status(200).send(analysis);
  } catch (error) {
    console.error('Error analyzing story:', error);
    res.status(500).send({ error: 'Failed to analyze story' });
  }
});

app.get('/analysis/story/:storyId/characters', async (req, res) => {
  try {
    const { storyId } = req.params;
    const analysis = await analyzeStory(storyId);
    res.status(200).send(analysis.characterAnalysis);
  } catch (error) {
    console.error('Error analyzing characters:', error);
    res.status(500).send({ error: 'Failed to analyze characters' });
  }
});

app.get('/analysis/story/:storyId/structure', async (req, res) => {
  try {
    const { storyId } = req.params;
    const analysis = await analyzeStory(storyId);
    res.status(200).send(analysis.structureAnalysis);
  } catch (error) {
    console.error('Error analyzing structure:', error);
    res.status(500).send({ error: 'Failed to analyze structure' });
  }
});

app.post('/analysis/craft/readability', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).send({ error: 'Text is required' });
    }
    const analysis = await analyzeTextCraft(text);
    res.status(200).send(analysis.readability);
  } catch (error) {
    console.error('Error analyzing readability:', error);
    res.status(500).send({ error: 'Failed to analyze readability' });
  }
});

app.post('/analysis/craft/style-tone', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).send({ error: 'Text is required' });
    }
    const analysis = await analyzeTextCraft(text);
    res.status(200).send(analysis.styleTone);
  } catch (error) {
    console.error('Error analyzing style and tone:', error);
    res.status(500).send({ error: 'Failed to analyze style and tone' });
  }
});

app.listen(port, () => {
  console.log(`Narrative Analysis service listening on port ${port}`);
});
