# 🛠️ Technology Stack & Decisions

> **Status:** Canonical · **Revision:** 2025.10 · **Last Updated:** October 2, 2025  
> **Owner:** Architecture Guild · **Contributors:** Camilo Martinez, AI Assistant

---

## TL;DR
- The stack is deliberately opinionated: TypeScript + Next.js for experience, Python + FastAPI for orchestration, PostgreSQL + pgvector for data/AI alignment, Vercel/Railway for velocity.
- Every selection is benchmarked against alternatives with emphasis on AI-readiness, maintainability, and low operational burden.
- Upgrade cadences, failure modes, and contingency plans are documented here to keep the system enterprise-grade as it scales.

---

## Table of Contents
- [🎯 Guiding Principles](#-guiding-principles)
- [📦 Stack Overview](#-stack-overview)
- [🎨 Experience Layer (Frontend)](#-experience-layer-frontend)
- [⚙️ Orchestration Layer (Backend)](#️-orchestration-layer-backend)
- [📊 Data & Persistence](#-data--persistence)
- [🤖 AI Platform](#-ai-platform)
- [🛠️ Developer Productivity](#-developer-productivity)
- [☁️ Deployment & Infrastructure](#️-deployment--infrastructure)
- [⚠️ Risks & Mitigations](#️-risks--mitigations)
- [📆 Upgrade Playbook](#-upgrade-playbook)
- [🔗 References](#-references)

---

## 🎯 Guiding Principles
1. **AI-First**: Prefer ecosystems with native support for embeddings, LLM tooling, and async workflows.
2. **Velocity with Discipline**: Select managed services that minimize ops toil without sacrificing observability.
3. **Progressive Disclosure**: Start simple, evolve to micro components only when justified by load or complexity.
4. **Polyglot Sympathy**: Embrace TypeScript + Python pairing; optimize interop via well-defined contracts.
5. **Future-Proofing**: Track LTS support windows, deprecation schedules, and community health.

---

## 📦 Stack Overview

| Layer | Primary Tech | Version | Rationale | Key Docs |
|-------|--------------|---------|-----------|----------|
| Experience | Next.js 15 (App Router), React 19, TypeScript 5 | Latest LTS | Server Components, ISR, strong DX | `docs/frontend/README.md` |
| Orchestration | FastAPI, Pydantic v2, SQLAlchemy 2 | Python 3.11 | Async performance, OpenAPI autogen, type safety | `docs/backend/README.md` |
| Data | PostgreSQL 15, pgvector 0.5, Redis 7 | Managed | Relational integrity + vector search | `docs/data/SCHEMA.md` |
| AI | OpenAI GPT-4o, text-embedding-3-small | API | Best-in-class reasoning + cost-effective embeddings | `docs/ai/README.md` |
| Dev Tooling | pnpm, Poetry, Ruff, Vitest, Pytest | - | Fast installs, consistent linting/testing | `docs/GETTING_STARTED.md` |
| Ops | Vercel, Railway, Docker, Prometheus/Grafana | - | Managed deploys + optional self-hosted observability | `docs/operations/README.md` |

---

## 🎨 Experience Layer (Frontend)

### Next.js 15 + React 19
- **Why**: App Router gives granular data fetching, Server Actions, and RSC streaming → ideal for AI responses needing partial hydration.
- **Patterns**: Colocation of `page.tsx` + `loading.tsx`; `src/app/(ai)/chat` uses Suspense to stream AI answers.
- **Performance**: Static generation for marketing pages; incremental static regeneration (ISR) for blogs; dynamic SSR for dashboards.

### TypeScript & State Management
- **Type Safety**: Strict mode, project references, `ts-reset` to improve type ergonomics.
- **Data Fetching**: `@tanstack/react-query` for server state; `zustand` for client state microstores.
- **Styling**: Tailwind CSS with design tokens; `clsx` helpers; `@tailwindcss/typography` for docs surfaces.

### Alternatives Reviewed
| Alternative | Verdict | Reason |
|-------------|---------|--------|
| Remix | Deferred | Excellent for data loading but weaker ISR story |
| SvelteKit | Deferred | Compelling performance but smaller AI tooling ecosystem |
| Astro | Niche | Static-first, not ideal for RAG UI interactivity |

---

## ⚙️ Orchestration Layer (Backend)

### FastAPI + Pydantic v2
- Async-first, type-driven; auto OpenAPI docs for frictionless contract testing.
- Validation layer ensures AI inputs are sanitized before touching the database.

### SQLAlchemy 2 + Alembic
- **Declarative models** with type hints; adopt 2.x Core for complex queries.
- Migration discipline: `poetry run alembic revision --autogenerate` with manual review, documented in `docs/data/SCHEMA.md`.

### Async Toolkit
- `httpx` for external API calls (WHOOP/Strava/OpenAI) with retry middleware.
- `redis.asyncio` for caching, rate limiting, and background job coordination.
- `APScheduler` for cron-equivalent scheduling; future migration to Celery/Arq once load dictates.

### Alternatives Reviewed
| Alternative | Verdict | Reason |
|-------------|---------|--------|
| Django REST Framework | Rejected | Sync by default, heavier ORM, less AI-friendly |
| Express.js (Node) | Rejected | Weak typing vs FastAPI + Python AI ecosystem |
| Go + Fiber | Future Consideration | Great performance but higher curve for AI libs |

---

## 📊 Data & Persistence

### PostgreSQL + pgvector
- **Strengths**: ACID, JSONB for semi-structured data, built-in vector search.
- **Schema Philosophy**: Third-normal form for ingestion; curated views for AI/analytics.
- **Extensions**: `pg_stat_statements`, `pg_cron`, `pg_partman` (future partitioning).

### Redis 7
- Caches AI responses, stores rate-limit counters, holds ephemeral chat sessions.
- TTL-based caching to protect against OpenAI quota exhaustion.

### Data Tooling
- Alembic migrations tracked in repo.
- Planned `dbt` project for analytics modelling; placeholder in `docs/data/ANALYTICS.md`.
- Great Expectations (future) for data quality—spec, metrics, thresholds in `docs/data/DATA_QUALITY.md`.

---

## 🤖 AI Platform

### Model Portfolio
| Capability | Primary | Fallback | Notes |
|------------|---------|----------|-------|
| Reasoning | GPT-4o | GPT-4o-mini / Claude 3.5 (future) | Multi-provider abstraction planned |
| Embeddings | text-embedding-3-small | text-embedding-3-large (high fidelity) | Cost-effective default |
| Classification | Fine-grained zero-shot | In-house logistic regression (planned) | For guardrails |

### Architecture Components
- **Embedding Service**: `backend/app/services/ai/schema_embedding_service.py` orchestrates ingestion from `docs/ai/EMBEDDINGS.md` manifest.
- **Prompt Registry**: Markdown-first in `docs/ai/PROMPTS.md` with YAML frontmatter for evaluations.
- **Evaluation Harness**: Synthetic telemetry defined in `docs/ai/EVALUATION.md`; pipelines executed via `poetry run python app/jobs/run_trainer_cycle.py`.

### Safety & Compliance
- Prompt hardening with strict system messages.
- SQL validator (regex + AST) disallows DDL/DML.
- Rate limiter and cost tracker preventing runaway spend (`ai_usage` table).

---

## 🛠️ Developer Productivity

- **Package Managers**: `pnpm` for Node (workspaces support), `poetry` for Python (PEP 517).
- **Linting**: ESLint (frontend), Biome (optional), Ruff (backend) for ultra-fast linting.
- **Formatter**: Prettier (frontend), Ruff formatter / Black (backend).
- **Testing**: Vitest + Testing Library; Pytest with async fixtures; `pytest-recording` for HTTP mocks.
- **Docs Tooling**: `scripts/docs/validateStructure.ts` ensures metadata integrity; Mermaid diagrams compiled via CLI.

---

## ☁️ Deployment & Infrastructure

| Component | Provider | Deployment Model | Notes |
|-----------|----------|------------------|-------|
| Frontend | Vercel | Git-based deployments, preview branches | Supports ISR, Edge Functions |
| Backend | Railway | Container deploy from Dockerfile | Secrets managed via Railway UI |
| Database | Railway PostgreSQL | Managed | Backups, pgvector support |
| Redis | Railway / Upstash | Managed | Multi-region optional |
| Observability | Docker Compose (local) / Grafana Cloud (prod) | Optional | Config in `docker-compose.observability.yml` |
| CI/CD | GitHub Actions | Workflows per domain | Templates in `.github/workflows` |

Deployment playbooks are codified in `docs/operations/DEPLOYMENT.md` (to be created) and `docs/operations/RUNBOOKS.md`.

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation | Owner |
|------|--------|-----------|-------|
| OpenAI dependency outage | AI features degraded | Multi-provider abstraction, cached answers | AI Platform Lead |
| pgvector bloat | Slow embeddings queries | Scheduled `VACUUM`, dimension monitoring | Data Engineer |
| OAuth credential rotation | Integration downtime | Automated refresh scripts, secret manager | Integrations Lead |
| FastAPI release regressions | API instability | Pin versions, canary environment, contract tests | Backend Lead |
| Next.js major updates | Frontend breakage | LTS tracking, upgrade branches, unit/integration tests | Frontend Lead |

---

## 📆 Upgrade Playbook

1. **Monitor** official release notes (Next.js, FastAPI, PostgreSQL, OpenAI) weekly.
2. **Assess** impact using `docs/TECH_STACK.md` checklist (compatibility, security, tooling).
3. **Prototype** upgrade in feature branch; run `scripts/ci/full_suite.sh` locally.
4. **Document** findings in `docs/knowledge/PROJECT_HISTORY.md` (Decision Log format).
5. **Rollout** via staged deployments (preview → staging → production) with monitoring hooks.

Upgrade calendar is tracked in `PROJECT_ARCHITECTURE_PLAN.md` (Quarterly planning section).

---

## 🔗 References
- `docs/ARCHITECTURE.md` – Architectural drivers influencing these choices.
- `docs/frontend/STATE_MANAGEMENT.md` – Detailed client-state strategies.
- `docs/backend/SERVICES.md` – Service contracts, dependency graph.
- `docs/data/ETL_PROCESSES.md` – Data ingestion tooling.
- `docs/ai/PROMPTS.md` – Prompt catalog linked to model releases.

---

*Last Updated: October 2, 2025*
