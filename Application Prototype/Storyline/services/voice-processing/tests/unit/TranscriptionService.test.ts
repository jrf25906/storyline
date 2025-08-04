import { TranscriptionService } from '../../src/services/TranscriptionService';
import { AssemblyAIProvider } from '../../src/providers/AssemblyAIProvider';
import { DeepgramProvider } from '../../src/providers/DeepgramProvider';
import { WhisperProvider } from '../../src/providers/WhisperProvider';
import { logger } from '../../src/utils/logger';

// Mock all providers
jest.mock('../../src/providers/AssemblyAIProvider');
jest.mock('../../src/providers/DeepgramProvider');
jest.mock('../../src/providers/WhisperProvider');
jest.mock('../../src/utils/logger');

describe('TranscriptionService', () => {
  let transcriptionService: TranscriptionService;
  let mockAssemblyAI: jest.Mocked<AssemblyAIProvider>;
  let mockDeepgram: jest.Mocked<DeepgramProvider>;
  let mockWhisper: jest.Mocked<WhisperProvider>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.ASSEMBLYAI_API_KEY = 'test-key';
    process.env.DEEPGRAM_API_KEY = 'test-key';
    process.env.OPENAI_API_KEY = 'test-key';
    
    // Create mock instances
    mockAssemblyAI = new AssemblyAIProvider('test-api-key') as jest.Mocked<AssemblyAIProvider>;
    mockDeepgram = new DeepgramProvider('test-api-key') as jest.Mocked<DeepgramProvider>;
    mockWhisper = new WhisperProvider('test-api-key') as jest.Mocked<WhisperProvider>;
    
    // Initialize service
    transcriptionService = new TranscriptionService();
    (transcriptionService as any).providers = {
      assemblyai: mockAssemblyAI,
      deepgram: mockDeepgram,
      whisper: mockWhisper
    };
    
    // Ensure the service knows it has providers
    (transcriptionService as any).assemblyai = {};
    (transcriptionService as any).deepgram = {};
    (transcriptionService as any).openai = {};
  });

  describe('Provider Failover', () => {
    const mockAudioBuffer = Buffer.from('mock-audio-data');
    const mockTranscription = {
      text: 'Hello, this is a test transcription',
      confidence: 0.95,
      language: 'en',
      duration: 5.0,
      processingTime: 150,
      provider: 'assemblyai',
      words: [
        { word: 'Hello', start: 0, end: 0.5, confidence: 0.98 },
        { word: 'this', start: 0.6, end: 0.8, confidence: 0.94 }
      ]
    };

    test('should use primary provider (AssemblyAI) when available', async () => {
      mockAssemblyAI.transcribe.mockResolvedValue(mockTranscription);
      
      const result = await transcriptionService.transcribe(mockAudioBuffer);
      
      expect(mockAssemblyAI.transcribe).toHaveBeenCalledWith(mockAudioBuffer, undefined);
      expect(mockDeepgram.transcribe).not.toHaveBeenCalled();
      expect(mockWhisper.transcribe).not.toHaveBeenCalled();
      expect(result).toEqual(mockTranscription);
    });

    test('should failover to Deepgram when AssemblyAI fails', async () => {
      mockAssemblyAI.transcribe.mockRejectedValue(new Error('AssemblyAI error'));
      mockDeepgram.transcribe.mockResolvedValue(mockTranscription);
      
      const result = await transcriptionService.transcribe(mockAudioBuffer);
      
      expect(mockAssemblyAI.transcribe).toHaveBeenCalled();
      expect(mockDeepgram.transcribe).toHaveBeenCalled();
      expect(mockWhisper.transcribe).not.toHaveBeenCalled();
      expect(result).toEqual(mockTranscription);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to transcribe with assemblyai'),
        expect.any(Error)
      );
    });

    test('should failover to Whisper when both AssemblyAI and Deepgram fail', async () => {
      mockAssemblyAI.transcribe.mockRejectedValue(new Error('AssemblyAI error'));
      mockDeepgram.transcribe.mockRejectedValue(new Error('Deepgram error'));
      mockWhisper.transcribe.mockResolvedValue(mockTranscription);
      
      const result = await transcriptionService.transcribe(mockAudioBuffer);
      
      expect(mockAssemblyAI.transcribe).toHaveBeenCalled();
      expect(mockDeepgram.transcribe).toHaveBeenCalled();
      expect(mockWhisper.transcribe).toHaveBeenCalled();
      expect(result).toEqual(mockTranscription);
    });

    test('should throw error when all providers fail', async () => {
      mockAssemblyAI.transcribe.mockRejectedValue(new Error('AssemblyAI error'));
      mockDeepgram.transcribe.mockRejectedValue(new Error('Deepgram error'));
      mockWhisper.transcribe.mockRejectedValue(new Error('Whisper error'));
      
      await expect(transcriptionService.transcribe(mockAudioBuffer))
        .rejects.toThrow('All transcription providers failed');
        
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('All transcription providers failed'),
        expect.any(Error)
      );
    });
  });

  describe('Audio Format Handling', () => {
    test('should handle WAV format', async () => {
      const wavBuffer = Buffer.from('RIFF....WAVEfmt '); // WAV header
      mockAssemblyAI.transcribe.mockResolvedValue({
        text: 'WAV audio',
        confidence: 0.95,
        language: 'en',
        duration: 5.0,
        processingTime: 100,
        provider: 'assemblyai'
      });
      
      const result = await transcriptionService.transcribe(wavBuffer, { format: 'wav' });
      
      expect(result.text).toBe('WAV audio');
    });

    test('should handle MP3 format', async () => {
      const mp3Buffer = Buffer.from([0xFF, 0xFB]); // MP3 header
      mockAssemblyAI.transcribe.mockResolvedValue({
        text: 'MP3 audio',
        confidence: 0.95,
        language: 'en',
        duration: 5.0,
        processingTime: 100,
        provider: 'assemblyai'
      });
      
      const result = await transcriptionService.transcribe(mp3Buffer, { format: 'mp3' });
      
      expect(result.text).toBe('MP3 audio');
    });

    test('should handle M4A format', async () => {
      const m4aBuffer = Buffer.from('....ftypM4A '); // M4A header
      mockAssemblyAI.transcribe.mockResolvedValue({
        text: 'M4A audio',
        confidence: 0.95,
        language: 'en',
        duration: 5.0,
        processingTime: 100,
        provider: 'assemblyai'
      });
      
      const result = await transcriptionService.transcribe(m4aBuffer, { format: 'm4a' });
      
      expect(result.text).toBe('M4A audio');
    });

    test('should auto-detect format from buffer', async () => {
      const wavBuffer = Buffer.from('RIFF....WAVEfmt ');
      mockAssemblyAI.transcribe.mockResolvedValue({
        text: 'Auto-detected',
        confidence: 0.95,
        language: 'en',
        duration: 5.0,
        processingTime: 100,
        provider: 'assemblyai'
      });
      
      const result = await transcriptionService.transcribe(wavBuffer);
      
      expect(result.text).toBe('Auto-detected');
    });
  });

  describe('Streaming Transcription', () => {
    test('should handle streaming transcription', async () => {
      const mockStream = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };
      
      mockAssemblyAI.createStream = jest.fn().mockReturnValue(mockStream);
      
      const stream = await transcriptionService.createStream();
      
      expect(stream).toBeDefined();
      expect(mockAssemblyAI.createStream).toHaveBeenCalled();
    });

    test('should emit partial transcriptions', async () => {
      const mockStream: any = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };
      
      // Set up the mock to call the callback after a delay
      mockStream.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'partial') {
          setTimeout(() => callback({ text: 'Hello', confidence: 0.8 }), 10);
        }
        return mockStream;
      });
      
      mockAssemblyAI.createStream = jest.fn().mockReturnValue(mockStream);
      
      const stream = await transcriptionService.createStream();
      const partialHandler = jest.fn();
      
      stream.on('partial', partialHandler);
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(partialHandler).toHaveBeenCalledWith({ text: 'Hello', confidence: 0.8 });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout');
      (networkError as any).code = 'ETIMEDOUT';
      
      mockAssemblyAI.transcribe.mockRejectedValue(networkError);
      mockDeepgram.transcribe.mockResolvedValue({
        text: 'Fallback',
        confidence: 0.9,
        language: 'en',
        duration: 5.0,
        processingTime: 100,
        provider: 'deepgram'
      });
      
      const result = await transcriptionService.transcribe(Buffer.from('audio'));
      
      expect(result.text).toBe('Fallback');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to transcribe with assemblyai'),
        networkError
      );
    });

    test('should handle API rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      
      mockAssemblyAI.transcribe.mockRejectedValue(rateLimitError);
      mockDeepgram.transcribe.mockResolvedValue({
        text: 'Fallback',
        confidence: 0.9,
        language: 'en',
        duration: 5.0,
        processingTime: 100,
        provider: 'deepgram'
      });
      
      const result = await transcriptionService.transcribe(Buffer.from('audio'));
      
      expect(result.text).toBe('Fallback');
    });

    test('should validate audio input', async () => {
      await expect(transcriptionService.transcribe(Buffer.alloc(0)))
        .rejects.toThrow('Audio buffer is empty');
        
      await expect(transcriptionService.transcribe(null as any))
        .rejects.toThrow('Invalid audio input');
    });
  });

  describe('Performance Requirements', () => {
    test('should complete transcription within 200ms for real-time', async () => {
      mockAssemblyAI.transcribe.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return { 
          text: 'Fast response', 
          confidence: 0.95,
          language: 'en',
          duration: 5.0,
          processingTime: 150,
          provider: 'assemblyai'
        };
      });
      
      const start = Date.now();
      await transcriptionService.transcribe(Buffer.from('audio'), { realtime: true });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });

    test('should switch providers if latency exceeds threshold', async () => {
      mockAssemblyAI.transcribe.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 250));
        return { 
          text: 'Slow response', 
          confidence: 0.95,
          language: 'en',
          duration: 5.0,
          processingTime: 250,
          provider: 'assemblyai'
        };
      });
      
      mockDeepgram.transcribe.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { 
          text: 'Fast response', 
          confidence: 0.95,
          language: 'en',
          duration: 5.0,
          processingTime: 100,
          provider: 'deepgram'
        };
      });
      
      const result = await transcriptionService.transcribe(
        Buffer.from('audio'), 
        { realtime: true, maxLatency: 200 }
      );
      
      expect(result.text).toBe('Fast response');
      expect(mockDeepgram.transcribe).toHaveBeenCalled();
    });
  });
});
