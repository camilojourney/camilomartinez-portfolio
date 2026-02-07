# 001 - Project Overview

## What the Portfolio Does

Camilo Martinez's portfolio is a **production-ready AI-driven fitness analytics platform** that transforms raw wearable data (WHOOP, Strava) into actionable insights. It serves dual purposes:
- **Public Showcase**: Demonstrates Camilo's full-stack AI engineering skills.
- **Live Product**: Functional analytics dashboard for personal fitness tracking with AI-powered recommendations.

**Core Value Proposition**:
- Ingests sleep, recovery, strain, and workout data.
- Generates visualizations, trends, and AI insights (e.g., optimal training windows).
- Includes geo-spatial analytics (e.g., Astoria walkability conquest).

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack support)
- **UI**: React 19, Tailwind CSS 3.4, shadcn/ui (class-variance-authority), Framer Motion 12
- **Charts/Maps**: Recharts 3, Leaflet + React-Leaflet 5, Turf.js 7 (geo operations)
- **State/Auth**: NextAuth v5 beta, Redux Toolkit 2.8
- **Other**: MDX for docs, OpenAI JS SDK, Vercel Postgres

### Backend
- **Framework**: FastAPI (uvicorn, Poetry/uv)
- **ORM/DB**: SQLAlchemy 2.0, PostgreSQL + pgvector (vector embeddings), asyncpg
- **Task Queue**: Celery 5.3, Redis 5
- **AI/ML**: OpenAI GPT-4, geopandas/osmnx (spatial), pandas/numpy
- **Security**: python-jose, passlib (bcrypt), fastapi-limiter
- **Integrations**: WHOOP/Strava OAuth, polyline decoding

### Deployment
- **Frontend**: Vercel
- **Backend**: Render (render.yaml)
- **DB**: Vercel Postgres / Neon Serverless

### AI Framework
- Custom `.ai/` system: Agents (builder/operator), standards (TS/Python), workflows (ship-feature).
- Embeddings/RAG for docs and schema.

## Architecture

**Monorepo Full-Stack**:
```
Frontend (Next.js) → API Calls → Backend (FastAPI)
                              ↓
                       PostgreSQL (pgvector)
                              ↓
                       Celery/Redis (async tasks)
```

- **62+ Next.js APIs migrated** to 5 FastAPI routers: `/api/ai`, `/integrations`, `/analytics`, `/system`, `/tools`.
- **Lifespan Events**: DB init/shutdown.
- **Middleware**: CORS, Rate Limiting (Redis), Logging, Process Timing.
- **Domain Boundaries**: AI analytics isolated; integrations firewalled.

**Data Flow**:
1. OAuth → Strava/WHOOP → ETL (polyline → geojson).
2. Store in Postgres (workouts, sleep, spatial).
3. Query → Turf.js (maps) / Recharts (trends).
4. AI Router → OpenAI + RAG (insights).

**Key Files**:
- `src/app/`: Pages (whoop-dashboard, ai-trainer).
- `backend/app/main.py`: App factory.
- `backend/app/routers/*`: Domain routers.
- `.ai/`: AI ops framework.

## Acceptance Criteria
- [ ] Runs locally: `pnpm dev:all`.
- [ ] Deploys to Vercel/Render.
- [ ] Integrates WHOOP/Strava (test tokens).
- [ ] AI endpoints respond with insights.
- [ ] Maps render Astoria data.
