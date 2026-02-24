# Vision — camilomartinez-portfolio

**Last updated:** 2026-02-24

## What It Is

A personal portfolio and fitness analytics platform for Camilo Martinez — data scientist and AI engineer. The site combines two purposes:

1. **Portfolio showcase** — Projects, writing, and professional background targeted at hiring managers and potential consulting clients in the AI/data space.
2. **Personal fitness dashboard** — An end-to-end analytics platform that pulls data from WHOOP (HRV, sleep, recovery) and Strava (runs, rides, workouts), runs analytics, and surfaces actionable performance insights.

## Who It's For

- **Primary:** Hiring managers and technical leads at AI-forward companies evaluating Camilo as a candidate or consultant.
- **Secondary:** Camilo himself, for daily fitness monitoring and trend analysis.

## What Success Looks Like

- **Inbound inquiries:** At least 2-3 qualified inbound contacts per month from target companies or consulting prospects who found the site organically.
- **Credibility signal:** The live fitness dashboard demonstrates production-grade engineering — real data, real integrations, real infrastructure.
- **Data freshness:** WHOOP and Strava data is never more than 24 hours stale. A stale dashboard undermines the credibility signal.
- **Performance:** Core Web Vitals all green. A slow or broken site is worse than no site.

## What It Is Not

- Not a social product. No user accounts for visitors, no sharing features.
- Not a blog platform (yet). Writing may be added as a future section.
- Not a general-purpose fitness app. It tracks one person's data.

## Strategic Bets

1. **Show, don't tell.** The dashboard is the resume — it demonstrates data engineering, API integration, analytics, and frontend polish simultaneously.
2. **Live beats static.** A working production system with real data is more compelling than screenshots or demos.
3. **Quality over quantity.** Two polished case studies beat ten mediocre project cards.

## Constraints

- Free-tier infrastructure (Vercel + Render) until revenue or employment justifies upgrading.
- No PII beyond the owner's own fitness data.
- OAuth scopes for WHOOP and Strava must remain minimal — request only what the dashboard actually displays.
