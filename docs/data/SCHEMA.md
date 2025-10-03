# 🗃️ Database Schema & Data Model

> **Status:** Authoritative · **Scope:** PostgreSQL + pgvector Schema · **Last Updated:** October 2, 2025  
> **Owner:** Data Platform Guild · **Reviewer:** Backend Guild

---

## TL;DR
- The schema balances normalized ingestion tables with curated materialized views optimized for AI and analytics.
- All structural changes require an Alembic migration, documentation here, and embedding refresh.
- Use this doc to understand data domains, relationships, and performance considerations before touching the database.

---

## Table of Contents
- [🏛️ Domain Model](#️-domain-model)
- [👥 Core Entities](#-core-entities)
- [💤 WHOOP Domain](#-whoop-domain)
- [🏃 Strava Domain](#-strava-domain)
- [🤖 AI & Telemetry](#-ai--telemetry)
- [🧠 Materialized Views (AI Serving)](#-materialized-views-ai-serving)
- [📊 Analytics Marts](#-analytics-marts)
- [🛡️ Constraints & Indexes](#️-constraints--indexes)
- [🛠️ Migration Workflow](#️-migration-workflow)
- [🔗 References](#-references)

---

## 🏛️ Domain Model

```
Users ─┬─ WHOOP domain (sleep, recovery, strain)
       ├─ Strava domain (runs, splits, gear)
       ├─ AI domain (query history, embeddings, evaluations)
       └─ Integrations (OAuth tokens, webhooks)
```

- Primary key strategy: surrogate `SERIAL/BIGSERIAL` or UUID (for external IDs).
- Timestamps stored as `TIMESTAMPTZ`.
- Soft deletes avoided; use historical tables or audit logs.

---

## 👥 Core Entities

### `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT,
  full_name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- Relationship hub for all domains.
- Feature flags stored in `user_feature_flags` table.

### `user_rate_limits`
Tracks daily query quotas, resets via cron (`docs/operations/CRON_JOBS.md`).

---

## 💤 WHOOP Domain

| Table | Purpose | Notes |
|-------|---------|-------|
| `whoop_users` | OAuth credentials + metadata | Supports v1 (int IDs) & v2 (UUID) |
| `whoop_cycles` | Daily physiological cycles | Strain, energy, HR, timezone |
| `whoop_sleep` | Sleep sessions | Stage breakdown, respiratory rate, efficiency |
| `whoop_recovery` | Daily recovery metrics | HRV, resting HR, SpO2 |
| `whoop_workouts` | Workout sessions | Tracking for strain, duration, heart-rate zones |
| `whoop_workout_samples` | High-resolution heart rate samples | 1-min resolution; stored as JSONB array |

Key indexes: `(user_id, start_time)`, `(cycle_id)` for joins; partitioning roadmap for workout samples.

---

## 🏃 Strava Domain

| Table | Purpose | Notes |
|-------|---------|-------|
| `strava_athletes` | OAuth credentials, athlete profile | Contains tokens + refresh logic |
| `strava_activities` | Raw activity payloads | Store all fields for replay/debug |
| `strava_runs` | Curated running workouts | Distilled fields (distance, pace, hr, elevation) |
| `strava_run_splits` | Split-by-split metrics | Supports track charting |
| `strava_webhooks` | Event logs | Stores `object_id`, `aspect_type`, `processed_at` |

Indexes align with query patterns (e.g., `btree (start_date)`, `btree (distance)` for range queries).

---

## 🤖 AI & Telemetry

| Table | Purpose |
|-------|---------|
| `schema_embeddings` | Vector representations of schema metadata |
| `document_embeddings` | Persona/docs embeddings |
| `query_history` | Every AI query executed; stores question, sql, answer, tokens, feedback |
| `ai_feedback` | User ratings/comments |
| `evaluation_cycles` | Synthetic evaluation runs |
| `evaluation_examples` | Example-level judgements |
| `ai_usage` | Token usage + cost tracking |

Example `query_history` schema:
```sql
CREATE TABLE query_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  question TEXT NOT NULL,
  sql TEXT,
  answer TEXT,
  confidence NUMERIC,
  tokens_prompt INT,
  tokens_completion INT,
  execution_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  evaluation_status TEXT,
  feedback TEXT
);
```

---

## 🧠 Materialized Views (AI Serving)

| View | Description | Refresh |
|------|-------------|---------|
| `daily_fitness_snapshot` | WHOOP sleep/recovery/strain + Strava aggregates per day | Nightly (cron) |
| `run_performance_details` | Run-level metrics with HR zones, splits, WHOOP overlays | On demand + after Strava sync |
| `boxing_performance_details` | Boxing workout metrics | On demand |
| `weightlifting_performance_details` | Strength training metrics | On demand |

Example (simplified):
```sql
CREATE MATERIALIZED VIEW daily_fitness_snapshot AS
SELECT
  u.id AS user_id,
  d.date,
  wr.recovery_score,
  wr.hrv_rmssd_milli,
  ws.sleep_efficiency_percentage,
  ws.sleep_consistency_percentage,
  wst.strain,
  runs.total_distance_miles,
  runs.avg_pace_min_per_mile
FROM calendar_dates d
JOIN users u ON TRUE
LEFT JOIN whoop_recovery wr ON wr.cycle_date = d.date AND wr.user_id = u.id
LEFT JOIN whoop_sleep ws ON ws.date = d.date AND ws.user_id = u.id
LEFT JOIN whoop_strain wst ON wst.date = d.date AND wst.user_id = u.id
LEFT JOIN run_daily_aggregates runs ON runs.date = d.date AND runs.user_id = u.id;
```

> Refresh via `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid read locks.

---

## 📊 Analytics Marts

- `run_weekly_metrics` – Weekly aggregates (distance, pace, elevation).
- `sleep_weekly_metrics` – Sleep debt, efficiency, consistency.
- `recovery_trends` – Rolling averages, z-scores.
- `activity_heatmap` – Activity intensity per day/hour (for visualizations).

Roadmap: transition to dbt for versioned transformations and tests.

---

## 🛡️ Constraints & Indexes

- Foreign keys cascade delete only on staging tables; production tables use `ON DELETE RESTRICT` to maintain history.
- Unique constraints on external IDs (WHOOP/Strava) to prevent duplicates.
- Partial indexes for frequently filtered columns (e.g., `WHERE aspect_type = 'create'`).
- Vector indexes using `USING hnsw` (`m=16, ef_construction=64` parameters).

---

## 🛠️ Migration Workflow

1. Create migration: `poetry run alembic revision --autogenerate -m "<change>"`.
2. Review generated SQL, adjust as needed.
3. Apply locally: `poetry run alembic upgrade head`.
4. Update this document (`docs/data/SCHEMA.md`) with new tables/columns.
5. Run test suite + integration tests.
6. Deploy migration (see `docs/backend/DEPLOYMENT.md`).
7. Refresh embeddings/analytics views if schema touched AI-facing surfaces.

---

## 🔗 References
- `docs/data/ETL_PROCESSES.md` – How data flows into these tables.
- `docs/ai/EMBEDDINGS.md` – Embedding manifest referencing schema.
- `docs/backend/DATABASE.md` – ORM + repository usage.
- `docs/data/DATA_QUALITY.md` – Validation checks per domain.

---

*Last Updated: October 2, 2025*
