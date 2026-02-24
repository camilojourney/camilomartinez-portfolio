# Memory — camilomartinez-portfolio

## Domain Knowledge

- Next.js + FastAPI fitness analytics portfolio site, deployed on Vercel (frontend) + Render (backend)
- External integrations: WHOOP API (HRV, sleep, recovery) and Strava API (runs, rides, workouts)
- Strava OAuth tokens expire every 6 hours — this is the most critical reliability risk
- WHOOP tokens expire less frequently but must also auto-refresh on 401
- Tokens stored in PostgreSQL via Vercel Postgres
- TypeScript strict mode on frontend, Python type hints on backend
- Tailwind CSS for all styling, Vitest for frontend tests, pytest for backend tests
- pnpm as package manager, uv for Python package management
- ALLOW_PUBLIC_DASHBOARD_DATA must default to false (health data is personal)
- CRON_SECRET must be validated on all cron/sync endpoints
- next-auth version is a beta (5.0.0-beta.30) — monitor for security advisories

## Lessons Learned

(none yet — first cycle)

## Last Updated

2026-02-24 (initial scaffold)
