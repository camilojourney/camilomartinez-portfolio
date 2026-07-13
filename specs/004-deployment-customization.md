# Camilo Martinez Portfolio - Deployment & Customization Guide

## Quick Start (Local)
```bash
cd /Users/mini/.openclaw/workspace/github/camilomartinez-portfolio/
pnpm install
cd backend && uv sync  # or poetry install
pnpm dev:all  # Starts frontend:3000 + backend:8000
```

**Env Setup**:
- Copy `.env.example` → `.env`
- Add `DATABASE_URL`, Strava/WHOOP OAuth creds, and one chat provider key:
  `AI_PROXY_API_KEY`, `GROQ_API_KEY`, or `OPENAI_API_KEY`.

**DB**:
```bash
# Backend
cd backend && alembic upgrade head
# Or scripts: pnpm db:setup, pnpm db:migrate
```

## Production Deployment
### Frontend (Vercel)
1. `pnpm build` → `next start`
2. Connect GitHub repo to Vercel.
3. Env vars: `NEXT_PUBLIC_API_URL=https://backend.render.com`
```
vercel.json:
{
  "rewrites": [{ "source": "/api/:path*", "destination": "https://backend-url/api/:path*" }]
}
```

### Backend (Render/Docker)
```yaml
# render.yaml (example)
services:
  - type: web
    name: camilo-analytics-backend
    env: python
    buildCommand: poetry install && alembic upgrade head
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
COPY . /app
WORKDIR /app
RUN poetry install --no-dev
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Customization Guide
1. **Branding**: Edit `src/app/layout.tsx`, Tailwind `tailwind.config.js` (Geist font).
2. **New Feature**:
   - Frontend: Add route group `src/app/(new)/page.tsx` + server action.
   - Backend: New router `backend/app/routers/new.py` → include in `main.py`.
3. **Data Sources**: Extend `integrations.py` router, add OAuth in `.env`.
4. **AI Prompts**: Customize in `backend/app/services/ai/` for backend RAG or `src/app/api/chat/route.ts` for the portfolio chat prompt.
5. **Maps**: Update `pnpm map:setup` for custom GeoJSON (Astoria streets example).

**Scripts**:
| Script | Purpose |
|--------|---------|
| `pnpm env:sync` | Pull env vars |
| `pnpm test:strava` | Integration tests |
| `pnpm data:get-workouts` | Load sample data |

## Monitoring & Scaling
- **Vercel**: Speed Insights, Analytics.
- **Backend**: `/api/system/health`, Prometheus-ready metrics.
- **Scale**: Redis cluster for rate-limits, pgvector partitioning.

*Generated: 2026-02-07*
