# Camilo Martinez Portfolio

AI-driven fitness analytics platform with Next.js frontend and FastAPI backend.

## The Vision

Deliver an end-to-end, production-grade analytics product that turns wearable data into actionable fitness insights.

## Commands

- Dev: `pnpm dev:all`
- Test: `pnpm test:db-schema`
- Lint: `pnpm exec next lint`
- Build: `pnpm build`

## Structure

- Pages: `src/app/`
- Components: `src/components/`
- Lib: `src/lib/`
- Server: `backend/`
- Tests: `backend/tests/`

## Agents

Load from `.ai/agents/`:

- builder.md (features, bugs, tests, review)
- operator.md (deploy, security, infrastructure)
- communicator.md (docs, UI, support)
- strategist.md (prioritization, feedback, growth)

## Standards

- `.ai/standards/code/` (TypeScript + Python, Next.js + FastAPI, testing)
- `.ai/standards/api/design.md`
- `.ai/standards/security/baseline.md`
- `.ai/standards/comms/voice.md`

## Critical Rules

- Keep frontend-backend API contracts synchronized\n- Validate auth/session handling for integrations\n- Do not break ingestion pipelines without migration plan

## Key Files

- `src/app/`\n- `backend/app/main.py`\n- `docs/README.md`

## Database Tables

- Managed by backend migrations and analytics scripts

## External Services

- WHOOP API\n- Strava API\n- Deployment platforms (Render/Vercel)

## Current Focus

See `.ai/contexts/current-priorities.md`

## Two Parallel Systems

| System | Location | Purpose |
|--------|----------|---------|
| **Playbooks** | `docs/playbooks/` | Human-facing prompts for driving AI sessions |
| **.ai** | `.ai/` | AI-facing context and standards for autonomous operation |

Use **playbooks** when you want to guide an AI through a specific workflow step-by-step.
Use **.ai** when you want AI to operate autonomously with full context.

## Development Workflow

Phase-based playbook in `docs/playbooks/`:

1. `1-spec-create.md` - Write detailed specs from ideas
2. `2-spec-review.md` - QA specs before implementation
3. `3-implement.md` - Build from specs
4. `4-audit-logic.md` - Hostile bug hunting (be adversarial)
5. `5-audit-intent.md` - UX and intent verification
6. `6-fix-iterate.md` - Apply fixes with minimal changes

Usage: "Read docs/playbooks/4-audit-logic.md and audit the feature I just built"

## MCP Servers

Configured in `.mcp.json` - filesystem, memory, GitHub access.

## Project Overrides

- Pre-merge CLAUDE notes (if present):
- `docs/project-overrides/CLAUDE.premerge.md`
- Use repository READMEs and docs for feature-level constraints before implementation.
