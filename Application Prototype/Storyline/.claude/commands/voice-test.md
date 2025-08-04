Run comprehensive voice accuracy tests for Storyline including demographic validation and latency checks.

!cd tests/voice-accuracy && npm run test:voice-accuracy
!cd tests/performance && npm run test:voice-latency

Check that voice processing meets Storyline requirements:
- <200ms latency for real-time transcription
- >95% accuracy across demographic groups
- Graceful handling of background noise and accents
- Consistent audio quality across devices

If any tests fail, analyze the results and suggest specific improvements for voice processing pipeline.