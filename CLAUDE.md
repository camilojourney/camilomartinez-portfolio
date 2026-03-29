# Camilo Martinez Portfolio

Next.js + FastAPI fitness analytics platform. Pulls data from WHOOP and Strava. Deployed on Vercel + Render.

## Commands

- Dev (all): `pnpm dev:all`
- Dev (frontend only): `pnpm dev`
- Dev (backend only): `cd backend && uv run uvicorn app.main:app --reload --port 8000`
- Test (frontend): `pnpm test:run`
- Test (backend): `pnpm test:backend`
- Test (all): `pnpm test:all`
- Lint: `pnpm lint`
- Build: `pnpm build`

## Structure

> For detailed file placement rules, see `.claude/rules/structure.md`.

| Content | Location |
|---------|----------|
| Pages | `src/app/<route>/page.tsx` |
| Components | `src/components/` |
| Utilities | `src/lib/` |
| Backend services | `backend/app/services/` |
| Backend tests | `backend/tests/` |
| Specs | `specs/` |
| ADRs | `docs/decisions/` |
| Playbooks | `docs/playbooks/` |
| Agent rules | `.claude/rules/` |

## Critical Rules

- **No secrets in client bundle** — `NEXT_PUBLIC_` vars are public; keep `NEXTAUTH_SECRET`, `WHOOP_CLIENT_SECRET`, `STRAVA_CLIENT_SECRET`, `CRON_SECRET` server-side only
- **OAuth token refresh is critical path** — Strava tokens expire in 6h; WHOOP tokens must also auto-refresh
- **Never break ingestion pipelines** — downstream analytics depend on continuous data sync
- **ALLOW_PUBLIC_DASHBOARD_DATA defaults to false** — health data is personal

## Skills

All work dispatched via skills (see `.claude/rules/workflow.md`):
- Code changes: `/code camilomartinez-portfolio`
- UX/UI: `/ux camilomartinez-portfolio`
- Maintenance: `/maintenance camilomartinez-portfolio`
- Specs: `/specs camilomartinez-portfolio`

## External Services

- WHOOP API (HRV, sleep, recovery, strain)
- Strava API (activities: runs, rides, workouts)
- Vercel (frontend deployment)
- Render (backend deployment)
- Vercel Postgres (token + data storage)

## Type
C — Full-Stack Application (Next.js 14 + FastAPI + WHOOP/Strava integrations)

## Context

@ARCHITECTURE.md
@.claude/rules/structure.md
@specs/README.md

@import .claude/rules/workflow.md
