# AGENTS.md - camilomartinez-portfolio

## Project Overview

**Purpose:** AI-driven fitness analytics platform with Next.js frontend and FastAPI backend. Delivers production-grade analytics turning wearable data (WHOOP, Strava) into actionable fitness insights: workout/sleep analytics, AI-assisted insights.

**Status:** MVP (0-8 weeks: Stabilize core data ingestion, analytics views, backend reliability; V1.5 8-16w; V2 16+w)

**Port:** Frontend ~3000 (Next.js dev); Backend (FastAPI, TBD)

## Tech Stack

| Layer          | Technology                  |
|----------------|-----------------------------|
| Language       | TypeScript + Python         |
| Framework      | Next.js + FastAPI           |
| Database       | PostgreSQL/SQLite           |
| Key Libraries  | Tailwind CSS; uv (Python deps); Integrations: WHOOP, Strava |
| Deployment     | Render, Vercel              |

## Roles

Adopt based on task. Standard roles + project AI agents from `.ai/agents/`.

### Frontend Developer
- Next.js UI/pages/components (`src/components/`, `src/lib/`)
- State management, styling (Tailwind), responsiveness
- Client-side integrations

### Backend Developer
- FastAPI endpoints/business logic (`backend/`)
- Wearable data ingestion (WHOOP/Strava), analytics (workout/sleep)
- Error handling, validation

### DBA (Database Administrator)
- Schema/migrations (PostgreSQL/SQLite)
- Query optimization, data integrity for fitness data

### DevOps
- Deployment configs (Render/Vercel, `render.yaml`)
- CI/CD (`.github/`), Python deps (`uv sync`)

### Builder (AI Agent)
- Technical builds: `.ai/agents/builder.md`

### Operator (AI Agent)
- Runtime ops: `.ai/agents/operator.md`

### Communicator (AI Agent)
- Human comms: `.ai/agents/communicator.md`

### Strategist (AI Agent)
- Decisions: `.ai/agents/strategist.md`

## File Structure

```
camilomartinez-portfolio/
├── src/                    # Next.js frontend
│   ├── components/         # Reusable UI
│   └── lib/                # Utilities
├── backend/                # FastAPI backend
│   └── tests/              # Backend tests
├── .ai/                    # AI system: agents/, standards/, workflows/, contexts/, templates/
├── docs/                   # Playbooks (human-facing), docs
│   └── playbooks/          # Workflow guides
├── specs/                  # Feature specs (mvp-foundation.md)
├── .github/                # Workflows
├── docs/project-overrides/ # Pre-merge overrides (AGENTS.premerge.md)
├── package.json            # Node deps/scripts
└── render.yaml             # Deployment
```

**Two Parallel Systems:**
- **Playbooks** (`docs/playbooks/`): Human-guided AI workflows
- **.ai/**: Autonomous AI operation

**Standards:** `.ai/standards/` (code/typescript.md, nextjs.md, testing.md, api/, security/, comms/)

**Workflows:** `.ai/workflows/` (ship-feature.md, investigate-bug.md, etc.)

**Contexts:** `.ai/contexts/` (product-context.md, current-priorities.md, camilomartinez-portfolio.md)

## Conventions

### Git Commits
- Format: `type: description`
- Types: feat, fix, docs, refactor, test, chore
- Example: `feat: add WHOOP data ingestion`
- Always: `pnpm exec next lint`; align docs/specs/code

### Code Style
- TypeScript/Python: Strict mode (see `.ai/standards/code/`)
- Linting: `pnpm exec next lint` (auto-fix)
- Testing: Write for business logic (`pnpm test:db-schema`)
- Docs: JSDoc/exported functions
- `.ai/standards/` authoritative

### Branch Strategy
- `main`: Production-ready
- `feature/*`: New features
- `fix/*`: Bugs

**Core Rules:**
- **Always:** Type strict, tests, lint, docs aligned, no secrets
- **Ask First:** New deps, DB changes, auth, arch, prod creds
- **Never:** Disable types, skip errors/auth/audit
- **Escalate:** >1d work, breaking changes, sec>med, low conf (`.ai/decision-boundaries.md`)

## Entry Points

| What            | Where                          |
|-----------------|--------------------------------|
| Frontend App    | `src/` (Next.js `app/` router) |
| Backend Server  | `backend/main.py` (FastAPI)    |
| API Routes      | `backend/`                     |
| Database Schema | `backend/` (migrations/SQL)    |
| Config          | `.env`, `package.json`, `render.yaml` |
| Tests           | `backend/tests/`, `pnpm test:db-schema` |
| AI Contexts     | `.ai/contexts/`                |

## Dependencies

**External APIs:** WHOOP, Strava
**Services:** Render, Vercel
**Internal:** None (self-contained)
**Overrides:** `docs/project-overrides/AGENTS.premerge.md`

## Getting Started

```bash
# Install dependencies
pnpm install && cd backend && uv sync

# Run dev server (both frontend/backend)
pnpm dev:all

# Production build
pnpm build

# Lint & fix
pnpm exec next lint

# Tests
pnpm test:db-schema
```

*See README.md, WARP.md, ARCHITECTURE.md, CLAUDE.md for more. Keep updated as project evolves.*
