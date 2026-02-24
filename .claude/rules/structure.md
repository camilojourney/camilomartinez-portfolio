# Directory Structure — camilomartinez-portfolio

> Type C+B hybrid: Next.js App Router frontend + FastAPI backend. Portfolio site with live fitness analytics dashboard.

## Root Level
CLAUDE.md, AGENTS.md, README.md, ARCHITECTURE.md, package.json,
next.config.js, tailwind.config.js, tsconfig.json, vercel.json, render.yaml

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
| Data scripts | `scripts/` |
| Feature specs | `specs/NNN-name.md` |
| Architectural decisions | `docs/decisions/NNNN-name.md` |
| Operational guides | `docs/playbooks/` |
| Agent learned knowledge | `.claude/agent-memory/<agent>/MEMORY.md` |
| Self-improvement cycle outputs | `.self-improvement/reports/<worker>/YYYY-MM-DD.md` |

## Never Add
- No `.ai/` directory (deleted — use `.claude/` instead)
- No loose `.sh` files at the root level
- No hardcoded secrets anywhere — use `.env.local` locally, Vercel env vars in production
- No `NEXT_PUBLIC_` prefix on secret values

## File Naming
- React components: PascalCase (`DashboardCard.tsx`)
- Pages: `page.tsx` (Next.js App Router convention)
- Utilities: camelCase (`formatDate.ts`)
- API routes: `route.ts` (Next.js App Router convention)
- Python modules: snake_case (`strava_service.py`)

## Import Order (TypeScript)
1. Node built-ins
2. External packages
3. Internal imports (`@/components/...`, `@/lib/...`)
4. Relative imports

## Docs (`docs/`)

**Exactly four categories — no others.**

| Path | Purpose |
|------|---------|
| `docs/README.md` | Navigation index. |
| `docs/vision.md` | Product vision. Update at most yearly. |
| `docs/roadmap.md` | Versioned feature plan. |
| `docs/decisions/NNNN-*.md` | ADRs — why we made each design choice. Immutable once accepted. |
| `docs/playbooks/*.md` | Step-by-step operational guides. |

**NEVER create** ad-hoc docs files like `docs/architecture.md`, `docs/notes.md`, `docs/guides/`, etc.
Architecture → `ARCHITECTURE.md` (root). Specs → `specs/`. Everything else → the four categories above.
