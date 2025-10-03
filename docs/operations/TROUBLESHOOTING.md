# 🧯 Troubleshooting Guide

> **Status:** Production · **Scope:** Common Issues & Quick Fixes · **Last Updated:** October 2, 2025  
> **Owner:** Operations Guild · **Reviewer:** AI Assistant

---

## TL;DR
- This guide lists the most common operational issues, symptoms, diagnostic steps, and fixes.
- Each entry links to deeper runbooks or documentation for sustained incidents.
- Use it during triage before escalating to full incident response.

---

## Table of Contents
- [🚀 Deployments](#-deployments)
- [🤖 AI Services](#-ai-services)
- [📡 Integrations](#-integrations)
- [📊 Data Pipelines](#-data-pipelines)
- [🌐 Frontend](#-frontend)
- [📞 Support Escalation](#-support-escalation)

---

## 🚀 Deployments

### Issue: Deployment Fails on Railway
- **Symptoms**: Deployment marked failed; logs show migration error.
- **Diagnostics**:
  1. Check `railway logs -f` for stack trace.
  2. Review Alembic migration script for missing dependency.
  3. Confirm database available: `railway run psql -c "SELECT 1"`.
- **Fix**: Roll back migration (`alembic downgrade -1`), patch script, redeploy. Document in `PROJECT_HISTORY`.

### Issue: Vercel Preview Link 404
- **Symptoms**: Preview URL returns 404 or 500.
- **Diagnostics**:
  1. Check Vercel build logs for errors.
  2. Ensure environment variables present in preview scope.
  3. Re-run build locally (`pnpm build`).
- **Fix**: Patch build errors; redeploy; update pipeline step if necessary.

---

## 🤖 AI Services

### Issue: AI Query Returns Fallback Message
- **Symptoms**: Response indicates inability to answer.
- **Diagnostics**:
  1. Check backend logs for `AI_VALIDATION_ERROR`.
  2. Review `query_history` entry; inspect generated SQL.
  3. Run embedding drift check (`scripts/ai/checkEmbeddingDrift.ts`).
- **Fix**: Update schema docs / prompts; refresh embeddings; rerun query.

### Issue: High AI Latency (>2s)
- **Diagnostics**:
  1. Inspect `ai_query_latency_seconds` in Grafana.
  2. Check OpenAI status page (possible provider slowdown).
  3. Review query plan; ensure materialized views fresh.
- **Fix**: Increase concurrency tokens, refresh views, switch to cached response if necessary.

---

## 📡 Integrations

### Issue: WHOOP Sync Stalled
- **Symptoms**: `whoop_sync_lag_minutes` > 120.
- **Diagnostics**:
  1. Check job logs (`whoop_sync_hourly`).
  2. Verify OAuth tokens: `SELECT token_expires_at FROM whoop_users`.
  3. Manually fetch API status (curl request).
- **Fix**: Refresh tokens, rerun job `railway run poetry run python app/jobs/whoop_sync.py`.

### Issue: Strava Webhooks Failing Verification
- **Symptoms**: Strava dashboard shows failed deliveries.
- **Diagnostics**:
  1. Review webhook logs for signature mismatch.
  2. Ensure secret matches Strava settings.
  3. Replay event with `scripts/integrations/replay_strava_event.py`.
- **Fix**: Update signature secret, redeploy endpoint, confirm 200 response.

---

## 📊 Data Pipelines

### Issue: Materialized View Refresh Fails
- **Symptoms**: Logs show concurrency/lock errors.
- **Diagnostics**:
  1. `SELECT * FROM pg_locks` to identify blocking sessions.
  2. Check job logs for detailed SQL error.
  3. Ensure running within maintenance window.
- **Fix**: Terminate blocking sessions; rerun `REFRESH ... CONCURRENTLY`; review schedule to avoid conflict.

### Issue: Data Quality Alert Triggered
- **Diagnostics**:
  1. Inspect data quality report in `reports/data-quality/`.
  2. Identify failing expectation (table, condition).
  3. Determine root cause (API change, transformation bug).
- **Fix**: Patch ETL logic; reprocess affected data; update expectation if source changed legitimately.

---

## 🌐 Frontend

### Issue: 500 Errors on API Calls
- **Diagnostics**:
  1. Browser console/network logs for failing endpoint.
  2. Check backend logs with correlation ID.
  3. Reproduce locally with `pnpm dev`.
- **Fix**: Investigate backend service; apply fix; redeploy.

### Issue: Static Assets Not Loading on Vercel
- **Diagnostics**: Inspect Vercel logs; ensure `next.config.js` allows domain; confirm CDN status.
- **Fix**: Update config, redeploy; purge CDN cache if necessary.

---

## 📞 Support Escalation

- **Primary On-Call**: Slack `@oncall-ai` / PagerDuty schedule.
- **Secondary**: `@camilo` (founder/architect).
- **Vendors**: WHOOP/Strava support contacts stored in Notion; OpenAI support via dashboard.
- Document escalations in incident tracker.

---

*Last Updated: October 2, 2025*
