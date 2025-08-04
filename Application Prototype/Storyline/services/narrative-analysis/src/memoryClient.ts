import axios from 'axios';

const MEMORY_SERVICE_URL = process.env.MEMORY_SERVICE_URL || 'http://localhost:3000';

const memoryClient = axios.create({
  baseURL: MEMORY_SERVICE_URL,
});

export const queryMemory = async (query: string) => {
  try {
    const response = await memoryClient.get('/memory/query', { params: { query } });
    return response.data;
  } catch (error) {
    console.error('Error querying memory service:', error);
    throw error;
  }
};

export const getGraphEntities = async (entity: string) => {
  try {
    const response = await memoryClient.get('/memory/graph', { params: { entity } });
    return response.data;
  } catch (error) {
    console.error('Error getting graph entities:', error);
    throw error;
  }
};
