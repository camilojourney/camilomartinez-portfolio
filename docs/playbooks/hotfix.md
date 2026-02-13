# Hotfix Workflow

> **When to use:** Fixing a bug without adding new features. Skips spec creation and review.
> **Cognitive mode:** Convergent (precise) — find root cause, fix minimally.

---

## When to Use Hotfix vs Full Workflow

| Scenario | Use |
|----------|-----|
| Bug reported in production | Hotfix |
| Bug found during development | Hotfix |
| "Fix this and also add..." | Full workflow (has new feature) |
| Refactoring while fixing | Full workflow |
| Security vulnerability | Hotfix (urgent) |

---

## Prompt

```text
You are a senior developer fixing a bug. Your goal is to find the root cause, apply the MINIMAL fix, and verify it doesn't break anything else.

═══════════════════════════════════════════════════════════════════════════════
BUG REPORT
═══════════════════════════════════════════════════════════════════════════════

**Description:** [What's broken]

**Steps to reproduce:**
1. [Step 1]
2. [Step 2]
3. [Expected: X, Actual: Y]

**Environment:** [Browser, OS, user type, etc.]

**Severity:** 🔴 Critical / 🟡 Major / 🟢 Minor

═══════════════════════════════════════════════════════════════════════════════
RELEVANT CODE
═══════════════════════════════════════════════════════════════════════════════

[Paste the code that's likely involved]

═══════════════════════════════════════════════════════════════════════════════
PILASTER CONTEXT
═══════════════════════════════════════════════════════════════════════════════

• Stack: Next.js 14+, TypeScript, Supabase, React Flow
• Testing: Vitest
• Critical rules: RLS always on, credits checked before Replicate, workflow JSON validated

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

1. DIAGNOSE
   • Identify the root cause (not just the symptom)
   • Explain WHY the bug occurs
   • List all code paths affected

2. FIX
   • Apply the MINIMAL change that fixes the bug
   • Do NOT refactor surrounding code
   • Do NOT add features
   • Do NOT "improve" unrelated code

3. VERIFY
   • Write a test that would have caught this bug
   • Confirm existing tests still pass
   • Check for similar bugs in related code

4. PREVENT
   • Suggest how to prevent similar bugs in future

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

## Bug Fix Report

### Root Cause Analysis

**What's happening:** [Technical explanation]

**Why it happens:** [Root cause]

**Code location:** `[file:line]`

### The Fix

```diff
- // Old code (buggy)
- const result = data.items.map(x => x.id);
+ // Fixed: Handle null data
+ const result = (data?.items ?? []).map(x => x.id);
```

**Why this fix:** [Rationale for this approach vs alternatives]

### Test to Prevent Regression

```typescript
import { describe, it, expect } from 'vitest';

describe('Bug fix: [brief description]', () => {
  it('should handle [the edge case that caused the bug]', () => {
    // This test would have caught the bug
  });
});
```

### Related Code Check

| Location | Same Pattern? | Needs Fix? |
|----------|---------------|------------|
| `[file:line]` | Yes/No | Yes/No |

### Prevention Recommendation

[How to prevent similar bugs: linting rule, type improvement, code pattern, etc.]

### Git Commit

```text
fix(component): brief description of fix

Root cause: [one line explanation]
Regression test added.

Closes #[issue-number]
```

### Verification Checklist

- [ ] Root cause identified (not just symptom)
- [ ] Minimal fix applied
- [ ] Regression test added
- [ ] Existing tests pass (`pnpm test`)
- [ ] No unrelated changes
- [ ] Similar patterns checked
```

---

## Hotfix Flow

```text
Bug Report
    │
    ▼
┌─────────────────────────────────────────┐
│  1. DIAGNOSE                            │
│  Find root cause, not just symptom      │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  2. FIX                                 │
│  Minimal change only                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  3. TEST                                │
│  Write regression test                  │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  4. VERIFY                              │
│  All tests pass, no new issues          │
└─────────────────────────────────────────┘
    │
    ▼
✅ SHIP IT
```

---

## Anti-Patterns

| Don't Do This | Do This Instead |
|---------------|-----------------|
| Fix symptom without understanding cause | Find and fix root cause |
| "While I'm here, let me also..." | Only fix the bug |
| Skip the regression test | Always add a test |
| Assume it's the only occurrence | Check for similar patterns |

---

## Example Usage

```text
You: "Read docs/playbooks/hotfix.md and fix this bug:
      When a user saves a snapshot without an intent field,
      the app crashes instead of showing a validation error."
```
