# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an AI-driven fitness analytics portfolio platform with a Next.js frontend and FastAPI backend. The platform integrates WHOOP and Strava data, uses PostgreSQL with pgvector for AI-powered analytics, and includes background workers for data synchronization.

**Architecture Pattern**: Hybrid Microservices (transitioning from Modular Monolith)
- Frontend: Next.js 15 on Vercel (separate deployment)
- Backend: FastAPI API on Railway
- Workers: Celery background tasks (separate service)
- Database: PostgreSQL 15 + pgvector + Redis

## Development Commands

### Frontend Development
```bash
# Install dependencies (use pnpm, not npm)
pnpm install

# Start development server (Next.js on port 3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Backend Development
```bash
# Navigate to backend directory
cd backend/

# Install Poetry (if needed)
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Activate virtual environment
poetry shell

# Start FastAPI development server (port 9000)
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 9000

# Run database migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"
```

### Code Quality & Testing

**Frontend:**
```bash
# TypeScript type checking
npx tsc --noEmit

# Linting (ESLint)
pnpm lint
```

**Backend:**
```bash
cd backend/

# Format code
poetry run black .

# Lint code
poetry run ruff .

# Type checking
poetry run mypy .

# Run tests
poetry run pytest

# Run tests with coverage
poetry run pytest --cov=app --cov-report=html
```

### Data & Database Operations

```bash
# Environment variable management
pnpm env:pull          # Pull environment variables
pnpm env:status        # Check environment status
pnpm env:sync          # Sync env and start dev server

# Database setup and migrations
pnpm db:setup          # Initial database setup
pnpm db:migrate        # Run Strava migration

# Data loading and analysis
pnpm data:load-streets      # Load Astoria streets data
pnpm data:analyze-sleep     # Analyze sleep data
pnpm data:get-workouts      # Fetch workout data

# Testing integrations
pnpm test:db-schema         # Verify database schema
pnpm test:strava            # Test Strava integration
pnpm test:whoop             # Test WHOOP token status
pnpm check:strava           # Check Strava setup
pnpm check:recent-data      # Verify recent data

# Map generation (Astoria Conquest project)
pnpm map:setup              # Generate base map
pnpm map:update             # Update progress
```

### Running Single Tests

**Backend (Python/pytest):**
```bash
cd backend/
poetry run pytest tests/test_specific_file.py              # Single file
poetry run pytest tests/test_specific_file.py::test_name   # Single test
poetry run pytest -k "keyword"                             # Tests matching keyword
```

## Architecture & Code Structure

### High-Level Architecture

**Three-Tier System:**
1. **Experience Layer** (Next.js): UI, data storytelling, AI conversational UX
2. **Orchestration Layer** (FastAPI): REST API, AI gateway with guardrails, integration managers
3. **Data & AI Substrate**: PostgreSQL + pgvector, Redis cache, background workers

**Key Design Principles:**
- Layers communicate through explicit contracts (OpenAPI spec, SQL views, message schemas)
- Cross-layer access requires defined interfaces
- Server Components by default, client components only when needed
- Async-first patterns throughout (FastAPI + SQLAlchemy 2.0)

### Domain Boundaries

| Domain | Responsibility | Location |
|--------|----------------|----------|
| **Experience** | UI/UX, storytelling, AI chat | `src/app`, `src/components` |
| **Orchestration** | API exposure, auth, coordination | `backend/app/routers`, `backend/app/services` |
| **AI Cognition** | Retrieval, reasoning, evaluation | `backend/app/services/ai` |
| **Data Platform** | Storage, ETL, analytics | `backend/app/models`, SQL migrations |
| **Integrations** | OAuth, data ingestion (WHOOP/Strava) | `backend/app/integrations` |

### Frontend Structure (`src/`)
```
app/
├── (marketing)/      # Public pages (SSG/ISR)
├── (analytics)/      # Authenticated dashboards (SSR)
├── (ai)/             # AI assistant (streaming)
└── api/              # Legacy API routes (being migrated to FastAPI)

components/
├── ui/               # Design system primitives
├── charts/           # Visualization components (lazy loaded)
├── features/         # Domain composites (WhoopCard, StravaTimeline)
└── layout/           # Navigation shells (Navbar, Sidebar, Footer)

lib/
├── api/              # REST clients, fetch wrappers
├── hooks/            # Custom React hooks
├── utils/            # Pure utilities (formatters, validators)
└── validations/      # Zod schemas (client ↔ server)
```

**Rendering Strategy:**
- Static Generation (SSG/ISR): `/`, `/projects`, `/blog`
- Server-Side Rendering (SSR): `/whoop-dashboard`, `/analytics`
- Streaming: `/ai/coach` uses Server Components + Suspense
- Client Components: Dashboard widgets with interactivity

### Backend Structure (`backend/app/`)
```
config/         # Database setup, environment configuration
models/         # Pydantic models & SQLAlchemy schemas
routers/        # API endpoints organized by domain
services/       # Business logic layer
  ├── ai/       # RAG pipeline, embeddings, evaluation
  └── ...       # Other service modules
utils/          # Utilities & helpers
middleware/     # FastAPI middleware
scripts/        # Data processing & automation
  └── astoria/  # Astoria Conquest map generation
```

### Data Architecture

**Storage Strategy:**
- **Operational Store**: PostgreSQL with normalized tables (WHOOP, Strava, app data)
- **AI Serving Layer**: Denormalized materialized views (`daily_fitness_snapshot`, `run_performance_details`, etc.)
- **Vector Store**: `schema_embeddings` + `document_embeddings` with HNSW indexes
- **Telemetry**: `query_history`, `evaluation_cycles`, `ai_feedback` for traceability

**Data Flow:**
```
[WHOOP/Strava APIs] → Celery Workers → PostgreSQL Core Tables
                                            ↓
                        ┌───────────────────┴──────────────────┐
                        ↓                                       ↓
            Materialized Views (AI)                  Analytics Schemas
                        ↓                                       ↓
            Embedding Service                         Dashboards
```

### AI Cognition Layer (RAG Pipeline)

**7-Step Process:**
1. Question Intake → `POST /api/ai/query`
2. Schema Retrieval → Vector search (cosine similarity, HNSW)
3. Planning → GPT-4o generates reasoning + SQL skeleton
4. Validation → Secondary LLM reviewer + regex guards + SQL AST parser
5. Execution → Read-only transaction with timeout + row limits
6. Narrative Response → LLM synthesizes answer with citations
7. Telemetry & Feedback → Persisted in `query_history`

**Safety Guardrails:**
- Parameterized SQL builder (no string interpolation)
- Disallowed keyword filter (DDL/DML blocked)
- Sandbox PostgreSQL role for AI queries
- Automated evaluator scoring precision/recall

## Critical Implementation Details

### TypeScript Path Aliases
The project uses `@/*` path aliases mapping to `./src/*`. Always use these for imports:
```typescript
import { Component } from '@/components/ui/component'
import { util } from '@/lib/utils'
```

### Environment Variables & Secrets

**Token Storage Architecture:**
- **Static Config**: API keys, database URLs stored in `.env` (root) or `.env.local`
- **Dynamic Tokens**: Strava/WHOOP OAuth tokens stored in **database** (not `.env`)
- Tokens require automatic refresh cycles managed by database services

**Never hardcode secrets.** For backend, use environment variables. For scripts:
```bash
API_KEY=$(command_to_get_secret)  # Store in variable
api_command --key=$API_KEY        # Use variable, never echo
```

### File Creation Protocol (from GitHub Copilot Instructions)

**STRICT RULE: NEVER create new files without explicit permission.**

1. Explain why a new file is necessary
2. State the proposed file path and purpose
3. Get explicit approval ("Yes, create that file")
4. Always state the file path in code blocks: `// 📂 src/components/NewComponent.tsx`

**Project Structure Conventions:**
- Application code: `src/app/`, `src/components/`, `src/lib/`, `src/types/`
- Development scripts: `scripts/data/`, `scripts/testing/`, `scripts/dev/`, `scripts/db/`
- Backend code: `backend/app/`
- Documentation: `docs/`
- Configuration: root level

### Code Change Format (from GitHub Copilot Instructions)

Use diff blocks to show modifications:
```diff
// 📂 path/to/file.ts

  function example() {
-   // Old implementation
-   const old = true;
+   // New implementation
+   const improved = true;
    return improved;
  }
```

### Database Migrations

**Always use Alembic for schema changes:**
1. Modify SQLAlchemy models in `backend/app/models/`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review generated migration in `backend/alembic/versions/`
4. Apply migration: `alembic upgrade head`
5. Document in `docs/data/SCHEMA.md`

### Testing Philosophy

**Backend:**
- Pytest with async support (`pytest-asyncio`)
- Coverage target: `--cov=app`
- Test files: `tests/test_*.py` or `tests/*_test.py`

**Frontend:**
- Component tests co-located: `src/features/<domain>/*.test.tsx`
- Testing Library for component tests
- Storybook for visual testing (optional)

## Performance & Quality Targets

**Frontend:**
- Bundle Size: < 100 KB JS per critical route (post-gzip)
- Lighthouse Score: ≥ 98
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

**Backend:**
- API Latency: < 200 ms p95 for reads
- Availability: 99.9%
- AI Response Explainability: 100% with provenance

## Integration Details

### WHOOP Integration
- OAuth2 flow for authentication
- Tokens stored in database (not `.env`)
- Endpoint: `POST /api/whoop/collect`
- Health check: `GET /api/integrations/health`

### Strava Integration
- OAuth2 flow for authentication
- Tokens stored in database with auto-refresh
- Sync endpoints: `GET /api/strava/sync/status`, `POST /api/strava/sync/weekly`
- Used for Astoria Conquest project (map generation)

### OpenAI Integration
- Primary model: GPT-4o (fallback: GPT-4o-mini)
- Embeddings: text-embedding-3-small
- Rate limiting: 5 queries/day with bypass tokens
- API key in `.env.local`

## Documentation Map

**Essential References:**
- [`docs/README.md`](docs/README.md) - Master documentation hub
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - System architecture blueprint
- [`docs/backend/DEVELOPER_GUIDE.md`](docs/backend/DEVELOPER_GUIDE.md) - Backend setup & API reference
- [`docs/frontend/README.md`](docs/frontend/README.md) - Frontend architecture & components
- [`docs/data/SCHEMA.md`](docs/data/SCHEMA.md) - Database schema & DDL
- [`docs/ai/RAG_SYSTEM.md`](docs/ai/RAG_SYSTEM.md) - AI pipeline details

**Role-Based Entry Points:**
- Full-Stack Engineers: Start with `docs/GETTING_STARTED.md` → `docs/ARCHITECTURE.md`
- AI/ML Engineers: `docs/ai/README.md` → `docs/ai/RAG_SYSTEM.md`
- Data Engineers: `docs/data/README.md` → `docs/data/SCHEMA.md`
- Operations: `docs/operations/README.md` → `docs/operations/MONITORING.md`

## Deployment

**Frontend (Vercel):**
- Git-based deployments
- Preview branches per PR
- ISR support for static pages
- Edge functions for API routes

**Backend (Railway):**
- Container deployment from Dockerfile
- Environment variables via Railway dashboard
- Managed PostgreSQL + Redis
- Blue/green deployment strategy

**Workers (Railway):**
- Celery background tasks
- Auto-scaling based on queue depth
- Separate service from API

## Common Gotchas

1. **Use pnpm, not npm** - The project uses pnpm for frontend dependencies
2. **Backend runs on port 9000** - Not 8000, not 3000
3. **Dynamic tokens in database** - Strava/WHOOP tokens are NOT in `.env`
4. **Path aliases** - Always use `@/` for imports, not relative paths
5. **Server Components first** - Client components only when interactivity needed
6. **Alembic for migrations** - Never modify database schema manually
7. **Poetry for Python** - Use `poetry run` prefix for all Python commands
8. **Async patterns** - Backend is async-first (FastAPI + SQLAlchemy 2.0)
