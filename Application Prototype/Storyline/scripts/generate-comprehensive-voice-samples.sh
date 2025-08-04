#!/bin/bash

echo "🎯 Generating Comprehensive Voice Test Sample Set..."
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="tests/voice-accuracy/test-data"

# Function to create sample with proper formatting
create_sample() {
  local dir="$1"
  local filename="$2"
  local content="$3"
  
  mkdir -p "$BASE_DIR/$dir"
  echo "$content" > "$BASE_DIR/$dir/$filename"
}

# Generate diverse adult samples (different ages, genders, contexts)
echo -e "${BLUE}=== Generating Adult Demographics (Ages 25-55) ===${NC}"

# Professional contexts
create_sample "demographics/adult" "professional-1.json" '{
  "id": "adult-pro-001",
  "text": "After fifteen years in corporate finance, I decided to write about the human side of Wall Street. The stories behind the numbers are what really matter.",
  "speaker": {
    "age": 38,
    "gender": "male",
    "accent": "american-northeast",
    "profession": "finance"
  },
  "metadata": {
    "duration": 11.2,
    "words": 29,
    "emotionalTone": "reflective",
    "context": "professional-memoir"
  }
}'

# Parenting experiences
create_sample "demographics/adult" "parent-1.json" '{
  "id": "adult-parent-001",
  "text": "Becoming a single mother at thirty-two changed everything. This book is for my daughter, so she understands the choices I made for us.",
  "speaker": {
    "age": 35,
    "gender": "female",
    "accent": "american-midwest",
    "parentalStatus": "single-parent"
  },
  "metadata": {
    "duration": 10.3,
    "words": 25,
    "emotionalTone": "determined",
    "context": "parenting-memoir"
  }
}'

# Immigration stories
create_sample "demographics/adult" "immigrant-1.json" '{
  "id": "adult-immig-001",
  "text": "I left everything behind in Syria to give my children a future. Writing our journey helps me process the trauma and celebrate our survival.",
  "speaker": {
    "age": 44,
    "gender": "female",
    "accent": "arabic-english",
    "languageBackground": ["Arabic", "English"]
  },
  "metadata": {
    "duration": 10.8,
    "words": 26,
    "emotionalTone": "hopeful",
    "context": "immigration-story"
  }
}'

# Generate elderly samples with various health conditions
echo -e "${BLUE}=== Generating Elderly Demographics (Ages 65+) ===${NC}"

create_sample "demographics/elderly" "veteran-1.json" '{
  "id": "elderly-vet-001",
  "text": "I served in Vietnam when I was nineteen. Fifty years later, I'm finally ready to tell my story. Some wounds take decades to heal.",
  "speaker": {
    "age": 72,
    "gender": "male",
    "accent": "american-southern",
    "veteranStatus": true
  },
  "metadata": {
    "duration": 11.5,
    "words": 27,
    "emotionalTone": "somber",
    "context": "war-memoir"
  }
}'

create_sample "demographics/elderly" "tremor-1.json" '{
  "id": "elderly-tremor-001",
  "text": "My hands shake now from Parkinson's, but my voice is still strong. That's why I'm dictating my memoirs instead of writing them.",
  "speaker": {
    "age": 68,
    "gender": "female",
    "accent": "british-rp",
    "healthCondition": "parkinsons",
    "speechCharacteristics": ["mild-tremor", "occasional-pause"]
  },
  "metadata": {
    "duration": 11.9,
    "words": 25,
    "emotionalTone": "resilient",
    "context": "health-journey"
  }
}'

# Generate critical emotional content (with safety flags)
echo -e "${BLUE}=== Generating Critical Emotional Content ===${NC}"

create_sample "content/emotional" "crisis-immediate-1.json" '{
  "id": "crisis-immediate-001",
  "text": "I don't want to wake up tomorrow. The pain is unbearable and I've been thinking about how to end it all.",
  "content": {
    "type": "crisis",
    "severity": "critical-immediate",
    "interventionRequired": true
  },
  "criticalPhraseDetection": {
    "required": true,
    "expectedDetection": true,
    "expectedResponse": "immediate-support",
    "escalationRequired": true,
    "detectedPhrases": ["don'\''t want to wake up tomorrow", "end it all"]
  },
  "metadata": {
    "duration": 7.8,
    "words": 22,
    "emotionalTone": "suicidal",
    "responseTime": "immediate"
  }
}'

create_sample "content/emotional" "self-harm-1.json" '{
  "id": "crisis-selfharm-001",
  "text": "I've been hurting myself again. The cutting helps me feel something other than this emptiness. I know I need help but I'm scared.",
  "content": {
    "type": "crisis",
    "severity": "high",
    "interventionRequired": true
  },
  "criticalPhraseDetection": {
    "required": true,
    "expectedDetection": true,
    "expectedResponse": "compassionate-support",
    "detectedPhrases": ["hurting myself", "cutting", "need help"]
  },
  "metadata": {
    "duration": 9.2,
    "words": 26,
    "emotionalTone": "distressed",
    "responseTime": "urgent"
  }
}'

# Generate samples for various noise environments
echo -e "${BLUE}=== Generating Environmental Noise Samples ===${NC}"

# Coffee shop with specific sounds
create_sample "environments/noisy" "coffee-shop-detailed.json" '{
  "id": "env-coffee-001",
  "text": "The espresso machine is really loud but I had to capture this scene while it's fresh. My protagonist just had their breakthrough moment.",
  "environment": {
    "type": "coffee-shop",
    "noiseLevel": "68dB",
    "peakNoise": "85dB",
    "backgroundSounds": {
      "espressoMachine": { "frequency": "intermittent", "level": "loud" },
      "conversations": { "frequency": "constant", "level": "moderate" },
      "music": { "frequency": "constant", "level": "soft" },
      "dishes": { "frequency": "occasional", "level": "moderate" }
    }
  },
  "metadata": {
    "duration": 10.1,
    "words": 25,
    "intelligibilityChallenge": "high",
    "requiredProcessing": ["noise-reduction", "voice-isolation"]
  }
}'

# Car environment
create_sample "environments/outdoor" "driving-highway.json" '{
  "id": "env-car-001",
  "text": "I'm driving on I-95 and just thought of the perfect ending. The road noise is loud but I need to record this before I forget.",
  "environment": {
    "type": "vehicle",
    "noiseLevel": "72dB",
    "location": "highway",
    "speed": "65mph",
    "backgroundSounds": {
      "engineNoise": { "frequency": "constant", "level": "loud" },
      "windNoise": { "frequency": "constant", "level": "moderate" },
      "roadNoise": { "frequency": "constant", "level": "loud" }
    }
  },
  "metadata": {
    "duration": 10.5,
    "words": 27,
    "intelligibilityChallenge": "very-high",
    "safetyNote": "hands-free-recording"
  }
}'

# Generate accent variation samples
echo -e "${BLUE}=== Generating Diverse Accent Samples ===${NC}"

# Nigerian English
create_sample "accents/nigerian-english" "sample-1.json" '{
  "id": "accent-nigerian-001",
  "text": "Growing up in Lagos shaped my worldview. The hustle and bustle of the city, the warmth of our extended family, it all influences my writing.",
  "speaker": {
    "accent": "nigerian-english",
    "region": "Lagos",
    "languageBackground": ["Yoruba", "English", "Pidgin"],
    "intonationPattern": "tonal"
  },
  "metadata": {
    "duration": 11.3,
    "words": 28,
    "prosody": "rhythmic",
    "stressPattern": "syllable-timed"
  }
}'

# Jamaican English
create_sample "accents/jamaican-english" "sample-1.json" '{
  "id": "accent-jamaican-001",
  "text": "Mi grandmother used to tell mi stories bout duppy and rolling calf. Now I'm writing dem down so di next generation don't forget our folklore.",
  "speaker": {
    "accent": "jamaican-english",
    "dialectName": "Jamaican Patois",
    "codeSwitch": true
  },
  "metadata": {
    "duration": 10.8,
    "words": 27,
    "dialectFeatures": ["mi", "bout", "dem", "di"],
    "culturalContext": "folklore-preservation"
  }
}'

# Generate samples with speech variations
echo -e "${BLUE}=== Generating Speech Variation Samples ===${NC}"

# Stuttering
create_sample "speech-variations/stutter" "sample-1.json" '{
  "id": "speech-stutter-001",
  "text": "W-w-writing has always been my escape. When I st-stutter, the words get stuck, but on paper, they flow freely.",
  "speaker": {
    "speechCondition": "stuttering",
    "severity": "moderate",
    "triggers": ["initial-sounds", "stress"]
  },
  "metadata": {
    "duration": 9.8,
    "words": 21,
    "disfluencies": ["repetition", "prolongation"],
    "accommodationNeeded": true
  }
}'

# Fast speech
create_sample "speech-variations/fast" "sample-1.json" '{
  "id": "speech-fast-001",
  "text": "OkaysoIjusthadthisbrilliantideaformynextchapterandIneedtogetitdownbeforeIloseitbecauseyouknowhowitiswhenyou'reintheflowandeverythingjustclicks",
  "speaker": {
    "speechRate": "very-fast",
    "wordsPerMinute": 220,
    "characteristic": "rapid-speech"
  },
  "metadata": {
    "duration": 4.2,
    "words": 19,
    "segmentationChallenge": "high",
    "processingRequired": ["speech-segmentation", "pace-normalization"]
  }
}'

# Count total samples
TOTAL=$(find "$BASE_DIR" -name "*.json" -not -name "manifest.json" | wc -l | tr -d ' ')

echo ""
echo -e "${GREEN}✅ Comprehensive sample generation complete!${NC}"
echo ""
echo "Statistics:"
echo "- Total samples created: $TOTAL"
echo "- Crisis/safety samples: $(find "$BASE_DIR" -name "*crisis*.json" -o -name "*critical*.json" | wc -l | tr -d ' ')"
echo "- Environmental variations: $(find "$BASE_DIR/environments" -name "*.json" | wc -l | tr -d ' ')"
echo "- Accent variations: $(find "$BASE_DIR/accents" -name "*.json" | wc -l | tr -d ' ')"
echo "- Speech variations: $(find "$BASE_DIR/speech-variations" -name "*.json" 2>/dev/null | wc -l | tr -d ' ')"
echo ""
echo -e "${YELLOW}Note: These samples are designed to test:${NC}"
echo "- Crisis detection accuracy - 100% required"
echo "- Demographic bias prevention"
echo "- Environmental noise handling"
echo "- Accent recognition equality"
echo "- Speech variation accommodation"