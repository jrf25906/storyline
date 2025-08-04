// Integration test setup
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Set up test database connections
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/storyline_integration_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Mock external services
process.env.OPENAI_API_KEY = 'test-key';
process.env.ASSEMBLYAI_API_KEY = 'test-key';
process.env.DEEPGRAM_API_KEY = 'test-key';
