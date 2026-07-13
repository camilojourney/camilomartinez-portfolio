# Playbook: Development Setup — camilomartinez-portfolio

## Prerequisites

- Node.js 18+ + pnpm
- Python 3.11+ + uv (for backend)

## Full Stack

```bash
pnpm dev:all
# Frontend: http://localhost:3005
# Backend: http://localhost:8005
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
just test-e2e       # Playwright, starts frontend on http://localhost:3005
```

Playwright uses `http://localhost:3005` by default. Set `PORT` to launch the
frontend web server on a different local port, or `PLAYWRIGHT_BASE_URL` to point
the tests at a specific base URL.

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
- For local chatbot testing, configure one chat provider key:
  `AI_PROXY_API_KEY` (highest precedence), `GROQ_API_KEY`, or `OPENAI_API_KEY`.
  Groq defaults to `llama-3.3-70b-versatile`; OpenAI defaults to `gpt-4.1-mini`.

**Critical:** Never put secrets in `NEXT_PUBLIC_*` vars — they end up in the client bundle.
