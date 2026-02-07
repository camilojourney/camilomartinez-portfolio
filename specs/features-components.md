# Camilo Martinez Portfolio - Features & Components

## Core Features
| Feature | Description | Tech |
|---------|-------------|------|
| **Fitness Data Ingestion** | Sync WHOOP sleep/recovery + Strava workouts | OAuth2 APIs, Celery tasks |
| **AI Analytics** | RAG-powered insights (GPT-4 + pgvector embeddings) | OpenAI, vector search on docs/schema |
| **Dashboards** | Interactive charts (sleep trends, workout maps) | Recharts, React Leaflet, Turf.js |
| **AI Coach** | Streaming chat for personalized advice | Server-Sent Events, Suspense |
| **Rate-Limited Queries** | 5 AI queries/day (Redis-enforced) | Custom middleware |
| **Health Checks** | System/integration status | FastAPI endpoints |

## UI Components Catalog
### Primitives (shadcn/ui)
| Component | Usage |
|-----------|-------|
| Button, Card, Dialog | Forms, modals |
| Table, Chart | Data display |
| Map (Leaflet) | Workout routes (polylines) |

### Domain Components
```
components/
├── charts/
│   ├── SleepTrendChart.tsx     # Line chart w/ date-fns
│   └── WorkoutSummary.tsx      # Bar chart (Recharts)
├── features/
│   ├── WhoopCard.tsx           # Recovery/sleep snapshot
│   ├── StravaTimeline.tsx      # Activity feed
│   └── AIChatBubble.tsx        # Streaming responses
└── layout/
    ├── Navbar.tsx              # Responsive nav
    └── DashboardShell.tsx      # Sidebar + main
```

## Key Libraries & Hooks
| Library | Purpose |
|---------|---------|
| `framer-motion` | Page transitions, animations |
| `@radix-ui/react-slot` | Composite primitives |
| `date-fns-tz` | Timezone-aware formatting |
| `next-mdx-remote` | Blog/projects (MDX) |
| `next-auth` | Auth sessions |

**State Management**:
- Server: Actions + `cache/revalidate`.
- Client: Zustand (microstores per feature), React Query (API caching).

## Integrations
```tsx
// Example: Strava sync
const syncStrava = serverAction(async () => {
  const res = await fetch(`${API_URL}/api/integrations/strava/sync`, {
    headers: { Authorization: `Bearer ${token}` }
  });
});
```

*Generated: 2026-02-07*
