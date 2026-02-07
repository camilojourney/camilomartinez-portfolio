# API Routes Documentation

## Overview

This project has two API surfaces:
1. **FastAPI Backend** (`backend/`) - Canonical for AI, analytics, and data operations
2. **Next.js API Routes** (`src/app/api/`) - Canonical for auth, frontend-specific, and third-party integrations

## Route Ownership Matrix

### FastAPI Backend (Canonical)

| Route | Purpose | Status |
|-------|---------|--------|
| `POST /api/ai/chat/completion` | GPT-4 chat completions | ✅ Active |
| `POST /api/ai/chat/query` | AI query with context | ✅ Active |
| `POST /api/ai/query` | AI query with SQL pipeline | ✅ Active |
| `GET /api/ai/chat/history` | Query history | ✅ Active |
| `POST /api/ai/embeddings/create` | Create embeddings | ✅ Active |
| `POST /api/ai/embeddings/documents` | Embed documents | ✅ Active |
| `POST /api/ai/embeddings/search` | Similarity search | ✅ Active |
| `GET /api/ai/embeddings/stats` | Embedding statistics | ✅ Active |
| `GET /api/ai/health` | AI service health | ✅ Active |
| `GET /api/system/health` | System health | ✅ Active |
| `GET /api/system/status` | System status | ✅ Active |
| `GET /api/analytics/*` | Data analytics | ✅ Active |
| `GET /api/integrations/*` | External integrations | 🚧 Planned |
| `GET /api/tools/*` | Productivity tools | ✅ Active |

### Next.js API Routes (Canonical)

| Route | Purpose | Status |
|-------|---------|--------|
| `POST /api/chat` | Portfolio chatbot (RAG) | ✅ Active |
| `POST /api/chat/feedback` | Chat feedback | ✅ Active |
| `POST /api/chat/evaluate` | Chat evaluation | ✅ Active |
| `POST /api/chat/log` | Chat logging | ✅ Active |
| `GET /api/auth/[...nextauth]` | NextAuth authentication | ✅ Active |
| `GET /api/auth/strava/*` | Strava OAuth | ✅ Active |
| `GET /api/auth/whoop/*` | WHOOP OAuth | ✅ Active |
| `GET /api/astoria/*` | Astoria Conquest maps | ✅ Active |
| `GET /api/ai-trainer/*` | AI trainer features | ✅ Active |
| `GET /health` | Frontend health check | ✅ Active |
| `GET /rss` | RSS feed | ✅ Active |

### Deprecated Routes (Migrate to FastAPI)

These Next.js routes have FastAPI equivalents and should be migrated:

| Next.js Route | FastAPI Equivalent | Migration Status |
|---------------|-------------------|------------------|
| `/api/ai/embeddings` | `/api/ai/embeddings/create` | ⚠️ Pending |
| `/api/openai/completion` | `/api/ai/chat/completion` | ⚠️ Pending |
| `/api/rag/search` | `/api/ai/embeddings/search` | ⚠️ Pending |

## Usage Guidelines

### When to use FastAPI Backend

- AI/ML operations requiring compute
- Database queries and analytics
- Rate-limited endpoints
- Operations requiring persistent state
- High-performance requirements

### When to use Next.js API Routes

- Authentication/OAuth flows
- Frontend-specific operations (e.g., SSR data)
- Middleware that needs Next.js context
- Static content generation (RSS, sitemaps)
- Rapid prototyping

## Migration Strategy

1. **New features:** Implement in FastAPI by default
2. **Existing duplicates:** Migrate to FastAPI, add deprecation notice to Next.js route
3. **Auth flows:** Keep in Next.js (NextAuth integration)
4. **Frontend helpers:** Keep in Next.js

## Adding Deprecation Notices

For routes being migrated, add this to the Next.js route:

```typescript
/**
 * @deprecated This route is deprecated. Use FastAPI endpoint instead.
 * FastAPI equivalent: POST /api/ai/embeddings/create
 * Migration date: 2026-03-01
 */
export async function POST(req: Request) {
  console.warn('DEPRECATED: /api/ai/embeddings - Use FastAPI /api/ai/embeddings/create');
  // ... existing implementation
}
```

## Health Check Endpoints

Both systems have health endpoints:

- **Frontend:** `GET /health` - Next.js server status
- **Backend:** `GET /api/system/health` - FastAPI server status
- **Backend:** `GET /health` - FastAPI root health (simple)

For production monitoring, check both endpoints.

## CORS Configuration

FastAPI backend CORS is configured in `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Ensure frontend origin is in `CORS_ORIGINS` environment variable.
