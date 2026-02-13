# AI Development Playbook v1.0

> Phase-based workflow for building features with AI assistance.
>
> **Last updated:** 2025-01

---

## Two Parallel Systems

| System | Location | Purpose |
|--------|----------|---------|
| **Playbooks** | `docs/playbooks/` | Human-facing prompts for driving AI sessions |
| **AI-rules** | `ai-rules/` | AI-facing context and standards for autonomous operation |

Use **playbooks** when you want to guide an AI through a specific workflow step-by-step.
Use **ai-rules** when you want AI to operate autonomously with full context.

---

## Quick Reference

| Phase | File | When to Use | Cognitive Mode | Can Skip? |
|-------|------|-------------|----------------|-----------|
| 1. Spec Creation | `1-spec-create.md` | Starting a new feature | Divergent (creative) | No |
| 2. Spec Review | `2-spec-review.md` | Before implementation | Convergent (critical) | Only for tiny features |
| 3. Implementation | `3-implement.md` | Ready to write code | Divergent (creative) | No |
| 4. Logic Audit | `4-audit-logic.md` | After implementation | Convergent (hostile) | Only for trivial changes |
| 5. Intent Review | `5-audit-intent.md` | After logic audit | Divergent (empathetic) | Yes, if time-constrained |
| 6. Fix & Iterate | `6-fix-iterate.md` | After reviews | Convergent (precise) | Only if no issues found |

**For bug fixes only:** See `hotfix.md` — skip phases 1-2.

---

## How to Use

### Option 1: Direct Reference

```text
"Read docs/playbooks/4-audit-logic.md and apply it to the snapshot feature I just implemented"
```

### Option 2: Phase Transition

```text
"I finished implementing the branching feature. Run a logic audit - be a hostile auditor looking for bugs."
```

### Option 3: Full Context

```text
"Load the spec creation prompt from my playbook and help me spec out user notifications"
```

---

## The Core Principle

**Different phases need different thinking modes:**

- **Divergent thinking** (creative, exploratory): Spec creation, implementation, UX review
- **Convergent thinking** (critical, precise): Spec review, logic audit, bug fixes

You can prompt the same model into different modes by being explicit about what you need.

---

## Workflow Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                      FEATURE DEVELOPMENT                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. SPEC CREATION                                               │
│  "Help me write detailed specs for [feature]"                   │
│  → Use: 1-spec-create.md                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. SPEC REVIEW                                                 │
│  "Review these specs for gaps and ambiguities"                  │
│  → Use: 2-spec-review.md                                        │
│  ⤷ Skip if: Single-file change, <20 lines, well-understood      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. IMPLEMENTATION                                              │
│  "Implement these specs"                                        │
│  → Use: 3-implement.md                                          │
│  ⚠️  Tests are REQUIRED, not optional                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. LOGIC AUDIT                                                 │
│  "Be a hostile auditor - find every bug"                        │
│  → Use: 4-audit-logic.md                                        │
│  ⤷ Skip if: Pure UI change, no logic                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. INTENT REVIEW                                               │
│  "Does this achieve what the user actually wants?"              │
│  → Use: 5-audit-intent.md                                       │
│  ⤷ Skip if: Time-constrained, logic audit passed clean          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. FIX & ITERATE                                               │
│  "Fix these issues with minimal changes"                        │
│  → Use: 6-fix-iterate.md                                        │
│  ⤷ Skip if: No issues found in audits                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        ✅ SHIP IT
```

---

## Alternative Workflows

### Bug Fix (Hotfix)

For fixing bugs without new features:

```text
Bug Report → 4. Logic Audit → 6. Fix & Iterate → ✅ Ship
```

See `hotfix.md` for the streamlined prompt.

### Refactoring

For cleaning up code without changing behavior:

```text
1. Write specs describing CURRENT behavior
2. Implement refactor
3. Logic Audit (verify behavior unchanged)
4. Fix & Iterate
```

### Database Migration

For schema changes:

```text
1. Spec Creation (include "Database Changes" section)
2. Spec Review (verify RLS policies)
3. Implementation (migration + code)
4. Logic Audit (test rollback)
5. Ship
```

---

## Conflict Resolution

**When Logic Audit and Intent Review disagree:**

1. Logic Audit finds code bugs → Always fix
2. Intent Review finds UX issues → Prioritize by user impact
3. Both find same issue → Critical priority

**When 3+ fix cycles still find critical issues:**

- Stop and reassess the spec
- Consider splitting into smaller features
- Check if architecture needs redesign

---

## Pilaster-Specific Reminders

These rules apply to ALL phases:

- ✅ Validate workflow JSON before storage
- ✅ Intent field required for every snapshot
- ✅ Check credits before Replicate API calls
- ✅ Use Supabase RLS — never bypass auth
- ✅ Tests required for all implementations

---

## Tips

1. **Don't skip spec review** — 10 minutes here saves hours of rework
2. **Be explicit about mode** — "Be adversarial" or "Be creative" changes output significantly
3. **Reference specs by number** — SPEC-001, EDGE-002 makes reviews traceable
4. **Iterate specs after implementation** — Update specs with lessons learned
5. **One fix per commit** — Makes rollback easier
