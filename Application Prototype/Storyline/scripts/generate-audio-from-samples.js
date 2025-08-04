const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TEST_DATA_DIR = path.join(__dirname, '../tests/voice-accuracy/test-data');

// Voice mapping for different demographics
const VOICE_MAPPING = {
  'adult-female': 'alloy',
  'adult-male': 'echo',
  'elderly-female': 'nova',
  'elderly-male': 'fable',
  'child': 'shimmer',
  'teen': 'onyx'
};

async function generateAudioForSample(samplePath) {
  try {
    // Read the JSON sample
    const content = await readFile(samplePath, 'utf8');
    const sample = JSON.parse(content);
    
    if (!sample.text || !sample.id) {
      console.log(`Skipping ${samplePath} - missing text or id`);
      return;
    }

    // Determine voice based on speaker metadata
    let voice = 'alloy'; // default
    if (sample.speaker) {
      const age = sample.speaker.age;
      const gender = sample.speaker.gender || 'neutral';
      
      if (age < 13) {
        voice = VOICE_MAPPING['child'];
      } else if (age < 20) {
        voice = VOICE_MAPPING['teen'];
      } else if (age < 65) {
        voice = gender === 'male' ? VOICE_MAPPING['adult-male'] : VOICE_MAPPING['adult-female'];
      } else {
        voice = gender === 'male' ? VOICE_MAPPING['elderly-male'] : VOICE_MAPPING['elderly-female'];
      }
    }

    console.log(`Generating audio for ${sample.id} with voice: ${voice}`);
    
    // Generate audio using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: sample.text,
      speed: 1.0
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Save as MP3 (we can convert to WAV later if needed)
    const audioPath = samplePath.replace('.json', '.mp3');
    await writeFile(audioPath, buffer);
    
    console.log(`✓ Generated audio: ${audioPath}`);
    
    // Update the JSON sample with audio file reference
    sample.audioFile = path.basename(audioPath);
    sample.audioFormat = 'mp3';
    await writeFile(samplePath, JSON.stringify(sample, null, 2));
    
    return audioPath;
  } catch (error) {
    console.error(`Error generating audio for ${samplePath}:`, error.message);
  }
}

async function processDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.name.endsWith('.json') && !entry.name.includes('manifest')) {
      await generateAudioForSample(fullPath);
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function main() {
  console.log('🎤 Generating Audio Files from Voice Test Samples');
  console.log('==============================================');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set');
    console.log('Please set your OpenAI API key:');
    console.log('export OPENAI_API_KEY="your-api-key-here"');
    process.exit(1);
  }
  
  try {
    // Process all subdirectories
    await processDirectory(TEST_DATA_DIR);
    
    console.log('\n✅ Audio generation complete!');
    console.log('\nNext steps:');
    console.log('1. Convert MP3 files to WAV if needed for testing');
    console.log('2. Run voice accuracy tests with real audio');
    console.log('3. Validate transcription accuracy across providers');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateAudioForSample };