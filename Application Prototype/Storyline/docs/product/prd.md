# Product Requirements Document (PRD)

## Product Title: Storyline – Audio-First Book Writing App

### Author: [James Farmer]
### Date: July 2025 (Updated for Narrative Intelligence)

---

## 1. Purpose
Storyline enables authors, storytellers, and creators to write books using their voice. The app leverages AI to transcribe speech, suggest structure, assist with rewriting, and guide users through the book-writing process. It is designed for users who think better out loud, who are constantly on the move, or who need a low-friction way to capture and organize their creative ideas. It is especially powerful for memoirists and anyone processing emotional or vulnerable content.

---

## 2. Problem Statement
Writing can feel isolating and overwhelming, especially for personal stories that require vulnerability. Traditional writing tools often confront users with a blank page — a paralyzing starting point for many would-be authors. Current tools are text-based and require structure from the outset. Voice dictation tools exist, but they are typically limited to transcription and lack narrative intelligence. Users need a seamless, voice-first experience that bridges spontaneous speech and structured writing, with AI support for organizing, refining, and exporting long-form content.

---

## 3. Goals and Objectives
- Enable book writing through voice as the primary interface
- Provide voice dialogue as a core interaction, not a premium feature
- Automatically transcribe and structure spoken content into chapters and scenes
- Allow users to talk through emotional or narrative blocks
- Provide smart AI suggestions for narrative flow, tone, and formatting
- Organize, revise, and export work into book-ready formats
- Support fiction, memoirs, non-fiction, and thought leadership writing styles
- Offer a compelling brand experience rooted in creativity, clarity, and emotional safety
- Provide data privacy and emotional protection for vulnerable content
- Deliver a clear and empathetic upsell journey that aligns to user needs
- Introduce contradiction-aware narrative memory for memoir evolution

---

## 4. User Stories

### Primary User: Aspiring Author / Memoirist / Creative Professional
- As a user, I want to record my thoughts on the go, so I don’t lose spontaneous ideas.
- As a user, I want my recordings to be transcribed accurately and labeled.
- As a user, I want to organize transcriptions into chapters or sections.
- As a user, I want AI to rewrite raw voice notes into publishable prose.
- As a user, I want to receive feedback on tone, clarity, and narrative arc.
- As a user, I want to set writing goals and be reminded via voice or notifications.
- As a user, I want to chat naturally with my AI writing partner using my voice.
- As a user, I want to ask my AI assistant questions about my book or provide context using text chat.
- As a user, I want to test different narrative approaches by talking through them with my AI partner.
- As a memoirist, I want to process difficult memories conversationally before committing them to text.
- As a user, I want my AI to remember details from previous conversations so I don’t repeat context.
- As a user, I want to select a voice persona that fits my preferred style of feedback.
- As a user, I want to feel emotionally safe while writing about traumatic or sensitive experiences.
- As a memoirist, I want to revise or contradict earlier perspectives and have the AI honor both versions without judgment.
- As a user, I want AI guidance on story structure and narrative techniques to improve my writing.
- As a writer, I want to track character development and ensure consistency across my story.
- As a user, I want to visualize my story's structure and see how themes develop throughout.
- As a writer, I want genre-specific guidance that respects different storytelling traditions.
- As a user, I want real-time feedback on pacing, tension, and narrative flow during conversations.

---

## 5. Key Features

### 5.1 Voice Recorder
- One-tap recording
- Voice command activation ("Start Chapter", "Pause", "New Scene")
- High-fidelity audio storage with background noise reduction

### 5.2 Real-Time Transcription
- Live speech-to-text conversion using Whisper API or similar
- Smart punctuation, paragraph breaks, speaker diarization

### 5.3 Conversational AI Partner
- Natural spoken conversation with the AI writing assistant
- Use cases: brainstorming, talking through character motivations, processing emotional memories, resolving narrative blocks
- Conversation log saved as chat history
- Voice personas apply to tone/style of responses
- Contradiction-aware prompts for memory evolution:
  > “Earlier you described this as grief. Now it sounds like forgiveness. Would you like to replace, layer, or explore both perspectives?”

### 5.4 Chapter & Scene Organizer
- AI tags natural divisions in speech (chapters, characters, locations)
- Drag-and-drop or voice-command reorganization

### 5.5 AI Bookify Engine
- Rewrites raw speech into narrative-ready text
- Tone matching (e.g., casual, humorous, poetic, inspirational)
- Theme suggestions, duplicate detection, summarization

### 5.6 Prompt Engine
- Writing prompts based on current material ("Tell me more about X")
- Daily creative challenges and voice-guided sprints

### 5.7 Text-Based AI Chat Interface
- Embedded chat UI for text-based interaction with the AI assistant
- Users can ask questions about their draft, clarify plot points, add character notes, or make structural changes
- Context-aware memory of the project and previous chats

### 5.8 Export Engine
- Export to: Google Docs, ePub, PDF, Word, Scrivener
- Backup to iCloud, Dropbox, or Google Drive

### 5.9 Offline Sync Mode
- Local recording and storage with later cloud sync

### 5.10 Narrative Intelligence Engine
- **Story Structure Analysis**: Real-time detection of narrative elements (plot points, character arcs, themes)
- **Character Development Tracking**: Monitor character consistency and growth across the story
- **Writing Craft Guidance**: Genre-specific suggestions for pacing, tension, and narrative techniques
- **Cultural Storytelling Integration**: Support for diverse narrative traditions beyond Western structures
- **Plot Coherence Assessment**: Identify inconsistencies and suggest improvements
- **Theme Development**: Track how themes evolve and integrate throughout the narrative

### 5.11 Story Visualization Dashboard
- **Character Relationship Maps**: Visual representation of character connections and dynamics
- **Plot Timeline**: Both chronological and narrative structure views
- **Story Health Indicators**: Real-time feedback on narrative strength and areas for improvement
- **Genre Framework Guides**: Interactive templates for different story structures
- **Progress Tracking**: Visual representation of story completion and development milestones

### 5.12 Voice Personas (Enhanced)
- Users can choose from different AI tones: Literary Mentor, Hype Muse, No-Bullshit Editor, Soft Storyteller, etc.
- Each persona affects how responses are framed and how suggestions are voiced
- **Narrative Intelligence Integration**: Personas now include writing craft expertise and genre knowledge
- **Cultural Sensitivity**: Personas adapted for different storytelling traditions
- Auto-switching and presets planned for future versions

---

## 6. Technical Requirements
- Speech-to-text: AssemblyAI Universal-Streaming for sub-second real-time transcription (300ms latency)
- LLM: Claude 3.5 Sonnet for writing assistance + GPT-4o for real-time conversation
- Platform: React Native app (iOS + Android)
- Hosting: Firebase or Supabase for backend and auth
- Audio: Native support for MP3/WAV + speech diarization
- Voice interaction: OpenAI Realtime API for natural conversation with interruption handling
- Text-to-Speech: Deepgram Aura-2 for lifelike, low-latency voice responses
- Memory & Context: Chroma DB with privacy-preserving search, 32k live context + retrieval-augmented generation
- Chat UI: Rich text and markdown support, history threading, inline audio summaries
- Conversation state management with contradiction-aware memory evolution
- Emotional tone detection and safety protocols for sensitive memoir content
- Voice activity detection for natural turn-taking
- Narrative contradiction detection with perspective layering support
- Editable project memory with version control (user can revise what AI remembers)
- **Story Structure Analysis**: Real-time detection of narrative elements during conversation
- **Character Development Tracking**: Monitor character arcs and ensure consistency
- **Writing Craft Knowledge Base**: Extensive database of storytelling techniques and frameworks
- **Cultural Storytelling Support**: Integration of diverse narrative traditions (Kishotenketsu, circular narratives, etc.)
- **Genre-Specific Guidance**: Tailored advice for memoir, fiction, non-fiction, and hybrid forms
- **Plot Coherence Analysis**: Automated detection of story inconsistencies and suggestions
- **Theme Integration Tracking**: Monitor how themes develop and weave throughout the narrative

---

## 7. Non-Functional Requirements
- Data Privacy: GDPR/CCPA compliant
- Privacy-forward UX for personal storytelling (clear data ownership messaging)
- Emotional safety: AI responses calibrated for empathy and sensitivity
- Accessibility: Support for screen readers and dyslexia-friendly fonts
- Latency: 500-700ms realistic mobile transcription; 1.5s end-to-end voice processing with fallbacks
- Security: End-to-end encryption for recordings and text

---

## 8. Related Documentation

### Core Product Documents
- **Product Vision**: `storyline_product_vision.md` - Long-term vision and market strategy
- **Brand Guide**: `storyline_brand_guide.md` - Brand identity, voice, and visual guidelines
- **Technical Architecture**: `storyline_tech_recommendations.md` - Detailed technical stack and implementation
- **Memory Architecture**: `storyline_memory_spec.md` - Contradiction-aware memory system specification

### Development Dependencies
This PRD should be updated whenever:
- Technical recommendations change (coordinate with tech recommendations doc)
- Brand voice evolve (coordinate with brand guide)
- Memory architecture requirements shift (coordinate with memory spec)
- Product vision pivots (coordinate with vision doc)

## 9. Appendices
- Competitive analysis (to be added)
- Voice persona tone samples (see separate document)
- UX wireframes and mockups (in progress)
- Cost analysis details (see technical recommendations)

---

