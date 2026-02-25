# Directory Structure — camilomartinez-portfolio

> Type C: Next.js App Router frontend + FastAPI backend. Portfolio site with live fitness analytics.

## Root Level

| File/Dir | Purpose |
|----------|---------|
| `CLAUDE.md` | Claude Code quick reference (≤80 lines). |
| `AGENTS.md` | Universal AI entry point. |
| `README.md` | Human-facing project overview. |
| `ARCHITECTURE.md` | Codebase architecture. |
| `justfile` | Unified task runner (`just --list` to discover). |
| `package.json` | Node package config. |
| `next.config.js` | Next.js configuration. |
| `tailwind.config.js` | Tailwind CSS configuration. |
| `tsconfig.json` | TypeScript configuration. |
| `playwright.config.ts` | Playwright e2e test configuration. |
| `vercel.json` | Vercel deployment config. |
| `render.yaml` | Render deployment config. |
| `src/` | Next.js application source. |
| `backend/` | FastAPI backend. |
| `e2e/` | Playwright end-to-end tests. |
| `public/` | Static assets. |
| `scripts/` | Data scripts. |
| `specs/` | Numbered feature specifications. |
| `docs/` | Structured documentation (four categories only). |
| `.claude/` | Claude Code configuration. |
| `.self-improvement/` | Autonomous improvement system. |

## Where Things Go

| Content | Location |
|---------|----------|
| Page components | `src/app/<route>/page.tsx` |
| Shared React components | `src/components/` |
| Utility functions / API clients | `src/lib/` |
| TypeScript types | `src/types/` |
| Static assets | `public/` |
| FastAPI app entrypoint | `backend/app/main.py` |
| API route handlers | `backend/app/routers/` |
| Business logic | `backend/app/services/` |
| Pydantic models | `backend/app/models/` |
| Backend tests | `backend/tests/` |
| E2E tests | `e2e/<feature>.spec.ts` |
| Feature specs | `specs/NNN-name.md` |
| Architecture decisions | `docs/decisions/NNNN-name.md` |
| Operational guides | `docs/playbooks/` |
| Agent priorities | `.self-improvement/NEXT.md` |
| Worker reports | `.self-improvement/reports/<worker>/YYYY-MM-DD.md` |

## Docs (`docs/`) — Exactly Four Categories

| Path | Purpose |
|------|---------|
| `docs/README.md` | Navigation index. |
| `docs/vision.md` | Product vision. Update at most yearly. |
| `docs/roadmap.md` | Versioned feature plan. |
| `docs/decisions/NNNN-*.md` | ADRs — immutable once accepted. |
| `docs/playbooks/*.md` | Step-by-step operational guides. |

**NEVER create** ad-hoc docs files. Architecture → `ARCHITECTURE.md` (root). Specs → `specs/`.

## Never Add
- No `.ai/` directory (deleted — use `.claude/` instead)
- No loose `.sh` files at the root level
- No hardcoded secrets — use `.env.local` locally, Vercel env vars in production
- No `NEXT_PUBLIC_` prefix on secret values

## File Naming
- React components: PascalCase (`DashboardCard.tsx`)
- Pages: `page.tsx` (Next.js App Router convention)
- Utilities: camelCase (`formatDate.ts`)
- API routes: `route.ts` (Next.js App Router convention)
- Python modules: snake_case (`strava_service.py`)
