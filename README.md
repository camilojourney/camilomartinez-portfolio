# camilomartinez-portfolio

My personal site and fitness analytics app (WHOOP + Strava), deployed on Vercel.

- Frontend: Next.js
- Backend: FastAPI

## Docs

- [`docs/README.md`](docs/README.md): Navigation and runbooks
- [`docs/overview/PORTFOLIO_OVERVIEW.md`](docs/overview/PORTFOLIO_OVERVIEW.md): Product overview
- [`docs/backend/DEVELOPER_GUIDE.md`](docs/backend/DEVELOPER_GUIDE.md): Backend setup
- [`docs/frontend/README.md`](docs/frontend/README.md): Frontend architecture

## Quick Start

Frontend:

```bash
pnpm install
pnpm dev
```

Backend:

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```


## Workflow: Explore → Plan → Execute → Review

Opus in VS Code plans and launches autonomous CLI agents in the background — the user never leaves the conversation. Agents run via `env -u CLAUDECODE claude --dangerously-skip-permissions --model [model] -p '...'` with output redirected to files. Multiple cycles ensure quality: Sonnet implements, Opus reviews. See `.claude/rules/workflow.md` for full details.

## Environment Variables

This repo ships with safe placeholders in `.env.example`. Secrets should be configured in Vercel env vars (and locally via `.env.local`), never committed.
