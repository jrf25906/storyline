import * as fs from 'fs';
import * as path from 'path';

interface TestSample {
  id: string;
  text: string;
  metadata: {
    duration: number;
    words: number;
    emotionalTone?: string;
  };
}

interface ValidationResult {
  totalSamples: number;
  validSamples: number;
  issues: string[];
}

function validateSamples(directory: string): ValidationResult {
  const result: ValidationResult = {
    totalSamples: 0,
    validSamples: 0,
    issues: []
  };

  function validateSample(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const sample: TestSample = JSON.parse(content);
      
      result.totalSamples++;
      
      // Validate required fields
      if (!sample.id || !sample.text || !sample.metadata) {
        result.issues.push(`${filePath}: Missing required fields`);
        return;
      }
      
      // Validate word count
      const actualWords = sample.text.split(/\s+/).length;
      if (Math.abs(actualWords - sample.metadata.words) > 2) {
        result.issues.push(
          `${filePath}: Word count mismatch (expected: ${sample.metadata.words}, actual: ${actualWords})`
        );
      }
      
      // Check for critical phrases in emotional content
      if (filePath.includes('emotional') && filePath.includes('critical')) {
        const criticalPhrases = [
          'ending everything',
          'need help',
          'crisis',
          'thoughts of'
        ];
        
        const hasCriticalPhrase = criticalPhrases.some(phrase => 
          sample.text.toLowerCase().includes(phrase)
        );
        
        if (!hasCriticalPhrase) {
          result.issues.push(`${filePath}: Critical sample missing crisis phrases`);
        }
      }
      
      result.validSamples++;
    } catch (error) {
      result.issues.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Recursively validate all JSON files
  function walkDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDirectory(filePath);
      } else if (file.endsWith('.json') && !file.includes('manifest')) {
        validateSample(filePath);
      }
    });
  }

  walkDirectory(directory);
  return result;
}

// Run validation
const result = validateSamples(__dirname);
console.log(`\nValidation Results:`);
console.log(`Total Samples: ${result.totalSamples}`);
console.log(`Valid Samples: ${result.validSamples}`);
console.log(`Issues Found: ${result.issues.length}`);

if (result.issues.length > 0) {
  console.log('\nIssues:');
  result.issues.forEach(issue => console.log(`- ${issue}`));
}
