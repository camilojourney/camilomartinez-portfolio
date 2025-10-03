# 🚨 Operations Runbooks

> **Status:** Authoritative · **Scope:** Incident Response & Operational Procedures · **Last Updated:** October 2, 2025  
> **Owner:** Operations Guild · **Reviewer:** AI Assistant

---

## TL;DR
- Runbooks provide step-by-step guidance for critical incidents across infrastructure, AI, data, and integrations.
- Each runbook lists severity, triggers, immediate actions, diagnostics, mitigation, communication, and post-incident tasks.
- Always document outcomes in `docs/knowledge/PROJECT_HISTORY.md` and update runbooks after each incident.

---

## Table of Contents
- [🧭 How to Use This Runbook](#-how-to-use-this-runbook)
- [🔥 Sev1: Production Outage / Incorrect AI Answers](#-sev1-production-outage--incorrect-ai-answers)
- [⚠️ Sev2: Degraded Performance / Data Delays](#️-sev2-degraded-performance--data-delays)
- [ℹ️ Sev3: Non-Critical Issues](#ℹ️-sev3-non-critical-issues)
- [📝 Post-Incident Checklist](#-post-incident-checklist)
- [🔗 References](#-references)

---

## 🧭 How to Use This Runbook
1. Determine severity based on impact (see matrix below).
2. Identify corresponding runbook section.
3. Follow steps sequentially; assign roles (Incident Commander, Scribe, Domain Experts).
4. Communicate status via designated channels.
5. Document all actions and timelines for postmortem.

### Severity Matrix
| Severity | Description | Examples |
|----------|-------------|----------|
| **Sev1** | Full outage, corrupted data, incorrect AI answers to users | API 500s, AI returning harmful SQL, production data loss |
| **Sev2** | Partial outage, increased latency, delayed pipelines | AI latency > 2s, embeddings stale, ingestion lag |
| **Sev3** | Non-critical issues, cosmetic bugs | Preview deploy failures, dashboard hiccups |

---

## 🔥 Sev1: Production Outage / Incorrect AI Answers

### Triggers
- API returns ≥ 5% 5xx responses for >5 mins.
- AI system returns incorrect/harmful data confirmed by multiple users.
- Data corruption impacting dashboards or AI responses.

### Immediate Actions
1. **Declare Incident** in Slack `#alerts` with timestamp + summary.
2. **Assign Roles**: Incident Commander (IC), Communications, Subject Matter Expert (SME).
3. **Stabilize**:
   - Roll back to last known good deployment (`vercel rollback`, `railway rollback`).
   - Disable AI feature flag (`ai_query_enabled=false`) if AI-specific issue.
4. **Protect Data**: Switch database to read-only if corruption suspected.

### Diagnostics
- Check Grafana dashboards for spikes.
- Inspect logs with correlation IDs.
- Run `scripts/ops/check_health.py` for quick system status.
- Validate AI outputs by replaying last queries (`scripts/ai/replay_query.py`).

### Mitigation
- Deploy hotfix or revert offending change.
- Refresh embeddings or rebuild materialized views if data issue.
- Regenerate prompts or adjust guardrails when AI misbehavior occurs.

### Communication
- Update status every 15 min in `#alerts` + incident doc.
- Email stakeholders if outage >30 min.

### Recovery
- Validate system health via smoke tests.
- Remove temporary mitigations (restore read/write, re-enable features).

---

## ⚠️ Sev2: Degraded Performance / Data Delays

### Triggers
- AI latency p95 > 2s for 10 min.
- ETL lag > 2 hours.
- Embeddings older than 24 hours.

### Immediate Actions
1. Investigate dashboards for root cause (OpenAI throttling, DB contention, job failures).
2. Scale services if resources constrained (increase Railway instance, add Vercel concurrency).
3. Rerun failed jobs (`railway run python app/jobs/...`).

### Diagnostics
- Latency: inspect Prometheus metrics, database slow query logs.
- ETL: check ingestion audit tables, `ingestion_failures` entries.
- Embeddings: run drift script, confirm job succeeded.

### Mitigation
- Adjust caching, limit concurrent AI requests, or degrade gracefully (cached responses).
- Trigger manual job run; if external API issue, throttle requests and queue for later.

### Communication
- Inform stakeholders via Slack `#operations`; provide ETA for resolution.

---

## ℹ️ Sev3: Non-Critical Issues

### Examples
- Preview deployment failure.
- Single integration failing (e.g., Strava webhook glitch) without impacting production.
- Minor dashboard inaccuracies.

### Actions
- Create ticket in backlog.
- Schedule fix during working hours.
- Document in `PROJECT_HISTORY` if user visible.

---

## 📝 Post-Incident Checklist
1. Complete incident report (Notion template) within 24 hours.
2. Update runbook with new learnings.
3. Add remediation tasks to backlog (with owners + due dates).
4. Notify stakeholders once resolved.
5. Link incident doc in `docs/knowledge/PROJECT_HISTORY.md`.

---

## 🔗 References
- `docs/operations/MONITORING.md` – Dashboards & alert configurations.
- `docs/operations/CRON_JOBS.md` – Job schedules.
- `docs/data/DATA_QUALITY.md` – Data validation references.
- `docs/ai/EVALUATION.md` – AI quality metrics.
- `docs/frontend/DEPLOYMENT.md`, `docs/backend/DEPLOYMENT.md` – Rollback steps.

---

*Last Updated: October 2, 2025*
