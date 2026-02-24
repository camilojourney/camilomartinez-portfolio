# Architecture — camilomartinez-portfolio

> Guided tour of the actual codebase. WHY things are built, not just WHAT.
> **Last Updated:** 2026-02-24

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL (Frontend)                      │
│                                                               │
│   Next.js 14 App Router                                       │
│   ├── Portfolio pages (static)                                │
│   ├── WHOOP dashboard (dynamic, auth-gated)                   │
│   ├── Astoria Conquest map (Strava data)                      │
│   ├── AI Chatbot (OpenAI streaming)                           │
│   └── API routes (/api/*) — cron, auth, data proxy            │
│                      │                                        │
│              Vercel Postgres                                   │
│              (tokens + fitness data)                          │
└──────────────────────┬────────────────────────────────────────┘
                       │ HTTP (internal service calls)
┌──────────────────────▼────────────────────────────────────────┐
│                     RENDER (Backend)                           │
│                                                               │
│   FastAPI (Python) — port 8000                                │
│   ├── Alembic migrations (19 revisions)                       │
│   ├── SQLAlchemy models (WHOOP, Strava, AI)                   │
│   ├── Services: Strava sync, token refresh                    │
│   └── Middleware: rate limiting, logging                      │
└──────────────────────┬────────────────────────────────────────┘
                       │ OAuth + REST
        ┌──────────────┴──────────────┐
        │                             │
   WHOOP API                     Strava API
   (HRV, sleep,                  (runs, rides,
   recovery, strain)              GPS tracks)
```

---

## Frontend (`src/`)

### Pages (`src/app/`)

Next.js App Router. All public pages live under `src/app/(main)/`.

**Route groups:**
- `(main)/` — Public-facing portfolio site
  - `page.tsx` — Home page
  - `about/` — About page with AI chatbot
  - `apps/` — Live data apps index + individual app pages
    - `whoop-app/` — WHOOP fitness dashboard (auth-gated)
    - `astoria-conquest/` — Strava map challenge
    - `fitness-dashboard/` — Analytics charts
  - `projects/` — Portfolio project showcases
  - `blog/` — MDX blog posts
  - `live-data/` — Real-time fitness data view
  - `signin/` — NextAuth sign-in page
- `api/` — Next.js API routes (see below)
- `ai-trainer/` — AI self-improvement trainer (experimental)
- `whoop-dashboard/` — Alternative WHOOP dashboard view

**Key constraint:** Server Components by default. Only add `"use client"` when interactivity requires it (event handlers, browser APIs, hooks).

### API Routes (`src/app/api/`)

| Route group | Purpose |
|-------------|---------|
| `auth/[...nextauth]` | NextAuth session management |
| `auth/whoop/refresh` | WHOOP OAuth token refresh |
| `auth/strava/` | Strava OAuth flow (authorize → callback) |
| `strava/sync/` | Historical and weekly Strava sync triggers |
| `cron/` | 6 scheduled jobs called by Vercel Cron |
| `chat/` | AI chatbot (streaming, feedback, evaluation) |
| `astoria/` | Strava GPS data → map overlay computation |
| `actions/` | Manual data fetch triggers |
| `health/` | Health check endpoint |

**Cron jobs** (called by `.github/workflows/`):
- `daily-data-fetch` — WHOOP data pull
- `strava-monday-sync` — Weekly Strava activity sync
- `strava-weekly-sync` — Full weekly sync
- `astoria-update` — Recompute Astoria street coverage
- `refresh-views` — Materialize database views
- `evaluate-chats` — Score chatbot conversations

### Components (`src/components/`)

```
components/
├── common/        ← Generic atoms (Button)
├── ui/            ← Larger UI primitives (Card, TechFlowModal)
├── shared/        ← Layout components used across pages
│   ├── liquid-nav.tsx     — Navigation bar
│   ├── liquid-background.tsx
│   └── footer.tsx
├── features/      ← Feature-specific components
│   ├── whoop/     — WHOOP dashboard charts (Recharts)
│   ├── astoria-conquest/ — Map components (Leaflet)
│   ├── blog/      — MDX rendering
│   ├── auth/      — Auth buttons + provider
│   └── Chatbot.tsx / GlobalChatbot.tsx
└── projects/      — Project showcase cards
```

### Library (`src/lib/`)

```
lib/
├── auth.ts / auth-server.ts  ← NextAuth config + server helpers
├── db/
│   ├── db.ts                 ← Vercel Postgres connection
│   ├── whoop-database.ts     ← WHOOP data queries
│   ├── strava-database.ts    ← Strava data queries
│   ├── rate-limiting.ts      ← Per-user rate limits
│   └── query-history.ts      ← Chat query logging
├── services/
│   ├── strava-token-service.ts  ← Token storage/refresh
│   ├── strava-sync.ts           ← Activity ingestion
│   └── token-refresh-service.ts ← Generic refresh logic
├── security/route-auth.ts    ← Cron secret + session guards
└── [whoop-client, strava-client].ts ← API client wrappers
```

---

## Backend (`backend/`)

FastAPI Python service deployed on Render. Handles data that requires server-side computation or long-running DB queries that don't fit Next.js API route limits.

```
backend/app/
├── main.py           ← FastAPI app, middleware registration
├── config/
│   ├── database.py   ← SQLAlchemy engine + session
│   ├── settings.py   ← Pydantic settings (from env)
│   └── redis.py      ← Redis connection (rate limiting)
├── models/
│   ├── user.py       ← User + OAuth token tables
│   ├── strava.py     ← Strava activity tables
│   └── ai_query.py   ← AI trainer tables
└── middleware/
    ├── rate_limiting.py
    └── logging.py
```

**Alembic migrations** — 19 revisions in `backend/alembic/versions/`. Always run via `alembic upgrade head`. Never edit applied migrations.

---

## Data Flow

### WHOOP Data Pipeline

```
Vercel Cron (daily)
  → /api/cron/daily-data-fetch
    → WHOOP API (HRV, sleep, recovery, strain)
      → Vercel Postgres
        → /api/whoop/data (read endpoint)
          → WHOOP Dashboard components (Recharts)
```

### Strava / Astoria Pipeline

```
Vercel Cron (weekly) OR manual trigger
  → /api/strava/sync/weekly
    → Strava API (activities with GPS)
      → Vercel Postgres (strava_runs table)
        → /api/astoria/covered-streets
          → AstoriaMap component (Leaflet)
```

### AI Chatbot

```
User message
  → /api/chat (streaming)
    → OpenAI API (GPT-4)
      → /api/chat/log (persist)
        → Vercel Cron: evaluate-chats (score quality)
```

---

## OAuth Token Lifecycle

**Critical path** — both WHOOP and Strava tokens expire and must refresh automatically.

| Service | TTL | Refresh trigger |
|---------|-----|-----------------|
| Strava | ~6 hours | `strava-token-service.ts` checks expiry before each API call |
| WHOOP | varies | `/api/auth/whoop/refresh` called by cron + on-demand |

**Storage:** Tokens stored in Vercel Postgres user table, never in `NEXT_PUBLIC_*` env vars or client bundle.

**Fail behavior:** If refresh fails, the dashboard shows a "reconnect" state — never serves stale data silently.

---

## Deployment

| Layer | Platform | Config file |
|-------|----------|-------------|
| Frontend | Vercel (git-based) | `vercel.json` |
| Backend | Render (Docker) | `render.yaml`, `backend/Dockerfile` |
| Database | Vercel Postgres | env var `DATABASE_URL` |
| Redis | Render managed | env var `REDIS_URL` |

**Frontend env vars** — see `.env.example`. The `NEXT_PUBLIC_` prefix is intentionally absent from all secrets.

---

## What NOT to Change Without Discussion

1. **Token refresh logic** — `src/lib/services/strava-token-service.ts` and `/api/auth/whoop/refresh`. Breakage means silent data gaps.
2. **Alembic migration chain** — Never edit applied migrations. Always add new revisions.
3. **`ALLOW_PUBLIC_DASHBOARD_DATA`** — Defaults to `false`. Health data is personal. Changing this exposes real fitness data publicly.
4. **Cron secret validation** — `src/lib/security/route-auth.ts` protects all cron routes. Removing it exposes endpoints to public triggering.
5. **`src/app/layout.tsx`** — Root layout wraps everything. Changes here affect all pages.
