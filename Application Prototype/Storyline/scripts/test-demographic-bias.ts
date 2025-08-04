import { VoiceTranscriptionService } from '../services/voice-processing/src/services/VoiceTranscriptionService';
import * as fs from 'fs';
import * as path from 'path';

interface BiasTestResult {
  demographic: string;
  samples: number;
  avgConfidence: number;
  avgProcessingTime: number;
  avgWordErrorRate: number;
  provider: string;
}

interface DemographicGroup {
  name: string;
  samples: string[];
  expectedAccuracy: number;
}

class DemographicBiasAnalyzer {
  private transcriptionService: VoiceTranscriptionService;
  private results: Map<string, BiasTestResult[]> = new Map();

  constructor() {
    this.transcriptionService = new VoiceTranscriptionService();
  }

  async analyzeBias(): Promise<void> {
    const testDataDir = path.join(__dirname, '../tests/voice-accuracy/test-data');
    
    // Define demographic groups
    const demographicGroups: DemographicGroup[] = [
      {
        name: 'adult-male',
        samples: this.findSamples(testDataDir, 'adult', 'male'),
        expectedAccuracy: 0.95
      },
      {
        name: 'adult-female',
        samples: this.findSamples(testDataDir, 'adult', 'female'),
        expectedAccuracy: 0.95
      },
      {
        name: 'elderly',
        samples: this.findSamples(testDataDir, 'elderly'),
        expectedAccuracy: 0.93
      },
      {
        name: 'child',
        samples: this.findSamples(testDataDir, 'child'),
        expectedAccuracy: 0.92
      },
      {
        name: 'accent-indian',
        samples: this.findSamples(testDataDir, 'indian-english'),
        expectedAccuracy: 0.93
      },
      {
        name: 'accent-aave',
        samples: this.findSamples(testDataDir, 'aave'),
        expectedAccuracy: 0.93
      },
      {
        name: 'accent-southern',
        samples: this.findSamples(testDataDir, 'american-southern'),
        expectedAccuracy: 0.94
      }
    ];

    // Test each demographic group
    for (const group of demographicGroups) {
      console.log(`\nTesting demographic: ${group.name}`);
      await this.testDemographicGroup(group);
    }

    // Analyze results
    this.analyzeResults();
  }

  private findSamples(baseDir: string, ...keywords: string[]): string[] {
    const samples: string[] = [];
    
    function searchDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          searchDir(fullPath);
        } else if (entry.name.endsWith('.json') && !entry.name.includes('manifest')) {
          // Check if path contains any of the keywords
          const pathLower = fullPath.toLowerCase();
          if (keywords.every(keyword => pathLower.includes(keyword))) {
            samples.push(fullPath);
          }
        }
      }
    }
    
    searchDir(baseDir);
    return samples;
  }

  private async testDemographicGroup(group: DemographicGroup): Promise<void> {
    const results: BiasTestResult[] = [];
    
    for (const provider of this.transcriptionService.getAvailableProviders()) {
      let totalConfidence = 0;
      let totalProcessingTime = 0;
      let totalWER = 0;
      let successfulSamples = 0;
      
      for (const samplePath of group.samples) {
        try {
          // Read sample
          const sampleData = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
          
          // Skip if no audio file
          if (!sampleData.audioFile) {
            console.log(`Skipping ${sampleData.id} - no audio file`);
            continue;
          }
          
          // Load audio file
          const audioPath = path.join(path.dirname(samplePath), sampleData.audioFile);
          if (!fs.existsSync(audioPath)) {
            console.log(`Audio file not found: ${audioPath}`);
            continue;
          }
          
          const audioBuffer = fs.readFileSync(audioPath);
          
          // Transcribe with metadata
          const result = await this.transcriptionService.transcribe(audioBuffer, {
            preferredProvider: provider,
            speakerMetadata: {
              ...sampleData.speaker,
              expectedText: sampleData.text
            }
          });
          
          // Calculate metrics
          totalConfidence += result.confidence;
          totalProcessingTime += result.processingTime;
          totalWER += this.calculateWER(result.text, sampleData.text);
          successfulSamples++;
          
        } catch (error) {
          console.error(`Error testing ${samplePath} with ${provider}:`, error.message);
        }
      }
      
      if (successfulSamples > 0) {
        results.push({
          demographic: group.name,
          samples: successfulSamples,
          avgConfidence: totalConfidence / successfulSamples,
          avgProcessingTime: totalProcessingTime / successfulSamples,
          avgWordErrorRate: totalWER / successfulSamples,
          provider
        });
      }
    }
    
    this.results.set(group.name, results);
  }

  private calculateWER(hypothesis: string, reference: string): number {
    const hypWords = hypothesis.toLowerCase().split(/\s+/);
    const refWords = reference.toLowerCase().split(/\s+/);
    
    // Simple WER calculation
    const maxLen = Math.max(hypWords.length, refWords.length);
    let errors = 0;
    
    for (let i = 0; i < maxLen; i++) {
      if (hypWords[i] !== refWords[i]) {
        errors++;
      }
    }
    
    return errors / maxLen;
  }

  private analyzeResults(): void {
    console.log('\n=== Demographic Bias Analysis Results ===\n');
    
    // Calculate bias metrics per provider
    const providers = this.transcriptionService.getAvailableProviders();
    
    for (const provider of providers) {
      console.log(`\nProvider: ${provider}`);
      console.log('------------------------');
      
      const providerResults: BiasTestResult[] = [];
      
      for (const [demographic, results] of this.results) {
        const providerResult = results.find(r => r.provider === provider);
        if (providerResult) {
          providerResults.push(providerResult);
          
          console.log(`${demographic}:`);
          console.log(`  Samples: ${providerResult.samples}`);
          console.log(`  Avg Confidence: ${(providerResult.avgConfidence * 100).toFixed(2)}%`);
          console.log(`  Avg WER: ${(providerResult.avgWordErrorRate * 100).toFixed(2)}%`);
          console.log(`  Avg Processing Time: ${providerResult.avgProcessingTime.toFixed(0)}ms`);
        }
      }
      
      // Calculate bias score (max difference in accuracy)
      if (providerResults.length > 1) {
        const accuracies = providerResults.map(r => 1 - r.avgWordErrorRate);
        const maxAccuracy = Math.max(...accuracies);
        const minAccuracy = Math.min(...accuracies);
        const biasScore = maxAccuracy - minAccuracy;
        
        console.log(`\nBias Score: ${(biasScore * 100).toFixed(2)}%`);
        console.log(`Target: < 2%`);
        console.log(`Status: ${biasScore < 0.02 ? '✅ PASS' : '❌ FAIL'}`);
      }
    }
    
    // Overall analysis
    console.log('\n=== Overall Analysis ===');
    console.log('\nCritical findings:');
    
    // Check for any demographic with significantly lower performance
    for (const [demographic, results] of this.results) {
      const avgWER = results.reduce((sum, r) => sum + r.avgWordErrorRate, 0) / results.length;
      if (avgWER > 0.1) {
        console.log(`⚠️  ${demographic} has high error rate: ${(avgWER * 100).toFixed(2)}%`);
      }
    }
    
    // Save detailed results
    const reportPath = path.join(__dirname, '../tests/reports/demographic-bias-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: Object.fromEntries(this.results),
      summary: this.generateSummary()
    }, null, 2));
    
    console.log(`\nDetailed report saved to: ${reportPath}`);
  }

  private generateSummary(): any {
    const summary = {
      totalDemographics: this.results.size,
      providers: {} as any
    };
    
    const providers = this.transcriptionService.getAvailableProviders();
    
    for (const provider of providers) {
      const providerData = {
        demographics: {} as any,
        overallBiasScore: 0,
        passesThreshold: false
      };
      
      const accuracies: number[] = [];
      
      for (const [demographic, results] of this.results) {
        const result = results.find(r => r.provider === provider);
        if (result) {
          const accuracy = 1 - result.avgWordErrorRate;
          accuracies.push(accuracy);
          providerData.demographics[demographic] = {
            accuracy: accuracy,
            confidence: result.avgConfidence,
            processingTime: result.avgProcessingTime
          };
        }
      }
      
      if (accuracies.length > 1) {
        providerData.overallBiasScore = Math.max(...accuracies) - Math.min(...accuracies);
        providerData.passesThreshold = providerData.overallBiasScore < 0.02;
      }
      
      summary.providers[provider] = providerData;
    }
    
    return summary;
  }
}

// Run the analysis
async function main() {
  console.log('🔍 Starting Demographic Bias Analysis for Voice Providers');
  console.log('========================================================\n');
  
  const analyzer = new DemographicBiasAnalyzer();
  
  try {
    await analyzer.analyzeBias();
  } catch (error) {
    console.error('Error during analysis:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DemographicBiasAnalyzer };