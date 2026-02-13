# Quick Reference Card

> One-page cheat sheet for AI Development Playbook.

---

## Phase Flow

```text
SPEC → REVIEW → IMPLEMENT → AUDIT → INTENT → FIX → SHIP
  1       2         3          4        5       6
```

---

## When to Use Each Phase

| Phase | Prompt Starter | Skip If |
|-------|----------------|---------|
| 1. Spec | "Write specs for [feature]" | Never |
| 2. Review | "Review specs for gaps" | <20 lines, single file |
| 3. Implement | "Implement these specs" | Never |
| 4. Audit | "Be hostile, find bugs" | Pure UI, no logic |
| 5. Intent | "Does this achieve user goals?" | Time-constrained |
| 6. Fix | "Fix with minimal changes" | No issues found |

---

## Cognitive Modes

| Mode | Phases | Trigger Phrases |
|------|--------|-----------------|
| **Divergent** (creative) | 1, 3, 5 | "explore", "creative", "possibilities" |
| **Convergent** (critical) | 2, 4, 6 | "hostile", "adversarial", "precise", "minimal" |

---

## Pilaster Rules (Always Apply)

```text
☐ Validate workflow JSON before storage
☐ Intent field REQUIRED for snapshots
☐ Check credits BEFORE Replicate calls
☐ Use Supabase RLS — never bypass auth
☐ Tests REQUIRED for all implementations
```

---

## Spec Numbering

| Type | Format | Example |
|------|--------|---------|
| Core specs | SPEC-001 | SPEC-001: Create snapshot |
| Edge cases | EDGE-001 | EDGE-001: Empty workflow |

---

## Severity Levels

| Icon | Level | Action |
|------|-------|--------|
| 🔴 | Critical | Must fix before ship |
| 🟡 | Warning | Should fix |
| 🟣 | Intent | Nice to fix |
| 🔵 | Polish | Defer to next iteration |

---

## Verdict Meanings

| Verdict | Meaning | Next Step |
|---------|---------|-----------|
| ✅ READY | Good to go | Proceed to next phase |
| ⚠️ NEEDS WORK | Minor issues | Fix listed items, re-review |
| ❌ NOT READY | Blocking issues | Major rework needed |

---

## Quick Commands

```text
# New feature
"Read 1-spec-create.md and spec out [feature]"

# Before coding
"Read 2-spec-review.md and review these specs"

# Start coding
"Read 3-implement.md and implement these specs"

# After coding
"Read 4-audit-logic.md and audit this implementation"

# UX check
"Read 5-audit-intent.md and review for intent"

# Apply fixes
"Read 6-fix-iterate.md and fix these issues"

# Bug fix only
"Read hotfix.md and fix this bug: [description]"
```

---

## Files at a Glance

| File | Purpose |
|------|---------|
| `README.md` | Full documentation |
| `0-quick-ref.md` | This cheat sheet |
| `1-spec-create.md` | Write specs |
| `2-spec-review.md` | QA specs |
| `3-implement.md` | Write code + tests |
| `4-audit-logic.md` | Find bugs |
| `5-audit-intent.md` | Verify UX |
| `6-fix-iterate.md` | Apply fixes |
| `hotfix.md` | Bug-only workflow |
