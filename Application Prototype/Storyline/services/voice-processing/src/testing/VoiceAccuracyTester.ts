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
        metadata: {}
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
