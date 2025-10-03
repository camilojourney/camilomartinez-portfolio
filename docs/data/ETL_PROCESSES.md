# 🔄 ETL & Data Pipelines

> **Status:** Production · **Scope:** Ingestion, Transformation, Scheduling · **Last Updated:** October 2, 2025  
> **Owner:** Data Platform Guild · **Reviewer:** Operations Guild

---

## TL;DR
- ETL pipelines synchronize WHOOP and Strava data, normalize into core tables, and refresh AI-serving views.
- Jobs run via APScheduler within FastAPI; future migration to Airflow/dbt Cloud when scale demands.
- Use this guide for data flow diagrams, schedules, retry logic, and operational procedures.

---

## Table of Contents
- [📥 Ingestion Pipelines](#-ingestion-pipelines)
- [🛠️ Transformation Jobs](#️-transformation-jobs)
- [🗓️ Scheduling](#️-scheduling)
- [⚠️ Error Handling & Retries](#️-error-handling--retries)
- [📄 Logging & Auditing](#-logging--auditing)
- [🔗 References](#-references)

---

## 📥 Ingestion Pipelines

### WHOOP Sync
```
APS Job (hourly)
  │
  ▼
Fetch cycles/sleep/recovery/workouts (HTTPx async)
  │
  ▼
Stage tables (`stg_whoop_*`)
  │
  ▼
Merge into core tables (`whoop_*`)
  │
  ▼
Trigger materialized view refresh (daily snapshot)
```
- **Incremental Strategy**: Query API by `updated_at` cursor; store last cursor per user.
- **Backfill**: Onboard pipeline fetches last 30 days, then incremental.
- **Rate Limits**: 100 req/hr per user; implemented via Redis token bucket.

### Strava Sync
- Webhook-driven (activity create/update/delete).
- Fetch activity detail (`/activities/{id}`) for new/updated events.
- Polyline decoding, metric calculation (pace, HR zones) performed in transformation step.
- Daily reconciliation ensures missed events are recovered.

---

## 🛠️ Transformation Jobs

| Job | Description | Output |
|-----|-------------|--------|
| `process_whoop_sleep` | Normalize sleep payloads → `whoop_sleep` | Sleep metrics with stage breakdown |
| `process_whoop_recovery` | Map recovery metrics | Recovery history |
| `process_strava_activity` | Extract running metrics, compute derived stats | `strava_runs`, `strava_run_splits` |
| `refresh_daily_snapshot` | `REFRESH MATERIALIZED VIEW CONCURRENTLY daily_fitness_snapshot` | AI-serving view |
| `refresh_run_performance` | Rebuild run details when new data arrives | `run_performance_details` |

Transformations leverage SQLAlchemy for upserts or raw SQL for bulk operations.

---

## 🗓️ Scheduling

| Job | Frequency | Trigger |
|-----|-----------|---------|
| WHOOP incremental sync | Every hour | APScheduler cron | 
| Strava webhook processor | Real-time | HTTP webhook | 
| Embedding refresh (schema/doc) | Daily 02:00 UTC | APScheduler delegated to script |
| Daily snapshot refresh | Daily 03:00 UTC | APScheduler |
| Trainer evaluation cycle | Weekly Monday 04:00 UTC | APScheduler |

Configuration in `backend/app/workers/scheduler.py`; schedule definitions also listed in `docs/operations/CRON_JOBS.md`.

---

## ⚠️ Error Handling & Retries

- **HTTP Retries**: Exponential backoff with jitter (max 5 attempts). Specific handling for 429 (respect `Retry-After`).
- **Idempotency**: Deduplicate by external ID + `updated_at`. Upserts ensure no duplicates.
- **Dead Letter Queue**: Failed payloads stored in `ingestion_failures` table with reason + replay flag.
- **Alerting**: Failed jobs emit metric `pipeline_failures_total` and send alert via Ops channel.

---

## 📄 Logging & Auditing

- Structured logs include `pipeline`, `job`, `external_id`, `duration_ms`, `status`.
- `ingestion_audit` table tracks runs (start, end, records processed, failures, operator).
```sql
CREATE TABLE ingestion_audit (
  id SERIAL PRIMARY KEY,
  pipeline TEXT,
  run_id UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  records_processed INT,
  records_failed INT,
  status TEXT,
  details JSONB
);
```
- `scripts/data/replay_failed_payloads.py` handles reprocessing.

---

## 🔗 References
- `docs/integrations/WHOOP.md`, `docs/integrations/STRAVA.md` – API contracts.
- `docs/data/SCHEMA.md` – Target tables & views.
- `docs/data/DATA_QUALITY.md` – Post-load validation rules.
- `docs/operations/RUNBOOKS.md` – Incident response for pipeline failures.

---

*Last Updated: October 2, 2025*
