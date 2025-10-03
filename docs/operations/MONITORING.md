# 📈 Monitoring & Alerting Playbook

> **Status:** Authoritative · **Scope:** Metrics, Logging, Alert Routing · **Last Updated:** October 2, 2025  
> **Owner:** Operations Guild · **Reviewer:** AI Assistant

---

## TL;DR
- Observability spans metrics (Prometheus), logs (structured JSON), and traces (OpenTelemetry), aggregated into Grafana dashboards.
- Alerts route based on severity to Slack, email, or PagerDuty; every alert ties to a runbook.
- Use this playbook to set up dashboards, thresholds, and on-call procedures.

---

## Table of Contents
- [🧭 Observability Stack](#-observability-stack)
- [📊 Metrics Catalog](#-metrics-catalog)
- [🪵 Logging Strategy](#-logging-strategy)
- [🧵 Tracing](#-tracing)
- [🚨 Alert Routing](#-alert-routing)
- [🛠️ Setup Instructions](#-setup-instructions)
- [🔗 References](#-references)

---

## 🧭 Observability Stack

| Component | Purpose | Notes |
|-----------|---------|-------|
| Prometheus | Metrics collection | `prometheus.yml` configuration in `observability/` |
| Grafana | Dashboards + alerts | Dashboards exported as JSON |
| Loki (optional) | Log aggregation | Docker Compose service |
| Jaeger (optional) | Distributed tracing | Exposed on `localhost:16686` |
| Sentry | Frontend error tracking | DSN per environment |

---

## 📊 Metrics Catalog

| Metric | Source | Description | Alert |
|--------|--------|-------------|-------|
| `http_requests_total` | FastAPI | Request volume by route/status | High error rate (>5%) |
| `http_request_duration_seconds` | FastAPI | Response latency histogram | p95 > 1s |
| `ai_query_latency_seconds` | AI service | End-to-end AI query duration | p95 > 2s |
| `ai_query_failures_total` | AI service | Count of failed AI queries | Growth > 10/min |
| `whoop_sync_lag_minutes` | ETL job | Minutes since last successful sync | >120 |
| `database_connections` | PostgreSQL exporter | Active connections | > max pool size |
| `embedding_refresh_age_hours` | AI job | Hours since last refresh | >24 |

Dashboards:
- **API Performance** (`grafana_dashboards/api_performance.json`)
- **AI Quality** (`grafana_dashboards/ai_quality.json`)
- **Data Pipelines** (`grafana_dashboards/data_pipelines.json`)
- **Infrastructure Overview** (`grafana_dashboards/infrastructure.json`)

---

## 🪵 Logging Strategy

- Structured logs with `structlog` (backend) include fields: `timestamp`, `level`, `event`, `request_id`, `user_id`, `latency_ms`.
- Sensitive data redacted via log processors.
- Logs forwarded to Railway console; optional sink to Logtail (configure via `LOGTAIL_TOKEN`).
- Frontend logs captured via Sentry breadcrumbs; filter PII.

---

## 🧵 Tracing

- OpenTelemetry instrumentation (`opentelemetry-instrumentation-fastapi`, `opentelemetry-instrumentation-httpx`).
- Traces exported via OTLP to Jaeger/Tempo; correlate request ID across services.
- Instrument major operations: AI query pipeline steps, ETL jobs, database transactions.

---

## 🚨 Alert Routing

| Severity | Channel | Response Time | On-Call |
|----------|---------|---------------|---------|
| **Sev1** (prod outage, incorrect AI data) | PagerDuty + Slack `#alerts` | 5 min | Primary on-call |
| **Sev2** (degraded performance, delayed pipelines) | Slack `#alerts` | 30 min | On-call |
| **Sev3** (non-urgent anomalies) | Slack `#operations` | 8 hours | Ops guild |

Alerts link to relevant runbook in `docs/operations/RUNBOOKS.md`. Ensure contact rotation documented in team calendar.

---

## 🛠️ Setup Instructions

1. Launch observability stack locally:
   ```bash
   docker compose -f docker-compose.observability.yml up -d
   ```
2. Import dashboards via Grafana UI (dashboards JSON under `grafana_dashboards/`).
3. Configure Prometheus targets (backend, database, redis exporters).
4. Enable alerts via Grafana Alerting → Notification policies (Slack webhook or PagerDuty integration).
5. Document dashboard URLs in team wiki / Notion.

---

## 🔗 References
- `docs/operations/RUNBOOKS.md` – Incident response playbooks.
- `docs/operations/CRON_JOBS.md` – Job metrics and schedules.
- `docs/data/DATA_QUALITY.md` – Data validation alerts.
- `docs/ai/EVALUATION.md` – AI quality metrics integration.

---

*Last Updated: October 2, 2025*
