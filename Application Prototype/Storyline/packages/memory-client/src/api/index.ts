import axios from 'axios';

const memoryService = axios.create({
  baseURL: process.env.MEMORY_SERVICE_URL || 'http://localhost:3000',
});

export const queryMemory = async (query: string) => {
  const response = await memoryService.get('/memory/query', { params: { query } });
  return response.data;
};
