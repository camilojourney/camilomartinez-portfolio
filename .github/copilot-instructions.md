# GitHub Copilot Instructions

## Agent System

Load from `.ai/agents/`:
- Feature work: `@.ai/agents/builder.md`
- Deployment: `@.ai/agents/operator.md`
- Documentation: `@.ai/agents/communicator.md`
- Prioritization: `@.ai/agents/strategist.md`

## Standards

Apply these to all code:
- TypeScript + Python: `@.ai/standards/code/typescript.md`
- Next.js + FastAPI: `@.ai/standards/code/nextjs.md`
- Testing: `@.ai/standards/code/testing.md`
- API Design: `@.ai/standards/api/design.md`
- Security: `@.ai/standards/security/baseline.md`

## Core Rules

### Always
- Keep docs, specs, and context files aligned with shipped code

### Ask First
- Changes to production credentials, billing, or automation schedules

### Never
- Never bypass auth, rate limits, or audit logging controls

## Commands

- Install: `pnpm install && cd backend && uv sync`
- Dev: `pnpm dev:all`
- Test: `pnpm test:db-schema`
- Build: `pnpm build`
- Lint: `pnpm exec next lint`

## More Context

See `AGENTS.md` for full agent definitions and `CLAUDE.md` for quick reference.
