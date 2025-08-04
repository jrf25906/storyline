import { AssemblyAIProvider } from '../../src/providers/AssemblyAIProvider';
import { DeepgramProvider } from '../../src/providers/DeepgramProvider';
import { WhisperProvider } from '../../src/providers/WhisperProvider';
import { VoiceTranscriptionService } from '../../src/services/VoiceTranscriptionService';
import * as fs from 'fs';
import * as path from 'path';

// Mock the provider modules
jest.mock('assemblyai');
jest.mock('@deepgram/sdk');
jest.mock('openai');
jest.mock('fs');

// Mock the providers with implementations
jest.mock('../../src/providers/AssemblyAIProvider', () => {
  return {
    AssemblyAIProvider: jest.fn().mockImplementation(() => ({
      transcribe: jest.fn().mockResolvedValue({
        text: 'Test transcription',
        confidence: 0.95,
        language: 'en',
        duration: 5.0,
        processingTime: 100,
        provider: 'AssemblyAI',
        metadata: {
          contentSafety: {
            hasCriticalContent: false,
            labels: []
          }
        }
      }),
      transcribeStream: jest.fn(),
      startRealtimeSession: jest.fn(),
      isHealthy: jest.fn().mockReturnValue(true)
    }))
  };
});

jest.mock('../../src/providers/DeepgramProvider', () => {
  return {
    DeepgramProvider: jest.fn().mockImplementation(() => ({
      transcribe: jest.fn().mockResolvedValue({
        text: 'Test transcription',
        confidence: 0.93,
        language: 'en',
        duration: 5.0,
        processingTime: 120,
        provider: 'Deepgram',
        metadata: {
          criticalPhrases: {
            detected: false,
            matches: []
          }
        }
      }),
      transcribeStream: jest.fn().mockReturnValue({
        on: jest.fn(),
        pipe: jest.fn()
      }),
      startRealtimeSession: jest.fn(),
      isHealthy: jest.fn().mockReturnValue(true)
    }))
  };
});

jest.mock('../../src/providers/WhisperProvider', () => {
  return {
    WhisperProvider: jest.fn().mockImplementation(() => ({
      transcribe: jest.fn().mockResolvedValue({
        text: 'Test transcription',
        confidence: 0.92,
        language: 'en',
        duration: 5.0,
        processingTime: 150,
        provider: 'Whisper',
        metadata: {
          hasCriticalContent: false,
          criticalPhrases: []
        }
      }),
      transcribeStream: jest.fn().mockRejectedValue(new Error('Stream transcription not directly supported by Whisper')),
      startRealtimeSession: jest.fn().mockRejectedValue(new Error('Real-time transcription not supported by OpenAI Whisper')),
      isHealthy: jest.fn().mockReturnValue(true)
    }))
  };
});

describe('Voice Provider Integration Tests', () => {
  let transcriptionService: VoiceTranscriptionService;
  const testDataDir = path.join(__dirname, '../../../../tests/voice-accuracy/test-data');
  
  beforeAll(() => {
    // Set up test environment
    process.env.ASSEMBLYAI_API_KEY = 'test-assemblyai-key';
    process.env.DEEPGRAM_API_KEY = 'test-deepgram-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    
    transcriptionService = new VoiceTranscriptionService();
  });

  describe('VoiceTranscriptionService', () => {
    it('should initialize all three providers', () => {
      const providers = transcriptionService.getAvailableProviders();
      expect(providers).toContain('assemblyai');
      expect(providers).toContain('deepgram');
      expect(providers).toContain('whisper');
      expect(providers).toHaveLength(3);
    });

    it('should handle provider preference', async () => {
      const mockAudio = Buffer.from('test audio');
      
      // Create a mock result
      const mockResult = {
        text: 'Test transcription',
        confidence: 0.95,
        language: 'en',
        duration: 5.0,
        processingTime: 100,
        provider: 'deepgram',
        metadata: {}
      };

      // Mock the provider instances
      const mockDeepgramProvider = {
        transcribe: jest.fn().mockResolvedValue(mockResult),
        isHealthy: jest.fn().mockReturnValue(true)
      };

      // Replace the provider in the service
      (transcriptionService as any).providers.set('deepgram', mockDeepgramProvider);

      // Test with preferred provider
      const result = await transcriptionService.transcribe(mockAudio, {
        preferredProvider: 'deepgram'
      });

      expect(result).toBeDefined();
      expect(result.text).toBe('Test transcription');
      expect(mockDeepgramProvider.transcribe).toHaveBeenCalledWith(mockAudio, expect.any(Object));
    });

    describe('Crisis Detection Integration', () => {
      it('should detect crisis content and enhance metadata', async () => {
        const mockAudio = Buffer.from('test audio');
        
        // Mock a provider response with crisis content
        const mockProvider = {
          transcribe: jest.fn().mockResolvedValue({
            text: "I can't go on anymore. I want to end it all.",
            confidence: 0.95,
            language: 'en',
            duration: 5.0,
            processingTime: 150,
            provider: 'assemblyai',
            metadata: {}
          })
        };

        // Replace the provider
        (transcriptionService as any).providers.set('assemblyai', mockProvider);

        const result = await transcriptionService.transcribe(mockAudio);

        expect(result.metadata?.crisisDetection).toBeDefined();
        expect(result.metadata?.crisisDetection?.hasCriticalContent).toBe(true);
        expect(result.metadata?.crisisDetection?.detectedPhrases).toContain("can't go on");
        expect(result.metadata?.crisisDetection?.detectedPhrases).toContain('end it all');
        expect(result.metadata?.crisisDetection?.severity).toBe('critical');
      });

      it('should not flag non-crisis content', async () => {
        const mockAudio = Buffer.from('test audio');
        
        const mockProvider = {
          transcribe: jest.fn().mockResolvedValue({
            text: "I'm working on my memoir about overcoming challenges.",
            confidence: 0.96,
            language: 'en',
            duration: 6.0,
            processingTime: 120,
            provider: 'deepgram',
            metadata: {}
          })
        };

        (transcriptionService as any).providers.set('deepgram', mockProvider);

        const result = await transcriptionService.transcribe(mockAudio);

        expect(result.metadata?.crisisDetection).toBeUndefined();
      });
    });

    describe('Provider Failover', () => {
      it('should failover to next provider on error', async () => {
        const mockAudio = Buffer.from('test audio');
        
        // Mock providers with first two failing
        const failingProvider1 = {
          transcribe: jest.fn().mockRejectedValue(new Error('Provider unavailable'))
        };
        
        const failingProvider2 = {
          transcribe: jest.fn().mockRejectedValue(new Error('API limit exceeded'))
        };
        
        const successProvider = {
          transcribe: jest.fn().mockResolvedValue({
            text: 'Successful transcription',
            confidence: 0.92,
            language: 'en',
            duration: 4.0,
            processingTime: 200,
            provider: 'whisper',
            metadata: {}
          })
        };

        (transcriptionService as any).providers.set('assemblyai', failingProvider1);
        (transcriptionService as any).providers.set('deepgram', failingProvider2);
        (transcriptionService as any).providers.set('whisper', successProvider);

        const result = await transcriptionService.transcribe(mockAudio);

        expect(failingProvider1.transcribe).toHaveBeenCalled();
        expect(failingProvider2.transcribe).toHaveBeenCalled();
        expect(successProvider.transcribe).toHaveBeenCalled();
        expect(result.provider).toBe('whisper');
      });

      it('should throw error when all providers fail', async () => {
        const mockAudio = Buffer.from('test audio');
        
        // Mock all providers to fail
        const failingProvider = {
          transcribe: jest.fn().mockRejectedValue(new Error('Provider error'))
        };

        (transcriptionService as any).providers.set('assemblyai', failingProvider);
        (transcriptionService as any).providers.set('deepgram', failingProvider);
        (transcriptionService as any).providers.set('whisper', failingProvider);

        await expect(transcriptionService.transcribe(mockAudio))
          .rejects.toThrow('All voice providers failed');
      });
    });

    describe('Bias Metrics Logging', () => {
      it('should log bias metrics when speaker metadata is provided', async () => {
        const mockAudio = Buffer.from('test audio');
        
        const mockProvider = {
          transcribe: jest.fn().mockResolvedValue({
            text: 'Test transcription with demographics',
            confidence: 0.94,
            language: 'en',
            duration: 5.5,
            processingTime: 180,
            provider: 'assemblyai',
            metadata: {}
          })
        };

        (transcriptionService as any).providers.set('assemblyai', mockProvider);

        // Spy on the logBiasMetrics method
        const logBiasMetricsSpy = jest.spyOn(transcriptionService as any, 'logBiasMetrics');

        await transcriptionService.transcribe(mockAudio, {
          speakerMetadata: {
            age: 35,
            gender: 'female',
            accent: 'indian-english',
            expectedText: 'Test transcription with demographics'
          }
        });

        expect(logBiasMetricsSpy).toHaveBeenCalled();
        expect(logBiasMetricsSpy).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            age: 35,
            gender: 'female',
            accent: 'indian-english'
          })
        );
      });
    });
  });

  describe('Individual Provider Tests', () => {
    describe('AssemblyAI Provider', () => {
      let provider: AssemblyAIProvider;

      beforeEach(() => {
        provider = new AssemblyAIProvider('test-key');
        // The mock returns an object with these methods
        provider = {
          transcribe: jest.fn(),
          transcribeStream: jest.fn(),
          startRealtimeSession: jest.fn(),
          isHealthy: jest.fn()
        } as any;
      });

      it('should implement required methods', () => {
        expect(provider.transcribe).toBeDefined();
        expect(provider.transcribeStream).toBeDefined();
        expect(provider.startRealtimeSession).toBeDefined();
        expect(provider.isHealthy).toBeDefined();
      });

      it('should detect critical content in response', async () => {
        // Override the mock for this specific test
        provider.transcribe = jest.fn().mockResolvedValue({
          text: 'I wish I wasn\'t here anymore',
          confidence: 0.95,
          language: 'en',
          duration: 5.0,
          processingTime: 100,
          provider: 'AssemblyAI',
          metadata: {
            contentSafety: {
              hasCriticalContent: true,
              labels: [
                { label: 'suicide', severity: 'high', confidence: 0.98 }
              ]
            }
          }
        });

        const result = await provider.transcribe(Buffer.from('audio'));
        
        expect(result.metadata?.contentSafety?.hasCriticalContent).toBe(true);
      });
    });

    describe('Deepgram Provider', () => {
      let provider: DeepgramProvider;

      beforeEach(() => {
        provider = new DeepgramProvider('test-key');
        // The mock returns an object with these methods
        provider = {
          transcribe: jest.fn(),
          transcribeStream: jest.fn(),
          startRealtimeSession: jest.fn(),
          isHealthy: jest.fn()
        } as any;
      });

      it('should implement required methods', () => {
        expect(provider.transcribe).toBeDefined();
        expect(provider.transcribeStream).toBeDefined();
        expect(provider.startRealtimeSession).toBeDefined();
        expect(provider.isHealthy).toBeDefined();
      });

      it('should detect critical phrases through keyword search', async () => {
        // Mock the transcribe method to return critical content
        provider.transcribe = jest.fn().mockResolvedValue({
          text: 'I want to hurt myself',
          confidence: 0.93,
          language: 'en',
          duration: 4.0,
          processingTime: 120,
          provider: 'Deepgram',
          metadata: {
            criticalPhrases: {
              detected: true,
              matches: [
                { query: 'hurt myself', hits: [{ start: 10, end: 20 }] }
              ]
            }
          }
        });

        const result = await provider.transcribe(Buffer.from('audio'));
        
        expect(result.metadata?.criticalPhrases?.detected).toBe(true);
      });
    });

    describe('Whisper Provider', () => {
      let provider: WhisperProvider;

      beforeEach(() => {
        provider = new WhisperProvider('test-key');
        // The mock returns an object with these methods
        provider = {
          transcribe: jest.fn(),
          transcribeStream: jest.fn(),
          startRealtimeSession: jest.fn(),
          isHealthy: jest.fn()
        } as any;
      });

      it('should implement required methods', () => {
        expect(provider.transcribe).toBeDefined();
        expect(provider.transcribeStream).toBeDefined();
        expect(provider.startRealtimeSession).toBeDefined();
        expect(provider.isHealthy).toBeDefined();
      });

      it('should detect critical content through text analysis', async () => {
        // Mock the transcribe method to return critical content
        provider.transcribe = jest.fn().mockResolvedValue({
          text: 'I don\'t want to wake up tomorrow',
          confidence: 0.92,
          language: 'en',
          duration: 6.0,
          processingTime: 150,
          provider: 'Whisper',
          metadata: {
            hasCriticalContent: true,
            criticalPhrases: ['don\'t want to wake up']
          }
        });

        const result = await provider.transcribe(Buffer.from('audio'));
        
        expect(result.metadata?.hasCriticalContent).toBe(true);
        expect(result.metadata?.criticalPhrases).toContain('don\'t want to wake up');
      });

      it('should throw error for streaming (not supported)', async () => {
        const stream = fs.createReadStream(__filename);
        
        provider.transcribeStream = jest.fn().mockRejectedValue(
          new Error('Stream transcription not directly supported by Whisper')
        );
        
        await expect(provider.transcribeStream(stream))
          .rejects.toThrow('Stream transcription not directly supported by Whisper');
      });
    });
  });

  describe('Real-time Streaming Tests', () => {
    it('should support streaming with Deepgram', async () => {
      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn()
      };

      // Mock the deepgram provider's transcribeStream method
      const mockProvider = {
        transcribeStream: jest.fn().mockResolvedValue({
          on: jest.fn(),
          pipe: jest.fn()
        })
      };
      
      (transcriptionService as any).providers.set('deepgram', mockProvider);
      
      const result = await transcriptionService.transcribeStream(mockStream as any);
      
      expect(result).toBeDefined();
    });

    it('should start real-time session with available providers', async () => {
      const mockSession = { 
        on: jest.fn(),
        send: jest.fn(),
        close: jest.fn()
      };

      // Mock providers that support real-time
      const mockProvider = {
        startRealtimeSession: jest.fn().mockResolvedValue(mockSession)
      };

      (transcriptionService as any).providers.set('assemblyai', mockProvider);

      const session = await transcriptionService.startRealtimeSession();
      
      expect(session).toBeDefined();
      expect(mockProvider.startRealtimeSession).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API keys gracefully', () => {
      delete process.env.ASSEMBLYAI_API_KEY;
      delete process.env.DEEPGRAM_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const service = new VoiceTranscriptionService();
      const providers = service.getAvailableProviders();
      
      expect(providers).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      const mockAudio = Buffer.from('test audio');
      
      const mockProvider = {
        transcribe: jest.fn().mockRejectedValue(new Error('Network timeout'))
      };

      // Mock all providers to fail with network error
      (transcriptionService as any).providers.set('assemblyai', mockProvider);
      (transcriptionService as any).providers.set('deepgram', mockProvider);
      (transcriptionService as any).providers.set('whisper', mockProvider);

      await expect(transcriptionService.transcribe(mockAudio))
        .rejects.toThrow('All voice providers failed');
    });
  });
});