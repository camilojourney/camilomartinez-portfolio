# AGENTS.md — camilomartinez-portfolio

## Project Overview

Next.js + FastAPI fitness analytics portfolio for Camilo Martinez. Pulls wearable data from WHOOP (HRV, sleep, recovery) and Strava (runs, rides, workouts) into a personal analytics dashboard. Deployed on Vercel + Render.

**Vision:** See [docs/vision.md](docs/vision.md)
**Roadmap:** See [docs/roadmap.md](docs/roadmap.md)

## Quick Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev:all` | Start full dev stack |
| `pnpm build` | Production build |
| `pnpm test:all` | Run all tests |
| `pnpm lint` | Lint check |

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript strict, Tailwind CSS
- **Backend:** FastAPI, Python 3.11+, Pydantic v2
- **Database:** PostgreSQL via Vercel Postgres
- **Auth:** NextAuth 5 beta + WHOOP/Strava OAuth 2.0
- **Deploy:** Vercel (frontend) + Render (backend)
- **Testing:** Vitest (frontend), pytest (backend)

## Agent System

| Task | Agent | File |
|------|-------|------|
| Code improvements | code-improver | `.claude/agents/code-improver.md` |
| Security audit | security-sentinel | `.claude/agents/security-sentinel.md` |
| Frontend quality (Mission C) | ux-frontend-builder | `.claude/agents/ux-frontend-builder.md` |
| Infrastructure health | devops-guardian | `.claude/agents/devops-guardian.md` |
| Verdict / validation | judge-agent | `.claude/agents/judge-agent.md` |
| Prompt improvement | prompt-optimizer | `.claude/agents/prompt-optimizer.md` |
| Weekly coordination | manager | `.claude/agents/manager.md` |

Agent cycle: weekly (Sunday 5 AM ET). See `.self-improvement/workers.yaml`.

## Playbooks

See `docs/playbooks/` for human-facing workflow guides:
- `docs/playbooks/development.md` — local setup and dev workflow
- `docs/playbooks/performance.md` — performance targets and optimization notes

## Rules

### Always
- TypeScript strict mode — no `any` types
- Python type hints everywhere — Pydantic v2 models for all API contracts
- Run `pnpm lint` before committing
- Keep TypeScript types in `src/types/` aligned with Pydantic models in `backend/app/models/`

### Ask First
- Adding new npm or Python dependencies
- Changing database schema
- Modifying OAuth scope for WHOOP or Strava
- Major architectural changes

### Never
- Commit secrets or API keys
- Push directly to `main`
- Make dashboard data publicly accessible without explicit ALLOW_PUBLIC_DASHBOARD_DATA=true
- Change infrastructure (Render/Vercel) beyond free tier without approval
- Store health data in any new location not already in the schema

## Escalation (All Agents)

Escalate to Camilo if:
- Work estimate > 1 day
- Breaking change to API or database
- Security severity >= HIGH
- OAuth scope change for WHOOP or Strava
- Confidence < 70%

## Domain Concepts

- **HRV** — Heart Rate Variability (WHOOP primary signal)
- **Recovery score** — WHOOP daily readiness (0-100%)
- **Strain** — WHOOP cardiovascular load metric
- **Strava activity** — A logged workout (run, ride, swim, etc.)
- **Token TTL** — Strava tokens expire in 6h; WHOOP tokens last longer but must still auto-refresh
