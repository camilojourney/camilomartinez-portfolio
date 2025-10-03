# ⚙️ Backend Architecture Guide

> **Status:** Authoritative · **Scope:** FastAPI Service Mesh · **Last Updated:** October 2, 2025  
> **Owner:** Backend Guild (Camilo Martinez) · **Reviewer:** AI Assistant

---

## TL;DR
- The backend is an async FastAPI service that orchestrates AI reasoning, data ingestion, analytics, and integrations with strict observability and safety guarantees.
- Architecture follows Clean Architecture principles: routers → services → repositories → infrastructure.
- Use this guide to understand module layout, lifecycle hooks, config, and quality gates for elite backend craftsmanship.

---

## Table of Contents
- [🏛️ System Overview](#️-system-overview)
- [📁 Project Structure](#-project-structure)
- [🚦 Request Lifecycle](#-request-lifecycle)
- [🧱 Layered Responsibilities](#-layered-responsibilities)
- [🔐 Cross-Cutting Concerns](#-cross-cutting-concerns)
- [✅ Quality Gates](#-quality-gates)
- [🔗 References](#-references)

---

## 🏛️ System Overview

| Concern | Detail |
|---------|--------|
| **Framework** | FastAPI (ASGI) with async-first design |
| **Runtime** | Python 3.11, Uvicorn workers (gunicorn optional) |
| **Storage** | PostgreSQL 15 + pgvector, Redis 7 |
| **Integrations** | WHOOP, Strava, OpenAI |
| **AI Services** | RAG pipeline, trainer agent, evaluation harness |
| **Configuration** | Pydantic Settings (`Settings` class) |
| **Testing** | Pytest, pytest-asyncio, respx for HTTP mocks |

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                # FastAPI factory + lifespan events
│   ├── config/                # Environment configuration
│   │   ├── settings.py
│   │   ├── database.py        # SQLAlchemy async engine/session
│   │   └── redis.py           # Redis client factory
│   ├── routers/               # API endpoints (presentation layer)
│   │   ├── ai.py
│   │   ├── analytics.py
│   │   ├── integrations.py
│   │   ├── auth.py
│   │   └── system.py
│   ├── services/              # Business logic / orchestration
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── data_sync/
│   │   └── security/
│   ├── repositories/          # Persistence abstraction (SQLAlchemy)
│   ├── models/                # ORM models (SQLAlchemy)
│   ├── schemas/               # Pydantic models (request/response)
│   ├── workers/               # Background jobs (APScheduler / Celery)
│   ├── dependencies/          # FastAPI dependency injection providers
│   ├── middleware/            # Logging, auth, rate limiting
│   └── utils/                 # Shared helpers (encryption, time, etc.)
├── alembic/                   # Database migrations (versions, env)
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── scripts/                   # CLI utilities (embedding refresh, trainer)
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
└── poetry.lock
```

---

## 🚦 Request Lifecycle

1. **Ingress** – Uvicorn worker receives HTTP request.
2. **Middleware** – Logging (structured), request ID, CORS, rate limiting, authentication.
3. **Router** – Path operation maps to handler (async def) with Pydantic schemas.
4. **Dependency Injection** – Provides database sessions, authenticated user, service instances.
5. **Service Layer** – Executes business logic, orchestrates calls to repositories/integrations/AI.
6. **Repositories** – Interact with PostgreSQL via SQLAlchemy AsyncSession.
7. **Response** – Returns Pydantic response models with proper status codes.
8. **Telemetry** – Structured logs + metrics instrumentation (OpenTelemetry).

```python
@router.post("/query", response_model=AIResponse)
async def run_query(payload: QueryRequest, service: AIQueryService = Depends(get_ai_service)):
    result = await service.execute(payload)
    return result
```

---

## 🧱 Layered Responsibilities

### Routers (`app/routers`)
- No business logic—only validation, dependency wiring, response mapping.
- Grouped by domain (ai, analytics, integrations, system, auth).
- OpenAPI tags align with documentation.

### Services (`app/services`)
- Orchestrate multi-step workflows (AI pipeline, data sync, analytics computations).
- Manage transactions using Unit of Work pattern when necessary (context manager).
- Provide idempotent methods for background jobs.

### Repositories (`app/repositories`)
- Encapsulate SQLAlchemy queries.
- Return domain models or DTOs—not raw ORM objects.
- Dedicated repository per aggregate root (WhoopDataRepository, QueryHistoryRepository).

### Workers (`app/workers`)
- APScheduler tasks for cron-style jobs (`sync_whoop_data`, `refresh_embeddings`).
- Optional Celery integration for distributed job processing.

---

## 🔐 Cross-Cutting Concerns

### Configuration
- Pydantic `Settings` reads from env vars `.env` + OS environment.
- Hierarchical config: base settings → environment-specific overrides.

### Security
- OAuth flows managed through `integrations` services.
- JWT-based session for first-party clients.
- Role-based access control (RBAC) scaffolding ready (enum roles in user model).

### Observability
- Structured logging via `structlog` + context (request_id, user_id).
- Prometheus metrics exporter (`/metrics` optional endpoint).
- Traces via OpenTelemetry instrumentation (collector optional).

### Error Handling
- Custom exception handlers for integrations, AI errors, validation issues.
- Global fallback returns standardized error envelope with correlation ID.

---

## ✅ Quality Gates

| Stage | Command | Notes |
|-------|---------|-------|
| **Lint** | `poetry run ruff check` | Enforce style + bugbear rules |
| **Format** | `poetry run ruff format` | Auto-format code |
| **Type Check** | `poetry run mypy app` | Optional but recommended |
| **Unit Tests** | `poetry run pytest tests/unit` | Fast feedback |
| **Integration Tests** | `poetry run pytest tests/integration` | Spins up db fixture |
| **Coverage** | `poetry run pytest --cov=app --cov-report=xml` | Target ≥ 80% |
| **Contracts** | `poetry run python scripts/openapi_snapshot.py` | Detects API drift |

CI enforces lint + tests via `.github/workflows/backend.yml`.

---

## 🔗 References
- `docs/backend/API_REFERENCE.md` – Endpoint catalog and payload schemas.
- `docs/backend/SERVICES.md` – Service layer contracts and orchestration details.
- `docs/backend/DEPLOYMENT.md` – Railway deployment procedures.
- `docs/data/SCHEMA.md` – Database tables and relationships.
- `docs/ai/RAG_SYSTEM.md` – AI pipeline invoked by backend services.

---

*Last Updated: October 2, 2025*
