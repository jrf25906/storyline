Validate AI voice consistency and persona maintenance across conversation threads.

!cd tests/ai-quality/personas && npm run test:persona-consistency
!cd tests/ai-quality/personas && npm run test:voice-drift
!cd tests/integration/full-conversation && npm run test:persona-memory

Validate voice persona standards:
- **Consistency**: Same persona maintained across sessions
- **Memory Integration**: Persona remembers user preferences
- **Emotional Tone**: Appropriate empathy and trauma-informed responses
- **Context Switching**: Smooth transitions between recording and conversation
- **Provider Consistency**: Same persona across OpenAI, Claude, etc.

@docs/design/voice-personas.md

Test persona scenarios:
- Long conversation continuity
- Context switches (voice → text → voice)
- Emotional state changes
- User preference adaptation
- Cross-session persona memory
- Multi-provider persona alignment

Ensure the AI maintains consistent, empathetic personality that users can trust for vulnerable memoir content sharing.