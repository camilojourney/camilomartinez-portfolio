# 🕒 Job Schedule & Automation

> **Status:** Production · **Scope:** APScheduler, Cron Jobs, Automation Tasks · **Last Updated:** October 2, 2025  
> **Owner:** Operations Guild · **Reviewer:** Data Platform Guild

---

## TL;DR
- Scheduled jobs run via APScheduler inside the backend container; each job is idempotent, observable, and tied to a runbook.
- This table documents schedule, ownership, expected duration, and post-run validations.
- Keep this document updated whenever jobs are added, modified, or retired.

---

## Table of Contents
- [🗓️ Job Inventory](#️-job-inventory)
- [⚙️ Implementation Notes](#-implementation-notes)
- [🧪 Validation Checklist](#-validation-checklist)
- [⚠️ Failure Handling](#️-failure-handling)
- [🔗 References](#-references)

---

## 🗓️ Job Inventory

| Job ID | Description | Schedule (UTC) | Owner | Expected Duration | Post-Run Validation |
|--------|-------------|----------------|-------|-------------------|---------------------|
| `whoop_sync_hourly` | Pull WHOOP updates (sleep, recovery, workouts) | Every hour at :05 | Data Eng | < 3 min | `whoop_sync_lag_minutes < 120` |
| `strava_reconcile_daily` | Reconcile Strava activities | Daily 02:30 | Data Eng | < 5 min | `strava_last_sync` dashboard |
| `refresh_daily_snapshot` | Refresh AI-serving materialized views | Daily 03:00 | AI Eng | < 2 min | Row count diff <5% |
| `refresh_embeddings_full` | Regenerate schema/persona embeddings | Daily 03:15 | AI Eng | < 10 min | Embedding drift <0.1 |
| `trainer_cycle_weekly` | Run evaluation cycle | Monday 04:00 | AI Eng | < 15 min | Success rate ≥ 0.9 |
| `cleanup_query_history` | Archive stale AI query logs >90 days | Sunday 05:00 | Ops | < 3 min | Archive row count logged |
| `token_rotate_check` | Notify for expiring OAuth tokens | Daily 12:00 | Integrations | < 1 min | Slack notification posted |

Schedules defined in `backend/app/workers/scheduler.py`; use cron-style expressions.

---

## ⚙️ Implementation Notes

- APScheduler configured with `AsyncIOScheduler`; jobs defined at startup (`app/main.py`).
- Each job obtains distributed lock (Redis) to prevent concurrent runs.
- Jobs log start/end, duration, status; metrics exported via Prometheus.
- Long-running jobs should chunk workloads and commit periodically.

---

## 🧪 Validation Checklist

After adding/updating a job:
1. Write unit tests covering job logic.
2. Add integration test (if job depends on external APIs, use mocks).
3. Update Grafana dashboard widgets.
4. Document job in this file with owner + validation.
5. Ensure runbook entry exists (`docs/operations/RUNBOOKS.md`).

---

## ⚠️ Failure Handling

- Retry policy: 3 attempts with exponential backoff (per job). Critical jobs escalate to on-call after final failure.
- Failures logged to `ingestion_failures` (for data jobs) or `job_failures` table with details.
- On repeated failures, disable job (`scheduler.remove_job`) and follow runbook.

---

## 🔗 References
- `docs/operations/RUNBOOKS.md` – Recovery steps for job failures.
- `docs/data/ETL_PROCESSES.md` – Ingestion jobs details.
- `docs/ai/EVALUATION.md` – Trainer cycle details.
- `docs/operations/MONITORING.md` – Dashboards/alerts observing job health.

---

*Last Updated: October 2, 2025*
