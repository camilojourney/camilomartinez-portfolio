# 📊 Data Platform Overview

> **Status:** Authoritative · **Scope:** Storage, Pipelines, Analytics · **Last Updated:** October 2, 2025  
> **Owner:** Data Platform Guild · **Reviewer:** AI Assistant

---

## TL;DR
- The data platform orchestrates ingestion from WHOOP/Strava, curates analytics-ready views, and powers AI retrieval via pgvector.
- Architecture balances normalized OLTP tables with AI-serving materialized views and analytics marts.
- Use this guide to understand domains, tooling, and governance before building new data features.

---

## Table of Contents
- [🏛️ Architecture Summary](#️-architecture-summary)
- [📥 Ingestion & Integrations](#-ingestion--integrations)
- [🗃️ Storage Layers](#️-storage-layers)
- [📈 Analytics & BI](#-analytics--bi)
- [🤖 AI Enablement](#-ai-enablement)
- [🔐 Governance & Security](#-governance--security)
- [🔗 References](#-references)

---

## 🏛️ Architecture Summary

```
WHOOP / Strava APIs ──► Ingestion Services (FastAPI workers) ──► PostgreSQL Core ──►
                                                       │
                                  ┌──────── Materialized Views (AI) ───────────┐
                                  │                                            │
                          Analytics Marts (dbt roadmap)               Vector Store (pgvector)
```

- **Database**: PostgreSQL 15 (managed) with pgvector extension.
- **Orchestration**: FastAPI services + APScheduler jobs (dbt in roadmap).
- **Caching**: Redis for ingestion dedupe and idempotency keys.

---

## 📥 Ingestion & Integrations

- WHOOP and Strava connectors documented in `docs/integrations/WHOOP.md` / `docs/integrations/STRAVA.md`.
- OAuth tokens stored encrypted; rotation tasks scheduled.
- Sync cadence: hourly incremental + daily reconciliation.
- Webhooks (Strava) trigger delta ingestions; WHOOP uses polling.
- Ingestion writes to staging tables, then merges into core tables via stored procedures.

---

## 🗃️ Storage Layers

| Layer | Description | Purpose |
|-------|-------------|---------|
| **Raw / Staging** | Append-only tables capturing API payloads | Audit, replay, debugging |
| **Normalized Core** | 3NF tables (`whoop_sleep`, `strava_runs`, `users`) | Transactional queries |
| **AI Serving** | Denormalized materialized views | Text-to-SQL, RAG |
| **Analytics Marts** | Aggregated tables / views (dbt) | Dashboards, reporting |

Refer to `docs/data/SCHEMA.md` for detailed definitions.

---

## 📈 Analytics & BI

- Visualization: frontend dashboards using Recharts/Tremor.
- Metrics definitions in `docs/data/ANALYTICS.md`.
- Roadmap: adopt dbt for transformation, Great Expectations for quality checks.
- Export capabilities: CSV/Parquet downloads via FastAPI endpoints.

---

## 🤖 AI Enablement

- Embedding pipeline uses schema metadata + curated narratives (`docs/ai/EMBEDDINGS.md`).
- Query engine relies on `daily_fitness_snapshot`, `run_performance_details`, `boxing_performance_details`, `weightlifting_performance_details` views.
- AI evaluation uses historical query logs stored in `query_history` + evaluation tables.

---

## 🔐 Governance & Security

- PII minimized; only anonymized fitness metrics stored.
- Database roles:
  - `app_writer` – application writes.
  - `app_reader` – read-only for frontend/API consumers.
  - `ai_reader` – restricted to AI views.
  - `dba` – migrations.
- Backups: daily snapshots + point-in-time recovery (managed by Railway).
- Audit: Query logs stored in `audit_logs` table; retention 90 days.

---

## 🔗 References
- `docs/data/SCHEMA.md` – Detailed schema definitions.
- `docs/data/ETL_PROCESSES.md` – Ingestion pipelines and job schedule.
- `docs/data/ANALYTICS.md` – Metric library.
- `docs/data/DATA_QUALITY.md` – Validation and monitoring.
- `docs/ai/EMBEDDINGS.md` – Embedding manifest using data sources.

---

*Last Updated: October 2, 2025*
