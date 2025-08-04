#!/bin/bash
# create-voice-tests.sh - Create comprehensive voice processing tests

echo "🎤 Creating Voice Processing Tests for Storyline..."
echo "==============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: Create voice processing test structure
echo -e "\n${YELLOW}Step 1: Creating voice processing test files...${NC}"

# Create TranscriptionService tests
cat > services/voice-processing/tests/unit/TranscriptionService.test.ts << 'EOF'
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
    
    // Create mock instances
    mockAssemblyAI = new AssemblyAIProvider() as jest.Mocked<AssemblyAIProvider>;
    mockDeepgram = new DeepgramProvider() as jest.Mocked<DeepgramProvider>;
    mockWhisper = new WhisperProvider() as jest.Mocked<WhisperProvider>;
    
    // Initialize service
    transcriptionService = new TranscriptionService();
    (transcriptionService as any).providers = {
      assemblyai: mockAssemblyAI,
      deepgram: mockDeepgram,
      whisper: mockWhisper
    };
  });

  describe('Provider Failover', () => {
    const mockAudioBuffer = Buffer.from('mock-audio-data');
    const mockTranscription = {
      text: 'Hello, this is a test transcription',
      confidence: 0.95,
      words: [
        { word: 'Hello', start: 0, end: 0.5, confidence: 0.98 },
        { word: 'this', start: 0.6, end: 0.8, confidence: 0.94 }
      ]
    };

    test('should use primary provider (AssemblyAI) when available', async () => {
      mockAssemblyAI.transcribe.mockResolvedValue(mockTranscription);
      
      const result = await transcriptionService.transcribe(mockAudioBuffer);
      
      expect(mockAssemblyAI.transcribe).toHaveBeenCalledWith(mockAudioBuffer);
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
        expect.stringContaining('Failed to transcribe with assemblyai')
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
        expect.stringContaining('All transcription providers failed')
      );
    });
  });

  describe('Audio Format Handling', () => {
    test('should handle WAV format', async () => {
      const wavBuffer = Buffer.from('RIFF....WAVEfmt '); // WAV header
      mockAssemblyAI.transcribe.mockResolvedValue({ text: 'WAV audio', confidence: 0.95 });
      
      const result = await transcriptionService.transcribe(wavBuffer, { format: 'wav' });
      
      expect(result.text).toBe('WAV audio');
    });

    test('should handle MP3 format', async () => {
      const mp3Buffer = Buffer.from([0xFF, 0xFB]); // MP3 header
      mockAssemblyAI.transcribe.mockResolvedValue({ text: 'MP3 audio', confidence: 0.95 });
      
      const result = await transcriptionService.transcribe(mp3Buffer, { format: 'mp3' });
      
      expect(result.text).toBe('MP3 audio');
    });

    test('should handle M4A format', async () => {
      const m4aBuffer = Buffer.from('....ftypM4A '); // M4A header
      mockAssemblyAI.transcribe.mockResolvedValue({ text: 'M4A audio', confidence: 0.95 });
      
      const result = await transcriptionService.transcribe(m4aBuffer, { format: 'm4a' });
      
      expect(result.text).toBe('M4A audio');
    });

    test('should auto-detect format from buffer', async () => {
      const wavBuffer = Buffer.from('RIFF....WAVEfmt ');
      mockAssemblyAI.transcribe.mockResolvedValue({ text: 'Auto-detected', confidence: 0.95 });
      
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
      
      mockAssemblyAI.createStream.mockReturnValue(mockStream as any);
      
      const stream = await transcriptionService.createStream();
      
      expect(stream).toBeDefined();
      expect(mockAssemblyAI.createStream).toHaveBeenCalled();
    });

    test('should emit partial transcriptions', async () => {
      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'partial') {
            setTimeout(() => callback({ text: 'Hello', confidence: 0.8 }), 10);
          }
        }),
        write: jest.fn(),
        end: jest.fn(),
      };
      
      mockAssemblyAI.createStream.mockReturnValue(mockStream as any);
      
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
      mockDeepgram.transcribe.mockResolvedValue({ text: 'Fallback', confidence: 0.9 });
      
      const result = await transcriptionService.transcribe(Buffer.from('audio'));
      
      expect(result.text).toBe('Fallback');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Network timeout')
      );
    });

    test('should handle API rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      
      mockAssemblyAI.transcribe.mockRejectedValue(rateLimitError);
      mockDeepgram.transcribe.mockResolvedValue({ text: 'Fallback', confidence: 0.9 });
      
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
        return { text: 'Fast response', confidence: 0.95 };
      });
      
      const start = Date.now();
      await transcriptionService.transcribe(Buffer.from('audio'), { realtime: true });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });

    test('should switch providers if latency exceeds threshold', async () => {
      mockAssemblyAI.transcribe.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 250));
        return { text: 'Slow response', confidence: 0.95 };
      });
      
      mockDeepgram.transcribe.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { text: 'Fast response', confidence: 0.95 };
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
EOF
check_status "TranscriptionService tests creation"

# Create Voice Accuracy tests
cat > services/voice-processing/tests/unit/VoiceAccuracy.test.ts << 'EOF'
import { VoiceAccuracyTester } from '../../src/testing/VoiceAccuracyTester';
import { TranscriptionService } from '../../src/services/TranscriptionService';
import fs from 'fs/promises';
import path from 'path';

describe('Voice Accuracy Requirements', () => {
  let accuracyTester: VoiceAccuracyTester;
  let transcriptionService: TranscriptionService;

  beforeEach(() => {
    transcriptionService = new TranscriptionService();
    accuracyTester = new VoiceAccuracyTester(transcriptionService);
  });

  describe('Demographic Accuracy Tests', () => {
    const MIN_ACCURACY = 95; // 95% minimum accuracy requirement

    test('should achieve >95% accuracy for adult speakers', async () => {
      const testSamples = await accuracyTester.loadTestSamples('demographics/adult');
      const results = await accuracyTester.runAccuracyTests(testSamples);
      
      expect(results.overallAccuracy).toBeGreaterThanOrEqual(MIN_ACCURACY);
      expect(results.wordErrorRate).toBeLessThan(5);
      
      // Log for baseline record
      console.log(`Adult speaker accuracy: ${results.overallAccuracy}%`);
    });

    test('should achieve >93% accuracy for elderly speakers', async () => {
      const testSamples = await accuracyTester.loadTestSamples('demographics/elderly');
      const results = await accuracyTester.runAccuracyTests(testSamples);
      
      // Slightly lower threshold for elderly due to speech patterns
      expect(results.overallAccuracy).toBeGreaterThanOrEqual(93);
      expect(results.criticalWordAccuracy).toBeGreaterThanOrEqual(95);
    });

    test('should achieve consistent accuracy across genders', async () => {
      const genderResults = {
        male: await accuracyTester.runAccuracyTests(
          await accuracyTester.loadTestSamples('demographics/male')
        ),
        female: await accuracyTester.runAccuracyTests(
          await accuracyTester.loadTestSamples('demographics/female')
        ),
        nonbinary: await accuracyTester.runAccuracyTests(
          await accuracyTester.loadTestSamples('demographics/nonbinary')
        )
      };

      const accuracies = Object.values(genderResults).map(r => r.overallAccuracy);
      const maxDifference = Math.max(...accuracies) - Math.min(...accuracies);
      
      // Maximum 2% difference between genders
      expect(maxDifference).toBeLessThan(2);
      
      // All must meet minimum
      Object.values(genderResults).forEach(result => {
        expect(result.overallAccuracy).toBeGreaterThanOrEqual(MIN_ACCURACY);
      });
    });

    test('should handle diverse accents', async () => {
      const accentTests = [
        { accent: 'american-general', minAccuracy: 95 },
        { accent: 'british-rp', minAccuracy: 94 },
        { accent: 'indian-english', minAccuracy: 93 },
        { accent: 'american-southern', minAccuracy: 94 },
        { accent: 'aave', minAccuracy: 93 }
      ];

      for (const { accent, minAccuracy } of accentTests) {
        const samples = await accuracyTester.loadTestSamples(`accents/${accent}`);
        const results = await accuracyTester.runAccuracyTests(samples);
        
        expect(results.overallAccuracy).toBeGreaterThanOrEqual(minAccuracy);
        console.log(`${accent} accuracy: ${results.overallAccuracy}%`);
      }
    });
  });

  describe('Environmental Conditions', () => {
    test('should maintain accuracy in quiet environments', async () => {
      const samples = await accuracyTester.loadTestSamples('environments/quiet');
      const results = await accuracyTester.runAccuracyTests(samples);
      
      expect(results.overallAccuracy).toBeGreaterThanOrEqual(97);
      expect(results.confidence).toBeGreaterThan(0.9);
    });

    test('should handle moderate background noise', async () => {
      const samples = await accuracyTester.loadTestSamples('environments/moderate-noise');
      const results = await accuracyTester.runAccuracyTests(samples);
      
      expect(results.overallAccuracy).toBeGreaterThanOrEqual(92);
      expect(results.noiseHandling).toBe('adequate');
    });

    test('should apply enhancement for noisy environments', async () => {
      const samples = await accuracyTester.loadTestSamples('environments/noisy');
      const results = await accuracyTester.runAccuracyTests(samples);
      
      expect(results.overallAccuracy).toBeGreaterThanOrEqual(85);
      expect(results.enhancementApplied).toBe(true);
      expect(results.userNotified).toBe(true);
    });
  });

  describe('Content-Specific Accuracy', () => {
    test('should accurately transcribe emotional content', async () => {
      const emotionalSamples = await accuracyTester.loadTestSamples('content/emotional');
      const results = await accuracyTester.runAccuracyTests(emotionalSamples);
      
      expect(results.overallAccuracy).toBeGreaterThanOrEqual(94);
      expect(results.emotionalMarkers).toBeGreaterThan(0);
      
      // Critical emotional phrases must be accurate
      expect(results.criticalPhraseAccuracy).toBe(100);
    });

    test('should handle narrative storytelling', async () => {
      const narrativeSamples = await accuracyTester.loadTestSamples('content/narrative');
      const results = await accuracyTester.runAccuracyTests(narrativeSamples);
      
      expect(results.overallAccuracy).toBeGreaterThanOrEqual(95);
      expect(results.properNouns.accuracy).toBeGreaterThan(90);
    });

    test('should transcribe character dialogue accurately', async () => {
      const dialogueSamples = await accuracyTester.loadTestSamples('content/dialogue');
      const results = await accuracyTester.runAccuracyTests(dialogueSamples);
      
      expect(results.overallAccuracy).toBeGreaterThanOrEqual(93);
      expect(results.speakerChanges.detected).toBeGreaterThan(85);
    });
  });

  describe('Word Error Rate (WER) Calculation', () => {
    test('should calculate WER correctly', () => {
      const reference = 'The quick brown fox jumps over the lazy dog';
      const hypothesis = 'The quick brown fox jumped over a lazy dog';
      
      const wer = accuracyTester.calculateWER(reference, hypothesis);
      
      // 2 errors (jumps->jumped, the->a) out of 9 words = 22.22%
      expect(wer).toBeCloseTo(22.22, 2);
    });

    test('should handle punctuation in WER calculation', () => {
      const reference = 'Hello, world! How are you?';
      const hypothesis = 'Hello world. How are you';
      
      const wer = accuracyTester.calculateWER(reference, hypothesis);
      
      // Should normalize punctuation for fair comparison
      expect(wer).toBeLessThan(20);
    });
  });

  describe('Performance Metrics', () => {
    test('should measure transcription latency', async () => {
      const samples = await accuracyTester.loadTestSamples('performance/latency-test');
      const latencyResults = [];
      
      for (const sample of samples) {
        const start = Date.now();
        await transcriptionService.transcribe(sample.audio);
        const latency = Date.now() - start;
        latencyResults.push(latency);
      }
      
      const p50 = percentile(latencyResults, 50);
      const p95 = percentile(latencyResults, 95);
      const p99 = percentile(latencyResults, 99);
      
      expect(p50).toBeLessThan(100);  // 50th percentile < 100ms
      expect(p95).toBeLessThan(200);  // 95th percentile < 200ms
      expect(p99).toBeLessThan(300);  // 99th percentile < 300ms
    });
  });
});

// Helper function for percentile calculation
function percentile(arr: number[], p: number): number {
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}
EOF
check_status "Voice accuracy tests creation"

# Create streaming WebSocket tests
cat > services/voice-processing/tests/unit/StreamingWebSocket.test.ts << 'EOF'
import { VoiceStreamingService } from '../../src/services/VoiceStreamingService';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

jest.mock('ws');

describe('Voice Streaming WebSocket', () => {
  let streamingService: VoiceStreamingService;
  let mockWebSocket: jest.Mocked<WebSocket>;
  let mockEventEmitter: EventEmitter;

  beforeEach(() => {
    mockEventEmitter = new EventEmitter();
    mockWebSocket = {
      on: mockEventEmitter.on.bind(mockEventEmitter),
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
      OPEN: WebSocket.OPEN,
      CLOSED: WebSocket.CLOSED,
    } as any;

    (WebSocket as any).mockImplementation(() => mockWebSocket);
    streamingService = new VoiceStreamingService();
  });

  describe('Connection Management', () => {
    test('should establish WebSocket connection', async () => {
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key'
      });

      expect(WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('wss://'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('test-key')
          })
        })
      );
      expect(connection).toBeDefined();
    });

    test('should handle connection errors', async () => {
      const connectPromise = streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key'
      });

      mockEventEmitter.emit('error', new Error('Connection failed'));

      await expect(connectPromise).rejects.toThrow('Connection failed');
    });

    test('should reconnect on unexpected disconnect', async () => {
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key',
        autoReconnect: true
      });

      const reconnectSpy = jest.spyOn(streamingService, 'reconnect' as any);
      
      mockEventEmitter.emit('close', 1006, 'Abnormal closure');

      expect(reconnectSpy).toHaveBeenCalled();
    });

    test('should not reconnect on normal closure', async () => {
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key',
        autoReconnect: true
      });

      const reconnectSpy = jest.spyOn(streamingService, 'reconnect' as any);
      
      mockEventEmitter.emit('close', 1000, 'Normal closure');

      expect(reconnectSpy).not.toHaveBeenCalled();
    });
  });

  describe('Audio Streaming', () => {
    test('should stream audio chunks', async () => {
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key'
      });

      const audioChunk = Buffer.from('audio-data');
      await streamingService.sendAudio(audioChunk);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.objectContaining({
          audio_data: audioChunk.toString('base64')
        })
      );
    });

    test('should buffer audio when connection is not ready', async () => {
      mockWebSocket.readyState = WebSocket.CONNECTING;
      
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key'
      });

      const audioChunk = Buffer.from('audio-data');
      await streamingService.sendAudio(audioChunk);

      expect(mockWebSocket.send).not.toHaveBeenCalled();

      // Simulate connection ready
      mockWebSocket.readyState = WebSocket.OPEN;
      mockEventEmitter.emit('open');

      // Buffer should be flushed
      expect(mockWebSocket.send).toHaveBeenCalled();
    });

    test('should handle backpressure', async () => {
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key'
      });

      // Simulate backpressure
      mockWebSocket.send.mockImplementation((data, callback) => {
        setTimeout(() => callback?.(undefined), 100);
      });

      const chunks = Array(10).fill(Buffer.from('audio-data'));
      const promises = chunks.map(chunk => streamingService.sendAudio(chunk));

      await Promise.all(promises);

      expect(mockWebSocket.send).toHaveBeenCalledTimes(10);
    });
  });

  describe('Transcription Results', () => {
    test('should emit partial transcriptions', async () => {
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key'
      });

      const partialHandler = jest.fn();
      streamingService.on('partial', partialHandler);

      mockEventEmitter.emit('message', JSON.stringify({
        message_type: 'PartialTranscript',
        text: 'Hello world',
        confidence: 0.85,
        words: [
          { text: 'Hello', start: 0, end: 0.5, confidence: 0.9 },
          { text: 'world', start: 0.6, end: 1.0, confidence: 0.8 }
        ]
      }));

      expect(partialHandler).toHaveBeenCalledWith({
        text: 'Hello world',
        confidence: 0.85,
        words: expect.any(Array)
      });
    });

    test('should emit final transcriptions', async () => {
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key'
      });

      const finalHandler = jest.fn();
      streamingService.on('final', finalHandler);

      mockEventEmitter.emit('message', JSON.stringify({
        message_type: 'FinalTranscript',
        text: 'Hello world, this is final.',
        confidence: 0.95,
        punctuated: true,
        words: [
          { text: 'Hello', start: 0, end: 0.5, confidence: 0.98 },
          { text: 'world', start: 0.6, end: 1.0, confidence: 0.92 }
        ]
      }));

      expect(finalHandler).toHaveBeenCalledWith({
        text: 'Hello world, this is final.',
        confidence: 0.95,
        punctuated: true,
        words: expect.any(Array)
      });
    });

    test('should handle provider-specific message formats', async () => {
      // Test Deepgram format
      const connection = await streamingService.connect({
        provider: 'deepgram',
        apiKey: 'test-key'
      });

      const partialHandler = jest.fn();
      streamingService.on('partial', partialHandler);

      mockEventEmitter.emit('message', JSON.stringify({
        channel: { alternatives: [{ transcript: 'Hello from Deepgram' }] },
        is_final: false
      }));

      expect(partialHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Hello from Deepgram'
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should emit errors for invalid messages', async () => {
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key'
      });

      const errorHandler = jest.fn();
      streamingService.on('error', errorHandler);

      mockEventEmitter.emit('message', 'invalid-json');

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to parse')
        })
      );
    });

    test('should handle provider errors', async () => {
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key'
      });

      const errorHandler = jest.fn();
      streamingService.on('error', errorHandler);

      mockEventEmitter.emit('message', JSON.stringify({
        error: 'Rate limit exceeded',
        code: 'rate_limit'
      }));

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'rate_limit',
          message: 'Rate limit exceeded'
        })
      );
    });
  });

  describe('Latency Monitoring', () => {
    test('should track end-to-end latency', async () => {
      const connection = await streamingService.connect({
        provider: 'assemblyai',
        apiKey: 'test-key'
      });

      const latencyHandler = jest.fn();
      streamingService.on('latency', latencyHandler);

      // Send audio with timestamp
      const audioChunk = Buffer.from('audio-data');
      await streamingService.sendAudio(audioChunk);

      // Simulate transcription response
      mockEventEmitter.emit('message', JSON.stringify({
        message_type: 'PartialTranscript',
        text: 'Hello',
        audio_start: Date.now() - 150, // 150ms ago
        audio_end: Date.now() - 50     // 50ms ago
      }));

      expect(latencyHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          latency: expect.any(Number),
          withinTarget: true // Should be < 200ms
        })
      );
    });
  });
});
EOF
check_status "Streaming WebSocket tests creation"

# Step 2: Create voice test data generator
echo -e "\n${YELLOW}Step 2: Creating voice test data infrastructure...${NC}"

mkdir -p services/voice-processing/src/testing

cat > services/voice-processing/src/testing/VoiceAccuracyTester.ts << 'EOF'
export interface TestSample {
  id: string;
  audio: Buffer;
  reference: string;
  metadata: {
    speaker?: string;
    age?: string;
    gender?: string;
    accent?: string;
    environment?: string;
    emotionalState?: string;
  };
}

export interface AccuracyResults {
  overallAccuracy: number;
  wordErrorRate: number;
  confidence: number;
  criticalWordAccuracy?: number;
  criticalPhraseAccuracy?: number;
  properNouns?: { accuracy: number };
  speakerChanges?: { detected: number };
  emotionalMarkers?: number;
  noiseHandling?: string;
  enhancementApplied?: boolean;
  userNotified?: boolean;
}

export class VoiceAccuracyTester {
  constructor(private transcriptionService: any) {}

  async loadTestSamples(category: string): Promise<TestSample[]> {
    // In real implementation, load from test data directory
    // For now, return mock data
    return [
      {
        id: `${category}-1`,
        audio: Buffer.from('mock-audio'),
        reference: 'This is a test transcription',
        metadata: { category }
      }
    ];
  }

  async runAccuracyTests(samples: TestSample[]): Promise<AccuracyResults> {
    let totalWords = 0;
    let totalErrors = 0;
    let totalConfidence = 0;

    for (const sample of samples) {
      const result = await this.transcriptionService.transcribe(sample.audio);
      const wer = this.calculateWER(sample.reference, result.text);
      
      const wordCount = sample.reference.split(/\s+/).length;
      totalWords += wordCount;
      totalErrors += Math.round(wordCount * (wer / 100));
      totalConfidence += result.confidence || 0;
    }

    const overallWER = (totalErrors / totalWords) * 100;
    const overallAccuracy = 100 - overallWER;
    const avgConfidence = totalConfidence / samples.length;

    return {
      overallAccuracy,
      wordErrorRate: overallWER,
      confidence: avgConfidence,
      noiseHandling: 'adequate',
      enhancementApplied: false,
      userNotified: false
    };
  }

  calculateWER(reference: string, hypothesis: string): number {
    const refWords = reference.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const hypWords = hypothesis.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    
    // Levenshtein distance calculation
    const dp = Array(refWords.length + 1).fill(null)
      .map(() => Array(hypWords.length + 1).fill(0));
    
    for (let i = 0; i <= refWords.length; i++) dp[i][0] = i;
    for (let j = 0; j <= hypWords.length; j++) dp[0][j] = j;
    
    for (let i = 1; i <= refWords.length; i++) {
      for (let j = 1; j <= hypWords.length; j++) {
        if (refWords[i - 1] === hypWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,    // deletion
            dp[i][j - 1] + 1,    // insertion
            dp[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }
    
    const errors = dp[refWords.length][hypWords.length];
    return (errors / refWords.length) * 100;
  }
}
EOF
check_status "Voice accuracy tester creation"

# Step 3: Create test data structure
echo -e "\n${YELLOW}Step 3: Creating test data directory structure...${NC}"

# Create test data directories
mkdir -p tests/voice-accuracy/test-data/{demographics,environments,content,accents,performance}
mkdir -p tests/voice-accuracy/test-data/demographics/{adult,elderly,child,teen,male,female,nonbinary}
mkdir -p tests/voice-accuracy/test-data/environments/{quiet,moderate-noise,noisy,outdoor}
mkdir -p tests/voice-accuracy/test-data/content/{emotional,narrative,dialogue,technical}
mkdir -p tests/voice-accuracy/test-data/accents/{american-general,british-rp,indian-english,american-southern,aave}

# Create sample test data manifest
cat > tests/voice-accuracy/test-data/manifest.json << 'EOF'
{
  "version": "1.0.0",
  "totalSamples": 500,
  "categories": {
    "demographics": {
      "adult": { "samples": 100, "ageRange": "25-55", "minAccuracy": 95 },
      "elderly": { "samples": 50, "ageRange": "65+", "minAccuracy": 93 },
      "child": { "samples": 30, "ageRange": "8-12", "minAccuracy": 92 },
      "teen": { "samples": 40, "ageRange": "13-18", "minAccuracy": 94 },
      "male": { "samples": 50, "minAccuracy": 95 },
      "female": { "samples": 50, "minAccuracy": 95 },
      "nonbinary": { "samples": 30, "minAccuracy": 95 }
    },
    "environments": {
      "quiet": { "samples": 50, "noiseLevel": "<30dB", "minAccuracy": 97 },
      "moderate-noise": { "samples": 50, "noiseLevel": "30-50dB", "minAccuracy": 92 },
      "noisy": { "samples": 50, "noiseLevel": "50-70dB", "minAccuracy": 85 },
      "outdoor": { "samples": 30, "noiseLevel": "variable", "minAccuracy": 88 }
    },
    "content": {
      "emotional": { "samples": 40, "minAccuracy": 94, "criticalPhraseAccuracy": 100 },
      "narrative": { "samples": 50, "minAccuracy": 95 },
      "dialogue": { "samples": 40, "minAccuracy": 93 },
      "technical": { "samples": 30, "minAccuracy": 96 }
    },
    "accents": {
      "american-general": { "samples": 40, "minAccuracy": 95 },
      "british-rp": { "samples": 40, "minAccuracy": 94 },
      "indian-english": { "samples": 40, "minAccuracy": 93 },
      "american-southern": { "samples": 40, "minAccuracy": 94 },
      "aave": { "samples": 40, "minAccuracy": 93 }
    }
  },
  "criticalPhrases": [
    "I need help",
    "I'm in crisis",
    "Emergency",
    "I'm having thoughts of",
    "I feel unsafe"
  ],
  "performanceTargets": {
    "realTimeLatency": { "p50": 100, "p95": 200, "p99": 300 },
    "accuracy": { "overall": 95, "demographic": 93, "environmental": 85 },
    "biasThreshold": { "maxDifference": 2 }
  }
}
EOF
check_status "Test data manifest creation"

# Step 4: Create integration test for voice pipeline
echo -e "\n${YELLOW}Step 4: Creating voice pipeline integration test...${NC}"

cat > tests/integration/voice-pipeline.integration.test.ts << 'EOF'
import { VoiceProcessingService } from '../../services/voice-processing/src';
import { AIOrchestrator } from '../../services/ai-orchestrator/src';
import { MemoryService } from '../../services/memory/src';
import { CrisisDetectionService } from '../../services/crisis-detection/src';

describe('Voice Pipeline Integration', () => {
  let voiceService: VoiceProcessingService;
  let aiService: AIOrchestrator;
  let memoryService: MemoryService;
  let crisisService: CrisisDetectionService;

  beforeAll(async () => {
    // Initialize services
    voiceService = new VoiceProcessingService();
    aiService = new AIOrchestrator();
    memoryService = new MemoryService();
    crisisService = new CrisisDetectionService();
    
    await Promise.all([
      voiceService.initialize(),
      aiService.initialize(),
      memoryService.initialize()
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      voiceService.shutdown(),
      aiService.shutdown(),
      memoryService.shutdown()
    ]);
  });

  describe('End-to-End Voice Recording Flow', () => {
    test('should process voice input through complete pipeline', async () => {
      // 1. Start voice recording session
      const session = await voiceService.createSession({
        userId: 'test-user-123',
        format: 'wav',
        sampleRate: 16000
      });

      // 2. Stream audio data
      const audioChunks = [
        Buffer.from('chunk1'),
        Buffer.from('chunk2'),
        Buffer.from('chunk3')
      ];

      for (const chunk of audioChunks) {
        await session.writeAudio(chunk);
      }

      // 3. Get transcription
      const transcription = await session.getTranscription();
      expect(transcription).toBeDefined();
      expect(transcription.text).toBeTruthy();
      expect(transcription.confidence).toBeGreaterThan(0.8);

      // 4. Send to AI for response
      const aiResponse = await aiService.processConversation({
        userId: 'test-user-123',
        message: transcription.text,
        persona: 'empathetic-guide',
        context: await memoryService.getContext('test-user-123')
      });

      expect(aiResponse).toBeDefined();
      expect(aiResponse.response).toBeTruthy();
      expect(aiResponse.persona).toBe('empathetic-guide');

      // 5. Store in memory
      const memoryResult = await memoryService.store({
        userId: 'test-user-123',
        content: transcription.text,
        aiResponse: aiResponse.response,
        metadata: {
          sessionId: session.id,
          timestamp: new Date(),
          confidence: transcription.confidence
        }
      });

      expect(memoryResult.stored).toBe(true);
      expect(memoryResult.vectorId).toBeDefined();
      expect(memoryResult.graphId).toBeDefined();

      // 6. Verify retrieval
      const retrieved = await memoryService.retrieve({
        userId: 'test-user-123',
        query: transcription.text.substring(0, 50)
      });

      expect(retrieved.results).toHaveLength(greaterThan(0));
      expect(retrieved.results[0].content).toContain(transcription.text);
    });

    test('should handle streaming transcription with real-time AI responses', async () => {
      const streamSession = await voiceService.createStreamingSession({
        userId: 'test-user-123',
        realtime: true
      });

      const partialTranscripts: string[] = [];
      const aiResponses: string[] = [];

      // Set up event handlers
      streamSession.on('partial', async (partial) => {
        partialTranscripts.push(partial.text);
        
        // Send partial to AI for early processing
        if (partial.text.split(' ').length >= 5) {
          const quickResponse = await aiService.processPartial({
            userId: 'test-user-123',
            partial: partial.text,
            persona: 'empathetic-guide'
          });
          
          if (quickResponse.shouldRespond) {
            aiResponses.push(quickResponse.response);
          }
        }
      });

      streamSession.on('final', async (final) => {
        expect(final.text).toBeTruthy();
        expect(final.confidence).toBeGreaterThan(0.85);
      });

      // Simulate streaming audio
      const mockAudioStream = createMockAudioStream();
      await streamSession.pipeFrom(mockAudioStream);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(partialTranscripts.length).toBeGreaterThan(0);
      expect(aiResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Crisis Detection in Voice Pipeline', () => {
    test('should detect and handle crisis content in voice input', async () => {
      const crisisSession = await voiceService.createSession({
        userId: 'test-user-crisis',
        safetyEnabled: true
      });

      // Simulate crisis content audio
      const crisisAudio = await loadTestAudio('crisis-content-sample.wav');
      await crisisSession.writeAudio(crisisAudio);

      const transcription = await crisisSession.getTranscription();
      
      // Crisis detection should trigger
      const crisisResult = await crisisService.analyze(transcription.text);
      expect(crisisResult.detected).toBe(true);
      expect(crisisResult.riskLevel).toBe('high');

      // AI should use trauma-informed approach
      const aiResponse = await aiService.processConversation({
        userId: 'test-user-crisis',
        message: transcription.text,
        crisisDetected: true,
        riskLevel: crisisResult.riskLevel
      });

      expect(aiResponse.approach).toBe('trauma-informed');
      expect(aiResponse.resources).toBeDefined();
      expect(aiResponse.resources.length).toBeGreaterThan(0);

      // Memory should store with appropriate flags
      const memoryResult = await memoryService.store({
        userId: 'test-user-crisis',
        content: transcription.text,
        aiResponse: aiResponse.response,
        flags: ['crisis-content', 'sensitive'],
        encryption: true
      });

      expect(memoryResult.encrypted).toBe(true);
      expect(memoryResult.flags).toContain('crisis-content');
    });
  });

  describe('Performance Requirements', () => {
    test('should meet latency requirements for real-time processing', async () => {
      const performanceResults = {
        transcriptionLatencies: [],
        aiLatencies: [],
        memoryLatencies: [],
        totalLatencies: []
      };

      // Run 100 iterations to get statistical data
      for (let i = 0; i < 100; i++) {
        const startTotal = Date.now();
        
        // Transcription
        const startTranscription = Date.now();
        const audio = await generateTestAudio(1000); // 1 second audio
        const transcription = await voiceService.transcribe(audio);
        performanceResults.transcriptionLatencies.push(Date.now() - startTranscription);

        // AI Processing
        const startAI = Date.now();
        const aiResponse = await aiService.processConversation({
          userId: 'perf-test',
          message: transcription.text
        });
        performanceResults.aiLatencies.push(Date.now() - startAI);

        // Memory Storage
        const startMemory = Date.now();
        await memoryService.store({
          userId: 'perf-test',
          content: transcription.text,
          aiResponse: aiResponse.response
        });
        performanceResults.memoryLatencies.push(Date.now() - startMemory);

        performanceResults.totalLatencies.push(Date.now() - startTotal);
      }

      // Calculate percentiles
      const calculatePercentile = (arr: number[], p: number) => {
        const sorted = arr.sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index];
      };

      // Verify latency requirements
      expect(calculatePercentile(performanceResults.transcriptionLatencies, 95))
        .toBeLessThan(200); // <200ms P95 for transcription

      expect(calculatePercentile(performanceResults.aiLatencies, 95))
        .toBeLessThan(2000); // <2s P95 for AI response

      expect(calculatePercentile(performanceResults.memoryLatencies, 95))
        .toBeLessThan(500); // <500ms P95 for memory storage

      expect(calculatePercentile(performanceResults.totalLatencies, 95))
        .toBeLessThan(3000); // <3s P95 for total pipeline
    });
  });
});

// Helper functions
function createMockAudioStream() {
  const { Readable } = require('stream');
  const stream = new Readable({
    read() {
      // Simulate audio chunks
      setTimeout(() => {
        this.push(Buffer.from('audio-chunk'));
      }, 100);
      
      setTimeout(() => {
        this.push(null); // End stream
      }, 500);
    }
  });
  return stream;
}

async function loadTestAudio(filename: string): Promise<Buffer> {
  // In real implementation, load from test data
  return Buffer.from('mock-crisis-audio-content');
}

async function generateTestAudio(durationMs: number): Promise<Buffer> {
  // In real implementation, generate audio of specified duration
  return Buffer.alloc(durationMs * 16); // 16 bytes per ms at 16kHz
}
EOF
check_status "Voice pipeline integration test creation"

# Step 5: Create performance monitoring
echo -e "\n${YELLOW}Step 5: Creating performance monitoring setup...${NC}"

cat > services/voice-processing/src/monitoring/PerformanceMonitor.ts << 'EOF'
export class VoicePerformanceMonitor {
  private metrics = {
    transcriptionLatencies: [],
    providerFailovers: 0,
    accuracyScores: [],
    audioQualityScores: []
  };

  recordTranscriptionLatency(latency: number, provider: string) {
    this.metrics.transcriptionLatencies.push({
      latency,
      provider,
      timestamp: Date.now()
    });

    // Alert if latency exceeds threshold
    if (latency > 200) {
      this.alertHighLatency(latency, provider);
    }
  }

  recordFailover(fromProvider: string, toProvider: string, reason: string) {
    this.metrics.providerFailovers++;
    console.warn(`Provider failover: ${fromProvider} → ${toProvider} (${reason})`);
  }

  recordAccuracy(accuracy: number, demographic?: string) {
    this.metrics.accuracyScores.push({
      accuracy,
      demographic,
      timestamp: Date.now()
    });

    // Alert if accuracy drops below threshold
    if (accuracy < 93) {
      this.alertLowAccuracy(accuracy, demographic);
    }
  }

  private alertHighLatency(latency: number, provider: string) {
    console.error(`HIGH LATENCY ALERT: ${latency}ms from ${provider}`);
    // In production, send to monitoring service
  }

  private alertLowAccuracy(accuracy: number, demographic?: string) {
    console.error(`LOW ACCURACY ALERT: ${accuracy}% ${demographic ? `for ${demographic}` : ''}`);
    // In production, send to monitoring service
  }

  getMetrics() {
    const latencies = this.metrics.transcriptionLatencies.map(m => m.latency);
    return {
      latency: {
        p50: this.percentile(latencies, 50),
        p95: this.percentile(latencies, 95),
        p99: this.percentile(latencies, 99)
      },
      failovers: this.metrics.providerFailovers,
      accuracy: {
        average: this.average(this.metrics.accuracyScores.map(s => s.accuracy)),
        min: Math.min(...this.metrics.accuracyScores.map(s => s.accuracy))
      }
    };
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
}
EOF
check_status "Performance monitor creation"

# Step 6: Create test runner script
echo -e "\n${YELLOW}Step 6: Creating voice test runner script...${NC}"

cat > scripts/run-voice-tests.sh << 'EOF'
#!/bin/bash
# run-voice-tests.sh - Run comprehensive voice processing tests

echo "🎤 Running Voice Processing Tests..."
echo "==================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Function to run tests with timing
run_timed_test() {
    local test_name=$1
    local test_path=$2
    
    echo -e "\n${YELLOW}Running $test_name...${NC}"
    start_time=$(date +%s)
    
    if npx jest "$test_path" --verbose; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        exit 1
    fi
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    echo "Duration: ${duration}s"
}

# Run unit tests
echo -e "${YELLOW}=== Voice Processing Unit Tests ===${NC}"
run_timed_test "TranscriptionService tests" "services/voice-processing/tests/unit/TranscriptionService.test.ts"
run_timed_test "Voice Accuracy tests" "services/voice-processing/tests/unit/VoiceAccuracy.test.ts"
run_timed_test "Streaming WebSocket tests" "services/voice-processing/tests/unit/StreamingWebSocket.test.ts"

# Run integration tests
echo -e "\n${YELLOW}=== Voice Pipeline Integration Tests ===${NC}"
run_timed_test "Voice Pipeline integration" "tests/integration/voice-pipeline.integration.test.ts"

# Generate coverage report
echo -e "\n${YELLOW}Generating coverage report...${NC}"
npx jest services/voice-processing --coverage --coverageDirectory=coverage/voice-processing

# Check accuracy baseline
echo -e "\n${YELLOW}=== Voice Accuracy Baseline Check ===${NC}"
echo "Minimum Requirements:"
echo "- Overall accuracy: >95%"
echo "- Demographic variance: <2%"
echo "- Crisis phrase accuracy: 100%"
echo "- Real-time latency: <200ms (P95)"

# Performance summary
echo -e "\n${YELLOW}=== Performance Summary ===${NC}"
echo "Run 'npm run test:performance' for detailed latency analysis"
echo "Run 'npm run test:accuracy:full' for comprehensive accuracy testing"

echo -e "\n${GREEN}✅ Voice processing tests complete!${NC}"
echo "Coverage report: coverage/voice-processing/lcov-report/index.html"
EOF

chmod +x scripts/run-voice-tests.sh
check_status "Voice test runner creation"

# Final summary
echo -e "\n${YELLOW}========== Voice Testing Setup Complete ==========${NC}"
echo -e "${GREEN}✅ Created TranscriptionService unit tests${NC}"
echo -e "${GREEN}✅ Created Voice Accuracy testing framework${NC}"
echo -e "${GREEN}✅ Created Streaming WebSocket tests${NC}"
echo -e "${GREEN}✅ Created Voice Pipeline integration tests${NC}"
echo -e "${GREEN}✅ Created Performance monitoring tools${NC}"
echo -e "${GREEN}✅ Created test data structure${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Run './scripts/run-voice-tests.sh' to execute voice tests"
echo "2. Populate test-data directories with real voice samples"
echo "3. Run accuracy baseline testing across demographics"
echo "4. Set up continuous monitoring for production"

echo -e "\n${YELLOW}Critical Success Metrics:${NC}"
echo "- Voice accuracy: >95% (all demographics)"
echo "- Latency: <200ms (P95)"
echo "- Provider failover: <500ms"
echo "- Crisis detection: 100% accuracy"

echo -e "\n${RED}⚠️  REMINDER: Voice is the CORE feature - quality is non-negotiable!${NC}"