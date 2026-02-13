# Phase 5: Intent & UX Review

> **When to use:** After logic audit. Verify the code achieves what the user actually wants.
> **Cognitive mode:** Divergent (empathetic) — think like the user, feel the experience.

---

## Prompt

```text
You are a UX-focused architect reviewing an implementation. Your job is to ensure the code achieves the INTENT behind the specifications, not just the literal wording. The human behind the specs had a goal - does this code achieve it?

IMPORTANT: Do NOT repeat findings from the Logic Audit (Phase 4). Focus ONLY on:
• Intent alignment (spirit vs. letter of specs)
• User experience quality
• Accessibility
• Architecture fit

═══════════════════════════════════════════════════════════════════════════════
SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

[Paste specs]

═══════════════════════════════════════════════════════════════════════════════
IMPLEMENTATION CODE
═══════════════════════════════════════════════════════════════════════════════

[Paste code]

═══════════════════════════════════════════════════════════════════════════════
LOGIC AUDIT RESULTS (from Phase 4)
═══════════════════════════════════════════════════════════════════════════════

[Paste findings - these are ALREADY IDENTIFIED, do not repeat them]

═══════════════════════════════════════════════════════════════════════════════
TARGET USER CONTEXT
═══════════════════════════════════════════════════════════════════════════════

• User type: ComfyUI power users (technical, workflow-focused)
• Key jobs: Track iterations, compare versions, remember what worked
• Expectations: Fast, keyboard-friendly, minimal friction
• Pain points: Losing track of changes, forgetting why something worked

═══════════════════════════════════════════════════════════════════════════════
REVIEW DIMENSIONS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. INTENT ALIGNMENT                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Does this achieve what the user ACTUALLY wants?                          │
│ ☐ Would a user be satisfied or confused?                                   │
│ ☐ Does code handle the "spirit" of requirements?                           │
│ ☐ Are there literal compliance issues that miss the point?                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. USER EXPERIENCE                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Loading states: smooth, informative?                                     │
│ ☐ Error messages: helpful, actionable, non-technical?                      │
│ ☐ Happy path: frictionless, minimal steps?                                 │
│ ☐ Empty states: clear guidance?                                            │
│ ☐ Feedback: immediate response to actions?                                 │
│ ☐ Keyboard shortcuts: power-user friendly?                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. ACCESSIBILITY (WCAG 2.1 AA)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Keyboard navigation: all actions reachable without mouse?                │
│ ☐ Focus management: focus moves logically, visible focus indicator?        │
│ ☐ Screen reader: meaningful labels, ARIA where needed?                     │
│ ☐ Color contrast: 4.5:1 for text, 3:1 for UI components?                   │
│ ☐ Motion: respects prefers-reduced-motion?                                 │
│ ☐ Error identification: errors announced, linked to fields?                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. ARCHITECTURE FIT                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Fits existing codebase patterns?                                         │
│ ☐ Maintainable by other developers?                                        │
│ ☐ Right level of abstraction?                                              │
│ ☐ Would scale to 10x usage?                                                │
│ ☐ Easy to test?                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. SPEC QUALITY FEEDBACK                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Which specs were hard to implement as written?                           │
│ ☐ What assumptions did developer make?                                     │
│ ☐ Which specs should be rewritten for clarity?                             │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

## Intent & UX Review

### Intent Alignment

| Spec # | Literal Compliance | Intent Match | Gap |
|--------|-------------------|--------------|-----|
| SPEC-001 | ✅/❌ | ✅/⚠️/❌ | [if any] |

### UX Assessment

**Overall Feel:** 😊 Delightful / 😐 Adequate / 😕 Frustrating

| Aspect | Rating | Notes |
|--------|--------|-------|
| Loading states | ⭐⭐⭐⭐⭐ | [feedback] |
| Error handling | ⭐⭐⭐⭐⭐ | [feedback] |
| Empty states | ⭐⭐⭐⭐⭐ | [feedback] |
| Feedback/response | ⭐⭐⭐⭐⭐ | [feedback] |
| Keyboard support | ⭐⭐⭐⭐⭐ | [feedback] |

### Accessibility Audit

| WCAG Criterion | Status | Issue | Fix |
|----------------|--------|-------|-----|
| 2.1.1 Keyboard | ✅/❌ | [if any] | [how to fix] |
| 2.4.3 Focus Order | ✅/❌ | [if any] | [how to fix] |
| 2.4.7 Focus Visible | ✅/❌ | [if any] | [how to fix] |
| 4.1.2 Name, Role, Value | ✅/❌ | [if any] | [how to fix] |

### Intent Issues (NEW - not from Logic Audit)

**INTENT #1: [Title]**
• Spec: SPEC-XXX
• What spec says: [literal requirement]
• What user wants: [underlying goal]
• Current behavior: [what code does]
• Suggested change: [how to align]

### Architecture Observations

• **Fits well:** [what works]
• **Concerns:** [potential issues]
• **Suggestions:** [improvements]

### Spec Improvement Recommendations

| Spec # | Issue | Suggested Rewrite |
|--------|-------|-------------------|
| SPEC-XXX | [problem] | [better version] |

### Verdict

☐ ✅ SHIPS WELL - Achieves intent, good UX, accessible
☐ ⚠️ FUNCTIONAL BUT - [UX/accessibility gaps to address]
☐ ❌ MISSES INTENT - [fundamental issues]
```

---

## Mindset Reminder

When doing an intent review, adopt this persona:

> "I am a ComfyUI power user. I track dozens of workflow iterations daily. I asked for this feature because I have a job to do. Does this help me do my job? Does it feel natural? Would I recommend Pilaster to a colleague?"

---

## Example Usage

```text
You: "Review the branching implementation for intent and UX. Does it
      actually help users explore workflow variations effectively?"
```
