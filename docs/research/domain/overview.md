# Domain Profile: camilomartinez-portfolio

## Domain

Personal portfolio + live fitness analytics platform. Dual-purpose site: professional showcase for hiring managers / consulting clients, and a live fitness dashboard pulling from WHOOP and Strava APIs. The live dashboard is the product differentiator — it demonstrates production-grade engineering and must never go stale.

## Non-Obvious Constraints

- **OAuth token refresh is the most critical path.** Strava tokens expire every 6 hours. WHOOP tokens also require refresh. If refresh fails silently, the dashboard shows stale data — which undermines the entire credibility purpose of the site. Token refresh must be proactive, not reactive.
- **Data freshness is a credibility signal.** The dashboard exists to show "I build production systems with real data." A stale dashboard (data >24h old) is worse than no dashboard — it signals the site is broken and unmonitored.
- **ALLOW_PUBLIC_DASHBOARD_DATA defaults to false.** HRV, sleep quality, and recovery scores are personal health data. Never make this public by default. The flag exists but defaults off.
- **Free-tier infrastructure constraints.** Vercel (frontend) + Render (backend) free tiers have cold start delays and memory limits. Do not add dependencies that push the backend over Render free tier RAM. Render free tier spins down after 15 minutes of inactivity — factor this into dashboard load time expectations.
- **Core Web Vitals must be green.** A slow portfolio is worse than no portfolio. Hiring managers form an opinion in 3 seconds. Image optimization, lazy loading, and font preloading are not optional polish — they are credibility gates.
- **OAuth scopes must be minimal.** WHOOP and Strava grant scopes during the OAuth flow. Only request scopes that the dashboard actually uses. Overly broad scopes are a privacy concern and may trigger security review by cautious companies.
- **Ingestion pipelines must not break.** GitHub Actions cron jobs (`cron-daily-data-fetch.yml`, `cron-strava-monday-sync.yml`) keep data fresh. Downstream analytics depend on continuous ingestion. A broken pipeline means stale data = broken credibility signal.
- **No PII beyond owner's fitness data.** The site tracks one person's data. Visitor tracking, contact form submissions, or any third-party PII collection requires explicit consent and privacy policy.

## Production Environment

- **Frontend:** Vercel (Next.js App Router, edge functions for some routes)
- **Backend:** Render (FastAPI, free tier — note cold start ~15s after inactivity)
- **Database:** Vercel Postgres (token storage, fitness data)
- **External APIs:** WHOOP API (HRV, sleep, recovery, strain), Strava API (activities: runs, rides, workouts)
- **CI/CD:** GitHub Actions (test on PR, cron jobs for data sync)
- **Deployment:** Vercel auto-deploys on push to main; Render auto-deploys on push to main
- **Cost:** Free tier for both hosting services until revenue/employment justifies upgrade

## Known Anti-Patterns

- **Exposing auth tokens in Next.js client bundle:** `NEXTAUTH_SECRET`, `WHOOP_CLIENT_SECRET`, `STRAVA_CLIENT_SECRET` are server-side only. `NEXT_PUBLIC_` vars are visible in the browser — never use NEXT_PUBLIC_ for secrets.
- **Polling WHOOP/Strava in request handlers:** These APIs have rate limits. Ingestion happens via cron jobs, not on page load. Pages read from the database, not from the APIs.
- **Breaking ingestion without testing:** The cron jobs (`cron-daily-data-fetch.yml`) are the heartbeat of the dashboard. A code change that breaks the cron silently fails for 24 hours before anyone notices.
- **Adding large client-side JavaScript bundles:** Hurts Core Web Vitals. Use server components where possible, lazy load heavy client components.
- **Making fitness data public before enabling the flag:** The default is private. A deploy that enables public access by accident exposes personal health data.

## Glossary

- **HRV:** Heart Rate Variability. A key WHOOP metric for recovery and readiness. High HRV = well-recovered. Measured during sleep.
- **Strain:** WHOOP's measure of cardiovascular load. Scale 0-21. High strain from intense workouts.
- **Recovery Score:** WHOOP's daily readiness indicator (0-100%). Composite of HRV, RHR, and sleep quality.
- **FTP:** Functional Threshold Power. A cycling performance benchmark (watts). Used by Strava for training zone calculations.
- **Core Web Vitals:** Google's page experience metrics — LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift). Green = good SEO + user experience.
- **BFF:** Backend For Frontend. The Next.js API routes (`src/app/api/`) act as a BFF — proxying backend data, handling auth token management, and transforming responses for the frontend.
- **Render cold start:** Render free tier spins down inactive services after 15 minutes. First request after inactivity takes ~15 seconds. Not a bug — a free tier behavior. Users should see a loading state, not a broken page.
- **launchd:** Not used here — scheduling via GitHub Actions cron workflows instead.
