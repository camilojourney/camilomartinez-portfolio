# 🚀 API Migration Plan: Next.js → FastAPI

> **Document Type:** Technical Migration Plan  
> **Owner:** Backend/Platform Engineering  
> **Status:** Planning Phase  
> **Created:** October 2, 2025  
> **Last Updated:** October 2, 2025

---

## 📋 Executive Summary

This document outlines the technical plan to complete the migration from Next.js API routes to FastAPI backend endpoints. Currently, we have **54+ Next.js API routes**, of which **~15 can be eliminated immediately**, **~20 need migration**, and **~19 must remain** for infrastructure reasons.

### Current State
- ✅ **FastAPI Backend:** Running on port 9000 with AI services implemented
- 🔄 **Hybrid Architecture:** Frontend uses FastAPI with Next.js fallbacks
- ⏸️ **Incomplete Migration:** Integration services (Strava, WHOOP) still in Next.js

### Target State
- ✅ All business logic in FastAPI
- ✅ Next.js routes only for OAuth, cron orchestration, and thin proxies
- ✅ Clean separation of concerns

---

## 👥 Ownership & Responsibilities

| Role | Responsibilities | Key Activities |
|------|------------------|----------------|
| **Backend/Platform Engineer** | • Build FastAPI integration routers<br>• Implement WHOOP/Strava services in Python<br>• Port business logic from TypeScript to Python<br>• Set up database connections and services | Primary migration driver |
| **Frontend Engineer** | • Update React components to call FastAPI<br>• Remove deprecated API routes<br>• Update `src/lib/api/config.ts` mappings<br>• Test UI flows after migration | Secondary collaborator |
| **DevOps/Platform Ops** | • Monitor Vercel cron configurations<br>• Manage environment variables across stacks<br>• Ensure uptime during transition<br>• Update deployment pipelines | Infrastructure guardian |
| **Data Engineer** | • Validate ETL pipeline dependencies<br>• Update scripts that call API endpoints<br>• Verify data flow continuity | Advisory/Validation role |

---

## 🗂️ API Route Inventory

### Category 1: ✅ **KEEP PERMANENTLY** (19 routes)

These routes must remain due to platform constraints or architectural patterns.

#### **A. Authentication & OAuth (5 routes)**
**Why keep:** OAuth flows require Next.js middleware for cookie management and external provider redirects.

| Route | Purpose | Dependencies |
|-------|---------|--------------|
| `/api/auth/[...nextauth]/route.ts` | NextAuth.js handler | NextAuth session management |
| `/api/auth/strava/authorize/route.ts` | Strava OAuth initiation | Strava OAuth redirect |
| `/api/auth/strava/callback/route.ts` | Strava OAuth callback | Strava token exchange |
| `/api/auth/whoop/refresh/route.ts` | WHOOP token refresh | WHOOP OAuth flow |
| `/api/auth/[...nextauth]/route.ts` | NextAuth session | User authentication |

**Technical Note:** These routes handle HTTP-only cookies and external redirects that require server-side Next.js middleware.

#### **B. Vercel Cron Orchestrators (3 routes)**
**Why keep:** Vercel Cron system only supports Next.js API route paths in `vercel.json`.

| Route | Purpose | Cron Schedule | Secret Required |
|-------|---------|---------------|-----------------|
| `/api/cron/daily-data-fetch/route.ts` | Daily WHOOP data collection | `0 19 * * *` (7 PM daily) | `CRON_SECRET` |
| `/api/cron/strava-weekly-sync/route.ts` | Weekly Strava activity sync | `0 13 * * 1` (1 PM Mondays) | `STRAVA_CRON_SECRET` |
| `/api/cron/refresh-views/route.ts` | Refresh materialized views | TBD | `CRON_SECRET` |

**Vercel Configuration (`vercel.json`):**
```json
{
  "crons": [
    { "path": "/api/cron/daily-data-fetch?secret=...", "schedule": "0 19 * * *" },
    { "path": "/api/cron/strava-weekly-sync?secret=...", "schedule": "0 13 * * 1" }
  ]
}
```

**Alternative:** Could migrate to Railway cron or GitHub Actions, but requires infrastructure changes.

#### **C. Security Proxy Wrappers (2 routes)**
**Why keep:** Inject secrets and provide authorization layer before calling real endpoints.

| Route | Purpose | Forwards To |
|-------|---------|-------------|
| `/api/actions/daily-fetch/route.ts` | Secure wrapper for daily cron | `/api/cron/daily-data-fetch` |
| `/api/actions/historical-fetch/route.ts` | Secure wrapper for historical sync | `/api/whoop-collector-v2` |

**Pattern:**
```typescript
// Injects CRON_SECRET from environment
const secret = process.env.CRON_SECRET;
const url = new URL('/api/cron/daily-data-fetch', baseUrl());
url.searchParams.set('secret', secret);
const res = await fetch(url.toString(), { headers: { 'x-cron-secret': secret } });
```

#### **D. Active Utility Routes (3 routes)**
**Why keep:** Used by dashboard UI; migration not worth the effort.

| Route | Purpose | Used By |
|-------|---------|---------|
| `/api/debug-session/route.ts` | Session debugging | `/whoop-dashboard` page (line 71) |
| `/api/sync-status/route.ts` | Integration status check | Multiple frontend components |
| `/api/health/route.ts` | Frontend health check | Landing page |

#### **E. Legacy Endpoints (6 routes - keep temporarily)**
**Why keep for now:** Still referenced by scripts or frontend; low priority to migrate.

| Route | Purpose | Migration Priority |
|-------|---------|---------------------|
| `/api/view-data/route.ts` | Dashboard data endpoint | Low (working, stable) |
| `/api/update-token/route.ts` | Token management utility | Low |
| `/api/tools/*` | Various utility endpoints | Low |

---

### Category 2: ❌ **ELIMINATE IMMEDIATELY** (4 routes)

These routes have no active references and can be deleted safely.

| Route | Reason for Elimination | References Found |
|-------|------------------------|------------------|
| `/api/debug-whoop-auth/route.ts` | Development debug tool | None |
| `/api/test-strain-data/route.ts` | Test route | None |
| `/api/auth/strava/debug/route.ts` | Debug endpoint | None |
| `/api/chatbot/` (empty folder) | Empty directory | N/A |

**Action:**
```bash
rm src/app/api/debug-whoop-auth/route.ts
rm src/app/api/test-strain-data/route.ts
rm src/app/api/auth/strava/debug/route.ts
rmdir src/app/api/chatbot
```

---

### Category 3: 🔄 **MIGRATE THEN ELIMINATE** (20 routes)

These routes contain business logic that should move to FastAPI.

#### **A. AI/Chat Services (4 routes)**
**Status:** ✅ FastAPI implementation exists  
**Frontend status:** ✅ Already using FastAPI with fallback  
**Action:** Remove fallback, delete Next.js routes

| Next.js Route | FastAPI Equivalent | Frontend Usage |
|---------------|--------------------|--------------------|
| `/api/chat/route.ts` | `/api/ai/chat/completion` | Fallback only (line 287 in config.ts) |
| `/api/ai-trainer/run-cycle/route.ts` | `/api/ai/trainer/evaluate` | Fallback at line 324 |
| `/api/ai-trainer/history/route.ts` | `/api/ai/trainer/history` | Fallback at line 333 |

**Migration Steps:**
1. ✅ **Already done:** FastAPI endpoints implemented in `backend/app/routers/ai.py`
2. ✅ **Already done:** Frontend configured to use FastAPI
3. **Todo:** Remove fallback logic from `src/lib/api/config.ts`
4. **Todo:** Delete Next.js route files

**Technical Details:**
- FastAPI version has better error handling, validation, and logging
- Frontend calls `aiService.query()` which hits FastAPI `/api/ai/chat/query`
- Fallback to `/api/chat` only triggers if FastAPI is unreachable

**Deletion Command:**
```bash
rm src/app/api/chat/route.ts
rm -rf src/app/api/ai-trainer/
```

#### **B. WHOOP Integration Services (6 routes)**
**Status:** ❌ FastAPI has placeholder only  
**Frontend status:** ⚠️ Actively using Next.js endpoints  
**Action:** Implement in FastAPI first, then migrate frontend

| Next.js Route | Purpose | Business Logic Location |
|---------------|---------|------------------------|
| `/api/whoop/data/route.ts` | Data collection endpoint | `src/lib/whoop/index.ts` (WhoopV2Client) |
| `/api/whoop-collector-v2/route.ts` | V2 collection orchestrator | `src/lib/whoop/index.ts` |
| `/api/whoop/auth/route.ts` | WHOOP authentication | NextAuth integration |

**Migration Steps:**

**Phase 1: Backend Implementation (Backend Engineer)**
1. Port `WhoopV2Client` from TypeScript to Python
   - **From:** `src/lib/whoop/index.ts`
   - **To:** `backend/app/services/integrations/whoop_client.py`
   - **Classes to port:** `WhoopV2Client`, `WhoopDatabaseService`
2. Port `WhoopDatabaseService` database operations
   - **From:** `src/lib/db/whoop-database.ts`
   - **To:** `backend/app/services/integrations/whoop_db.py`
3. Implement FastAPI endpoints in `backend/app/routers/integrations.py`:
   ```python
   @router.post("/whoop/collect")
   async def collect_whoop_data(mode: str = "daily")
   
   @router.get("/whoop/status")
   async def get_whoop_status()
   ```
4. Add token refresh logic using SQLAlchemy models

**Phase 2: Frontend Migration (Frontend Engineer)**
1. Update `src/lib/api/config.ts`:
   ```diff
   async triggerWhoopCollector(payload?: Record<string, unknown>) {
   -  return ApiClient.post(API_ENDPOINTS.INTEGRATIONS.WHOOP_COLLECT, payload, {
   -    fallback: '/api/whoop-collector-v2',
   -  });
   +  return ApiClient.post(API_ENDPOINTS.INTEGRATIONS.WHOOP_COLLECT, payload);
   }
   ```
2. Test WHOOP dashboard (`/whoop-dashboard` page)
3. Verify cron jobs still work

**Phase 3: Cleanup**
```bash
rm src/app/api/whoop/data/route.ts
rm src/app/api/whoop-collector-v2/route.ts
rm src/app/api/whoop/auth/route.ts
```

**Dependencies:**
- PostgreSQL connection in FastAPI
- WHOOP OAuth tokens in database
- `TokenRefreshService` ported to Python

**Estimated Effort:** 2-3 days (Backend) + 1 day (Frontend) + 0.5 day (Testing)

#### **C. Strava Integration Services (10 routes)**
**Status:** ❌ FastAPI has placeholder only  
**Frontend status:** ⚠️ Actively using Next.js endpoints  
**Action:** Implement in FastAPI first, then migrate frontend

| Next.js Route | Purpose | Business Logic Location |
|---------------|---------|------------------------|
| `/api/strava/sync/weekly/route.ts` | Weekly activity sync | `src/lib/services/strava-data-sync.ts` |
| `/api/strava/sync/historical/route.ts` | Historical import | `src/lib/services/strava-data-sync.ts` |
| `/api/strava/sync-status/route.ts` | Sync status monitoring | Simple DB query |
| `/api/strava/auth/route.ts` | Strava authentication | NextAuth + Strava OAuth |

**Migration Steps:**

**Phase 1: Backend Implementation (Backend Engineer)**
1. Port `StravaSyncService` classes:
   - **From:** `src/lib/services/strava-sync.ts` (legacy)
   - **From:** `src/lib/services/strava-data-sync.ts` (current)
   - **To:** `backend/app/services/integrations/strava_sync.py`
2. Port database operations:
   - Activities, routes, segments, polyline decoding
   - PostgreSQL + PostGIS operations
3. Implement FastAPI endpoints:
   ```python
   @router.post("/strava/sync/weekly")
   async def sync_weekly_activities(user_id: Optional[int] = None)
   
   @router.post("/strava/sync/historical")
   async def sync_historical_activities(user_id: Optional[int] = None)
   
   @router.get("/strava/sync/status")
   async def get_sync_status()
   ```
4. Handle Strava API rate limiting (40,000 requests/day, 100/15min)

**Phase 2: Frontend Migration (Frontend Engineer)**
1. Update `src/lib/api/config.ts` integration service
2. Test Astoria Conquest map page
3. Verify cron job (`/api/cron/strava-weekly-sync`)

**Phase 3: Cleanup**
```bash
rm -rf src/app/api/strava/sync/
rm src/app/api/strava/sync-status/route.ts
rm src/app/api/strava/auth/route.ts
```

**Dependencies:**
- Strava OAuth tokens in database
- PostGIS for geographic operations
- Polyline decoding library (Python equivalent of `@mapbox/polyline`)

**Estimated Effort:** 3-4 days (Backend) + 1 day (Frontend) + 1 day (Testing)

---

## 🛠️ Technical Implementation Guide

### Step 1: Environment Setup

**Backend Engineer:**
```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --port 9000
```

**Verify FastAPI is running:**
```bash
curl http://localhost:9000/health
```

### Step 2: Port TypeScript Services to Python

**Example: WHOOP Client Migration**

**TypeScript Source (`src/lib/whoop/index.ts`):**
```typescript
export class WhoopV2Client {
  private readonly baseUrl = 'https://api.prod.whoop.com/developer/v1';
  
  async getUserProfile(): Promise<WhoopUser> {
    const response = await fetch(`${this.baseUrl}/user/profile/basic`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    return response.json();
  }
}
```

**Python Target (`backend/app/services/integrations/whoop_client.py`):**
```python
import httpx
from typing import Dict, Any

class WhoopV2Client:
    BASE_URL = "https://api.prod.whoop.com/developer/v1"
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.client = httpx.AsyncClient()
    
    async def get_user_profile(self) -> Dict[str, Any]:
        """Fetch user profile from WHOOP API."""
        response = await self.client.get(
            f"{self.BASE_URL}/user/profile/basic",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        response.raise_for_status()
        return response.json()
```

**Key Differences:**
- Use `httpx` instead of `fetch` (async HTTP client for Python)
- Use `async/await` with FastAPI's async capabilities
- SQLAlchemy ORM instead of raw SQL queries
- Pydantic models for validation instead of TypeScript interfaces

### Step 3: Update Frontend API Client

**Before (`src/lib/api/config.ts`):**
```typescript
async triggerWhoopCollector(payload?: Record<string, unknown>) {
  return ApiClient.post(API_ENDPOINTS.INTEGRATIONS.WHOOP_COLLECT, payload, {
    fallback: '/api/whoop-collector-v2',  // ❌ Remove this fallback
  });
}
```

**After:**
```typescript
async triggerWhoopCollector(payload?: Record<string, unknown>) {
  return ApiClient.post(API_ENDPOINTS.INTEGRATIONS.WHOOP_COLLECT, payload);
  // No fallback - fail fast if FastAPI is down
}
```

### Step 4: Test Migration

**Backend Tests:**
```bash
cd backend
poetry run pytest tests/services/test_whoop_client.py -v
```

**Frontend Tests:**
```bash
pnpm test src/app/(main)/whoop-dashboard/page.test.tsx
```

**Manual Verification:**
1. Open `/whoop-dashboard` in browser
2. Click "Run Daily Collection"
3. Verify data appears in UI
4. Check FastAPI logs: `tail -f backend/logs/app.log`

### Step 5: Delete Old Routes

**Only after all tests pass:**
```bash
# Remove Next.js API routes
rm src/app/api/whoop/data/route.ts
rm src/app/api/whoop-collector-v2/route.ts

# Verify no references remain
rg "/api/whoop/data" src/
rg "/api/whoop-collector-v2" src/
```

---

## 📊 Migration Checklist

### Immediate Cleanup (Today)
- [ ] Delete unused debug routes (4 files)
- [ ] Remove empty `/api/chatbot` folder
- [ ] Update documentation

### Phase 1: WHOOP Integration (Week 1-2)
- [ ] Port `WhoopV2Client` to Python
- [ ] Port `WhoopDatabaseService` to Python
- [ ] Implement FastAPI `/api/integrations/whoop/*` endpoints
- [ ] Add authentication middleware
- [ ] Write unit tests for WHOOP services
- [ ] Update frontend to remove fallbacks
- [ ] Test WHOOP dashboard end-to-end
- [ ] Delete Next.js WHOOP routes
- [ ] Update cron jobs to call FastAPI internally

### Phase 2: Strava Integration (Week 3-4)
- [ ] Port `StravaSyncService` to Python
- [ ] Port polyline decoding logic
- [ ] Implement FastAPI `/api/integrations/strava/*` endpoints
- [ ] Handle Strava API rate limiting
- [ ] Write unit tests for Strava services
- [ ] Update frontend to remove fallbacks
- [ ] Test Astoria Conquest map
- [ ] Delete Next.js Strava routes
- [ ] Update cron jobs

### Phase 3: AI Service Cleanup (Week 5)
- [ ] Remove AI fallback logic from `config.ts`
- [ ] Delete Next.js AI routes
- [ ] Update error handling in chat UI
- [ ] Document FastAPI-only architecture

### Phase 4: Final Cleanup (Week 6)
- [ ] Audit remaining Next.js API routes
- [ ] Document "keep forever" routes with comments
- [ ] Update `API_INTEGRATION.md` documentation
- [ ] Create runbook for future API additions
- [ ] Archive old TypeScript service code

---

## 🔍 Verification & Testing

### Health Check Endpoints

**FastAPI Health:**
```bash
curl http://localhost:9000/api/system/health
```

**Next.js Health:**
```bash
curl http://localhost:3000/api/health
```

### Integration Testing

**Test WHOOP Flow:**
```bash
# 1. Authenticate
curl -X POST http://localhost:9000/api/integrations/whoop/collect \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "daily"}'

# 2. Verify data in database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM whoop_cycles WHERE created_at > NOW() - INTERVAL '1 hour';"
```

**Test Strava Flow:**
```bash
curl -X POST http://localhost:9000/api/integrations/strava/sync/weekly \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### Frontend Testing

**Dashboard Pages:**
- `/whoop-dashboard` - WHOOP data collection UI
- `/astoria-conquest` - Strava map visualization
- `/my-data` - Analytics dashboard

**Test Checklist:**
- [ ] All pages load without errors
- [ ] Data fetching works (no 404s)
- [ ] Error messages are user-friendly
- [ ] Loading states appear correctly
- [ ] No console errors

---

## 🚨 Rollback Plan

If migration causes production issues:

### Immediate Rollback
1. Revert frontend changes:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. Re-enable Next.js fallbacks in `config.ts`:
   ```typescript
   fallback: '/api/whoop-collector-v2'  // Restore this line
   ```

3. Restore deleted Next.js routes from git history:
   ```bash
   git checkout HEAD~1 -- src/app/api/whoop/
   ```

### Gradual Rollback
- Use feature flags to toggle between FastAPI and Next.js
- Add environment variable: `NEXT_PUBLIC_USE_FASTAPI_INTEGRATIONS=false`

---

## 📚 Dependencies & Prerequisites

### Python Dependencies (FastAPI)
```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.0"
httpx = "^0.25.0"          # For external API calls
sqlalchemy = "^2.0.0"      # ORM
asyncpg = "^0.29.0"        # Async PostgreSQL driver
pydantic = "^2.4.0"        # Data validation
```

### TypeScript Dependencies (Frontend)
- Already installed, no changes needed

### Environment Variables

**FastAPI (`.env` in `backend/`):**
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# WHOOP API
WHOOP_CLIENT_ID=your_client_id
WHOOP_CLIENT_SECRET=your_secret

# Strava API
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_secret

# OpenAI (already configured)
OPENAI_API_KEY=sk-...
```

**Next.js (`.env` in root):**
```bash
# Point to FastAPI backend
NEXT_PUBLIC_FASTAPI_URL=http://localhost:9000

# NextAuth (keep existing)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## 🎯 Success Criteria

Migration is complete when:

- [ ] All business logic routes are in FastAPI
- [ ] Next.js only has infrastructure routes (auth, cron, proxies)
- [ ] Frontend has no fallback logic to Next.js APIs
- [ ] All integration tests pass
- [ ] Dashboard pages work without errors
- [ ] Cron jobs execute successfully
- [ ] Documentation is updated
- [ ] Team is trained on new architecture

---

## 📞 Support & Questions

**For Migration Issues:**
- Backend questions → Backend/Platform Engineer
- Frontend issues → Frontend Engineer
- Deployment problems → DevOps

**Documentation:**
- `docs/frontend/API_INTEGRATION.md` - Current API architecture
- `docs/backend/README.md` - FastAPI backend guide
- `backend/app/routers/` - FastAPI route implementations

---

## 📝 Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-10-02 | AI Assistant | Initial migration plan created |

---

**Next Steps:** Review this plan with your team, assign owners, and start with the immediate cleanup phase to remove unused debug routes.
