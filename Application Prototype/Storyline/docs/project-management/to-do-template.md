# Storyline Task Documentation Template

## Standard Task Format

Use this template when adding new tasks or updating existing ones in the master to-do list. This format ensures proper coordination between subagents and maintains project standards.

---

## Task Template

```markdown
## Task: [Descriptive Task Name]
**Status:** [pending/in_progress/completed/blocked]
**Assigned Agent:** [agent-name or "collaborative" for multi-agent work]
**Priority:** [high/medium/low]
**Estimated Effort:** [hours or story points]
**Deadline:** [if applicable]

### Dependencies & Integration
**Dependencies:** [DEPENDS: agent-name] [BLOCKS: agent-name]
**Integration Points:** [INTEGRATES: agent-name]
**Prerequisite Tasks:** [List any tasks that must be completed first]

### Quality Gates & Standards
**Quality Gates:** [checklist-completed/design-reviewed/implementation-reviewed/completed]
**Performance Requirements:** [specific latency, accuracy, or throughput requirements]
**Safety Requirements:** [emotional safety, privacy, or security considerations]
**Documentation Updates:** [list of docs to update]

### Task Details
**Description:**
[Detailed description of what needs to be accomplished]

**Acceptance Criteria:**
- [ ] [Specific, measurable completion criterion 1]
- [ ] [Specific, measurable completion criterion 2]
- [ ] [Specific, measurable completion criterion 3]

**Technical Requirements:**
- [ ] [Specific technical requirement 1]
- [ ] [Specific technical requirement 2]

### Cross-Domain Coordination
**Cross-Domain Notes:** [Coordination notes and decisions affecting other agents]
**Integration Requirements:** [Specific requirements for other agents]
**Potential Conflicts:** [Any potential conflicts with other agent work]

### Testing & Validation
**Testing Strategy:** [How this will be tested]
**Validation Criteria:** [How success will be measured]
**Edge Cases:** [Important edge cases to consider]

### Progress Updates
**Started:** [Date]
**Last Updated:** [Date]
**Completion Notes:** [Notes about completion, blockers resolved, lessons learned]
```

---

## Standard Task Tags

### Status Tags
- `pending` - Task identified but not started
- `in_progress` - Currently being worked on
- `completed` - Task finished and validated
- `blocked` - Cannot proceed due to external dependency

### Priority Tags
- `high` - Critical path, affects project timeline
- `medium` - Important but not blocking
- `low` - Nice to have, can be deferred

### Agent Tags
- `voice-ai-integration-specialist`
- `emotional-safety-guardian`
- `narrative-intelligence-specialist`
- `mobile-voice-ui-specialist`
- `collaborative` - Requires multiple agents

### Dependency Tags
- `[DEPENDS: agent-name]` - This task depends on work from another agent
- `[BLOCKS: agent-name]` - This task blocks work by another agent
- `[INTEGRATES: agent-name]` - This task requires integration with another agent's work

### Quality Gate Tags
- `checklist-completed` - Pre-work checklist completed
- `design-reviewed` - Design approved before implementation
- `implementation-reviewed` - Code review completed
- `testing-completed` - All testing requirements met
- `documentation-updated` - All documentation updates completed

---

## Examples

### Example 1: Voice Processing Task
```markdown
## Task: Implement Real-Time Voice Processing Pipeline
**Status:** pending
**Assigned Agent:** voice-ai-integration-specialist
**Priority:** high
**Estimated Effort:** 16 hours
**Deadline:** August 15, 2025

### Dependencies & Integration
**Dependencies:** [DEPENDS: mobile-voice-ui-specialist] for audio capture
**Integration Points:** [INTEGRATES: emotional-safety-guardian] for crisis detection
**Prerequisite Tasks:** Basic audio recording functionality

### Quality Gates & Standards
**Quality Gates:** checklist-completed
**Performance Requirements:** <200ms latency, >95% accuracy
**Safety Requirements:** Privacy compliant audio handling
**Documentation Updates:** voice-processing-api.md, performance-standards.md

### Task Details
**Description:**
Implement real-time voice-to-text processing using AssemblyAI with WebRTC streaming, including fallback to Deepgram for accuracy validation.

**Acceptance Criteria:**
- [ ] Voice processing latency consistently <200ms
- [ ] Transcription accuracy >95% for clear speech
- [ ] Graceful handling of background noise
- [ ] Integration with crisis detection system
- [ ] Cross-platform compatibility (iOS/Android)

### Cross-Domain Coordination
**Cross-Domain Notes:** Requires audio input from mobile UI and feeds transcribed text to safety monitoring
**Integration Requirements:** Crisis detection agent needs access to real-time transcription stream
**Potential Conflicts:** None identified

### Testing & Validation
**Testing Strategy:** Performance testing with diverse voice samples and environments
**Validation Criteria:** Automated latency testing, accuracy validation suite
**Edge Cases:** Background noise, accents, emotional speech patterns
```

### Example 2: Safety Feature Task
```markdown
## Task: Implement Crisis Detection Keywords System
**Status:** in_progress
**Assigned Agent:** emotional-safety-guardian
**Priority:** high
**Estimated Effort:** 12 hours

### Dependencies & Integration
**Dependencies:** [DEPENDS: voice-ai-integration-specialist] for transcription stream
**Integration Points:** [INTEGRATES: narrative-intelligence-specialist] for context awareness
**Prerequisite Tasks:** Real-time voice processing pipeline

### Quality Gates & Standards
**Quality Gates:** design-reviewed
**Performance Requirements:** <100ms detection latency
**Safety Requirements:** 100% crisis detection accuracy, appropriate response protocols
**Documentation Updates:** safety-protocols.md, crisis-response.md

### Task Details
**Description:**
Implement real-time crisis keyword detection with graduated response system for user safety.

**Acceptance Criteria:**
- [ ] Crisis keywords detected within 100ms
- [ ] Zero false negatives for high-risk keywords
- [ ] Appropriate escalation to mental health resources
- [ ] User consent respected throughout process
- [ ] Privacy-compliant logging and monitoring

### Cross-Domain Coordination
**Cross-Domain Notes:** Needs narrative context to reduce false positives
**Integration Requirements:** Narrative agent should provide emotional context scoring
**Potential Conflicts:** None identified

### Progress Updates
**Started:** July 26, 2025
**Last Updated:** July 26, 2025
**Completion Notes:** Design review completed, implementation 40% complete
```

---

## Task Lifecycle

### 1. Task Creation
- Use template format
- Complete pre-work checklist
- Identify dependencies and integration points
- Add to master to-do list

### 2. Task Assignment
- Assign to appropriate agent
- Validate prerequisites are met
- Update dependencies with other agents
- Set quality gates and deadlines

### 3. Task Execution
- Mark status as in_progress
- Update progress regularly
- Document decisions affecting other agents
- Complete implementation and testing

### 4. Task Completion
- Validate all acceptance criteria met
- Complete quality gates (reviews, testing)
- Update documentation as required
- Mark status as completed
- Add completion notes and lessons learned

### 5. Cross-Agent Handoff
- Update integration status for dependent tasks
- Notify relevant agents of completion
- Document any changes affecting other domains
- Update shared documentation

---

*This template should be used consistently across all agents to maintain coordination and quality standards throughout the Storyline project.*