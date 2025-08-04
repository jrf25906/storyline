// Simple mocked tests for voice providers
import { VoiceTranscriptionService } from '../../src/services/VoiceTranscriptionService';

// Mock all dependencies
jest.mock('../../src/providers/AssemblyAIProvider');
jest.mock('../../src/providers/DeepgramProvider');  
jest.mock('../../src/providers/WhisperProvider');
jest.mock('../../../crisis-detection/src/CrisisDetectionService', () => {
  return {
    CrisisDetectionService: jest.fn().mockImplementation(() => ({
      detectCrisis: jest.fn().mockResolvedValue({
        hasCriticalContent: false,
        detectedPhrases: [],
        severity: 'none',
        requiresImmediateAction: false
      })
    }))
  };
});

describe('Voice Provider Mocked Tests', () => {
  let service: VoiceTranscriptionService;

  beforeEach(() => {
    // Reset environment
    process.env.ASSEMBLYAI_API_KEY = 'test-key';
    process.env.DEEPGRAM_API_KEY = 'test-key';
    process.env.OPENAI_API_KEY = 'test-key';
    
    // Clear mocks
    jest.clearAllMocks();
    
    service = new VoiceTranscriptionService();
    
    // Mock the crisis detection service
    const mockCrisisDetection = {
      detectCrisis: jest.fn().mockResolvedValue({
        hasCriticalContent: false,
        detectedPhrases: [],
        severity: 'none',
        requiresImmediateAction: false
      })
    };
    (service as any).crisisDetection = mockCrisisDetection;
    
    // Create a properly mocked provider
    const mockProvider = {
      transcribe: jest.fn().mockResolvedValue({
        text: 'Default mock transcription',
        confidence: 0.95,
        language: 'en',
        duration: 5.0,
        processingTime: 100,
        provider: 'mock',
        metadata: {}
      }),
      isHealthy: jest.fn().mockReturnValue(true),
      transcribeStream: jest.fn(),
      startRealtimeSession: jest.fn()
    };
    
    // Replace all providers with the mock by default
    (service as any).providers.set('assemblyai', mockProvider);
    (service as any).providers.set('deepgram', mockProvider);
    (service as any).providers.set('whisper', mockProvider);
  });

  it('should initialize service', () => {
    expect(service).toBeDefined();
  });

  it('should handle transcription request', async () => {
    const mockAudio = Buffer.from('test audio');
    
    // Mock the provider
    const mockProvider = {
      transcribe: jest.fn().mockResolvedValue({
        text: 'Test transcription',
        confidence: 0.95,
        language: 'en',
        duration: 5.0,
        processingTime: 100,
        provider: 'mock'
      })
    };

    // Replace provider
    (service as any).providers.set('assemblyai', mockProvider);
    
    const result = await service.transcribe(mockAudio);
    
    expect(result).toBeDefined();
    expect(result.text).toBe('Test transcription');
    expect(mockProvider.transcribe).toHaveBeenCalledWith(mockAudio, undefined);
  });

  it('should detect crisis content', async () => {
    const mockAudio = Buffer.from('test audio');
    
    // Mock provider with crisis content
    const mockProvider = {
      transcribe: jest.fn().mockResolvedValue({
        text: "I want to end it all",
        confidence: 0.94,
        language: 'en',
        duration: 3.0,
        processingTime: 150,
        provider: 'mock'
      })
    };

    // Mock crisis detection
    const mockCrisisDetection = {
      detectCrisis: jest.fn().mockResolvedValue({
        hasCriticalContent: true,
        detectedPhrases: ['end it all'],
        severity: 'critical',
        requiresImmediateAction: true
      })
    };

    (service as any).providers.set('assemblyai', mockProvider);
    (service as any).crisisDetection = mockCrisisDetection;
    
    const result = await service.transcribe(mockAudio);
    
    expect(result.metadata?.crisisDetection).toBeDefined();
    expect(result.metadata?.crisisDetection?.hasCriticalContent).toBe(true);
    expect(mockCrisisDetection.detectCrisis).toHaveBeenCalledWith("I want to end it all");
  });

  it('should handle provider failover', async () => {
    const mockAudio = Buffer.from('test audio');
    
    // First provider fails
    const failingProvider = {
      transcribe: jest.fn().mockRejectedValue(new Error('Provider error'))
    };
    
    // Second provider succeeds
    const successProvider = {
      transcribe: jest.fn().mockResolvedValue({
        text: 'Fallback transcription',
        confidence: 0.92,
        language: 'en',
        duration: 4.0,
        processingTime: 200,
        provider: 'deepgram'
      })
    };

    (service as any).providers.set('assemblyai', failingProvider);
    (service as any).providers.set('deepgram', successProvider);
    
    const result = await service.transcribe(mockAudio);
    
    expect(failingProvider.transcribe).toHaveBeenCalled();
    expect(successProvider.transcribe).toHaveBeenCalled();
    expect(result.text).toBe('Fallback transcription');
    expect(result.provider).toBe('deepgram');
  });

  it('should track bias metrics', async () => {
    const mockAudio = Buffer.from('test audio');
    
    const mockProvider = {
      transcribe: jest.fn().mockResolvedValue({
        text: 'Test with demographics',
        confidence: 0.93,
        language: 'en',
        duration: 5.5,
        processingTime: 180,
        provider: 'assemblyai'
      })
    };

    (service as any).providers.set('assemblyai', mockProvider);
    
    // Spy on bias metrics
    const logBiasMetricsSpy = jest.spyOn(service as any, 'logBiasMetrics');
    
    await service.transcribe(mockAudio, {
      speakerMetadata: {
        age: 35,
        gender: 'female',
        accent: 'indian-english'
      }
    });
    
    expect(logBiasMetricsSpy).toHaveBeenCalled();
  });
});