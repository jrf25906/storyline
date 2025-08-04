# Storyline Memory Architecture Specification

## Contradiction-Aware Narrative Memory for Memoir Evolution

### Author: [James Farmer]
### Date: July 2025 (Updated for Narrative Intelligence)

---

## 1. Purpose

This document specifies the comprehensive memory architecture for Storyline's AI system, designed to handle memoir writing challenges while providing advanced narrative intelligence capabilities including story structure tracking, character development analysis, and writing craft guidance.

---

## 2. Core Memory Challenges in Memoir Writing

### The Contradiction Problem
- Memoirists often revisit memories with new perspectives
- Initial grief may later be understood as growth
- Traumatic events may be reframed as empowering moments
- Traditional AI systems treat contradictions as errors to resolve

### Memory Evolution Needs
- Honor multiple versions of the same memory
- Allow perspective layering without judgment
- Track emotional progression over time
- Maintain narrative consistency while embracing complexity

---

## 3. Memory Hierarchy Architecture

### Level 1: Scene Memory (5k tokens)
- **Scope**: Individual recording sessions or conversations
- **Content**: Raw transcripts, emotional tone, immediate context
- **Lifespan**: Persistent, forms foundation for higher levels
- **Storage**: Local SQLite + Chroma vectors

### Level 2: Chapter Memory (50k tokens)
- **Scope**: Thematic groupings of related scenes
- **Content**: Synthesized narrative, character development, themes
- **Lifespan**: Evolves as new scenes are added
- **Storage**: Chroma DB with hierarchical indexing

### Level 3: Narrative Intelligence Layer (100k tokens)
- **Scope**: Story structure, character arcs, plot analysis
- **Content**: Story beats, character relationships, conflict tracking, theme integration
- **Lifespan**: Continuously updated with narrative analysis
- **Storage**: Dedicated narrative analysis service + Chroma DB

### Level 4: Book Memory (200k tokens)
- **Scope**: Entire memoir project context
- **Content**: Overall narrative arc, character evolution, major themes
- **Lifespan**: Living document that grows throughout project
- **Storage**: Claude 3.5 context window + periodic summarization

---

## 4. Contradiction Detection & Handling

### Detection Mechanisms
- **Semantic Analysis**: Vector similarity between memory versions
- **Emotional Tone Shift**: Sentiment analysis across time periods
- **Factual Inconsistency**: Timeline and detail comparison
- **Perspective Evolution**: Voice/stance analysis
- **Narrative Consistency**: Character behavior and motivation tracking
- **Plot Coherence**: Story structure and timeline validation

### Response Strategies
```
When contradiction detected:
> "Earlier you described this as grief. Now it sounds like forgiveness. 
> Would you like to:
> • Replace the earlier version
> • Layer both perspectives 
> • Explore how your understanding has evolved"
```

### Memory Versioning
- Each memory maintains version history
- User can select which version to emphasize
- AI prompts acknowledge evolution without judgment

---

## 5. Emotional Context Management

### Emotional State Tracking
- **Tone Analysis**: Real-time emotion detection in speech
- **Trigger Mapping**: Identify sensitive topics and patterns
- **Safety Protocols**: Gentle pivots when distress detected
- **Growth Recognition**: Celebrate perspective evolution

### Metadata Structure
```json
{
  "memory_id": "uuid",
  "versions": [
    {
      "timestamp": "2025-07-26T10:00:00Z",
      "emotional_tone": "grief",
      "content": "raw transcript",
      "context": "first telling",
      "narrative_elements": {
        "characters_mentioned": ["father", "self"],
        "story_beat": "inciting_incident",
        "conflict_type": "internal",
        "theme": "loss_and_grief"
      }
    },
    {
      "timestamp": "2025-08-15T14:30:00Z", 
      "emotional_tone": "acceptance",
      "content": "revised understanding",
      "context": "six months later",
      "narrative_elements": {
        "characters_mentioned": ["father", "self"],
        "story_beat": "resolution",
        "conflict_type": "resolved",
        "theme": "growth_and_healing"
      }
    }
  ],
  "active_version": "latest",
  "user_preference": "layer_perspectives",
  "narrative_analysis": {
    "character_development_stage": "transformation",
    "plot_progression": 0.85,
    "theme_consistency": 0.92
  }
}
```

---

## 6. Technical Implementation

### Dual RAG Architecture

#### Traditional RAG (Vector Storage - Chroma DB)
- **Purpose**: Content retrieval, similarity-based queries, contextual information
- **Embeddings**: Claude-3.5-generated semantic vectors
- **Indexing**: Hierarchical by Book > Chapter > Scene
- **Use Cases**: 
  - Find similar memoir passages ("find other times I wrote about grief")
  - Retrieve writing advice and techniques
  - Context-aware conversation continuity
  - Emotional safety guideline retrieval
- **API Endpoints**:
  - `/api/memory/context` - Vector similarity queries
  - `/api/memory/search` - Content-based search
- **Performance Target**: <100ms for vector similarity queries

#### Graph RAG (Relationship Storage)
- **Purpose**: Narrative structure, character relationships, story element connections
- **Database**: Neo4j or Amazon Neptune for graph storage
- **Entities**: Characters, themes, conflicts, story beats, narrative arcs
- **Relationships**: character_develops_to, theme_connects_with, conflict_resolves_into
- **Use Cases**:
  - Character relationship mapping and development tracking
  - Story structure analysis and beat progression
  - Theme integration across narrative threads
  - Contradiction-aware memory evolution tracking
  - Cross-chapter narrative continuity
- **API Endpoints**:
  - `/api/memory/relationships` - Graph traversal queries
  - `/api/memory/narrative` - Story structure queries
  - `/api/memory/characters` - Character development tracking
- **Performance Target**: <300ms for graph traverse queries

#### Hybrid Query Routing
- **AI Orchestrator** determines optimal retrieval method:
  - Content queries → Traditional RAG (vector similarity)
  - Relationship queries → Graph RAG (entity traversal)
  - Complex queries → Combined approach with result synthesis

### Memory Retrieval Logic
1. **Context Query**: What's relevant to current conversation?
2. **Narrative Analysis**: Which story elements are being discussed?
3. **Character Tracking**: Who are the key players in this memory?
4. **Contradiction Check**: Any conflicting memories or character inconsistencies?
5. **Story Structure Assessment**: Where does this fit in the overall narrative?
6. **Emotional Sensitivity**: Appropriate tone for current state?
7. **Version Selection**: Which perspective to emphasize?
8. **Writing Craft Guidance**: What narrative techniques could enhance this section?

### User Control Interface
- **Memory Editor**: Visual timeline of memory evolution
- **Story Structure Dashboard**: Character arcs, plot progression, theme development
- **Version Selector**: Choose which perspective to emphasize
- **Character Relationship Map**: Visual representation of character connections
- **Plot Timeline**: Chronological and narrative structure views
- **Privacy Controls**: What can AI remember vs. forget
- **Writing Craft Insights**: Story health indicators and improvement suggestions
- **Export Options**: Include memory evolution and narrative analysis in final manuscript

---

## 7. Privacy & Consent Framework

### Emotional Consent Model
- **Explicit Permission**: Before storing traumatic content
- **Granular Control**: User defines what AI can remember
- **Right to Forget**: Selective memory deletion
- **Context Boundaries**: Separate projects maintain memory isolation

### Data Handling
- **Local First**: Sensitive memories stored locally when possible
- **Encryption**: End-to-end encryption for cloud sync
- **Anonymization**: Remove identifying details from training data
- **User Ownership**: Clear data portability and deletion rights

---

## 8. Integration with Core Product

### Conversation Flow
```
User: "I want to talk about my father's death"
AI: "I remember we spoke about this before. Your feelings seemed to shift from anger to understanding. Would you like to explore where you are with this now?"
```

### Writing Assistance
- AI suggests narrative arcs that honor memory evolution
- Helps identify where contradictions enhance rather than confuse story
- Offers structural approaches for handling perspective shifts
- **Character Development Guidance**: Tracks character growth and suggests development opportunities
- **Plot Structure Analysis**: Identifies pacing issues, missing beats, and narrative gaps
- **Theme Integration**: Helps weave themes consistently throughout the narrative
- **Genre Convention Support**: Provides genre-specific guidance for memoir, fiction, or non-fiction
- **Writing Craft Suggestions**: Offers techniques for show vs. tell, dialogue, and scene construction

### Export Features
- Option to include "memory evolution" as narrative device
- Timeline view showing how understanding changed
- Multiple manuscript versions reflecting different perspectives

---

## 9. Success Metrics

### User Experience
- **Memory Accuracy**: How well does AI recall past conversations?
- **Emotional Safety**: Do users feel comfortable sharing vulnerable content?
- **Perspective Honor**: Does AI respect contradictory memories appropriately?
- **Narrative Intelligence**: How effectively does AI track story elements and provide writing guidance?
- **Character Consistency**: Does AI maintain accurate character development tracking?
- **Story Structure Support**: How helpful is AI guidance for narrative organization?

### Technical Performance
- **Traditional RAG Performance**:
  - Vector similarity queries: <100ms
  - Context retrieval accuracy: 95%+ relevance
  - Embedding generation: <50ms per document
- **Graph RAG Performance**:
  - Graph traversal queries: <300ms
  - Character relationship accuracy: 90%+ consistency
  - Story structure detection: 80%+ accuracy in narrative elements
- **Hybrid System Performance**:
  - Query routing decision: <10ms
  - Combined query synthesis: <500ms total
  - Real-time narrative analysis: <2s for story structure feedback
- **Storage Efficiency**: 
  - Vector storage compression ratios for conversation data
  - Graph storage optimization for relationship queries
  - Cross-system data synchronization: <1s latency

---

This comprehensive memory architecture creates a foundation for AI-assisted memoir writing that honors the complexity and evolution inherent in personal storytelling, while providing sophisticated narrative intelligence capabilities. The system supports both the emotional journey of memory processing and the craft requirements of compelling storytelling, maintaining the technical performance needed for real-time conversation and analysis.

