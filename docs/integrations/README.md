# 🔌 Integrations Overview

> **Status:** Authoritative · **Scope:** External Services (WHOOP, Strava, OpenAI, Future) · **Last Updated:** October 2, 2025  
> **Owner:** Integrations Guild · **Reviewer:** Operations Guild

---

## TL;DR
- Integrations follow a shared contract: OAuth authentication, rate-limited ingestion, resilient retries, and comprehensive logging.
- Use this doc to understand integration architecture, shared tooling, and governance before touching any external API connection.
- Detailed per-service guides live in `docs/integrations/*.md`.

---

## Table of Contents
- [🏛️ Integration Architecture](#️-integration-architecture)
- [🔐 Authentication Standards](#-authentication-standards)
- [🌐 Shared Clients & Utilities](#-shared-clients--utilities)
- [📊 Monitoring & SLAs](#-monitoring--slas)
- [🧪 Testing Strategy](#-testing-strategy)
- [🔗 References](#-references)

---

## 🏛️ Integration Architecture

```
Frontend OAuth Initiation → Backend OAuth Router → External Provider
                                             │
                                             ▼
                                    Token Store (PostgreSQL)
                                             │
                                             ▼
                      Ingestion Workers (FastAPI services + APScheduler)
                                             │
                                             ▼
                                    Data Platform (PostgreSQL/Redis)
```

- **Clients**: Async HTTP clients (`httpx`) with shared retry/backoff middleware.
- **Secrets**: Stored in Railway environment variables; rotated quarterly.
- **Idempotency**: Ingestion uses external IDs + timestamps to prevent duplicates.

---

## 🔐 Authentication Standards

| Provider | Grant Type | Scopes | Token TTL | Refresh Strategy |
|----------|------------|--------|-----------|------------------|
| WHOOP | OAuth 2.0 Authorization Code | `read:recovery`, `read:sleep`, `read:workout` | 8 hours | Auto refresh 15 min before expiry |
| Strava | OAuth 2.0 | `activity:read_all` | 6 hours | Auto refresh on use |
| OpenAI | API Key | `Bearer` header | N/A | Rotate monthly |

Tokens encrypted using `fernet` with key stored in KMS (roadmap) / environment secret.

---

## 🌐 Shared Clients & Utilities

- `app/services/integrations/base_client.py` – Base class for OAuth clients (token refresh, request signing).
- `app/services/integrations/retry.py` – Exponential backoff decorator with jitter.
- `app/services/integrations/signature.py` – Webhook signature validation utilities.
- `app/services/integrations/scheduler.py` – Job registration for ingestion tasks.

Frontends interact via `docs/frontend/API_INTEGRATION.md` patterns (status endpoints, connect/disconnect flows).

---

## 📊 Monitoring & SLAs

| Service | SLA | Monitoring |
|---------|-----|------------|
| WHOOP | < 2h freshness | Metric `whoop_sync_lag_minutes` |
| Strava | Real-time (webhook) | Metric `strava_pending_webhooks` |
| OpenAI | 99.9% availability | Metric `openai_latency_ms`, `openai_error_rate` |

Alerts configured in `docs/operations/MONITORING.md`.

---

## 🧪 Testing Strategy

- **Contract Tests**: Mock HTTP responses with `respx`; ensure payload parsing matches schema.
- **Replay**: Save real payloads (redacted) in `tests/fixtures/integrations/` for regression tests.
- **E2E**: Use sandbox/staging environments where available; manual runbooks documented per service.

---

## 🔗 References
- `docs/integrations/WHOOP.md` – WHOOP-specific endpoints, payloads, retries.
- `docs/integrations/STRAVA.md` – Strava webhook and ingestion details.
- `docs/integrations/OPENAI.md` – OpenAI usage, cost controls.
- `docs/data/ETL_PROCESSES.md` – Downstream processing.
- `docs/operations/RUNBOOKS.md` – Incident response for integration failures.

---

*Last Updated: October 2, 2025*
