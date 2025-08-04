describe('Critical User Paths - Integration Tests', () => {
  describe('Voice to AI to Memory Pipeline', () => {
    test('complete voice recording to memory storage', async () => {
      // 1. Start voice recording
      const voiceSession = await startVoiceRecording();
      
      // 2. Stream audio
      await streamTestAudio(voiceSession, 'test-narration.wav');
      
      // 3. Get transcription
      const transcription = await voiceSession.getTranscription();
      expect(transcription.text).toBeDefined();
      expect(transcription.confidence).toBeGreaterThan(0.9);
      
      // 4. Send to AI
      const aiResponse = await sendToAI(transcription.text, {
        persona: 'memoir-companion'
      });
      expect(aiResponse.response).toBeDefined();
      
      // 5. Store in memory
      const memoryResult = await storeInMemory({
        content: transcription.text,
        aiResponse: aiResponse.response,
        metadata: { type: 'narration' }
      });
      
      expect(memoryResult.stored).toBe(true);
      expect(memoryResult.vectorId).toBeDefined();
      expect(memoryResult.graphId).toBeDefined();
      
      // 6. Verify retrieval
      const retrieved = await retrieveFromMemory(memoryResult.id);
      expect(retrieved.content).toBe(transcription.text);
    });
  });
  
  describe('Crisis Detection Pipeline', () => {
    test('detects crisis and provides appropriate support', async () => {
      const crisisContent = 'I feel so hopeless and alone';
      
      // 1. Voice input with crisis content
      const voiceResult = await processVoiceInput(crisisContent);
      
      // 2. Crisis detection
      expect(voiceResult.crisisDetected).toBe(true);
      expect(voiceResult.riskLevel).toBe('moderate');
      
      // 3. AI response is trauma-informed
      expect(voiceResult.aiResponse.approach).toBe('trauma-informed');
      expect(voiceResult.aiResponse.tone).toBe('supportive');
      
      // 4. Resources provided
      expect(voiceResult.resources).toBeDefined();
      expect(voiceResult.resources).toHaveLength(greaterThan(0));
      
      // 5. Memory stores with appropriate flags
      const memory = await getMemoryEntry(voiceResult.memoryId);
      expect(memory.flags).toContain('sensitive-content');
      expect(memory.encryption).toBe('enabled');
    });
  });
});