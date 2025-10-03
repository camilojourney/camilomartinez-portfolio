# 🔌 API Integration & Data Contracts

> **Status:** Stable · **Scope:** Frontend ↔ Backend Communication · **Last Updated:** October 2, 2025  
> **Owner:** Frontend Guild · **Reviewer:** Backend Guild

---

## TL;DR
- **The System API (FastAPI)** is the authoritative API for all engineers - documented via OpenAPI/Swagger
- All frontend network access flows through typed API clients in `src/lib/api/`
- Contracts mirror the backend OpenAPI spec; runtime validation via Zod schemas
- Error handling, retries, and authentication follow consistent patterns

---

## Table of Contents
- [📡 The System API (FastAPI Backend)](#-the-system-api-fastapi-backend)
- [🧱 Client Abstractions](#-client-abstractions)
- [🔐 Authentication Flow](#-authentication-flow)
- [⚠️ Error Handling & Retries](#️-error-handling--retries)
- [📬 Real-Time & Streaming](#-real-time--streaming)
- [🧪 Contract Testing](#-contract-testing)
- [🔗 References](#-references)

---

## 📡 The System API (FastAPI Backend)

### The Authoritative API

**Location**: `/backend/app/` (deployed on Railway)

**Audience**: 🌍 **ALL ENGINEERS** - This is the canonical API for the entire platform

**Purpose**: 
- Single source of truth for all business logic and data
- Handles authentication, database access, and external integrations (WHOOP, Strava, OpenAI)
- Enforces business rules and data validation

**Documentation**: 
- Auto-generated OpenAPI/Swagger docs at `/docs` endpoint
- This is the official contract that engineers use to understand available endpoints
- Live docs at: `https://your-backend.railway.app/docs`

**Base URL**: `process.env.NEXT_PUBLIC_API_URL`
**Versioning**: All endpoints under `/api/v1/`
**Format**: JSON with snake_case
**Auth**: Bearer token authentication

### Architecture

```
Frontend (Next.js)
        │
        ▼
FastAPI Backend (System API)
        │
        ├──> Authentication & Authorization
        ├──> Business Logic Services
        ├──> Database (PostgreSQL + pgvector)
        └──> External APIs (WHOOP, Strava, OpenAI)
```

### Main Endpoint Groups

| Group | Path | Purpose |
|-------|------|---------|
| **AI** | `/api/v1/ai/*` | Text-to-SQL queries, AI trainer chat |
| **Analytics** | `/api/v1/analytics/*` | Dashboard metrics, correlations |
| **Integrations** | `/api/v1/integrations/*` | WHOOP/Strava sync |
| **System** | `/api/v1/system/*` | Health checks, status |

### How Frontend Calls the System API

**Server Components** (recommended):
```tsx
// app/dashboard/page.tsx
async function DashboardPage() {
  // Direct call to System API - safe on server
  const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/summary`, {
    headers: { 'Authorization': `Bearer ${cookies().get('auth_token')}` }
  });
  
  return <Dashboard data={data} />;
}
```

**Client Components** (when needed):
```tsx
// For client-side calls, use the API client abstraction
import { apiClient } from '@/lib/api/client';

function DashboardWidget() {
  const { data } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => apiClient.analytics.getSummary()
  });
  
  return <WidgetUI data={data} />;
}
```

**Implementation Note**: `/src/app/api/` routes exist as thin proxy layer for client components that need to hide secrets, but they're internal implementation details - not part of the official API contract.

---

## 🧱 Client Abstractions

### API Client Factory
```ts
// src/lib/api/client.ts
import { createFetcher } from './createFetcher';
import { whoopEndpoints } from './endpoints/whoop';

export const apiClient = {
  stats: whoopEndpoints(createFetcher()),
  ai: aiEndpoints(createFetcher({ timeout: 15000 })),
  integrations: integrationEndpoints(createFetcher()),
};
```

### Fetcher
- Wraps native `fetch` with:
  - Base URL injection
  - Headers (auth token, `Content-Type`)
  - Timeout via `AbortController`
  - Automatic JSON parsing and camelCase conversion

### DTO Validation
```ts
const whoopSummarySchema = z.object({
  date: z.string(),
  recoveryScore: z.number(),
  strainScore: z.number(),
});

export const whoopEndpoints = (fetcher: Fetcher) => ({
  async getWhoopSummary(params: SummaryParams) {
    const res = await fetcher.get('/api/v1/whoop/summary', { searchParams: params });
    return whoopSummarySchema.array().parse(res.data);
  },
});
```

---

## 🔐 Authentication Flow

### Auth Tokens
- Auth handled via backend session tokens (JWT or supabase session – choose strategy).
- Tokens stored in HTTP-only cookies; server actions read via `cookies()` API.

### Protected Routes
- Layout-level guard in `src/app/(analytics)/layout.tsx` checks session.
- Redirect to `/login` if unauthenticated (NextAuth planned integration).

### OAuth Integrations
- WHOOP/Strava flows initiated in frontend (`/integrations` pages) -> redirect to backend OAuth endpoints.
- Frontend displays status using `GET /api/v1/integrations/status`.

---

## ⚠️ Error Handling & Retries

### Error Taxonomy
| Code | Description | UI Response |
|------|-------------|-------------|
| `NETWORK_ERROR` | Fetch/timeout | Show retry CTA; log to Sentry |
| `VALIDATION_ERROR` | 4xx with details | Highlight form fields, show guidance |
| `AUTH_ERROR` | 401/403 | Trigger logout + login modal |
| `SERVER_ERROR` | 5xx | Graceful fallback; attach correlation ID |
| `AI_ERROR` | AI-specific failure | Display SQL & message, log for review |

### Retry Strategy
- Exponential backoff (100ms → 500ms → 1000ms) for idempotent GET requests.
- No auto-retry for POST/PUT unless flagged safe.
- Use `Retry-After` headers from backend when present.

---

## 📬 Real-Time & Streaming

### Server-Sent Events (AI Chat)
- SSE endpoint: `/api/ai/chat/stream`.
- Client uses `EventSource` wrapper with reconnection logic.
- Messages normalized into `MessageStream` component; SSE events include `type` (`token`, `complete`, `error`).

### WebSockets (Roadmap)
- Consider migrating streaming to WS for bi-directional interactions (notifications, collaborative editing).

### Optimistic UI
- Mutations update local state before server response; rollback on failure.
- Example: Integrations toggles update UI instantly, revert on backend error.

---

## 🧪 Contract Testing

1. **OpenAPI Validation**: `pnpm exec openapi-typescript http://localhost:8000/openapi.json --output src/types/api.d.ts` (automated daily).
2. **Mock Service Worker (MSW)**: Mirrors backend responses for tests.
3. **Smoke Tests**: Nightly workflow hits critical endpoints via Playwright.
4. **Schema Drift Alerts**: `scripts/api/compareOpenApi.ts` diff against baseline.

---

## 🔗 References
- `docs/backend/API_REFERENCE.md` – Endpoint catalog with parameters & responses.
- `docs/frontend/STATE_MANAGEMENT.md` – Query key naming conventions.
- `docs/frontend/DEPLOYMENT.md` – Environment variable management per environment.
- `docs/operations/TROUBLESHOOTING.md` – Known integration failure modes.

---

*Last Updated: October 2, 2025*
