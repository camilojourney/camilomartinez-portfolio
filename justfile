# Default: show available commands
default:
    @just --list

# ─── Development ──────────────────────────────────

# Start all services (frontend + backend)
dev:
    pnpm dev:all

# Start frontend only
dev-frontend:
    pnpm dev

# Start backend only
dev-backend:
    cd backend && uv run uvicorn app.main:app --reload --port 8000

# ─── Quality ──────────────────────────────────────

# Run all checks (lint + test)
check: lint test

# Lint
lint:
    pnpm lint

# Run frontend tests
test:
    pnpm test:run

# Run backend tests
test-backend:
    pnpm test:backend

# Run all tests
test-all:
    pnpm test:all

# Run e2e tests
test-e2e:
    npx playwright test

# Build
build:
    pnpm build

# ─── Autonomous Workers ──────────────────────────

# Run self-improvement cycle
improve:
    claude --agent .claude/agents/manager.md

# Run security audit
audit:
    claude --agent .claude/agents/security-sentinel.md

# Verify repo integrity before committing (checks duplicates, specs, schema, dead modules)
verify:
    python3 /Users/mini/.openclaw/workspace/github/~Projects/system/shared/scripts/repo_verify.py --repo camilomartinez-portfolio --skip tests || [ $? -eq 2 ]
