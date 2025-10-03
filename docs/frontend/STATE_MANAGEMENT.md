# 🔄 State Management & Data Flow

> **Status:** Stable · **Scope:** Server/Client State Coordination · **Last Updated:** October 2, 2025  
> **Owner:** Frontend Guild · **Reviewer:** AI Assistant

---

## TL;DR
- Favor server-first data fetching via Next.js Server Components and server actions; client state is opt-in for interactivity.
- React Query orchestrates remote data lifecycles, while Zustand microstores capture UI/session state.
- Consistency is enforced through typed query keys, optimistic updates, and global error boundaries.

---

## Table of Contents
- [🏗️ State Taxonomy](#️-state-taxonomy)
- [🧠 Server-First Data Layer](#-server-first-data-layer)
- [⚙️ React Query Patterns](#️-react-query-patterns)
- [🧱 Zustand Microstores](#-zustand-microstores)
- [🪝 Hooks & Utilities](#-hooks--utilities)
- [🚨 Error & Loading States](#-error--loading-states)
- [🧪 Testing Strategy](#-testing-strategy)
- [🔗 References](#-references)

---

## 🏗️ State Taxonomy

| State Type | Examples | Source | Lifecycle |
|------------|----------|--------|-----------|
| **Server-derived** | Fitness analytics, AI answers | Server components, server actions | Fetched per request / cached |
| **Client session** | Theme, expanded panels | Zustand store (`useUIStore`) | Persisted via `localStorage` |
| **Ephemeral** | Form inputs, modals | React component state | Reset on navigation |
| **Derived/computed** | KPI deltas, chart transforms | Memoized selectors | Recomputed when deps change |

Principle: **Promote System of Record**—if data exists in backend, fetch via API; avoid duplicating logic in the client.

---

## 🧠 Server-First Data Layer

### Server Actions
- Lives in `src/app/(domain)/actions.ts`.
- Handles authenticated calls, heavy computation, or direct DB access.
- Always validate inputs with Zod schemas and return typed DTOs.

```ts
'use server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { apiClient } from '@/lib/api/client';

const paramsSchema = z.object({ dateRange: z.string() });

export async function getWhoopSummaryAction(raw: unknown) {
  const params = paramsSchema.parse(raw);
  const session = await getSession();
  return apiClient.stats.getWhoopSummary({ ...params, userId: session.user.id });
}
```

### Server Components
- Default to Server Components; upgrade to Client Component only when using browser-only APIs.
- Compose with `Suspense` to stream partial UI.

---

## ⚙️ React Query Patterns

### Query Keys
- Namespace by domain: `['whoop', 'daily-summary', userId]`.
- Encapsulate in `lib/api/queries.ts` for reuse.

### Fetcher Pattern
```ts
import { useQuery } from '@tanstack/react-query';

export function useWhoopSummary(params: SummaryParams) {
  return useQuery({
    queryKey: whoopSummaryKey(params),
    queryFn: () => apiClient.stats.getWhoopSummary(params),
    staleTime: 5 * 60 * 1000,
    select: (data) => transformSummary(data),
  });
}
```

### Mutations & Optimistic Updates
- `useMutation` with `onMutate` rollbacks.
- Sync with server actions for privileged updates.
- Broadcast invalidations via `queryClient.invalidateQueries`.

### Prefetching
- Use `dehydrate` in Server Components to hydrate React Query cache on the client.

---

## 🧱 Zustand Microstores

### Principles
- Each store serves a single domain (UI, AI chat, analytics filters).
- Export selectors to avoid re-renders.
- Persist only when necessary; use middleware (`persist`, `immer`).

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UIState = {
  sidebarOpen: boolean;
  setSidebar: (open: boolean) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebar: (open) => set({ sidebarOpen: open }),
    }),
    { name: 'ui-store' }
  )
);
```

### AI Session Store
- `useChatStore` holds conversation history, streaming metadata, and feedback states.
- Includes `reset()` to clear on route change (hooks into Next.js router events).

---

## 🪝 Hooks & Utilities

| Hook | Purpose | Location |
|------|---------|----------|
| `useBreakpoint()` | Responsive logic (Tailwind breakpoints) | `lib/hooks/useBreakpoint.ts` |
| `useShortcuts()` | Keyboard shortcuts (cmd+k palette) | `lib/hooks/useShortcuts.ts` |
| `useDebouncedValue()` | Form inputs, search | `lib/hooks/useDebouncedValue.ts` |
| `useChartData()` | Memoized transforms for analytics | `lib/hooks/useChartData.ts` |

> Hooks must be pure (no side effects) and typed; include JSDoc describing output shape.

---

## 🚨 Error & Loading States

### Global Error Boundaries
- `src/app/error.tsx` handles uncaught errors with fallback UI + `Report Issue` CTA.
- `src/app/loading.tsx` sets skeleton baseline for top-level route transitions.

### React Query
- Use `isLoading`, `isError`, `error` to drive UI branching.
- Display actionable messages referencing `docs/operations/TROUBLESHOOTING.md` entries when relevant.

### Toasts & Notifications
- `ToastProvider` (Radix) configured in root layout.
- Use for user-triggered actions, not global system errors.

---

## 🧪 Testing Strategy
- **Unit Tests**: Hooks and selectors with Vitest.
- **Integration Tests**: React Testing Library verifying loading/error states.
- **Contract Tests**: Mock Service Worker ensures API shapes match backend definitions.
- **E2E (optional)**: Playwright script for AI chat flows.

Include fixtures mirroring backend JSON shapes to catch drift early.

---

## 🔗 References
- `docs/frontend/COMPONENTS.md` – Component catalogue interfacing with state stores.
- `docs/frontend/API_INTEGRATION.md` – REST/GraphQL client patterns.
- `docs/ai/RAG_SYSTEM.md` – AI response contract consumed by chat UI.
- `docs/backend/API_REFERENCE.md` – Endpoint definitions powering React Query hooks.

---

*Last Updated: October 2, 2025*
