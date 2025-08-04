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
