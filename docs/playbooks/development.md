# Playbook: Development Setup — camilomartinez-portfolio

## Prerequisites

- Node.js 18+ + pnpm
- Python 3.11+ + uv (for backend)

## Full Stack

```bash
pnpm dev:all
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## Frontend Only

```bash
pnpm dev
```

## Backend Only

```bash
cd backend && uv run uvicorn app.main:app --reload --port 8000
```

## Tests

```bash
pnpm test:all       # frontend + backend
pnpm test:run       # frontend only
pnpm test:backend   # backend only
```

## Lint

```bash
pnpm lint
```

## Build

```bash
pnpm build
```

## Key Directories

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages |
| `src/components/` | React components |
| `src/lib/` | Auth, DB queries, API clients |
| `backend/app/` | FastAPI application |
| `backend/alembic/` | DB migrations (19 revisions) |

## Environment

Copy `.env.example` to `.env.local`. Required:
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`
- `DATABASE_URL` — Vercel Postgres
- `CRON_SECRET` — protects cron routes

**Critical:** Never put secrets in `NEXT_PUBLIC_*` vars — they end up in the client bundle.
