#!/bin/bash

echo "🎤 Populating Voice Test Data for Storyline..."
echo "============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="tests/voice-accuracy/test-data"

# Step 1: Create sample text files for each category
echo -e "${YELLOW}Step 1: Creating text samples for demographics...${NC}"

# Adult samples
cat > "$BASE_DIR/demographics/adult/sample-1.json" << 'EOF'
{
  "id": "adult-001",
  "text": "I've been working on my memoir for three years now, and it's finally coming together. The process of writing has helped me understand my own journey better.",
  "speaker": {
    "age": 35,
    "gender": "female",
    "accent": "american-general"
  },
  "metadata": {
    "duration": 12.5,
    "words": 32,
    "emotionalTone": "reflective"
  }
}
EOF

cat > "$BASE_DIR/demographics/adult/sample-2.json" << 'EOF'
{
  "id": "adult-002",
  "text": "Chapter five explores the challenges I faced starting my business during the recession. It was a difficult time, but I learned valuable lessons about resilience.",
  "speaker": {
    "age": 45,
    "gender": "male",
    "accent": "british-rp"
  },
  "metadata": {
    "duration": 11.2,
    "words": 28,
    "emotionalTone": "determined"
  }
}
EOF

# Elderly samples
cat > "$BASE_DIR/demographics/elderly/sample-1.json" << 'EOF'
{
  "id": "elderly-001",
  "text": "When I was young, we didn't have all these fancy gadgets. But we had stories, real stories passed down through generations. Let me tell you about your grandmother.",
  "speaker": {
    "age": 78,
    "gender": "female",
    "accent": "american-southern"
  },
  "metadata": {
    "duration": 14.8,
    "words": 31,
    "emotionalTone": "nostalgic"
  }
}
EOF

# Child samples (with parental consent noted)
cat > "$BASE_DIR/demographics/child/sample-1.json" << 'EOF'
{
  "id": "child-001",
  "text": "My story is about a magical dragon who lives in the clouds. He's purple and sparkly and he helps children find their way home when they're lost.",
  "speaker": {
    "age": 9,
    "gender": "male",
    "accent": "american-general",
    "parentalConsent": true
  },
  "metadata": {
    "duration": 11.5,
    "words": 30,
    "emotionalTone": "excited"
  }
}
EOF

echo -e "${GREEN}✅ Demographic samples created${NC}"

# Step 2: Create environmental noise samples
echo -e "${YELLOW}Step 2: Creating environmental test samples...${NC}"

cat > "$BASE_DIR/environments/quiet/sample-1.json" << 'EOF'
{
  "id": "quiet-001",
  "text": "In the silence of my study, I find the words flow more easily. The character development for chapter twelve needs careful attention to detail.",
  "environment": {
    "type": "quiet",
    "noiseLevel": "25dB",
    "location": "home-office"
  },
  "metadata": {
    "duration": 10.3,
    "words": 26,
    "backgroundNoise": "minimal"
  }
}
EOF

cat > "$BASE_DIR/environments/noisy/sample-1.json" << 'EOF'
{
  "id": "noisy-001",
  "text": "I'm recording this at the coffee shop because inspiration struck. The protagonist just revealed their secret and I need to capture this dialogue immediately.",
  "environment": {
    "type": "noisy",
    "noiseLevel": "65dB",
    "location": "coffee-shop",
    "backgroundSounds": ["conversations", "coffee-machine", "music"]
  },
  "metadata": {
    "duration": 11.7,
    "words": 27,
    "backgroundNoise": "significant"
  }
}
EOF

echo -e "${GREEN}✅ Environmental samples created${NC}"

# Step 3: Create emotional content samples
echo -e "${YELLOW}Step 3: Creating emotional content samples...${NC}"

cat > "$BASE_DIR/content/emotional/sample-1.json" << 'EOF'
{
  "id": "emotional-001",
  "text": "Writing about my mother's passing has been the hardest part of this memoir. I need to take breaks, but I know her story deserves to be told.",
  "content": {
    "type": "emotional",
    "intensity": "high",
    "themes": ["grief", "love", "memory"]
  },
  "criticalPhraseDetection": {
    "required": true,
    "supportLevel": "medium"
  },
  "metadata": {
    "duration": 12.9,
    "words": 30,
    "emotionalTone": "vulnerable"
  }
}
EOF

cat > "$BASE_DIR/content/emotional/critical-phrase-1.json" << 'EOF'
{
  "id": "critical-001",
  "text": "I'm having thoughts of ending everything. I need help right now.",
  "content": {
    "type": "crisis",
    "severity": "critical"
  },
  "criticalPhraseDetection": {
    "required": true,
    "expectedDetection": true,
    "expectedResponse": "immediate-support"
  },
  "metadata": {
    "duration": 4.2,
    "words": 11,
    "emotionalTone": "distressed"
  }
}
EOF

echo -e "${GREEN}✅ Emotional content samples created${NC}"

# Step 4: Create accent variation samples
echo -e "${YELLOW}Step 4: Creating accent variation samples...${NC}"

cat > "$BASE_DIR/accents/indian-english/sample-1.json" << 'EOF'
{
  "id": "indian-001",
  "text": "The festivals of my childhood in Mumbai are vivid memories. Diwali, Holi, and Ganesh Chaturthi shaped my understanding of community and celebration.",
  "speaker": {
    "accent": "indian-english",
    "region": "Mumbai",
    "languageBackground": ["Hindi", "English", "Marathi"]
  },
  "metadata": {
    "duration": 11.3,
    "words": 25,
    "properNouns": ["Mumbai", "Diwali", "Holi", "Ganesh Chaturthi"]
  }
}
EOF

cat > "$BASE_DIR/accents/aave/sample-1.json" << 'EOF'
{
  "id": "aave-001",
  "text": "My grandmama always told me, you gotta speak your truth. That's why I'm writing this book, to tell our stories the way they need to be told.",
  "speaker": {
    "accent": "aave",
    "culturalContext": "African-American Vernacular"
  },
  "metadata": {
    "duration": 11.8,
    "words": 30,
    "dialectFeatures": ["gonna->gotta", "grammatical-variation"]
  }
}
EOF

echo -e "${GREEN}✅ Accent variation samples created${NC}"

# Step 5: Create narrative structure samples
echo -e "${YELLOW}Step 5: Creating narrative content samples...${NC}"

cat > "$BASE_DIR/content/narrative/sample-1.json" << 'EOF'
{
  "id": "narrative-001",
  "text": "The year was 1985. I stood at the intersection of Fifth Avenue and 42nd Street, briefcase in hand, wondering if I was making the biggest mistake of my life.",
  "content": {
    "type": "narrative",
    "structure": "opening",
    "tense": "past",
    "perspective": "first-person"
  },
  "metadata": {
    "duration": 13.4,
    "words": 32,
    "narrativeElements": ["setting", "character", "conflict-introduction"]
  }
}
EOF

echo -e "${GREEN}✅ Narrative samples created${NC}"

# Step 6: Create performance test samples
echo -e "${YELLOW}Step 6: Creating performance test samples...${NC}"

cat > "$BASE_DIR/performance/latency-test-1.json" << 'EOF'
{
  "id": "perf-001",
  "text": "Quick test.",
  "performance": {
    "targetLatency": 50,
    "acceptableLatency": 100,
    "testType": "real-time"
  },
  "metadata": {
    "duration": 1.2,
    "words": 2
  }
}
EOF

cat > "$BASE_DIR/performance/continuous-stream-1.json" << 'EOF'
{
  "id": "stream-001",
  "segments": [
    { "text": "This is segment one of", "timestamp": 0 },
    { "text": "a continuous stream test", "timestamp": 2.1 },
    { "text": "to validate real-time processing", "timestamp": 4.3 },
    { "text": "and transcription accuracy.", "timestamp": 6.8 }
  ],
  "performance": {
    "streamingRequired": true,
    "maxLatencyPerSegment": 200
  }
}
EOF

echo -e "${GREEN}✅ Performance test samples created${NC}"

# Step 7: Create test audio generation script
echo -e "${YELLOW}Step 7: Creating audio generation script...${NC}"

cat > "$BASE_DIR/generate-audio-samples.js" << 'EOF'
const fs = require('fs');
const path = require('path');

// This script would use a TTS service to generate actual audio files
// For testing purposes, we're creating the structure

const samples = [
  'demographics/adult/sample-1.json',
  'demographics/elderly/sample-1.json',
  'demographics/child/sample-1.json',
  'environments/quiet/sample-1.json',
  'environments/noisy/sample-1.json',
  'content/emotional/sample-1.json',
  'content/emotional/critical-phrase-1.json',
  'accents/indian-english/sample-1.json',
  'accents/aave/sample-1.json'
];

samples.forEach(samplePath => {
  const jsonPath = path.join(__dirname, samplePath);
  const audioPath = jsonPath.replace('.json', '.wav');
  
  // In production, this would generate actual audio
  // For now, create placeholder files
  const sampleData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  console.log(`Would generate audio for: ${sampleData.id}`);
  console.log(`Text: ${sampleData.text}`);
  console.log(`Output: ${audioPath}`);
  console.log('---');
});
EOF

echo -e "${GREEN}✅ Audio generation script created${NC}"

# Step 8: Create validation test runner
echo -e "${YELLOW}Step 8: Creating validation test runner...${NC}"

cat > "$BASE_DIR/validate-samples.ts" << 'EOF'
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
      result.issues.push(`${filePath}: ${error.message}`);
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
EOF

echo -e "${GREEN}✅ Validation test runner created${NC}"

# Step 9: Update manifest with actual counts
echo -e "${YELLOW}Step 9: Updating manifest...${NC}"

# Count actual samples created
TOTAL_SAMPLES=$(find "$BASE_DIR" -name "*.json" -not -name "manifest.json" | wc -l | tr -d ' ')

cat > "$BASE_DIR/manifest.json" << EOF
{
  "version": "1.0.0",
  "totalSamples": $TOTAL_SAMPLES,
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "categories": {
    "demographics": {
      "adult": { "samples": 2, "ageRange": "25-55", "minAccuracy": 95 },
      "elderly": { "samples": 1, "ageRange": "65+", "minAccuracy": 93 },
      "child": { "samples": 1, "ageRange": "8-12", "minAccuracy": 92, "requiresConsent": true },
      "teen": { "samples": 0, "ageRange": "13-18", "minAccuracy": 94 },
      "male": { "samples": 0, "minAccuracy": 95 },
      "female": { "samples": 0, "minAccuracy": 95 },
      "nonbinary": { "samples": 0, "minAccuracy": 95 }
    },
    "environments": {
      "quiet": { "samples": 1, "noiseLevel": "<30dB", "minAccuracy": 97 },
      "moderate-noise": { "samples": 0, "noiseLevel": "30-50dB", "minAccuracy": 92 },
      "noisy": { "samples": 1, "noiseLevel": "50-70dB", "minAccuracy": 85 },
      "outdoor": { "samples": 0, "noiseLevel": "variable", "minAccuracy": 88 }
    },
    "content": {
      "emotional": { "samples": 2, "minAccuracy": 94, "criticalPhraseAccuracy": 100 },
      "narrative": { "samples": 1, "minAccuracy": 95 },
      "dialogue": { "samples": 0, "minAccuracy": 93 },
      "technical": { "samples": 0, "minAccuracy": 96 }
    },
    "accents": {
      "american-general": { "samples": 0, "minAccuracy": 95 },
      "british-rp": { "samples": 0, "minAccuracy": 94 },
      "indian-english": { "samples": 1, "minAccuracy": 93 },
      "american-southern": { "samples": 0, "minAccuracy": 94 },
      "aave": { "samples": 1, "minAccuracy": 93 }
    }
  },
  "criticalPhrases": [
    "I need help",
    "I'm in crisis", 
    "Emergency",
    "I'm having thoughts of",
    "I feel unsafe",
    "ending everything",
    "can't go on"
  ],
  "performanceTargets": {
    "realTimeLatency": { "p50": 100, "p95": 200, "p99": 300 },
    "accuracy": { "overall": 95, "demographic": 93, "environmental": 85 },
    "biasThreshold": { "maxDifference": 2 }
  },
  "audioGeneration": {
    "status": "pending",
    "note": "Use generate-audio-samples.js with TTS service to create WAV files"
  }
}
EOF

echo -e "${GREEN}✅ Manifest updated${NC}"

echo ""
echo -e "${GREEN}✅ Voice test data population complete!${NC}"
echo ""
echo "Summary:"
echo "- Created $TOTAL_SAMPLES test samples across all categories"
echo "- Covered demographics, environments, emotions, and accents"
echo "- Included critical phrase detection samples"
echo "- Added performance testing samples"
echo ""
echo "Next steps:"
echo "1. Run 'node $BASE_DIR/generate-audio-samples.js' to create audio files"
echo "2. Run 'npx ts-node $BASE_DIR/validate-samples.ts' to validate samples"
echo "3. Use samples in voice accuracy tests"
echo ""
echo -e "${YELLOW}⚠️  Note: Audio files need to be generated using a TTS service${NC}"