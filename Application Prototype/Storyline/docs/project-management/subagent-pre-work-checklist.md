# Storyline Subagent Pre-Work Checklist

## Overview

This checklist must be completed by ALL subagents before beginning any development work. It ensures consistency with Storyline's core principles and facilitates proper coordination between agents.

---

## Mandatory Pre-Work Checklist

### □ 1. Documentation Review
**Required Reading (check all that apply):**
- □ `/CLAUDE.md` - Current project context and guidelines
- □ `/docs/project-management/subagent-coordination-plan.md` - Coordination protocols
- □ `/docs/project-management/to-do.md` - Current tasks and dependencies
- □ Domain-specific documentation relevant to the task

**Validation Questions:**
- Do I understand the current project priorities?
- Am I aware of any recent changes to project guidelines?
- Have I identified relevant existing work or decisions?

### □ 2. Voice-First Philosophy Check
**Core Principles Validation:**
- □ Does this feature prioritize voice interaction over text-based alternatives?
- □ Is the voice interface intuitive and accessible?
- □ Does it maintain voice persona consistency across AI providers?
- □ Will this enhance the voice-first user experience?

**Integration Points:**
- □ How does this integrate with existing voice processing pipelines?
- □ Does this maintain real-time performance requirements (<200ms)?
- □ Are voice accessibility standards considered?

### □ 3. Emotional Safety Assessment
**Trauma-Informed Design:**
- □ Have I considered trauma-informed design implications?
- □ Does this feature respect user boundaries and consent?
- □ Is crisis detection/response appropriate for this feature?
- □ Are there any potential triggers or sensitive content considerations?

**Privacy & Safety:**
- □ Are privacy protections adequate for sensitive content?
- □ Do data handling practices meet HIPAA-level standards?
- □ Is user consent properly obtained and respected?
- □ Are there appropriate safeguards for vulnerable users?

### □ 4. Performance Validation
**Performance Requirements:**
- □ Will this maintain required latency standards for real-time features?
- □ Have I planned for performance testing?
- □ Are there optimization opportunities identified?
- □ Does this scale appropriately with user load?

**Specific Standards:**
- □ Voice processing: <200ms latency target
- □ Memory queries: <100ms response time target
- □ Real-time features: Maintain responsiveness under load
- □ AI responses: Consistent quality across providers

### □ 5. Cross-Domain Coordination
**Dependency Analysis:**
- □ Have I checked for dependencies on other agents?
- □ Are integration points clearly documented?
- □ Do other domains need notification of changes?
- □ Are there potential conflicts with other agent work?

**Coordination Actions:**
- □ Searched to-do list for related tasks with tags: `[DEPENDS:]`, `[BLOCKS:]`, `[INTEGRATES:]`
- □ Identified any blocking or prerequisite work from other agents
- □ Documented integration requirements
- □ Noted any overlapping functionality

### □ 6. Testing & Documentation Planning
**Testing Strategy:**
- □ Is specialized testing planned for my domain expertise?
- □ Are edge cases and error conditions identified?
- □ Is accessibility testing included where relevant?
- □ Is cultural sensitivity testing planned for user-facing features?

**Documentation Requirements:**
- □ Are documentation updates identified and planned?
- □ Will implementation decisions be documented for other agents?
- □ Are API changes or integration points documented?
- □ Is user-facing documentation needed?

### □ 7. Quality Gate Planning
**Implementation Checkpoints:**
- □ Design review checkpoint planned before coding
- □ Implementation review during development
- □ Completion review before marking task done
- □ Cross-domain validation for integration points

**Standards Validation:**
- □ Code standards and patterns compliance planned
- □ Testing coverage requirements identified
- □ Documentation completion criteria defined
- □ Integration point validation approach planned

---

## Task Documentation Template

After completing the checklist, update the to-do list using this format:

```
## Task: [Task Name]
**Status:** pending → in_progress
**Assigned Agent:** [your-agent-name]
**Dependencies:** [DEPENDS: agent-name] [BLOCKS: agent-name]
**Integration Points:** [INTEGRATES: agent-name]
**Quality Gates:** checklist-completed
**Documentation Updates:** [list of docs to update]
**Cross-Domain Notes:** [coordination notes and decisions]

### Pre-Work Checklist Completed: ✅
- Voice-First Philosophy: ✅
- Emotional Safety: ✅  
- Performance Validation: ✅
- Cross-Domain Coordination: ✅
- Testing & Documentation: ✅

### Description
[Detailed task description]

### Acceptance Criteria
[Specific completion criteria aligned with quality standards]

### Coordination Notes
[Cross-agent dependencies, integration requirements, decisions affecting other domains]
```

---

## Common Checklist Scenarios

### Scenario 1: New Feature Development
**Additional Considerations:**
- How does this feature fit into existing user workflows?
- Are there onboarding or user education needs?
- Does this require changes to multiple services/agents?
- What are the rollback procedures if issues arise?

### Scenario 2: Performance Optimization
**Additional Considerations:**
- What are the current performance baselines?
- How will improvements be measured and validated?
- Are there trade-offs with other quality attributes?
- Do optimizations affect other agent domains?

### Scenario 3: Bug Fixes or Maintenance
**Additional Considerations:**
- Is this a critical fix affecting user safety?
- Are there workarounds currently in place?
- Does the fix address root cause or just symptoms?
- Are there regression testing implications?

### Scenario 4: Integration or API Changes
**Additional Considerations:**
- Which other agents are affected by these changes?
- Are there backward compatibility requirements?
- Is versioning or migration strategy needed?
- How will changes be communicated to dependent systems?

---

## Checklist Validation

**Before proceeding with implementation:**
- □ All checklist items completed
- □ To-do list updated with coordination information
- □ Dependencies and integration points documented
- □ Quality gates planned and scheduled
- □ Documentation updates identified

**If any checklist items cannot be completed:**
1. Document the blocker in to-do list coordination notes
2. Escalate to appropriate agent or project maintainer
3. Do not proceed with implementation until resolved
4. Update task status to "blocked" with clear reasoning

---

*This checklist should be used for every development task, regardless of size or complexity. Consistent use ensures quality, coordination, and alignment with Storyline's core principles.*