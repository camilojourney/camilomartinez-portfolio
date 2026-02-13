# Phase 6: Fix & Iterate

> **When to use:** After audits. Apply fixes from logic audit and intent review.
> **Cognitive mode:** Convergent (precise) — minimal changes, don't introduce new bugs.

---

## Prompt

```text
You are fixing issues identified during code review. Your goal is MINIMAL, PRECISE changes that fix the exact issues without introducing new problems or changing unrelated code.

═══════════════════════════════════════════════════════════════════════════════
ORIGINAL SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

[Paste specs for reference]

═══════════════════════════════════════════════════════════════════════════════
CURRENT IMPLEMENTATION
═══════════════════════════════════════════════════════════════════════════════

[Paste current code]

═══════════════════════════════════════════════════════════════════════════════
ISSUES TO FIX
═══════════════════════════════════════════════════════════════════════════════

From Logic Audit:
[Paste critical issues and warnings from Phase 4]

From Intent Review:
[Paste intent issues from Phase 5]

═══════════════════════════════════════════════════════════════════════════════
FIX REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

1. MINIMAL CHANGES
   • Fix only what's broken
   • Do not refactor unrelated code
   • Do not "improve" working code
   • If it's not in the issues list, don't touch it

2. ONE FIX AT A TIME
   • Address issues in priority order (critical → warnings → intent)
   • Each fix should be independently testable

3. PRESERVE EXISTING BEHAVIOR
   • Existing tests must pass
   • Working functionality must remain working

4. DOCUMENT CHANGES
   • Mark each fix with the issue it addresses
   • Explain why this specific fix was chosen

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

## Fix Report

### Issues Addressed

| Issue | Type | Status |
|-------|------|--------|
| CRITICAL #1 | Logic | ✅ Fixed |
| WARNING #2 | Logic | ✅ Fixed |
| INTENT #1 | UX | ⏭️ Deferred (reason) |

### Fix Details

**Fix for CRITICAL #1: [Issue Title]**

Issue: [Brief description]

```diff
- // Old code
- const result = items.filter(x => x.active);
+ // Fixed: Handle null items array
+ const result = (items ?? []).filter(x => x.active);
```

Rationale: [Why this fix, not another approach]

Test to verify:

```typescript
it('should handle null items', () => {
  expect(() => processItems(null)).not.toThrow();
});
```

---

**Fix for WARNING #2: [Issue Title]**

[Same structure]

---

### Deferred Issues

| Issue | Reason | Follow-up |
|-------|--------|-----------|
| INTENT #1 | Requires spec change | Create ticket for v2 |

### Updated Files

| File | Changes | Specs Affected |
|------|---------|----------------|
| `path/to/file.ts` | +5, -2 | SPEC-001, EDGE-003 |

### Git Commit

Use this commit message format:

```text
fix(feature-name): brief description of fix

- CRITICAL #1: [what was fixed]
- WARNING #2: [what was fixed]

Closes #[issue-number if applicable]
```

### Verification Checklist

- [ ] All critical issues fixed
- [ ] Existing tests pass (`pnpm test`)
- [ ] New tests added for fixed issues
- [ ] No unrelated changes made
- [ ] Lint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
```

---

## Fix Prioritization

Apply fixes in this order:

1. **🔴 Critical** - Bugs that break functionality or cause data loss
2. **🟡 Warnings** - Bugs that cause poor UX or edge case failures
3. **🟣 Intent** - Gaps between literal compliance and user goals
4. **🔵 Polish** - Minor improvements (often defer to next iteration)

---

## Anti-Patterns to Avoid

| Don't Do This | Do This Instead |
|---------------|-----------------|
| Refactor while fixing | Fix first, refactor separately |
| Add "helpful" features | Only fix what's broken |
| Change code style | Match existing style |
| Fix multiple issues in one change | One fix per change |
| Skip tests for "obvious" fixes | Every fix needs a test |

---

## When to Stop Iterating

Stop the fix cycle when:
- All 🔴 Critical issues are resolved
- All 🟡 Warnings are resolved or consciously deferred
- Remaining issues are 🟣 Intent or 🔵 Polish that don't block shipping

If you've done 3+ fix cycles and still finding critical issues, consider:
- Is the spec fundamentally flawed?
- Should this feature be re-architected?
- Is scope too large for one PR?

---

## Example Usage

```text
You: "Apply the fixes from the logic audit. Start with critical issues only.
      Make minimal changes - don't refactor anything else."
```
