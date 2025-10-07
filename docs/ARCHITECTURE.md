# 🏗️ System Architecture Overview

> **Status:** Authoritative · **Revision:** 2025.10 · **Last Updated:** October 2, 2025  
> **Owner:** Camilo Martinez (Chief Architect) · **Reviewer:** AI Assistant (Codex)

---

## TL;DR
- The portfolio is a polyglot, event-aware platform that fuses a Next.js experience layer, a FastAPI service mesh, and an AI cognition layer backed by pgvector.
- Domain boundaries are explicit—frontend (experience), backend (orchestration), AI (reasoning), data (truth), integrations (ingestion), operations (resilience).
- Quality attributes (latency, availability, explainability, safety) are enforced through layered defenses: zero-trust APIs, deterministic embeddings, observability-first design, and AI evaluation loops.

---

## Table of Contents
- [🎯 Architectural Intent](#-architectural-intent)
- [🌐 Context & Personas](#-context--personas)
- [🗺️ System Topology](#️-system-topology)
- [🏢 Domain Boundaries](#-domain-boundaries)
- [📊 Data Architecture](#-data-architecture)
- [🤖 AI Cognition Layer](#-ai-cognition-layer)
- [🛡️ Security & Compliance](#-security--compliance)
- [📈 Reliability & Observability](#-reliability--observability)
- [🚀 Evolution Roadmap](#-evolution-roadmap)
- [🔗 References](#-references)

---

## 🎯 Architectural Intent

### Mission
Deliver an AI-native personal analytics platform that proves elite engineering craft, enabling:
- **Self-serve insights** across fitness, productivity, and personal data streams.
- **AI copilots** that interpret context, execute safe SQL, and generate narrative reports.
- **Enterprise-grade posture** with traceability, observability, and security baked in.

### Non-Negotiable Quality Attributes
| Attribute | Target | Mechanisms |
|-----------|--------|------------|
| **Latency** | < 200 ms p95 for API reads | pgvector HNSW, async FastAPI, CDN caching |
| **Availability** | 99.9% | Health probes, graceful degradation, circuit breakers |
| **Explainability** | 100% AI responses w/ provenance | SQL + context echoing, evaluation logs |
| **Security** | Zero critical issues | OAuth scopes, parameterized SQL, secrets management |
| **Maintainability** | < 30 min onboarding | Modular docs, templates, automation |

---

## 🌐 Context & Personas

| Persona | Needs | Key Docs |
|---------|-------|----------|
| **AI Engineer** | Understand RAG, embeddings, evaluator loops | `docs/ai/*.md` |
| **Data Engineer** | ETL cadence, schema contract | `docs/data/*.md` |
| **Frontend Lead** | Experience architecture, design system | `docs/frontend/README.md` + `docs/frontend/COMPONENTS.md` |
| **Ops Engineer** | Deploy, monitor, recover | `docs/operations/*.md` |

Context diagram excerpt (C4 Level 1):
```
[User] → (Next.js App) → (FastAPI API) → (PostgreSQL + pgvector)
                          ↘ (OpenAI API)
                          ↘ (WHOOP / Strava APIs)
```

---

## 🗺️ System Topology

### Layered View
```
┌──────────────────────────────────────────────────────────────┐
│                         Experience Layer                     │
│  Next.js (App Router) • React Server Components • Tailwind    │
│  - Portfolio narratives                                      │
│  - Data storytelling dashboards                               │
│  - AI conversational UX                                      │
└──────────────────────────────────────────────────────────────┘
                 │ ISR / HTTP                                   
                 ▼                                              
┌──────────────────────────────────────────────────────────────┐
│                    Orchestration Layer (FastAPI)              │
│  - REST API (`/api/v1`)                                       │
│  - AI gateway (`/api/ai`) with guardrails                     │
│  - Integration managers (WHOOP, Strava, OpenAI)               │
└──────────────────────────────────────────────────────────────┘
                 │ async pg / redis
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                   Background Workers (Celery)                 │
│  - Data sync tasks (Strava, WHOOP)                            │
│  - ETL pipelines (activity correlation)                       │
│  - Database maintenance (view refreshes)                      │
│  - Map generation (Astoria Conquest)                          │
└──────────────────────────────────────────────────────────────┘
                 │ async pg / redis
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                        Data & AI Substrate                   │
│  PostgreSQL 15 + pgvector • Redis (Cache + Task Queue)        │
│  - Normalized core schema                                     │
│  - AI-serving materialized views                              │
│  - Embedding store + evaluation telemetry                     │
│  - Feature flag tables, audit log                             │
└──────────────────────────────────────────────────────────────┘
```

### Deployment Targets
- **Frontend**: Vercel (Edge + ISR) with preview deployments per PR.
- **Backend API**: Railway (containerized FastAPI) with blue/green strategy.
- **Workers**: Railway (Celery) with auto-scaling based on queue depth.
- **Data**: Managed PostgreSQL (Railway) + optional read replica; Redis Cloud instance.
- **AI Providers**: OpenAI (primary), optional Azure OpenAI failover.

### Architecture Pattern

**Classification**: **Hybrid Microservices** (Modular Monolith → Microservices transition)

- **Frontend**: Deployed separately (Vercel)
- **API**: Monolithic Python FastAPI application
- **Workers**: Separate Celery service (microservice-like)
- **Data Layer**: Shared PostgreSQL + Redis

See [ARCHITECTURE_PATTERNS.md](./ARCHITECTURE_PATTERNS.md) for comprehensive guide to architecture patterns and when to use each.

---

## 🏢 Domain Boundaries

| Domain | Responsibility | Owned Repos / Modules | Contracts |
|--------|----------------|-----------------------|-----------|
| **Experience** | UI/UX, storytelling, AI chat | `src/app`, `docs/frontend/*` | REST `/api/v1`, GraphQL (future) |
| **Orchestration** | API exposure, auth, coordination | `backend/app/routers`, `backend/app/services` | OpenAPI schema, job queues |
| **AI Cognition** | Retrieval, reasoning, evaluation | `backend/app/services/ai`, `docs/ai/*` | Embedding manifest, prompt APIs |
| **Data Platform** | Storage, ETL, analytics | `backend/app/models`, `docs/data/*` | DB schema migrations, dbt (planned) |
| **Integrations** | OAuth, data ingestion, SLAs | `backend/app/integrations`, `docs/integrations/*` | Sync cadence, webhook contracts |
| **Operations** | Deployments, monitoring, incident response | `backend/app/workers`, `docs/operations/*` | Runbooks, SLAs |

**Design Principle:** Layers communicate through explicit contracts (OpenAPI spec, SQL views, message schemas). Cross-layer access is prohibited without a defined interface.

---

## 📊 Data Architecture

### Storage Strategy
- **Operational Store**: PostgreSQL with normalized tables for WHOOP, Strava, and application domains.
- **AI Serving Layer**: Denormalized materialized views (`daily_fitness_snapshot`, `run_performance_details`, `boxing_performance_details`, `weightlifting_performance_details`).
- **Vector Store**: `schema_embeddings` + `document_embeddings` with HNSW indexes.
- **Telemetry**: `query_history`, `evaluation_cycles`, `ai_feedback` tables for traceability.

### Data Flow
```
[WHOOP API] ─┐
             ├─> Celery Workers (Scheduled Tasks) ─┐
[Strava API] ┘                                      │
                                                    ▼
                                          PostgreSQL Core Tables
                                                    │
                          ┌─────────────────────────┴─────────────────────┐
                          ▼                                               ▼
             Materialized Views (AI Serving)                Analytics Schemas (BI)
                          │                                               │
                          ▼                                               ▼
                 Embedding Service                              Dashboards / Notebooks
```

### Governance
- Migrations managed via Alembic; every DDL change documented in `docs/data/SCHEMA.md`.
- Data quality checks codified in `docs/data/DATA_QUALITY.md` (Great Expectations planned).
- ETL cadence and ownership defined in `docs/data/ETL_PROCESSES.md`.
- Background workers documented in `backend/app/workers/README.md`.

---

## 🤖 AI Cognition Layer

### Retrieval-Augmented Generation Pipeline
1. **Question Intake** – `POST /api/ai/query`
2. **Schema Retrieval** – Vector search against `schema_embeddings` (cosine similarity, HNSW)
3. **Planning** – Primary LLM (GPT-4o) generates reasoning + SQL skeleton
4. **Validation** – Secondary LLM reviewer + regex guards + SQL AST parser
5. **Execution** – Read-only transaction with timeout + row limit safeguards
6. **Narrative Response** – LLM synthesizes final answer with citations
7. **Telemetry & Feedback** – Persisted in `query_history` + evaluation triggers

### Safety & Guardrails
- Parameterized SQL builder eliminates string interpolation.
- Disallowed keyword filter (DDL/DML) + sandbox role in PostgreSQL.
- Prompt templates stored in `docs/ai/PROMPTS.md` with change control.
- Automated evaluator cycles (`docs/ai/EVALUATION.md`) score precision/recall.

### Future Enhancements
- Hybrid retrieval (symbolic + vector) for deterministic filters.
- Fine-tuned SQL translator on synthetic data generated via `docs/ai/TRAINING.md` playbooks.
- Agentic workflows for multi-step analytics narratives.

---

## 🛡️ Security & Compliance

| Layer | Control | Implementation |
|-------|---------|----------------|
| **Frontend** | Content Security Policy | Strict CSP headers via Next.js middleware |
| **Backend** | API Authentication | OAuth 2.0 (WHOOP/Strava), token-based internal auth |
| **Database** | Least Privilege | Read-only role for AI executor, migrations via privileged role |
| **Secrets** | Secure Storage | Vercel & Railway env vars, local `.env` gitignored |
| **AI Safety** | Prompt Hardening | System prompts enforce boundaries, JSON schema validation |
| **Audit** | Structured Logging | `structlog` pipelines, log retention 30 days |

Compliance posture aligns with SOC2-inspired controls; personal data is limited to fitness telemetry with explicit user consent.

---

## 📈 Reliability & Observability

### Monitoring Stack
- **Metrics**: Prometheus + Grafana (docker-compose optional) with dashboards defined in `operations/MONITORING.md`.
- **Logs**: Structured JSON logs shipped to Loki or CloudWatch (configurable).
- **Tracing**: OpenTelemetry instrumentation available in FastAPI middleware (Jaeger integration).

### Resilience Patterns
- Circuit breaker wrappers around external APIs with exponential backoff and jitter.
- Idempotent job processors to handle webhook retries.
- Feature flags for AI experimentation (rollout percentages in `feature_flags` table).

### Incident Response
- `docs/operations/RUNBOOKS.md` enumerates Sev1/Sev2 scenarios (API outage, embedding drift, OAuth failure).
- Post-incident reviews logged in `docs/knowledge/PROJECT_HISTORY.md` with remediation actions.

---

## 🚀 Evolution Roadmap

| Horizon | Initiative | Description | Owner |
|---------|------------|-------------|-------|
| **0-3 months** | Multi-Modal Data | Ingest Apple Health / Garmin via integrations | Data Platform |
| **0-3 months** | Agent Assist | Contextual agent that drafts weekly training plans | AI Platform |
| **3-6 months** | dbt Modeling | Transition analytics views to dbt + automated tests | Data Platform |
| **3-6 months** | SLA Dashboard | Real-time SLA tracking for integrations | Operations |
| **6-12 months** | Fine-Tuned SQL Model | Train custom SQL generator on synthetic corpora | AI Platform |

All roadmap items must be traced in `PROJECT_ARCHITECTURE_PLAN.md` and reviewed quarterly.

---

## 🔗 References
- `docs/ARCHITECTURE_PATTERNS.md` – **Comprehensive guide to architecture patterns and trade-offs**
- `docs/TECH_STACK.md` – Technology rationale underpinning this architecture.
- `docs/data/SCHEMA.md` – Detailed DDL, ER diagrams, and view definitions.
- `docs/ai/RAG_SYSTEM.md` – In-depth AI pipeline with prompt templates.
- `docs/operations/MONITORING.md` – Observability blueprint and alert catalog.
- `backend/app/workers/README.md` – Background workers service documentation.
- `DOCUMENTATION_ARCHITECTURE.md` – Documentation system meta-architecture.

---

*Last Updated: October 7, 2025*
