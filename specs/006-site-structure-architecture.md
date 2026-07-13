# Camilo Martinez Portfolio - Site Structure & Architecture

## Overview
AI-driven fitness analytics platform with a **Next.js 15 (App Router) frontend** and **FastAPI Python backend**. Migrated from 62+ Next.js serverless functions to a centralized, scalable architecture. Supports static marketing pages, streaming AI interactions, and data-intensive dashboards.

**Tech Stack Summary**:
| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Recharts, React Leaflet |
| **Backend** | FastAPI, SQLAlchemy 2.0 (async), PostgreSQL + pgvector, Redis, Celery |
| **Integrations** | WHOOP, Strava (OAuth), OpenAI-compatible chat provider + RAG |
| **Deployment** | Vercel (frontend), Render/Docker (backend) |

## Directory Structure
```
camilomartinez-portfolio/
├── src/                    # Next.js App Router source
│   ├── app/                # Route groups: (marketing), (analytics), (ai)
│   │   ├── (marketing)/    # SSG pages: /, /projects, /blog (MDX)
│   │   ├── (analytics)/    # SSR dashboards: /whoop-dashboard, /strava
│   │   └── layout.tsx      # Root layout (providers, fonts)
│   ├── components/         # UI: ui/ (shadcn), charts/, features/
│   ├── lib/                # api/ clients, utils/, validations/ (Zod)
│   └── types/              # Domain interfaces
├── backend/                # FastAPI app
│   ├── app/
│   │   ├── routers/        # ai.py, analytics.py, integrations.py, etc.
│   │   ├── services/       # AI RAG, data ingestion
│   │   ├── models/         # Pydantic + SQLAlchemy
│   │   └── main.py         # App factory + middleware (CORS, rate-limit)
│   ├── alembic/            # DB migrations
│   └── tests/              # pytest suite
├── docs/                   # Comprehensive docs hub
├── .ai/                    # AI agent framework (agents, standards, workflows)
└── specs/                  # Feature specifications
```

## Data Flow
```
Frontend (Server Components) → Server Actions → Backend API (/api/ai, /api/analytics)
                          ↓
PostgreSQL (pgvector) ←→ Redis (cache/rate-limit) ←→ External APIs (WHOOP/Strava)
                          ↓
AI Services (provider chain + RAG) → Structured Insights → Streaming UI (Suspense)
```

## Rendering Strategies
| Route | Rendering | Caching |
|-------|-----------|---------|
| `/` (home) | SSG/ISR | Edge cache |
| `/analytics/*` | SSR | Stale-while-revalidate |
| `/ai/chat` | Streaming Server Components | No cache (fresh AI) |

## Backend Routers
| Prefix | Tags | Key Endpoints |
|--------|------|---------------|
| `/api/ai` | AI & Analytics | `/query`, `/trainer/run-cycle` |
| `/api/analytics` | Data Analytics | Workout/sleep summaries |
| `/api/integrations` | External | `/strava/sync`, `/whoop/collect` |
| `/api/system` | Operations | `/health`, `/debug/rate-limit` |

**Middleware Stack**: CORS → TrustedHost → RateLimit (Redis, 5/day) → Logging → Timing.

## Security & Observability
- **Rate Limiting**: Redis IP/user-based (5 queries/day, bypass tokens).
- **Auth**: Next-Auth (frontend), JWT/OAuth2 (backend).
- **Monitoring**: Vercel Analytics, FastAPI metrics (`/docs`), structured logs.

*Generated: 2026-02-07*
