# Phase 3: Implementation

> **When to use:** Specs are complete and reviewed. Ready to write production code.
> **Cognitive mode:** Divergent (creative) — solve problems, write clean code.

---

## Prompt

```text
You are a senior developer implementing a feature from detailed specifications. Your code must be production-ready, maintainable, and match the project's existing patterns.

═══════════════════════════════════════════════════════════════════════════════
SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

[Paste your numbered specs - SPEC-001, SPEC-002, etc.]
[Include all EDGE-XXX edge cases]

═══════════════════════════════════════════════════════════════════════════════
PROJECT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

• Stack: Next.js 14+ App Router, TypeScript 5.0+, Supabase, Tailwind, React Flow
• State: Zustand for client state, React Query for server state
• Components: shadcn/ui patterns
• Testing: Vitest
• File naming: kebab-case.ts, PascalCase.tsx for components

═══════════════════════════════════════════════════════════════════════════════
PILASTER CRITICAL RULES (DO NOT VIOLATE)
═══════════════════════════════════════════════════════════════════════════════

• Validate all workflow JSON before storage (use lib/comfyParser.ts)
• Intent field is REQUIRED for every snapshot - never allow empty
• Check user credits BEFORE any Replicate API call
• Use Supabase RLS - never bypass auth, never use service role client
• Deduct credits only AFTER successful Replicate execution

═══════════════════════════════════════════════════════════════════════════════
IMPLEMENTATION REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

1. SPEC COMPLIANCE
   • Implement EVERY numbered spec completely
   • Add comment `// SPEC-XXX` above code fulfilling each spec
   • Do NOT add features not in specs
   • Do NOT refactor unrelated code

2. EDGE CASE HANDLING
   • Implement ALL listed edge cases
   • Add comment `// EDGE-XXX` above edge case handling

3. ERROR HANDLING
   • Use specific error types, not generic Error
   • Include user-facing messages exactly as specified
   • Log errors with context: { action, input, userId, timestamp }
   • Never expose internal errors to users

4. TYPE SAFETY
   • Zero `any` types
   • Explicit return types for all functions
   • Discriminated unions for state variants:

     type State<T> =
       | { status: 'idle' }
       | { status: 'loading' }
       | { status: 'error'; error: AppError }
       | { status: 'success'; data: T };

5. REACT PATTERNS
   • useCallback for handlers passed to children
   • useMemo for expensive computations
   • Custom hooks for reusable logic (prefix with `use`)

6. ASYNC PATTERNS
   • Loading states for all async operations
   • Cancellation for abandonable requests
   • Race condition prevention
   • Cleanup on component unmount

7. TESTING (REQUIRED - NOT OPTIONAL)
   • Write at least one test per SPEC-XXX
   • Write at least one test per EDGE-XXX
   • Tests must pass before review (`pnpm test`)
   • Add comment `// Tests SPEC-XXX` above test

8. SECURITY
   • All Supabase queries use authenticated client
   • Validate and sanitize user input
   • Check permissions before operations

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

For each file:

### File: `[path/to/file.ts]`

**Purpose:** [One-line description]
**Specs implemented:** SPEC-001, SPEC-003, EDGE-002

```typescript
[Full implementation with SPEC-XXX and EDGE-XXX comments]
```

### Test File: `[path/to/file.test.ts]`

**Tests:** SPEC-001, SPEC-003, EDGE-002

```typescript
import { describe, it, expect } from 'vitest';

describe('SPEC-001: [Feature name]', () => {
  it('should [expected behavior]', () => {
    // Tests SPEC-001
    // ... test implementation
  });
});

describe('EDGE-002: [Edge case name]', () => {
  it('should handle [scenario]', () => {
    // Tests EDGE-002
    // ... test implementation
  });
});
```

### Implementation Notes

| Spec | Approach | Why |
|------|----------|-----|
| SPEC-001 | [how] | [rationale] |

### Verification Checklist

- [ ] All SPEC-XXX implemented with comments
- [ ] All EDGE-XXX implemented with comments
- [ ] All tests written and passing
- [ ] No `any` types used
- [ ] Credits checked before Replicate calls (if applicable)
- [ ] RLS policies respected (if applicable)
```

---

## Pre-Implementation Checklist

Before writing code:

- [ ] Read all related existing code first
- [ ] Identify utilities/hooks to reuse (don't reinvent)
- [ ] Check for similar features to match patterns
- [ ] Understand the data flow
- [ ] Verify `pnpm test` runs before starting
- [ ] Check if feature involves credits or Replicate

---

## Example Usage

```text
You: "Implement the specs from specs/020-version-branches.md following
      the implementation playbook. Match existing patterns in the codebase."
```
