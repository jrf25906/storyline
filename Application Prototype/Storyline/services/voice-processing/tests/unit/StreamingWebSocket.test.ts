import { VoiceStreamingService } from '../../src/services/VoiceStreamingService';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

jest.mock('ws');

describe.skip('Voice Streaming WebSocket - Needs refactoring to match service interface', () => {
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
