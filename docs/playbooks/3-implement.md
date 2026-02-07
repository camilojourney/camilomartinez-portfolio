# Phase 3: Implementation

Implement approved specs with tests and minimal scope drift.

## Rules

- follow existing architecture patterns
- implement in dependency order
- add tests with each behavior change
- avoid unrelated refactors
- escalate risk per `.ai/decision-boundaries.md`

## Verification

Run commands from `AGENTS.md`:
- `pnpm exec next lint`
- `pnpm test:db-schema`
- `pnpm build`

## Output

- summary of implemented specs
- files changed
- tests added/updated
- verification results
- known risks/follow-ups
