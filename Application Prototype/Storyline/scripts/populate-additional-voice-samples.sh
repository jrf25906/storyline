#!/bin/bash

echo "🎤 Adding Additional Voice Test Samples..."
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="tests/voice-accuracy/test-data"

# Add more adult samples
echo -e "${YELLOW}Adding more adult demographic samples...${NC}"

cat > "$BASE_DIR/demographics/adult/sample-3.json" << 'EOF'
{
  "id": "adult-003",
  "text": "Looking back at my twenties, I realize how much I've grown. The mistakes I made shaped who I am today, and I wouldn't change them.",
  "speaker": {
    "age": 28,
    "gender": "nonbinary",
    "accent": "canadian"
  },
  "metadata": {
    "duration": 10.8,
    "words": 28,
    "emotionalTone": "introspective"
  }
}
EOF

cat > "$BASE_DIR/demographics/adult/sample-4.json" << 'EOF'
{
  "id": "adult-004",
  "text": "My journey through medical school taught me about perseverance. Every sleepless night studying anatomy was worth it when I saved my first patient.",
  "speaker": {
    "age": 42,
    "gender": "female",
    "accent": "australian"
  },
  "metadata": {
    "duration": 11.5,
    "words": 26,
    "emotionalTone": "proud"
  }
}
EOF

# Add teen samples
echo -e "${YELLOW}Adding teen demographic samples...${NC}"

mkdir -p "$BASE_DIR/demographics/teen"

cat > "$BASE_DIR/demographics/teen/sample-1.json" << 'EOF'
{
  "id": "teen-001",
  "text": "High school feels like a maze sometimes. Between college prep and figuring out who I am, writing helps me process everything.",
  "speaker": {
    "age": 16,
    "gender": "male",
    "accent": "american-general",
    "parentalConsent": true
  },
  "metadata": {
    "duration": 9.7,
    "words": 23,
    "emotionalTone": "uncertain"
  }
}
EOF

# Add more emotional samples with critical phrases
echo -e "${YELLOW}Adding more emotional/critical samples...${NC}"

cat > "$BASE_DIR/content/emotional/critical-phrase-2.json" << 'EOF'
{
  "id": "critical-002",
  "text": "I can't go on like this anymore. The pain is too much and I'm thinking about ending it all.",
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
    "duration": 6.8,
    "words": 20,
    "emotionalTone": "desperate"
  }
}
EOF

cat > "$BASE_DIR/content/emotional/critical-phrase-3.json" << 'EOF'
{
  "id": "critical-003",
  "text": "Everyone would be better off without me. I wish I wasn't here anymore.",
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
    "duration": 5.2,
    "words": 14,
    "emotionalTone": "hopeless"
  }
}
EOF

# Add dialogue samples
echo -e "${YELLOW}Adding dialogue samples...${NC}"

mkdir -p "$BASE_DIR/content/dialogue"

cat > "$BASE_DIR/content/dialogue/sample-1.json" << 'EOF'
{
  "id": "dialogue-001",
  "text": "She looked at me and said, 'You can't keep running from your past.' I knew she was right, but admitting it was the hardest part.",
  "content": {
    "type": "dialogue",
    "narrativeContext": "character-interaction"
  },
  "metadata": {
    "duration": 10.2,
    "words": 28,
    "quotedSpeech": true
  }
}
EOF

# Add technical writing samples
echo -e "${YELLOW}Adding technical content samples...${NC}"

mkdir -p "$BASE_DIR/content/technical"

cat > "$BASE_DIR/content/technical/sample-1.json" << 'EOF'
{
  "id": "technical-001",
  "text": "The implementation uses a dual RAG architecture combining vector and graph databases. ChromaDB handles semantic search while Neo4j manages relationship queries.",
  "content": {
    "type": "technical",
    "domain": "software-engineering"
  },
  "metadata": {
    "duration": 9.8,
    "words": 23,
    "technicalTerms": ["RAG", "ChromaDB", "Neo4j"]
  }
}
EOF

# Add moderate noise environment samples
echo -e "${YELLOW}Adding moderate noise environment samples...${NC}"

mkdir -p "$BASE_DIR/environments/moderate-noise"

cat > "$BASE_DIR/environments/moderate-noise/sample-1.json" << 'EOF'
{
  "id": "moderate-001",
  "text": "I'm recording from my home office. The kids are playing in the next room, but I need to capture this idea before it slips away.",
  "environment": {
    "type": "moderate-noise",
    "noiseLevel": "45dB",
    "location": "home-office",
    "backgroundSounds": ["children-playing", "tv-distant"]
  },
  "metadata": {
    "duration": 10.5,
    "words": 27,
    "backgroundNoise": "moderate"
  }
}
EOF

# Add outdoor environment samples
echo -e "${YELLOW}Adding outdoor environment samples...${NC}"

mkdir -p "$BASE_DIR/environments/outdoor"

cat > "$BASE_DIR/environments/outdoor/sample-1.json" << 'EOF'
{
  "id": "outdoor-001",
  "text": "Walking through the park always sparks creativity. The chapter about finding peace in nature practically writes itself here among the trees.",
  "environment": {
    "type": "outdoor",
    "noiseLevel": "variable",
    "location": "park",
    "backgroundSounds": ["birds", "wind", "footsteps"]
  },
  "metadata": {
    "duration": 9.3,
    "words": 23,
    "backgroundNoise": "natural"
  }
}
EOF

# Add more accent samples
echo -e "${YELLOW}Adding more accent variation samples...${NC}"

mkdir -p "$BASE_DIR/accents/american-southern"

cat > "$BASE_DIR/accents/american-southern/sample-1.json" << 'EOF'
{
  "id": "southern-001",
  "text": "Down here in Georgia, we've got stories passed down for generations. My grandaddy used to say every family's got a book in 'em.",
  "speaker": {
    "accent": "american-southern",
    "region": "Georgia",
    "dialectFeatures": ["drawl", "colloquialisms"]
  },
  "metadata": {
    "duration": 10.1,
    "words": 25,
    "regionalExpressions": ["down here", "grandaddy", "in 'em"]
  }
}
EOF

mkdir -p "$BASE_DIR/accents/british-rp"

cat > "$BASE_DIR/accents/british-rp/sample-1.json" << 'EOF'
{
  "id": "british-001",
  "text": "I've been working on this manuscript whilst commuting on the tube. It's quite extraordinary how the rhythm of the train helps the words flow.",
  "speaker": {
    "accent": "british-rp",
    "region": "London",
    "dialectFeatures": ["whilst", "quite"]
  },
  "metadata": {
    "duration": 10.7,
    "words": 26,
    "britishisms": ["whilst", "tube", "quite extraordinary"]
  }
}
EOF

# Create validation summary
echo -e "${YELLOW}Creating validation summary...${NC}"

TOTAL_NEW=$(find "$BASE_DIR" -name "*.json" -not -name "manifest.json" -newer "$BASE_DIR/manifest.json" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_ALL=$(find "$BASE_DIR" -name "*.json" -not -name "manifest.json" | wc -l | tr -d ' ')

echo ""
echo -e "${GREEN}✅ Additional samples created!${NC}"
echo "Summary:"
echo "- New samples added: $TOTAL_NEW"
echo "- Total samples now: $TOTAL_ALL"
echo ""
echo "Coverage improved:"
echo "- ✓ Teen demographics added"
echo "- ✓ More critical phrase samples"
echo "- ✓ Dialogue content added"
echo "- ✓ Technical content added"
echo "- ✓ Moderate noise environments"
echo "- ✓ Outdoor environments"
echo "- ✓ Southern US and British accents"