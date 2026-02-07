# Current Priorities (Week of 2026-02-07)

> Updated every Monday. Guides all agents on what matters most RIGHT NOW.

## This Week's Focus

### P0 - Critical (Done ✅)
1. **Add test framework and tests**
   - Why: No tests = no confidence in changes
   - Owner: Builder
   - Success: pytest + vitest running in CI
   - Status: ✅ DONE - Tests added for backend routers and frontend API routes

2. **Fix CI pipeline**
   - Why: `|| true` was hiding all errors
   - Owner: DevOps
   - Success: CI fails on real errors, tests run
   - Status: ✅ DONE - Removed `|| true`, added test steps

3. **Clean up dead code**
   - Why: ~200 lines of commented code adding confusion
   - Owner: Builder
   - Success: ai.py cleaned, documented in CLEANUP-LOG.md
   - Status: ✅ DONE - Removed disabled endpoints

### P1 - High Priority (In Progress)
1. **Document authentication path**
   - Why: Mock auth (`mock_user_123`) is not production-ready
   - Owner: Backend Developer
   - Success: Clear migration path documented
   - Status: ✅ DONE - AUTH-IMPLEMENTATION.md created

2. **Consolidate API surface**
   - Why: Duplicate routes between FastAPI and Next.js
   - Owner: Builder
   - Success: API-ROUTES.md documents canonical endpoints
   - Status: ✅ DONE - Route ownership documented

3. **Populate context files**
   - Why: Agent context was empty placeholders
   - Owner: Strategist
   - Success: current-priorities.md and product-context.md filled
   - Status: ✅ DONE

### P2 - Medium Priority (Done ✅)
1. **Enable strict TypeScript options**
   - Why: Catch bugs at compile time
   - Owner: Frontend Developer
   - Success: `noUncheckedIndexedAccess`, `noImplicitReturns` enabled
   - Status: ✅ DONE - Added to tsconfig.json

2. **Add structured logging**
   - Why: Better debugging in production
   - Owner: Backend Developer
   - Success: JSON logs with consistent format
   - Status: ✅ DONE - logging_config.py with JSONFormatter

3. **Add request tracing IDs**
   - Why: Trace requests across services
   - Owner: DevOps
   - Success: X-Request-ID header propagated
   - Status: ✅ DONE - LoggingMiddleware updated

## Blockers

| Blocker | Blocking What | Owner | Resolution |
|---------|---------------|-------|------------|
| None 🎉 | - | - | - |

## Decisions Made This Week

| Decision | Rationale | Date | Who |
|----------|-----------|------|-----|
| FastAPI is canonical for AI endpoints | Consolidate backend, reduce duplication | 2026-02-07 | Builder |
| Vitest for frontend testing | Fast, modern, good Next.js support | 2026-02-07 | Builder |
| Keep NextAuth routes in Next.js | Auth flows need Next.js context | 2026-02-07 | Builder |

## User Feedback Summary

**Top Pain Point:** Need reliable test coverage before adding features

**Top Request:** Better documentation of API boundaries

**Recent Praise:** Clean project structure, good separation of concerns

## Metrics This Week

| Metric | Target | Actual | Trend |
|--------|--------|--------|-------|
| Test coverage (backend) | 50% | ~40% | ↑ |
| Test coverage (frontend) | 50% | ~30% | ↑ |
| CI pass rate | 100% | 100% | → |
| Open bugs | 0 | 0 | → |

## Next Week Preview

What's coming:
- Complete P2 items (strict TS, structured logging, request tracing)
- Increase test coverage to 60%
- Begin Strava integration phase

## Long-Term Context

**Current Phase:** MVP (0-8 weeks) - Stabilize core

**Strategic Goal:** Production-ready fitness analytics platform

**Key Milestone:** Full test coverage and CI/CD pipeline by end of week

---

Last updated: 2026-02-07
