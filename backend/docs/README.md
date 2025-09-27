<!-- backend/docs/README.md -->
# Backend Knowledge Base

Central index for the Python FastAPI backend after migrating the Next.js serverless APIs. Use this guide to find every major service, router, migration, and automation script that powers the AI-driven fitness platform.

## 📡 API Routers (FastAPI)

- **AI Services** (`backend/app/routers/ai.py`)
  - `POST /api/ai/chat/completion` – Primary chat completions.
  - `POST /api/ai/chat/query` – AI query engine with rate limiting & RAG.
  - `GET  /api/ai/chat/history` – Historical query lookup.
  - `POST /api/ai/trainer/evaluate` – Evaluation/e2e trainer cycles.
  - `GET  /api/ai/trainer/history` – Trainer history overview.
  - Embedding utilities under `/api/ai/embeddings/*`.
- **System Operations** (`backend/app/routers/system.py`)
  - Health/status checks, rate-limit debugging, bypass token creation.
- **Integrations** (`backend/app/routers/integrations.py`)
  - Phase 6/7 placeholders for Strava & WHOOP webhooks, sync, OAuth.
- **Analytics** (`backend/app/routers/analytics.py`)
  - Phase 8 placeholders for correlation and performance dashboards.

## 🧠 Core Services (`backend/app/services`)

- **AI Engine** (`backend/app/services/ai/`)
  - `openai_client.py` – OpenAI client, error handling, retry logic.
  - `query_processor.py` – Context aggregation & RAG orchestration.
  - `rag_service.py` – Vector similarity search helpers.
  - `trainer_service.py` – AI trainer automation workflows.
- **Rate Limiting** (`backend/app/services/rate_limiting/`)
  - `service.py` – Redis-backed limit enforcement (Phase 3).
- **Utilities & Middleware**
  - Logging, rate limiting middleware, request helpers under `backend/app/middleware/` and `backend/app/utils/`.

## 🗄️ Database Layer

- **SQLAlchemy Models** (`backend/app/models/`)
  - `user.py`, `strava.py`, `whoop.py`, `ai_query.py`, `rate_limiting.py` mirror the existing Neon schema.
- **Configuration** (`backend/app/config/`)
  - `settings.py` – Pydantic settings for env vars.
  - `database.py` – Async SQLAlchemy engine/session.
  - `redis.py` – Redis connection helpers.
- **Alembic** (`backend/alembic/`)
  - Migration environment (`env.py`), templates, and upgrade scripts.

## 🔁 Planned Migration Phases

Documented in `backend/docs/IMPLEMENTATION_LOG.md` with per-phase status for rate limiting, Strava/WHOOP integrations, analytics dashboards, and automation services.

## 📚 Documentation Index (current canonical docs)

- `AI_QUERY_ENGINE.md` – Current RAG + Text-to-SQL system architecture, prompts, and guardrails.
- `AI_TRAINER_AGENT.md` – Automated evaluation pipeline, including the `run-evaluation-cycle.ts` workflow.
- `CAMILO_AI_EXPERT_QA.md` – Long-form knowledge base used for embedding seeding and portfolio content.
- `IMPLEMENTATION_LOG.md` – Phase-by-phase migration log covering FastAPI backend bring-up and system hardening.
- `chat_ai/database-schema-documentation.md` – Daily snapshot + performance view column descriptions.
- `chat_ai/vector-embeddings-documentation.md` – pgvector strategy, index selection, and similarity tuning guidance.
- `chat_ai/embeddings-implementation-guide.md` – End-to-end instructions for maintaining the schema embedding flywheel.

Keep this README up to date whenever routes or services move so the frontend and backend stay in sync.
