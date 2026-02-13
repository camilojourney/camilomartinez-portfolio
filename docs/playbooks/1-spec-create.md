# Phase 1: Specification Creation

> **When to use:** Starting a new feature, formalizing a vague idea, converting user feedback into requirements.
> **Cognitive mode:** Divergent (creative) — explore possibilities, be thorough.

---

## Prompt

```
You are a senior product manager creating detailed specifications for a development team. Your specs must be precise enough that a developer can implement them without asking follow-up questions.

═══════════════════════════════════════════════════════════════════════════════
FEATURE REQUEST
═══════════════════════════════════════════════════════════════════════════════

[Describe your feature idea here]

═══════════════════════════════════════════════════════════════════════════════
PROJECT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

• Application: Pilaster.ai - Memory layer for ComfyUI workflows
• Tech stack: Next.js 14+, TypeScript 5.0+, Supabase, Tailwind, React Flow
• Target users: ComfyUI power users tracking workflow iterations
• Key patterns: Snapshots with intent/outcome, project-based organization
• Database: Supabase with RLS (Row Level Security) - all queries must respect auth
• External APIs: Replicate for workflow execution (credit-based billing)

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS (DO NOT VIOLATE)
═══════════════════════════════════════════════════════════════════════════════

• All workflow JSON must be validated before storage
• Intent field is REQUIRED for every snapshot
• Credits must be checked before any Replicate API calls
• Never bypass Supabase RLS - all queries must include auth context

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Create comprehensive specifications following this structure. Do NOT include implementation details - focus only on WHAT, not HOW.

## Feature: [Clear, descriptive name]

### Overview
[2-3 sentences: what it does, why it matters]

### User Stories
• As a [user type], I want to [action] so that [benefit]

### Core Specifications

**SPEC-001: [First behavior]**
┌─────────────────────────────────────────────────────────────────────────────┐
│ Description   │ [What exactly happens]                                      │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Trigger       │ [What initiates this]                                       │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Input         │ [Required data/actions]                                     │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Output        │ [What user sees/gets]                                       │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Validation    │ [Input constraints]                                         │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Auth Required │ [Yes/No - what permission level]                            │
└─────────────────────────────────────────────────────────────────────────────┘

Acceptance Criteria:
☐ [Testable criterion - binary pass/fail]
☐ [Another criterion]

[Continue for all specs: SPEC-002, SPEC-003, etc.]

### Database Changes (if applicable)

| Table | Column | Type | Constraints | RLS Policy |
|-------|--------|------|-------------|------------|
| [table] | [column] | [type] | [NOT NULL, FK, etc.] | [policy name/description] |

Migrations required:
☐ [Migration description]

### API Changes (if applicable)

| Endpoint | Method | Auth | Request Body | Response |
|----------|--------|------|--------------|----------|
| /api/[path] | POST/GET/etc. | Required/Optional | [shape] | [shape] |

### Edge Cases & Error Handling

**EDGE-001: [Edge case name]**
• Scenario: [When this occurs]
• Expected behavior: [What should happen]
• Error message: "[Exact user-facing message]"
• Recovery: [How user resolves]

Standard edge cases to address:
☐ Empty states (no data yet)
☐ Invalid input (wrong format, too long, special chars)
☐ Network failure (API timeout, connection lost)
☐ Concurrent actions (double-click, race conditions)
☐ Permission denied (not authenticated, wrong user)
☐ Invalid ComfyUI workflow JSON
☐ Replicate API timeout or failure
☐ Insufficient credits for Replicate execution
☐ RLS policy denial (accessing another user's data)
☐ Session timeout during operation

### State Definitions

| State | Visual Indicator | User Can... | System Shows... |
|-------|------------------|-------------|-----------------|
| Loading | [indicator] | [actions] | [display] |
| Empty | [indicator] | [actions] | [message] |
| Error | [indicator] | [actions] | [message] |
| Success | [indicator] | [actions] | [confirmation] |
| Insufficient Credits | [indicator] | [actions] | [message + upgrade path] |

### Performance Requirements
• Initial load: [time target, e.g., <500ms]
• Interaction response: [time target, e.g., <100ms]
• Data limits: [scale constraints, e.g., max 1000 snapshots per project]

### Security Considerations
• Auth: [What auth checks are required]
• Data access: [RLS policies needed]
• Input sanitization: [What needs validation]

### Out of Scope
• [What is NOT included - prevents scope creep]

### Open Questions
• [Decisions needing stakeholder input]
```

---

## Output Checklist

Before considering specs complete, verify:

- [ ] Every spec has a unique number (SPEC-001, SPEC-002)
- [ ] Every acceptance criterion is binary (pass/fail, not subjective)
- [ ] Error messages are exact, not "show an error"
- [ ] All states defined: loading, empty, error, success, insufficient credits
- [ ] No ambiguous words: "appropriate", "relevant", "quickly", "handles"
- [ ] Edge cases cover all standard cases listed above
- [ ] Database changes include RLS policy requirements
- [ ] API endpoints specify auth requirements
- [ ] Credits checked before any Replicate-related features
- [ ] No implementation details (code patterns, specific libraries)

---

## Example Usage

```
You: "Read docs/playbooks/1-spec-create.md and help me spec out a feature
      where users can branch a snapshot to explore different directions"
```
