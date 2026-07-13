# 002 - Current Features

## Core Features

### 1. Fitness Data Ingestion
**How it Works**:
- OAuth flows via `/api/integrations` (Strava/WHOOP).
- Scripts: `scripts/data/get-workout-data.js`, `load-astoria-streets.js`.
- Decodes polylines (@mapbox/polyline, Turf.js).
- Stores: Postgres tables (workouts, sleep, geo).

**Endpoints**:
- `POST /api/integrations/strava/webhook`
- `GET /api/analytics/workouts`

### 2. Dashboards & Visualizations
**Pages** (`src/app/`):
- `/whoop-dashboard`: Recovery/strain charts (Recharts).
- `/ai-trainer`: AI recommendations.
- `/(main)`: Landing/portfolio views.
- Maps: Leaflet + Turf for Astoria conquest (walkability).

**Tech**:
- Framer Motion (animations).
- MDX for project docs.

### 3. AI Insights
**Routers** (`/api/ai`):
- OpenAI-compatible chat integration for analytics.
- RAG over schema/docs (pgvector embeddings).
- Rate-limited (Redis, 5/day free).

**Examples**:
- Sleep optimization.
- Training load balancing.

### 4. Authentication & Security
- NextAuth v5 (providers: credentials/OAuth).
- Backend: JWT (python-jose), bcrypt.
- Middleware: Rate limits, CORS.

### 5. Admin & Tools
- `/api/ai-admin`: Human-in-loop.
- `/api/tools`: Utilities (e.g., map generation).
- Health: `/health`, `/`.

### 6. Geo-Spatial (Astoria Conquest)
- OSMnx + geopandas for street networks.
- Scripts: `map:setup`, `map:update`.
- Turf.js for bbox, convex hull, etc.

## Feature Matrix

| Feature | Status | Dependencies | Tests |
|---------|--------|--------------|-------|
| Data Ingestion | ✅ Live | Strava/WHOOP API | `test:strava` |
| Dashboards | ✅ Live | Recharts/Leaflet | Manual |
| AI Insights | ✅ Beta | OpenAI-compatible chat provider | `test:whoop` |
| Auth | ✅ Live | NextAuth | - |
| Maps | ✅ MVP | Turf/OSMnx | `db:setup` |
| Rate Limiting | ✅ Enforced | Redis | - |

## Acceptance Criteria
- [ ] All pages render without errors.
- [ ] Data flows: Wearable → DB → Viz.
- [ ] AI generates coherent insights.
- [ ] Maps interactive (zoom/pan).
