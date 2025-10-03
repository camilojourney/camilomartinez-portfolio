# 🏃 Strava Integration Guide

> **Status:** Production · **Scope:** OAuth, Webhooks, Activity Sync · **Last Updated:** October 2, 2025  
> **Owner:** Integrations Guild · **Reviewer:** Data Platform Guild

---

## TL;DR
- Strava integration uses OAuth 2.0 and real-time webhooks to keep running data current; fallbacks ensure no data gaps.
- Data pipeline processes activities into normalized tables (`strava_runs`, `strava_run_splits`) and analytics views.
- This guide covers auth, webhook handling, data mapping, and operational playbooks.

---

## Table of Contents
- [🔐 Authentication Flow](#-authentication-flow)
- [📬 Webhook Lifecycle](#-webhook-lifecycle)
- [📡 API Endpoints](#-api-endpoints)
- [📦 Data Mapping](#-data-mapping)
- [⏱️ Rate Limits & Scheduling](#️-rate-limits--scheduling)
- [⚠️ Failure Handling](#-failure-handling)
- [🧪 Testing & Sandbox](#-testing--sandbox)
- [🔗 References](#-references)

---

## 🔐 Authentication Flow

1. User initiates from frontend → `/api/v1/integrations/strava/connect`.
2. Redirects to Strava authorization page (scopes `read, activity:read_all`).
3. Strava redirects back with `code` & `scope` → backend exchanges for tokens.
4. Store `access_token`, `refresh_token`, `expires_at` in `strava_athletes` table (encrypted).
5. Refresh tokens on demand (Strava tokens valid for 6 hours).

---

## 📬 Webhook Lifecycle

- Register webhook via Strava API (`POST /push_subscriptions`).
- Verification: Strava sends GET challenge; respond with `hub.challenge`.
- Event payload example:
```json
{
  "object_type": "activity",
  "object_id": 123456789,
  "aspect_type": "create",
  "updates": {},
  "owner_id": 98765,
  "subscription_id": 112233,
  "event_time": 1727840420
}
```
- Backend endpoint: `/api/v1/integrations/strava/webhook`.
- Process:
  1. Validate signature using `X-Strava-Signature` header (`sha256` HMAC).
  2. Enqueue processing job with event details.
  3. Fetch full activity via `GET /activities/{id}`.
  4. Upsert into `strava_activities` (raw) + curated tables.

---

## 📡 API Endpoints

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `GET /athlete` | Athlete profile | On connect |
| `GET /activities` | List activities | Use for backfill (pagination) |
| `GET /activities/{id}` | Detailed activity | Includes splits, streams |
| `GET /activities/{id}/streams` | GPS streams | optional, heavy |

Use `per_page=200` for backfill; handle rate limiting gracefully.

---

## 📦 Data Mapping

| Strava Field | Internal Column | Notes |
|--------------|-----------------|-------|
| `distance` (meters) | `strava_runs.distance_meters` | Convert to miles for analytics |
| `moving_time` | `strava_runs.moving_time_seconds` | Duration |
| `average_speed` | `strava_runs.avg_pace_ms` | Convert to pace (min/mile) |
| `average_heartrate` | `strava_runs.avg_heart_rate_bpm` | Nullable |
| `laps` / `splits_metric` | `strava_run_splits` | Store split index, distance, pace |
| `total_elevation_gain` | `strava_runs.elevation_gain_meters` | |

Complex calculations (pace, zones, energy) implemented in transformation layer (`docs/data/ETL_PROCESSES.md`).

---

## ⏱️ Rate Limits & Scheduling

- **Rate Limits**: 100 requests / 15 min, 1000 per day.
- **Strategy**:
  - Use webhook events for near-real-time updates.
  - Backoff when `X-RateLimit-Remaining` low; schedule follow-up using APScheduler.
  - Daily reconciliation ensures missing events captured.

---

## ⚠️ Failure Handling

| Issue | Mitigation |
|-------|------------|
| 401 Unauthorized | Refresh token; if fails inform user to reconnect |
| 429 Rate Limit | Delay processing with queue; log to `ingestion_failures` |
| Deleted Activity | Webhook `aspect_type=delete`; remove or mark as inactive |
| Inconsistent Distance | Recompute using GPS stream (if available) |

Escalate persistent failures via `docs/operations/RUNBOOKS.md` (Integrations section).

---

## 🧪 Testing & Sandbox

- Strava offers sandbox account; rotate credentials quarterly.
- Recorded fixtures under `tests/fixtures/integrations/strava/`.
- Use `scripts/integrations/replay_strava_event.py` to simulate webhook.
- Integration tests ensure full flow (webhook → fetch → upsert) runs successfully with mocks.

---

## 🔗 References
- `docs/data/ETL_PROCESSES.md` – Processing pipelines.
- `docs/data/SCHEMA.md` – Tables storing Strava data.
- `docs/frontend/API_INTEGRATION.md` – Frontend connect/disconnect flows.
- `docs/operations/RUNBOOKS.md` – Incident playbooks.

---

*Last Updated: October 2, 2025*
