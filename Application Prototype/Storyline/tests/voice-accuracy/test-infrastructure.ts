import fs from 'fs';
import path from 'path';

export class VoiceTestInfrastructure {
  private testDataPath = 'tests/voice-accuracy/test-data';
  
  async loadDemographicDatasets() {
    const datasets = {
      age: {
        child: await this.loadDataset('age/child-8-12'),
        teen: await this.loadDataset('age/teen-13-17'),
        adult: await this.loadDataset('age/adult-18-65'),
        elderly: await this.loadDataset('age/elderly-65+')
      },
      accent: {
        american: await this.loadDataset('accent/american-general'),
        british: await this.loadDataset('accent/british-rp'),
        indian: await this.loadDataset('accent/indian-english'),
        southern: await this.loadDataset('accent/american-southern'),
        aave: await this.loadDataset('accent/aave')
      },
      gender: {
        male: await this.loadDataset('gender/male'),
        female: await this.loadDataset('gender/female'),
        nonbinary: await this.loadDataset('gender/non-binary')
      }
    };
    
    return datasets;
  }

  async runAccuracyTest(audioFile: Buffer, expectedText: string) {
    const providers = ['assemblyai', 'deepgram', 'openai'];
    const results = {};
    
    for (const provider of providers) {
      const start = Date.now();
      const transcription = await this.transcribe(audioFile, provider);
      const latency = Date.now() - start;
      
      results[provider] = {
        text: transcription,
        accuracy: this.calculateWER(expectedText, transcription),
        latency,
        confidence: transcription.confidence
      };
    }
    
    return results;
  }

  private calculateWER(reference: string, hypothesis: string): number {
    // Word Error Rate calculation
    const refWords = reference.toLowerCase().split(/\s+/);
    const hypWords = hypothesis.toLowerCase().split(/\s+/);
    
    // Levenshtein distance implementation
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