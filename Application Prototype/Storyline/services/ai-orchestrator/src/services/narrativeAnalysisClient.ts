import axios from 'axios';

const NARRATIVE_ANALYSIS_SERVICE_URL = process.env.NARRATIVE_ANALYSIS_SERVICE_URL || 'http://localhost:3000';

const narrativeAnalysisClient = axios.create({
  baseURL: NARRATIVE_ANALYSIS_SERVICE_URL,
});

export const analyzeTextCraft = async (text: string) => {
  try {
    const readabilityResponse = await narrativeAnalysisClient.post('/analysis/craft/readability', { text });
    const styleToneResponse = await narrativeAnalysisClient.post('/analysis/craft/style-tone', { text });
    return { readability: readabilityResponse.data, styleTone: styleToneResponse.data };
  } catch (error) {
    console.error('Error analyzing text craft:', error);
    throw error;
  }
};
