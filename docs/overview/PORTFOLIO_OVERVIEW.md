# Portfolio Overview

> This document is a high-level orientation. For deep dives, start at `docs/README.md`.

## TL;DR
This repository powers an AI-driven fitness analytics platform:
- Frontend: Next.js (App Router) in `src/`
- Backend: FastAPI in `backend/`
- Data: Postgres, materialized views, and ETL workflows
- Integrations: WHOOP + Strava ingestion pipelines

## What Runs Where
- User-facing UI: Next.js routes in `src/app/`
- API endpoints: Next.js route handlers in `src/app/api/`
- Backend services: `backend/app/` (data ingestion, analysis, scripts)
- Operational automation: GitHub Actions in `.github/workflows/`

## Security Model (Important)
- Secrets are never committed to git.
- Production secrets are stored in Vercel/Render environment variables.
- GitHub Actions uses repository secrets for scheduled triggers.

## Getting Started
1. Read `docs/GETTING_STARTED.md`.
2. Follow backend setup in `docs/backend/DEVELOPER_GUIDE.md`.
3. Follow frontend setup in `docs/frontend/README.md`.

