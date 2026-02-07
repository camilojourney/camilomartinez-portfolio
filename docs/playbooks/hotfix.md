# Hotfix Workflow

For bug-only urgent fixes.

## Steps

1. Reproduce and isolate root cause
2. Apply minimal fix
3. Add regression test
4. Verify and ship safely

## Rules

- no feature scope in hotfix
- no unrelated refactors
- escalate if security/data integrity risk appears

## Verification

Run commands from `AGENTS.md`:
- `pnpm test:db-schema`
- `pnpm exec next lint`
- `pnpm build`

## Prompt Template

```text
Use hotfix workflow: identify root cause, apply minimal fix, add regression test, and verify.
```
