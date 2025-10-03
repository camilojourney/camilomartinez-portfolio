# 💤 WHOOP Integration Guide

> **Status:** Production · **Scope:** OAuth, Data Sync, Webhooks · **Last Updated:** October 2, 2025  
> **Owner:** Integrations Guild · **Reviewer:** Data Platform Guild

---

## TL;DR
- WHOOP integration uses OAuth 2.0 (v2 API) with support for legacy v1 IDs; data synchronized hourly with incremental cursors.
- Key datasets: cycles, sleep, recovery, workouts (including heart-rate samples).
- Follow this guide for setup, API contracts, rate limits, and failure handling.

---

## Table of Contents
- [🔐 Authentication Flow](#-authentication-flow)
- [📡 API Endpoints](#-api-endpoints)
- [📦 Data Mapping](#-data-mapping)
- [⏱️ Scheduling & Rate Limits](#️-scheduling--rate-limits)
- [⚠️ Error Handling](#-error-handling)
- [🧪 Testing & Sandbox](#-testing--sandbox)
- [🔗 References](#-references)

---

## 🔐 Authentication Flow

1. Frontend hits `/api/v1/integrations/whoop/connect`; backend generates authorization URL.
2. User authorizes → WHOOP redirects to backend callback with `code`.
3. Backend exchanges code for `access_token`, `refresh_token`, `expires_in`.
4. Tokens stored encrypted in `whoop_users` table.
5. Refresh job runs 15 minutes before expiry (buffer).

```python
async def refresh_token(user: WhoopUser) -> None:
    response = await http_client.post(
        "https://api.prod.whoop.com/oauth/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": user.refresh_token,
            "client_id": settings.whoop_client_id,
            "client_secret": settings.whoop_client_secret,
        }
    )
    # Update tokens + expiry
```

---

## 📡 API Endpoints

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `GET /v2/recovery` | Daily recovery metrics | Filter by `start`/`end` query params |
| `GET /v2/sleep` | Sleep sessions & stages | `page_size` max 200 |
| `GET /v2/workout` | Workouts with heart-rate samples | Use `metrics=calories,heart_rate_zones` |
| `GET /v2/cycle` | Daily strain metrics | Use `aggregate=false` |

**Legacy Support**: V1 endpoints used only for backfill; map integer IDs to UUID via `v1_id` columns.

Response validation via Pydantic models in `app/services/integrations/whoop/schemas.py`.

---

## 📦 Data Mapping

| WHOOP Field | Internal Column | Notes |
|-------------|-----------------|-------|
| `id` (UUID) | `whoop_sleep.id` | Primary key |
| `score.sleep_performance_percentage` | `whoop_sleep.sleep_efficiency_percentage` | Convert to DECIMAL(5,2) |
| `score.hrv_rmssd_milli` | `whoop_recovery.hrv_rmssd_milli` | Store as DECIMAL(8,4) |
| `strain` | `whoop_strain.strain` | DECIMAL(8,6) |
| `heart_rate.average` | `whoop_workouts.avg_heart_rate_bpm` | INT |

Raw payloads saved in JSONB staging tables for auditing (`stg_whoop_*`).

---

## ⏱️ Scheduling & Rate Limits

- **Rate Limit**: 100 requests/hour per user.
- **Strategy**: Token bucket via Redis; jobs request tokens before API call.
- **Schedule**: Hourly incremental sync + daily `full_refresh` to reconcile gaps.
- **Timeouts**: 20s per request; 3 retries with exponential backoff.

---

## ⚠️ Error Handling

| Scenario | Mitigation |
|----------|------------|
| 401 Unauthorized | Refresh token; if fails, mark integration `disconnected`, notify user |
| 429 Rate Limited | Respect `Retry-After`; re-queue remaining pages |
| Timeout | Retry with jitter; if repeated, log to `ingestion_failures` |
| Data Gaps | Daily reconciliation job fetches last 7 days |

Webhooks not currently available; rely on polling.

---

## 🧪 Testing & Sandbox

- WHOOP offers limited sandbox; use mock responses stored in `tests/fixtures/integrations/whoop/`.
- Replay script `scripts/integrations/replay_whoop_payload.py` for regression testing.
- Integration tests run against recorded payloads with respx mocking.

---

## 🔗 References
- `docs/data/ETL_PROCESSES.md` – Ingestion workflow details.
- `docs/data/SCHEMA.md` – Target tables and columns.
- `docs/operations/RUNBOOKS.md` – Incident response for WHOOP failures.
- `docs/frontend/API_INTEGRATION.md` – Frontend connection UI patterns.

---

*Last Updated: October 2, 2025*
