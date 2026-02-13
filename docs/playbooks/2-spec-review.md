# Phase 2: Specification Review

> **When to use:** Before implementation begins. QA check on specs to find gaps, ambiguities, and missing edge cases.
> **Cognitive mode:** Convergent (critical) — find problems, be skeptical.

---

## Prompt

```
You are a QA engineer reviewing specifications for completeness BEFORE development begins. Your job is to find gaps, ambiguities, and missing edge cases that will cause problems during implementation.

═══════════════════════════════════════════════════════════════════════════════
SPECIFICATIONS TO REVIEW
═══════════════════════════════════════════════════════════════════════════════

[Paste all specs including SPEC-XXX and EDGE-XXX]

═══════════════════════════════════════════════════════════════════════════════
PILASTER CRITICAL REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

These MUST be verified for every spec:
• Workflow JSON validation before storage
• Intent field required for every snapshot
• Credits checked before Replicate API calls
• Supabase RLS respected - never bypass auth

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Analyze these specifications and produce a quality audit report.

## Spec Quality Audit

### Completeness Matrix

| Spec # | Clear Trigger? | Defined Output? | Error Handling? | Auth Specified? | Testable? |
|--------|----------------|-----------------|-----------------|-----------------|-----------|
| SPEC-001 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Pilaster-Specific Checks

| Requirement | Addressed? | Location | Issue |
|-------------|------------|----------|-------|
| Workflow JSON validation | ✅/❌/N/A | SPEC-XXX | [if missing] |
| Intent field required | ✅/❌/N/A | SPEC-XXX | [if missing] |
| Credit check before Replicate | ✅/❌/N/A | SPEC-XXX | [if missing] |
| RLS policy defined | ✅/❌/N/A | Database section | [if missing] |
| Insufficient credits handling | ✅/❌/N/A | EDGE-XXX | [if missing] |

### Ambiguity Detection

| Spec # | Ambiguous Phrase | Why It's Ambiguous | Suggested Clarification |
|--------|------------------|-------------------|------------------------|
| SPEC-XXX | "[phrase]" | [could mean X or Y] | "[precise version]" |

Flag these common ambiguous words:
• "appropriate", "relevant", "suitable" → specify criteria
• "quickly", "fast", "responsive" → specify milliseconds
• "user-friendly", "intuitive" → specify exact behavior
• "handles", "manages" → specify exact algorithm
• "validates" → specify validation rules

### Missing Edge Cases

| Scenario | Why It's Missing | Impact if Not Handled |
|----------|------------------|----------------------|
| [scenario] | Not mentioned | [consequence] |

Standard edge cases to verify:
☐ Empty/null input
☐ Maximum length input
☐ Special characters / unicode
☐ Concurrent user actions
☐ Network failure mid-operation
☐ Session timeout during action
☐ Permission denied (RLS rejection)
☐ Browser back/forward button
☐ Page refresh during operation
☐ Invalid ComfyUI workflow JSON structure
☐ Replicate API timeout (>30s)
☐ Replicate API rate limiting
☐ Insufficient credits (zero balance)
☐ Credit deduction race condition (concurrent runs)
☐ Another user's data access attempt

### Dependency Map

```
SPEC-001 ──▶ SPEC-003 (dependency)
SPEC-002 ◀── conflicts with ──▶ SPEC-004
```

### Security Review

| Check | Status | Notes |
|-------|--------|-------|
| All endpoints require auth? | ✅/❌ | [details] |
| RLS policies cover all tables? | ✅/❌ | [details] |
| Input sanitization specified? | ✅/❌ | [details] |
| No sensitive data in error messages? | ✅/❌ | [details] |
| Credit operations are atomic? | ✅/❌ | [details] |

### Implementation Risk Assessment

| Spec # | Risk Level | Risk Factor | Mitigation |
|--------|------------|-------------|------------|
| SPEC-XXX | 🔴/🟡/🟢 | [factor] | [strategy] |

### Recommended Implementation Order

1. **SPEC-XXX** (foundational)
2. **SPEC-YYY** (builds on XXX)
3. **EDGE-XXX** (error handling layer)

### Verdict

☐ ✅ READY FOR IMPLEMENTATION
☐ ⚠️ NEEDS MINOR CLARIFICATION - [list items]
☐ ❌ NOT READY - [list blockers]

**Blocking issues (must fix before implementation):**
1. [Issue]

**Non-blocking issues (can fix during implementation):**
1. [Issue]
```

---

## Key Questions to Ask

When reviewing, mentally simulate:

1. **First-time user** - Will they understand what to do?
2. **Power user** - Does it support efficient workflows?
3. **Error recovery** - Can they get unstuck?
4. **Edge cases** - What happens at boundaries?
5. **Security** - Can a malicious user exploit this?
6. **Credits** - What if user runs out mid-operation?

---

## Example Usage

```
You: "Review the specs in specs/020-version-branches.md using the
      spec review playbook. Find gaps before I implement."
```
