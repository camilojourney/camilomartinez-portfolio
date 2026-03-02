# Repository Structure — camilomartinez-portfolio

> WHERE things go in this repo. Read before creating or moving any file.
> Type C — Full-Stack Application (Next.js frontend + Python/FastAPI backend).

## Root Level

| File/Dir | Purpose |
|----------|---------|
| `CLAUDE.md` | Claude Code quick reference. |
| `AGENTS.md` | Universal AI entry point. |
| `ARCHITECTURE.md` | Codebase architecture. |
| `README.md` | Human-facing project overview. |
| `justfile` | Unified task runner (`just --list` to discover). |
| `package.json` | Node package config (pnpm). |
| `next.config.js` | Next.js configuration. |
| `tsconfig.json` | TypeScript configuration. |
| `tailwind.config.js` | Tailwind CSS configuration. |
| `playwright.config.ts` | Playwright e2e test configuration. |
| `vitest.config.ts` | Vitest unit test configuration. |
| `render.yaml` | Render deployment configuration. |
| `vercel.json` | Vercel deployment configuration. |
| `src/` | Next.js frontend source (pages, components, lib). |
| `backend/` | Python/FastAPI API server with Alembic migrations. |
| `public/` | Static assets (images, maps, downloads). |
| `scripts/` | Utility and automation scripts. |
| `e2e/` | Playwright end-to-end tests. |
| `specs/` | Numbered feature specifications. |
| `docs/` | Structured documentation (four categories only). |
| `.github/workflows/` | CI and scheduled cron workflows. |
| `.claude/` | Claude Code configuration and rules. |
| `.self-improvement/` | Autonomous improvement system. |

**Never create files at root** unless they are one of the above.

## Frontend Source (`src/`)

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js App Router pages and layouts. |
| `src/app/api/` | Next.js API route handlers (BFF layer). |
| `src/app/ai-trainer/` | AI trainer feature pages. |
| `src/app/whoop-dashboard/` | Whoop health dashboard pages. |
| `src/components/` | Reusable React components. |
| `src/components/ui/` | Base UI primitives (shadcn/ui-style). |
| `src/components/features/` | Feature-specific component groups. |
| `src/components/projects/` | Project showcase components. |
| `src/components/common/` | Shared layout and utility components. |
| `src/lib/` | Shared utilities, API clients, auth, config. |
| `src/lib/services/` | Service layer (API integrations). |
| `src/lib/security/` | Security utilities. |
| `src/lib/db/` | Database client and queries. |
| `src/types/` | Shared TypeScript type definitions. |
| `src/styles/` | Global CSS (animations, scrollbar, globals). |
| `src/data/` | Static data files (projects, etc.). |

## Backend (`backend/`)

| Directory | Purpose |
|-----------|---------|
| `backend/app/main.py` | FastAPI app entry point. |
| `backend/app/routers/` | API route modules (ai, analytics, integrations, etc.). |
| `backend/app/services/` | Business logic and external API clients. |
| `backend/app/models/` | SQLAlchemy models (user, strava, whoop, etc.). |
| `backend/app/middleware/` | Request middleware (auth, logging). |
| `backend/app/config/` | Configuration and settings. |
| `backend/app/utils/` | Shared utility functions. |
| `backend/alembic/` | Alembic migration environment. |
| `backend/alembic/versions/` | Database migration files (never edit once applied). |
| `backend/data/` | Backend data files (astoria-conquest, caches). |
| `backend/scripts/` | Backend utility scripts (Notion sync, health checks). |
| `backend/tests/` | Pytest backend tests. |
| `backend/Dockerfile` | Backend container build definition. |
| `backend/docker-compose.yml` | Backend local dev services. |

## GitHub Workflows (`.github/workflows/`)

| File | Purpose |
|------|---------|
| `ci.yml` | Continuous integration (lint, type-check, test). |
| `astoria-conquest-update.yml` | Cron: Astoria Conquest data updates. |
| `cron-strava-monday-sync.yml` | Cron: Strava data sync (Mondays). |
| `cron-daily-data-fetch.yml` | Cron: Daily data fetch pipeline. |
| `weekly-notion-sync.yml` | Cron: Weekly Notion sync. |

## Docs (`docs/`) — Exactly Four Categories

| Path | Purpose |
|------|---------|
| `docs/README.md` | Navigation index. |
| `docs/vision.md` | Product vision. Update at most yearly. |
| `docs/roadmap.md` | Versioned feature plan. |
| `docs/decisions/NNNN-*.md` | ADRs — immutable once accepted. |
| `docs/playbooks/*.md` | Step-by-step operational guides. |

**NEVER create** ad-hoc docs files. Architecture goes in `ARCHITECTURE.md` (root). Specs go in `specs/`.

## What Goes Where

| Content | Location |
|---------|----------|
| New feature spec | `specs/NNN-name.md` |
| Architecture decision | `docs/decisions/NNNN-name.md` |
| Dev setup guide | `docs/playbooks/development.md` |
| Agent priorities | `.self-improvement/NEXT.md` |
| Worker reports | `.self-improvement/reports/<worker>/YYYY-MM-DD.md` |
| New frontend page | `src/app/<route>/page.tsx` |
| New frontend API route | `src/app/api/<route>/route.ts` |
| New React component | `src/components/<category>/<name>.tsx` |
| New backend router | `backend/app/routers/<name>.py` |
| New backend service | `backend/app/services/<name>/` |
| New backend model | `backend/app/models/<name>.py` |
| DB migration | `backend/alembic/versions/<rev>_<description>.py` |
| Backend test | `backend/tests/<module>/test_<name>.py` |
| E2E test | `e2e/<feature>.spec.ts` |
| GitHub cron workflow | `.github/workflows/cron-<name>.yml` |
| Static data | `src/data/<name>.ts` or `public/data/` |
