# Research — Camilo Martinez Portfolio

**Last updated:** 2026-02

---

## 1. RAG Pipeline Architecture

### v2 Implementation (Current)
- **Retrieval:** pgvector HNSW index for vector similarity
- **Validation:** Dual-LLM reviewer system (second model validates first model's response)
- **Performance:** 60% failure rate reduction from v1, p95 latency = 1.6s
- **Next:** Hybrid retrieval (keyword + vector) planned for Q4

### Embedding Strategy
- OpenAI text-embedding-ada-002 for document embeddings
- pgvector extension in Vercel Postgres
- HNSW index for approximate nearest neighbor search
- Chunk size: optimized for Q&A style retrieval

### AI Chatbot
- Streaming responses via OpenAI-compatible chat completions
- Provider resolution: legacy proxy first, Groq defaulting to `llama-3.3-70b-versatile`, OpenAI fallback defaulting to `gpt-4.1-mini`
- Feedback collection per conversation
- Automated evaluation pipeline (synthetic questions → judgment)
- 92% precision on automated evaluation benchmark

## 2. Fitness Data Engineering

### WHOOP Integration
- OAuth 2.0 authentication with automatic token refresh
- Daily data pull via cron job (recovery, strain, sleep, HRV)
- Historical backfill capability
- Data stored in Vercel Postgres with materialized views

### Strava Integration
- OAuth flow (authorize → callback) via Next.js API routes
- Two sync modes:
  - `strava-monday-sync`: weekly activity sync
  - `strava-weekly-sync`: full weekly sync with GPS data
- GPS track data → Astoria Conquest map (street coverage calculation)

### Data Pipeline Architecture
```
WHOOP API ──→ daily-data-fetch (cron) ──→ Vercel Postgres
                                              │
                                         Materialized Views
                                              │
                                         Dashboard Components
                                              
Strava API ──→ strava-*-sync (cron) ──→ Vercel Postgres
                                              │
                                         Astoria Conquest
                                         (GPS → street coverage)
```

### Cron Jobs (6 Scheduled)
| Job | Frequency | Purpose |
|-----|-----------|---------|
| daily-data-fetch | Daily | WHOOP data pull |
| strava-monday-sync | Weekly (Mon) | Strava activity sync |
| strava-weekly-sync | Weekly | Full weekly sync |
| astoria-update | Daily | Recompute street coverage |
| refresh-views | Daily | Materialize database views |
| evaluate-chats | Daily | Score chatbot conversations |

## 3. Frontend Architecture

### Next.js 14 App Router
- Server Components by default (only `"use client"` when interactivity requires it)
- Route groups: `(main)/` for public-facing, `api/` for backend routes
- MDX blog posts
- Dynamic routes: WHOOP app (auth-gated), Astoria Conquest (Strava data)

### Key Components
- **Liquid nav** — animated navigation bar
- **Liquid background** — particle animation background
- **WHOOP dashboard** — interactive fitness analytics with charts
- **Astoria Conquest** — Strava GPS data → neighborhood street coverage map
- **AI Chatbot** — streaming conversational interface on About page

### Tech Stack
- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS
- NextAuth for authentication
- Vercel deployment (frontend)
- Render deployment (backend)

## 4. Backend Architecture

### FastAPI (Python)
- 19 Alembic migration revisions
- SQLAlchemy ORM models (WHOOP, Strava, AI)
- Services: Strava sync, token refresh
- Middleware: rate limiting, structured logging
- Deployed on Render (port 8000)

### Database Schema
- WHOOP tables: recovery, strain, sleep, HRV metrics
- Strava tables: activities, GPS tracks, weekly summaries
- AI tables: chat conversations, feedback, evaluations
- Materialized views for dashboard performance

## 5. AI Evaluation System

### Automated Evaluation Loop
1. **Trainer agent** generates synthetic questions about the portfolio
2. **Chatbot** generates responses using RAG pipeline
3. **Judge agent** evaluates response quality (accuracy, relevance, completeness)
4. Results logged to evaluation dashboard

### Metrics
- 92% precision on evaluation benchmark
- Continuous monitoring via scheduled cron job
- Monthly human-in-the-loop review planned

## 6. Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Frontend framework | Next.js 14 App Router | Server Components, streaming, Vercel native |
| Database | Vercel Postgres (pgvector) | Managed, vector support, Vercel-native |
| Backend | FastAPI on Render | Python data processing, separate scaling |
| Auth | NextAuth | Session management, multi-provider |
| AI chat | OpenAI-compatible provider chain | Preserves proxy deployments, prefers Groq Llama for chat, keeps OpenAI fallback |
| Deployment | Vercel + Render | Frontend/backend separation, managed infra |

## 7. Project History Milestones

| Date | Event | Outcome |
|------|-------|---------|
| 2025-07 | Fitness Analytics Dashboard Launch | WHOOP/Strava dashboards + AI assistant |
| 2025-08 | RAG Pipeline v2 | 60% failure reduction, 1.6s p95 latency |
| 2025-09 | AI Evaluation Loop Launch | 92% precision, automated quality monitoring |
| 2025-10 | Documentation Architecture Revamp | Enterprise-grade docs, embedding manifest |
