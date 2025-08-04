Check memory retrieval performance and contradiction-aware narrative memory for Storyline.

!cd tests/integration/memory-retrieval && npm run test:memory
!cd tests/performance/memory-speed && npm run test:memory-performance
!cd services/memory && npm run test:contradiction-detection

Validate memory system standards:
- Fast retrieval (<100ms for context queries)
- Accurate contradiction detection in memoir evolution
- Privacy-compliant storage and access
- Consistent narrative thread maintenance across sessions
- Chroma DB vector storage performance

@docs/technical/memory-system.md

Review memory test results and ensure the system maintains conversation continuity while detecting narrative inconsistencies appropriately.