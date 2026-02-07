# AGENTS.md - Camilo Martinez Portfolio Project Constitution

## Project Overview

Camilo Martinez Portfolio is **AI-driven fitness analytics platform with Next.js frontend and FastAPI backend.**.

**Vision:** Deliver an end-to-end, production-grade analytics product that turns wearable data into actionable fitness insights.

## Build Phases

| Phase | Timeline | Focus |
|-------|----------|-------|
| **MVP** | 0-8 weeks | Stabilize core data ingestion, analytics views, and backend reliability |
| **V1.5** | 8-16 weeks | Expand automation and improve user-facing analytics quality |
| **V2** | 16+ weeks | Multi-environment hardening and operational maturity |

## Quick Commands

| Command | Purpose |
|---------|---------|
| `pnpm install && cd backend && uv sync` | Install dependencies |
| `pnpm dev:all` | Start dev server |
| `pnpm build` | Production build |
| `pnpm test:db-schema` | Run tests |
| `pnpm exec next lint` | Lint and auto-fix |

## Tech Stack

- **Framework:** Next.js + FastAPI
- **Language:** TypeScript + Python
- **Database:** PostgreSQL/SQLite
- **Integrations: WHOOP, Strava, Render, Vercel**

## Project Structure

```
camilomartinez-portfolio/
├── src/           # Source code
├── src/components/       # Reusable components
├── src/lib/              # Utilities and libraries
├── backend/           # API routes and server logic
└── backend/tests/            # Test files
```

## Two Parallel Systems

| System | Location | Purpose |
|--------|----------|---------|
| **Playbooks** | `docs/playbooks/` | Human-facing prompts for driving AI sessions |
| **.ai** | `.ai/` | AI-facing context and standards for autonomous operation |

Use **playbooks** when you want to guide an AI through a specific workflow step-by-step.
Use **.ai** when you want AI to operate autonomously with full context.

## Agent System

| Task Type | Agent | File |
|-----------|-------|------|
| Build anything technical | Builder | `.ai/agents/builder.md` |
| Keep it running | Operator | `.ai/agents/operator.md` |
| Talk to humans | Communicator | `.ai/agents/communicator.md` |
| Decide what to build | Strategist | `.ai/agents/strategist.md` |

## Standards

- TypeScript + Python: `.ai/standards/code/typescript.md`
- Next.js + FastAPI: `.ai/standards/code/nextjs.md`
- Testing: `.ai/standards/code/testing.md`
- API: `.ai/standards/api/design.md`
- Security: `.ai/standards/security/baseline.md`
- Voice: `.ai/standards/comms/voice.md`

## Workflows

- Ship Feature: `.ai/workflows/ship-feature.md`
- Investigate Bug: `.ai/workflows/investigate-bug.md`
- Customer Feedback: `.ai/workflows/customer-feedback.md`
- Weekly Ops: `.ai/workflows/weekly-ops.md`

## Contexts

- Product: `.ai/contexts/product-context.md`
- Priorities: `.ai/contexts/current-priorities.md`
- Optional project-specific context: `.ai/contexts/camilomartinez-portfolio.md`

## Templates

- PR Description: `.ai/templates/pr-description.md`
- Changelog Entry: `.ai/templates/changelog-entry.md`
- Customer Response: `.ai/templates/customer-response.md`
- Weekly Update: `.ai/templates/weekly-update.md`

## Core Rules

### Always

- Use TypeScript + Python strict mode
- Write tests for business logic
- Run `pnpm exec next lint` before committing
- Add documentation to exported functions
- Keep docs, specs, and context files aligned with shipped code

### Ask First

- Adding new dependencies
- Modifying database schema
- Changing authentication flow
- Major architectural changes
- Changes to production credentials, billing, or automation schedules

### Never

- Commit API keys or secrets
- Disable type checking
- Skip error handling
- Never bypass auth, rate limits, or audit logging controls

## Escalation (All Agents)

- Work estimate > 1 day
- Breaking change to API or database
- Security severity > Medium
- Confidence is low

See `.ai/decision-boundaries.md` for full authority matrix.

## Domain Concepts

- Wearable data ingestion\n- Workout and sleep analytics\n- AI-assisted insights generation

## Specs

- **MVP:** `specs/mvp-foundation.md`

## Project Overrides

- Pre-merge AGENTS (if present):
- none
- Project-specific context source: `.ai/contexts/camilomartinez-portfolio.md`
- Existing repository docs remain authoritative for business/domain details.
