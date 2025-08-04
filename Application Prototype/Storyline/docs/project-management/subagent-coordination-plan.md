# Storyline Subagent Coordination Plan

## Overview

This document outlines the comprehensive strategy for ensuring all Storyline subagents follow consistent guidelines, coordinate effectively, and maintain project standards across all development work.

## Core Coordination Strategies

### 1. Shared Context & Documentation Strategy

**Implementation:**
- All subagents must reference the same core documentation set:
  - `/CLAUDE.md` - Project overview and guidelines
  - `/docs/project-management/subagent-guidance.md` - Agent-specific guidance
  - `/docs/project-management/to-do.md` - Master task coordination
  - `/docs/project-management/subagent-pre-work-checklist.md` - Quality gates
- Each agent's system prompt includes references to these documents
- Agents must check documentation currency before starting work

**Documentation Access Protocol:**
```
Before any development work:
1. Read current CLAUDE.md for project context
2. Review subagent-guidance.md for role-specific requirements
3. Check master to-do list for related/blocking tasks
4. Reference pre-work checklist for validation requirements
```

### 2. Cross-Agent Coordination Protocol

**Task Initiation Workflow:**
```
Step 1: Task Discovery & Analysis
- Check master to-do list for related tasks
- Identify cross-domain dependencies
- Note any blocking or prerequisite work
- Flag potential conflicts with other agents

Step 2: Coordination Check
- Search for existing work in related domains
- Document integration points and dependencies
- Update to-do list with coordination notes
- Flag items requiring multi-agent collaboration

Step 3: Work Planning
- Break down tasks with coordination touchpoints
- Schedule integration/review checkpoints
- Plan documentation updates
- Identify quality validation requirements
```

**Dependency Management:**
- Use standardized tags in to-do list: `[DEPENDS: agent-name]`, `[BLOCKS: agent-name]`, `[INTEGRATES: agent-name]`
- Agents must update dependency status when completing work
- Cross-domain changes require coordination comments in to-do list

### 3. Quality Gates & Review Process

**Pre-Implementation Validation:**
- All agents use standardized pre-work checklist
- Validate against Storyline's core standards before coding
- Document quality implications for other domains
- Plan testing approach for specialized functionality

**Implementation Quality Gates:**
```
Gate 1: Design Review (before coding)
- Voice-first philosophy compliance check
- Emotional safety impact assessment
- Performance requirements validation
- Cross-domain integration planning

Gate 2: Implementation Review (during development)
- Code standards and patterns compliance
- Testing coverage for domain expertise
- Documentation update requirements
- Integration point validation

Gate 3: Completion Review (before task completion)
- Performance standards validation (<200ms for real-time features)
- Emotional safety and privacy compliance
- Cross-domain impact assessment
- Documentation completion check
```

**Performance Standards Enforcement:**
- Voice processing: <200ms latency, >95% accuracy
- Memory queries: <100ms response time
- Emotional safety: 100% crisis detection validation
- Privacy: HIPAA-level compliance verification

### 4. Shared Standards Enforcement

**Mandatory Pre-Work Checklist:**
All agents must complete this checklist before implementation:

```
□ Voice-First Philosophy Check
  - Does this feature prioritize voice interaction?
  - Is the voice interface intuitive and accessible?
  - Does it maintain voice persona consistency?

□ Emotional Safety Assessment
  - Have I considered trauma-informed design implications?
  - Does this feature respect user boundaries?
  - Is crisis detection/response appropriate?
  - Are privacy protections adequate for sensitive content?

□ Performance Validation
  - Will this maintain required latency standards?
  - Have I planned for performance testing?
  - Are there optimization opportunities?

□ Cross-Domain Coordination
  - Have I checked for dependencies on other agents?
  - Are integration points documented?
  - Do other domains need notification of changes?

□ Testing & Documentation
  - Is specialized testing planned for my domain?
  - Are documentation updates identified?
  - Is accessibility testing included where relevant?
```

### 5. Centralized Communication Hub

**Enhanced To-Do List Format:**
```
## Task: [Task Name]
**Status:** [pending/in_progress/completed/blocked]
**Assigned Agent:** [agent-name or "collaborative"]
**Dependencies:** [DEPENDS: agent-name] [BLOCKS: agent-name]
**Integration Points:** [INTEGRATES: agent-name]
**Quality Gates:** [checklist-completed/design-reviewed/implementation-reviewed]
**Documentation Updates:** [list of docs to update]
**Cross-Domain Notes:** [coordination notes and decisions]

### Description
[Detailed task description]

### Acceptance Criteria
[Specific completion criteria]

### Coordination Notes
[Cross-agent dependencies, integration requirements, decisions affecting other domains]
```

**Communication Protocols:**
- Agents update to-do list with progress and coordination notes
- Cross-domain decisions documented in "Coordination Notes" section
- Blocking issues escalated with clear problem description
- Integration requirements documented with specific agent callouts

## Implementation Timeline

### Phase 1: Documentation Framework (Immediate)
1. ✅ Create coordination plan document (this document)
2. Update subagent-guidance.md with coordination protocols
3. Create pre-work checklist document
4. Update to-do list template format
5. Update CLAUDE.md to reference coordination system

### Phase 2: Agent Integration (Next)
1. Update each agent's guidance with coordination requirements
2. Test coordination workflow with sample tasks
3. Validate quality gate process
4. Refine documentation based on initial usage

### Phase 3: Optimization (Ongoing)
1. Monitor coordination effectiveness
2. Refine processes based on agent feedback
3. Update documentation as project evolves
4. Expand coordination protocols as needed

## Success Metrics

**Coordination Effectiveness:**
- Zero conflicts between agent implementations
- All cross-domain dependencies identified and managed
- 100% completion of pre-work checklists
- Consistent quality standards across all agent work

**Quality Maintenance:**
- All performance standards met consistently
- Emotional safety protocols followed in 100% of user-facing features
- Documentation kept current with all changes
- Testing coverage maintained for all specialized domains

**Communication Quality:**
- Clear coordination notes in all relevant tasks
- Timely updates to blocking/dependency status
- Proactive identification of integration requirements
- Effective escalation of cross-domain issues

## Troubleshooting Common Coordination Issues

### Issue: Conflicting Implementations
**Resolution:** Use to-do list dependency tracking and require coordination checks before implementation

### Issue: Missed Cross-Domain Dependencies
**Resolution:** Mandatory pre-work checklist includes dependency identification step

### Issue: Inconsistent Quality Standards
**Resolution:** Standardized quality gates with specific validation criteria

### Issue: Documentation Drift
**Resolution:** Documentation updates required as part of task completion criteria

### Issue: Performance Standards Conflicts
**Resolution:** Performance requirements clearly defined with specific metrics for each domain

---

*This coordination plan should be reviewed and updated regularly as the project evolves and agent coordination patterns become clearer.*