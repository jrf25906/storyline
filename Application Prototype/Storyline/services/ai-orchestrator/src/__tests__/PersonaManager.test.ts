import { PersonaManager } from '../services/PersonaManager';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Mock external dependencies
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('PersonaManager', () => {
  let personaManager: PersonaManager;

  beforeEach(() => {
    // Reset the singleton instance before each test
    // @ts-ignore
    PersonaManager.instance = null;
    personaManager = PersonaManager.getInstance();
    jest.clearAllMocks();
  });

  it('should be a singleton instance', () => {
    const anotherInstance = PersonaManager.getInstance();
    expect(personaManager).toBe(anotherInstance);
  });

  it('should initialize and load default personas', async () => {
    await personaManager.initialize();
    const allPersonas = await personaManager.getAllPersonas();
    expect(allPersonas.length).toBeGreaterThan(0);
    expect(allPersonas.some(p => p.id === 'empathetic-guide')).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Loaded'));
  });

  it('should return a persona by ID', async () => {
    await personaManager.initialize();
    const persona = await personaManager.getPersona('empathetic-guide');
    expect(persona).toBeDefined();
    expect(persona?.name).toBe('Empathetic Guide');
  });

  it('should return null for a non-existent persona ID', async () => {
    await personaManager.initialize();
    const persona = await personaManager.getPersona('non-existent-id');
    expect(persona).toBeNull();
  });

  it('should return all personas', async () => {
    await personaManager.initialize();
    const allPersonas = await personaManager.getAllPersonas();
    expect(allPersonas.length).toBe(4); // Based on the default personas in the source
  });

  it('should create a new persona', async () => {
    await personaManager.initialize();
    const newPersonaData = {
      name: 'Test Persona',
      description: 'A test description',
      systemPrompt: 'You are a test.',
      traits: [],
      voiceCharacteristics: { tone: 'flat', pace: 'slow', style: 'direct' },
      temperature: 0.5,
      maxTokens: 100,
    };
    const createdPersona = await personaManager.createPersona(newPersonaData);

    expect(createdPersona).toEqual({ ...newPersonaData, id: 'mock-uuid' });
    expect(await personaManager.getPersona('mock-uuid')).toBeDefined();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Created persona'));
  });

  it('should update an existing persona', async () => {
    await personaManager.initialize();
    const updates = { name: 'Updated Empathetic Guide', temperature: 0.9 };
    const updatedPersona = await personaManager.updatePersona('empathetic-guide', updates);

    expect(updatedPersona?.name).toBe('Updated Empathetic Guide');
    expect(updatedPersona?.temperature).toBe(0.9);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Updated persona'));
  });

  it('should return null when updating a non-existent persona', async () => {
    await personaManager.initialize();
    const updates = { name: 'Non Existent' };
    const updatedPersona = await personaManager.updatePersona('non-existent-id', updates);
    expect(updatedPersona).toBeNull();
  });

  it('should delete a non-default persona', async () => {
    await personaManager.initialize();
    const newPersonaData = {
      name: 'Deletable Persona',
      description: 'A persona that can be deleted',
      systemPrompt: 'You are deletable.',
      traits: [],
      voiceCharacteristics: { tone: 'flat', pace: 'slow', style: 'direct' },
      temperature: 0.5,
      maxTokens: 100,
    };
    const createdPersona = await personaManager.createPersona(newPersonaData);

    const deleted = await personaManager.deletePersona(createdPersona.id);
    expect(deleted).toBe(true);
    expect(await personaManager.getPersona(createdPersona.id)).toBeNull();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Deleted persona'));
  });

  it('should not delete a default persona', async () => {
    await personaManager.initialize();
    const deleted = await personaManager.deletePersona('empathetic-guide');
    expect(deleted).toBe(false);
    expect(await personaManager.getPersona('empathetic-guide')).toBeDefined();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Cannot delete default persona'));
  });

  it('should return the default persona ID', () => {
    expect(personaManager.getDefaultPersonaId()).toBe('empathetic-guide');
  });

  describe('selectPersonaForContext', () => {
    beforeEach(async () => {
      await personaManager.initialize();
    });

    it('should select empathetic-guide for emotional context', async () => {
      const personaId = await personaManager.selectPersonaForContext({ emotional: true });
      expect(personaId).toBe('empathetic-guide');
    });

    it('should select creative-muse for creative context', async () => {
      const personaId = await personaManager.selectPersonaForContext({ creative: true });
      expect(personaId).toBe('creative-muse');
    });

    it('should select memoir-companion for memoir context', async () => {
      const personaId = await personaManager.selectPersonaForContext({ memoir: true });
      expect(personaId).toBe('memoir-companion');
    });

    it('should select analytical-coach for analytical context', async () => {
      const personaId = await personaManager.selectPersonaForContext({ analytical: true });
      expect(personaId).toBe('analytical-coach');
    });

    it('should return default persona if no specific context matches', async () => {
      const personaId = await personaManager.selectPersonaForContext({ unknown: true });
      expect(personaId).toBe(personaManager.getDefaultPersonaId());
    });

    it('should prioritize emotional context over others', async () => {
      const personaId = await personaManager.selectPersonaForContext({ emotional: true, creative: true });
      expect(personaId).toBe('empathetic-guide');
    });
  });
});
