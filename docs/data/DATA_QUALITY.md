# ✅ Data Quality & Validation Playbook

> **Status:** Drafting for Production · **Scope:** Quality Checks, Monitoring, SLAs · **Last Updated:** October 2, 2025  
> **Owner:** Data Platform Guild · **Reviewer:** Operations Guild

---

## TL;DR
- Data quality is enforced via automated checks (Great Expectations roadmap), SQL assertions, and observability dashboards.
- This playbook outlines critical validations, remediation procedures, and owner responsibilities.
- Use it to maintain trustworthy analytics and AI outputs.

---

## Table of Contents
- [🎯 Quality Objectives](#-quality-objectives)
- [🧪 Validation Matrix](#-validation-matrix)
- [🛠️ Tooling & Automation](#️-tooling--automation)
- [🚨 Incident Management](#-incident-management)
- [📈 Monitoring & Alerts](#-monitoring--alerts)
- [🔗 References](#-references)

---

## 🎯 Quality Objectives

1. **Completeness** – All expected rows/columns present for each ingestion run.
2. **Accuracy** – Metrics match source-of-truth (WHOOP/Strava APIs).
3. **Timeliness** – Data freshness meets defined SLAs.
4. **Consistency** – Derived calculations align across systems (frontend, AI, analytics).
5. **Trust** – AI responses accurately cite underlying SQL and results.

---

## 🧪 Validation Matrix

| Domain | Check | Method | Frequency | Owner |
|--------|-------|--------|-----------|-------|
| WHOOP Sleep | Stage vs core row counts | SQL assert | Daily | Data Engineer |
| WHOOP Recovery | `recovery_score` between 0-100 | SQL constraint + expectation | Continuous | Data Engineer |
| Strava Runs | `distance > 0`, `avg_pace` within realistic bounds | SQL check + expectations | On ingestion | Data Engineer |
| Materialized Views | `REFRESH` success + row counts | Post-refresh script | Daily | Data Engineer |
| AI Embeddings | `avg_similarity >= 0.85` | Drift script | Weekly | AI Engineer |
| Query History | 100% queries have telemetry | Post-run audit | Daily | AI Engineer |

Example SQL assertion:
```sql
SELECT COUNT(*)
FROM whoop_sleep
WHERE total_sleep_time_milli <= 0;
-- Expect 0 rows
```

---

## 🛠️ Tooling & Automation

- **Great Expectations** (planned): store expectation suites per domain under `great_expectations/`.
- **Custom SQL Checks**: `scripts/data/run_quality_checks.py` executes assertions and posts report.
- **Data Diff**: Use `data-diff` to compare staging vs production tables post-deployment.
- **Notebook Audits**: `notebooks/quality/` contains exploratory checks for anomalies.

Quality reports stored in `reports/data-quality/<date>.md` with pass/fail summary.

---

## 🚨 Incident Management

1. Detect issue via alerts or manual checks.
2. Log incident in `docs/operations/RUNBOOKS.md` (Data Quality section).
3. Quarantine affected data (e.g., mark ingestion run as `invalid`, remove from AI retriever).
4. Communicate impact (AI features, dashboards) to stakeholders.
5. Fix root cause (re-run ingestion, patch transformation, update expectations).
6. Postmortem entry in `docs/knowledge/PROJECT_HISTORY.md` with action items.

Severity classification aligns with operations playbook (Sev1: incorrect AI answers, Sev2: stale dashboards, etc.).

---

## 📈 Monitoring & Alerts

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Ingestion latency | > 2 hours | Pager notification |
| Failed ingestions | > 3 consecutive failures | Slack + email |
| Drift score | < 0.8 | AI guardrail alert |
| Missing AI telemetry | > 1% missing metadata | Data Quality ticket |

Dashboards in Grafana `Data Quality` board (freshness heatmap, anomaly detection).

---

## 🔗 References
- `docs/data/ETL_PROCESSES.md` – Pipelines producing data.
- `docs/operations/MONITORING.md` – Alert routing.
- `docs/ai/EVALUATION.md` – AI quality metrics relying on data integrity.
- `docs/frontend/COMPONENTS.md` – Components displaying data (align formatting).

---

*Last Updated: October 2, 2025*
