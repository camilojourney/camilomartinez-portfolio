# Roadmap — camilomartinez-portfolio

**Last updated:** 2026-02-24

## Now (Active Sprint)

| Item | Priority | Notes |
|------|----------|-------|
| WHOOP + Strava OAuth token refresh reliability | P0 | 6h Strava TTL is the critical path |
| Backend service layer — implement data fetching | P0 | Several services are empty stubs |
| ALLOW_PUBLIC_DASHBOARD_DATA flag enforcement | P1 | Must default to false, checked server-side |
| Fix any WCAG 2.1 AA violations | P1 | Mission C: UX quality |
| Core Web Vitals — pass all green | P1 | LCP <2.5s, CLS <0.1 |

## Next (Planned)

| Item | Priority | Notes |
|------|----------|-------|
| Add 2-3 detailed project case studies | P1 | Replace placeholder project cards |
| Blog/writing section | P2 | Showcases thinking, improves SEO |
| Analytics for visitor engagement | P2 | Simple, privacy-respecting (no third-party trackers) |
| WHOOP weekly/monthly trend views | P2 | Rolling averages, best-week highlights |
| Mobile nav improvement | P2 | Current hamburger menu needs polish |

## Later (Backlog)

| Item | Notes |
|------|-------|
| Automated weekly fitness summary email | Self-addressed, no third-party |
| Strava route map visualizations | Leaflet/MapLibre integration |
| AI-generated insights from HRV + sleep data | Summarize patterns, flag anomalies |
| Dark mode | Tailwind dark: variant — design spec needed first |
| Resume PDF download | Auto-generated from structured data |

## Explicitly Out of Scope

- Multi-user accounts or social features
- Monetization / paywalls
- Third-party analytics that track visitor PII
- Switching away from Next.js + FastAPI stack

## Done (Reference)

| Item | Completed |
|------|-----------|
| Initial Next.js + FastAPI scaffold | 2026-02 |
| WHOOP OAuth 2.0 integration | 2026-02 |
| Strava OAuth 2.0 integration | 2026-02 |
| Vercel + Render deployment pipeline | 2026-02 |
