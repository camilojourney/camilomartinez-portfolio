# 🛠️ Operations Overview

> **Status:** Authoritative · **Scope:** Deployment, Monitoring, Incident Response · **Last Updated:** October 2, 2025  
> **Owner:** Operations Guild · **Reviewer:** DevOps Guild

---

## TL;DR
- Operations ensures the platform runs reliably: deployments, observability, incident response, compliance.
- This overview links to runbooks, monitoring dashboards, schedules, and tooling required to maintain enterprise-grade uptime.
- Treat operations as code—automated, observable, repeatable.

---

## Table of Contents
- [🏗️ Infrastructure Map](#️-infrastructure-map)
- [🚀 Deployments](#-deployments)
- [📈 Observability](#-observability)
- [📅 Schedules & Jobs](#-schedules--jobs)
- [🚨 Incident Management](#-incident-management)
- [🔐 Security & Compliance](#-security--compliance)
- [🔗 References](#-references)

---

## 🏗️ Infrastructure Map

| Component | Provider | Notes |
|-----------|----------|-------|
| Frontend | Vercel | Edge network, preview deploys |
| Backend | Railway | Containerized FastAPI service |
| PostgreSQL + pgvector | Railway | Backups, PITR |
| Redis | Railway / Upstash | Cache, rate limiting |
| Observability Stack | Docker Compose (local) / Grafana Cloud | Metrics, logs, traces |
| CI/CD | GitHub Actions | Domain-specific workflows |

Network architecture: Frontend → Backend (HTTPS) → PostgreSQL/Redis (TLS). Secrets managed per provider.

---

## 🚀 Deployments

- Frontend: see `docs/frontend/DEPLOYMENT.md`.
- Backend: see `docs/backend/DEPLOYMENT.md`.
- Deployments orchestrated via GitHub Actions; manual triggers documented in runbooks.
- Use release checklist (tests, migrations, verification) before production cutover.

---

## 📈 Observability

- Metrics: Prometheus scrape (FastAPI, PostgreSQL, Redis).
- Logs: Structured JSON to Railway (optionally forwarded to Logtail).
- Traces: OpenTelemetry instrumentation (Jaeger optional).
- Dashboards: Grafana (Performance, AI Quality, Data Pipelines, Infrastructure).
- Alerts: Configured via Grafana/Prometheus + Slack channels.

Detailed setup → `docs/operations/MONITORING.md`.

---

## 📅 Schedules & Jobs

- Cron/APS jobs documented in `docs/operations/CRON_JOBS.md`.
- Includes embedding refresh, ingestion sync, evaluation cycles, housekeeping tasks.
- Jobs instrumented with metrics (`job_duration_seconds`, `job_failures_total`).

---

## 🚨 Incident Management

- Severity matrix (Sev1-Sev3) defined in `docs/operations/RUNBOOKS.md`.
- Incident Commander rotates weekly (documented in team calendar).
- Post-incident reviews feed into `docs/knowledge/PROJECT_HISTORY.md`.

---

## 🔐 Security & Compliance

- Secrets managed via environment variable stores; rotate quarterly.
- Audit logs for database + AI queries retained 90 days.
- Security scans: `npm audit`, `pnpm audit`, `poetry run pip-audit`, `trivy` on Docker images (monthly).
- Access control: principle of least privilege across providers; MFA mandatory.

---

## 🔗 References
- `docs/operations/MONITORING.md`
- `docs/operations/CRON_JOBS.md`
- `docs/operations/TROUBLESHOOTING.md`
- `docs/operations/RUNBOOKS.md`
- `docs/backend/DEPLOYMENT.md`, `docs/frontend/DEPLOYMENT.md`
- `docs/data/DATA_QUALITY.md`

---

*Last Updated: October 2, 2025*
