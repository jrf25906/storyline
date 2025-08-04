Test AI response coherence, empathy, and persona consistency across all providers (OpenAI, Claude, AssemblyAI).

!cd tests/ai-quality && npm run test:ai-quality
!cd tests/ai-quality/coherence && npm run test:coherence
!cd tests/ai-quality/empathy && npm run test:empathy
!cd tests/ai-quality/personas && npm run test:personas

Validate AI quality standards:
- Trauma-informed and emotionally appropriate responses
- Consistent voice persona across conversation threads  
- Coherent narrative flow and memory integration
- Respectful boundary handling and consent
- Appropriate escalation for crisis situations

@docs/design/voice-personas.md

Review any AI quality failures and ensure responses meet Storyline's emotional safety and voice-first principles. Check for persona drift and response inconsistencies.