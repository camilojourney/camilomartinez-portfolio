# 🚀 Frontend Deployment & Delivery

> **Status:** Production · **Target:** Vercel Edge Network · **Last Updated:** October 2, 2025  
> **Owner:** Frontend Guild · **Reviewer:** DevOps Guild

---

## TL;DR
- Deployments are Git-driven via Vercel; every PR yields a preview URL with environment parity.
- Key variables live in Vercel project settings; secrets must never be committed.
- Post-deploy validation scripts run Lighthouse, end-to-end tests, and AI chat smoke checks before promotion.

---

## Table of Contents
- [🛠️ Environments](#️-environments)
- [🔑 Environment Variables](#-environment-variables)
- [📦 Build Pipeline](#-build-pipeline)
- [✅ Post-Deploy Verification](#-post-deploy-verification)
- [📉 Monitoring & Observability](#-monitoring--observability)
- [♻️ Rollback & Disaster Recovery](#️-rollback--disaster-recovery)
- [🔗 References](#-references)

---

## 🛠️ Environments

| Environment | Branch | Domain | Purpose |
|-------------|--------|--------|---------|
| **Preview** | Any PR | `https://<hash>-camilomartinez.vercel.app` | QA, stakeholder demos |
| **Staging** | `develop` (optional) | `https://staging.camilomartinez.com` | Integration testing |
| **Production** | `main` | `https://camilomartinez.com` | Public site |

> All environments share the same Next.js build pipeline; feature flags gate experimental UI.

---

## 🔑 Environment Variables

| Variable | Description | Required | Scope |
|----------|-------------|----------|-------|
| `NEXT_PUBLIC_API_URL` | Backend FastAPI base URL | ✅ | Preview/Staging/Prod |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend observability | ✅ | Staging/Prod |
| `OPENAI_PROJECT_ID` | (Optional) Project scoping for usage analytics | ⛔ | Server-only |
| `NEXT_PUBLIC_GA_ID` | Analytics (if enabled) | ⛔ | Prod |
| `NEXT_TELEMETRY_DISABLED` | Disable Next telemetry in CI | ✅ | Preview |

Manage via Vercel CLI:
```bash
vercel env pull .env.local
vercel env ls
vercel env add NEXT_PUBLIC_API_URL production
```

> Use `pnpm envcheck` to ensure required variables are present locally.

---

## 📦 Build Pipeline

1. **Install**
   ```bash
   corepack enable
   pnpm install --frozen-lockfile
   ```
2. **Build**
   ```bash
   pnpm build
   ```
   - Next.js automatically generates `.next/` artifacts.
   - Image domains defined in `next.config.js`.
3. **Test**
   ```bash
   pnpm lint
   pnpm test -- --runInBand
   pnpm typecheck
   ```
4. **Deploy**
   ```bash
   vercel --prod  # Production only; preview handled automatically
   ```

CI/CD (`.github/workflows/frontend.yml`) mirrors these steps; failures block merges.

---

## ✅ Post-Deploy Verification

- **Playwright Smoke** (`pnpm test:e2e -- --project=chromium`)
- **AI Chat Sanity** (`scripts/smoke/aiChatSmoke.ts` hitting `/ai/coach`)
- **Lighthouse CI** (`pnpm exec lhci autorun` – target ≥ 95 desktop/mobile)
- **Sentry Release** (`sentry-cli releases finalize $VERSION`)

Add results to release notes (GitHub Release or Notion entry).

---

## 📉 Monitoring & Observability

- **Sentry** – Error tracking (breadcrumbs, user context disabled by default).
- **Vercel Analytics** – Web vitals (CLS, LCP, FID) across environments.
- **Log Drains** – Export Vercel logs to Datadog/Loki for long-term retention.
- **Synthetic Monitoring** – UptimeRobot/Cronitor checks `/health` endpoint every 1 min.

Alert thresholds defined in `docs/operations/MONITORING.md`.

---

## ♻️ Rollback & Disaster Recovery

1. `vercel rollback <deploymentId>` to revert quickly.
2. Re-deploy previous tag via `vercel --prod --scope camilojourney --env=production --target <commit>`.
3. Update incident log in `docs/operations/RUNBOOKS.md`.

Vercel retains previous builds automatically (immutable deploys).

---

## 🔗 References
- `docs/frontend/README.md` – Architectural context.
- `docs/backend/DEPLOYMENT.md` – Backend release coordination.
- `docs/operations/RUNBOOKS.md` – Incident response procedures.
- `docs/operations/MONITORING.md` – Alert routing and dashboards.

---

*Last Updated: October 2, 2025*
