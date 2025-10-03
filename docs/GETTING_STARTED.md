# 🚀 Getting Started Guide

> **Status:** Production-Ready · **Audience:** New & Returning Engineers · **Last Updated:** October 2, 2025  
> **Maintainers:** Platform Engineering Guild (Camilo Martinez, AI Assistant)

---

## TL;DR
- You can launch the full stack (frontend, backend, data services, AI copilots) locally in under 30 minutes with the workflows in this guide.
- The golden path uses `pnpm` + `poetry` + Docker; optional FastAPI-only or frontend-only flows are documented for constrained environments.
- Validation steps ensure the AI query engine, embeddings, and data pipelines are functioning before you start building.

---

## Table of Contents
- [✅ Preflight Checklist](#-preflight-checklist)
- [⚙️ Environment Setup](#️-environment-setup)
- [🏃 First 30 Minutes](#-first-30-minutes)
- [🔍 Verification Matrix](#-verification-matrix)
- [🧠 AI Systems Bootstrap](#-ai-systems-bootstrap)
- [📈 Developer Quality Gates](#-developer-quality-gates)
- [🧰 Advanced Tooling & Shortcuts](#-advanced-tooling--shortcuts)
- [🔄 Ongoing Workflow](#-ongoing-workflow)
- [🔗 References](#-references)

---

## ✅ Preflight Checklist

| Item | Command | Notes |
|------|---------|-------|
| Node.js ≥ 18.18 | `node --version` | Use `asdf` or `nvm` to pin version |
| pnpm ≥ 9.0 | `pnpm --version` | Install via `corepack enable` |
| Python 3.11.x | `python3 --version` | Prefer `pyenv` + `poetry env use` |
| PostgreSQL 15 + pgvector | `psql --version` | Local install or Docker (see below) |
| Redis (optional, recommended) | `redis-server --version` | Required for rate limiting & caching |
| Docker Desktop | `docker --version` | For database/queue containers |
| Git | `git --version` | Enable commit signing if available |

> **Tip:** Run `scripts/doctor.sh` after cloning; it validates versions and checks required tooling.

---

## ⚙️ Environment Setup

### 1. Clone & Bootstrap Repository
```bash
# Clone
git clone https://github.com/camilojourney/camilomartinez-portfolio.git
cd camilomartinez-portfolio

# Install frontend dependencies
corepack enable
pnpm install

# Install backend dependencies
cd backend
poetry install
cd ..
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```
Update both files with credentials. Reference `docs/integrations/README.md` for OAuth setup.

**Minimum Required Keys**
- `DATABASE_URL` – PostgreSQL connection string
- `REDIS_URL` – Redis connection (fallback to `redis://localhost:6379/0`)
- `OPENAI_API_KEY` – For embeddings and GPT calls
- `WHOOP_*`, `STRAVA_*` – OAuth credentials (optional for initial setup)
- `NEXT_PUBLIC_API_URL` – Defaults to `http://localhost:8000`

> Store secrets securely (1Password, Bitwarden). Never commit `.env` files.

### 3. Launch Infra Dependencies (Docker)
```bash
# Start PostgreSQL with pgvector + Redis
make up-infra    # Equivalent: docker compose up -d

# Seed vector extension (first run)
docker compose exec db psql -U postgres -d portfolio_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

## 🏃 First 30 Minutes

### 0-10 Minutes · Backend API
```bash
pnpm dev:backend  # Runs `uvicorn app.main:app --reload --port 8000`
```
- Swagger UI: http://localhost:8000/docs
- Health check: `curl http://localhost:8000/api/system/health`
- Verify database migrations: `alembic current`

### 10-20 Minutes · Frontend Experience
```bash
pnpm dev:frontend  # Next.js App Router on http://localhost:3000
```
- Check `http://localhost:3000`
- Verify proxy calls to backend via Network tab
- Confirm no ESLint or TypeScript errors in terminal

### 20-30 Minutes · Data & AI
```bash
# Populate sample data (creates synthetic WHOOP/Strava data)
pnpm exec ts-node scripts/seed/mockFitnessData.ts

# Refresh embeddings for AI query engine
pnpm exec ts-node scripts/ai/refreshEmbeddings.ts
```
- Run smoke query: `curl http://localhost:8000/api/ai/query?question=How+was+my+sleep+last+week`.
- Inspect logs for similarity scores and SQL output (`backend/app/logs/ai.log`).

---

## 🔍 Verification Matrix

| System | Verification | Command / URL | Expected |
|--------|--------------|---------------|----------|
| Frontend | Smoke test | Browser → `/` | Hero sections render, charts load |
| Backend | Health | `curl http://localhost:8000/api/system/health` | Status `healthy` |
| Database | Migration | `alembic current` | `head` |
| Data Pipeline | Seed script | `pnpm exec ts-node scripts/seed/mockFitnessData.ts` | Inserts 100+ records |
| AI Embeddings | Refresh script | `pnpm exec ts-node scripts/ai/refreshEmbeddings.ts` | Reports embeddings regenerated |
| RAG Query | API call | `curl http://localhost:8000/api/ai/query?question=...` | JSON with `sql` + `answer` |
| Lint | Frontend | `pnpm lint` | Pass |
| Tests | Backend | `cd backend && poetry run pytest` | Pass |

---

## 🧠 AI Systems Bootstrap

### Regenerating Embeddings
```bash
# Refresh schema + knowledge embeddings
pnpm exec ts-node scripts/ai/refreshEmbeddings.ts --full
```
- Uses `docs/ai/EMBEDDINGS.md` manifest to determine canonical sources.
- Rebuilds HNSW index; monitor logs for embedding drift warnings.

### Validating Prompt Library
```bash
pnpm exec ts-node scripts/ai/promptLint.ts
```
- Ensures every prompt in `docs/ai/PROMPTS.md` has evaluation metadata and guardrails.

### AI Trainer Cycles
```bash
cd backend
poetry run python app/jobs/run_trainer_cycle.py --limit 20
```
- Generates synthetic questions, runs through pipeline, stores evaluations in `evaluation_cycles` table.
- Review results in `docs/ai/EVALUATION.md` for interpretation guide.

---

## 📈 Developer Quality Gates

1. **Static Analysis**
   ```bash
   pnpm lint
   pnpm typecheck
   cd backend && poetry run ruff check
   ```
2. **Tests**
   ```bash
   pnpm test          # Frontend unit tests (Vitest)
   cd backend && poetry run pytest -q
   ```
3. **Documentation Sync**
   ```bash
   pnpm exec ts-node scripts/docs/validateStructure.ts
   ```
4. **AI Safety**
   ```bash
   pnpm exec ts-node scripts/ai/validateSqlGuards.ts
   ```

> **Fail fast:** Do not open PRs with failing gates. Use branch protection + GitHub Actions to enforce.

---

## 🧰 Advanced Tooling & Shortcuts

- **Taskfile**: `task --list` (mirrors Makefile with richer UX).
- **VS Code Profile**: `.vscode/extensions.json` lists required plugins (ESLint, Tailwind, Python, Mermaid).
- **Dev Containers**: `.devcontainer/` configuration spins up reproducible environments (Docker + VS Code).
- **Observability**: Launch Grafana/Prometheus stack locally (`make up-observability`). Dashboards map to `docs/operations/MONITORING.md`.
- **Data Science Sandbox**: `notebooks/` contains Jupyter notebooks pre-wired to `.env` credentials.

---

## 🔄 Ongoing Workflow

1. **Daily**
   - Pull latest `main` (`git pull --rebase`) and rerun `pnpm install` if lockfile changed.
   - `pnpm dev` for combined frontend/backend (`concurrently` script).
   - Update changelog and docs for features touched.
2. **Weekly**
   - Refresh embeddings and regenerate synthetic data.
   - Review AI evaluation reports; adjust prompts as needed.
3. **Monthly**
   - Run full security scan: `pnpm audit`, `poetry run pip-audit`.
   - Smoke deploy to staging; verify runbooks.

---

## 🔗 References
- `docs/ARCHITECTURE.md` – Understand system boundaries before changing code.
- `docs/ai/EMBEDDINGS.md` – Embedding pipelines and drift mitigation.
- `docs/integrations/README.md` – WHOOP/Strava/OpenAI credential setup.
- `docs/operations/RUNBOOKS.md` – Deployment, monitoring, and incident response.
- `scripts/README.md` – Automation entry points for the entire stack.

---

*Last Updated: October 2, 2025*
