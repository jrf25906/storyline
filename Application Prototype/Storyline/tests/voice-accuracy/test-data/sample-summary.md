# Voice Test Data Summary

## Total Samples: 34

### Demographics Coverage
- **Adults (25-55)**: 7 samples
  - Professional contexts
  - Parenting experiences  
  - Immigration stories
  - Various genders and accents
  
- **Elderly (65+)**: 3 samples
  - Veterans
  - Health conditions (Parkinson's)
  - Memory preservation
  
- **Teens (13-18)**: 1 sample
  - High school experiences
  
- **Children (8-12)**: 1 sample
  - Creative storytelling

### Critical Content (100% Detection Required)
- **Crisis Samples**: 5 samples
  - Immediate suicide risk phrases
  - Self-harm mentions
  - Hopelessness expressions
  - All samples include expected detection and response metadata

### Environmental Conditions
- **Quiet (<30dB)**: 1 sample
- **Moderate Noise (30-50dB)**: 1 sample
- **Noisy (50-70dB)**: 3 samples
  - Coffee shop (68dB)
  - Highway driving (72dB)
- **Outdoor**: 1 sample

### Accent Variations
- **American Southern**: 1 sample
- **British RP**: 1 sample
- **Indian English**: 1 sample
- **AAVE**: 1 sample
- **Nigerian English**: 1 sample
- **Jamaican English**: 1 sample
- **Arabic English**: 1 sample

### Content Types
- **Emotional**: 7 samples (including crisis)
- **Narrative**: 1 sample
- **Dialogue**: 1 sample
- **Technical**: 1 sample

### Speech Variations
- **Stuttering**: 1 sample
- **Rapid speech**: 1 sample

### Performance Testing
- **Latency tests**: 1 sample
- **Streaming tests**: 1 sample

## Key Test Scenarios Covered

1. **Emotional Safety** ✅
   - Crisis phrase detection
   - Trauma-informed responses
   - Professional handoff triggers

2. **Demographic Diversity** ✅
   - Age ranges from 9 to 78
   - Multiple gender identities
   - Various cultural backgrounds

3. **Real-world Conditions** ✅
   - Background noise handling
   - Mobile recording scenarios
   - Various acoustic environments

4. **Accessibility** ✅
   - Speech impediments
   - Health-related speech changes
   - Various speech rates

## Next Steps

1. Generate actual audio files using TTS services
2. Run voice accuracy tests with providers
3. Validate bias metrics across demographics
4. Test crisis detection accuracy (must be 100%)
5. Benchmark latency performance