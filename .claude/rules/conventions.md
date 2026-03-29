# Camilomartinez Portfolio Conventions

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind, pnpm
- Backend: FastAPI (Python 3.11+), SQLAlchemy, Alembic, uv
- Tests: Vitest (frontend), pytest (backend), Playwright (e2e)
- Strict TypeScript mode enabled
- Server Components by default, "use client" only when needed
- Pydantic v2 models for API request/response
- No secrets in NEXT_PUBLIC_ vars — server-side only
- Specs follow NNN-name.md pattern
