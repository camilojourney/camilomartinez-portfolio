# 🎨 Frontend Architecture Guide

> **Status:** Authoritative · **Scope:** Experience Layer (Next.js) · **Last Updated:** October 2, 2025  
> **Owner:** Frontend Guild (Camilo Martinez) · **Reviewer:** AI Assistant

---

## TL;DR
- The frontend is a Next.js 15 App Router application engineered for hybrid delivery: static marketing pages, streaming AI interactions, and data-intensive dashboards.
- Modularity lives at three levels—route groups, feature modules, and UI primitives—backed by event-driven state management and server actions.
- Follow the golden paths here for layout composition, rendering strategies, performance budgets, and collaboration patterns to deliver elite experiences.

---

## Table of Contents
- [🏛️ Architectural Overview](#️-architectural-overview)
- [🧬 Rendering & Data Flow](#-rendering--data-flow)
- [📦 Module Organization](#-module-organization)
- [⚡ Performance Playbook](#-performance-playbook)
- [✅ Quality Gates](#-quality-gates)
- [🔗 References](#-references)

---

## 🏛️ Architectural Overview

### Stack Snapshot
| Concern | Technology | Notes |
|---------|------------|-------|
| Framework | Next.js 15 (App Router) | Server Components + Route Handlers |
| Language | TypeScript (strict) | Project references, path aliases (`@/`) |
| Styling | Tailwind CSS 3.4 + CSS Modules | Design tokens in `styles/tokens.css` |
| Animations | Framer Motion 12 | Motion presets centralised in `lib/motion.ts` |
| Icons | Lucide | Tree-shaken import helpers |
| Charts | Recharts + Tremor | Lazy loaded, SSR-safe fallbacks |

### Rendering Modes
- **Static Generation (SSG/ISR)** – `/`, `/projects`, `/blog` (via MDX, cached at edge).
- **Server-Side Rendering (SSR)** – `/whoop-dashboard`, `/analytics` (fresh data on every request).
- **Streaming** – `/ai/coach` uses Server Components + Suspense to stream AI insights.
- **Client Routing** – Dashboard widgets rely on client components for interactivity while delegating data fetching to server actions.

---

## 🧬 Rendering & Data Flow

### Tiered Data Strategy
1. **Server Actions & Loaders**
   - Located in `src/app/(domain)/actions.ts`.
   - Responsible for privileged data access (DB, secure APIs).
   - Always validate with Zod schemas.
2. **Client Components**
   - Consume typed hooks in `src/lib/api/` (React Query).
   - Derived state managed via Zustand microstores per feature.
3. **Edge Cache**
   - ISR for marketing; `cache('force-cache')` for infrequently changing data.

```tsx
// src/app/(analytics)/whoop-dashboard/page.tsx
export default async function WhoopDashboardPage() {
  const serverData = await getWhoopSummary();
  return (
    <AnalyticsLayout>
      <WhoopHero snapshot={serverData.snapshot} />
      <ClientCharts initialData={serverData.chartData} />
    </AnalyticsLayout>
  );
}
```

### API Access Paths
- Preferred: `server-only` utilities calling backend REST endpoints (`NEXT_PUBLIC_API_URL`).
- Alternate (internal-only): Prisma client via `@vercel/postgres` (future).
- Legacy Next.js API routes under `src/app/api` are deprecated—migrate to FastAPI or server actions.

---

## 📦 Module Organization

```
src/
├── app/
│   ├── (marketing)/          # Public pages (SSG)
│   ├── (analytics)/          # Authenticated dashboards (SSR)
│   ├── (ai)/chat             # AI assistant experience (streaming)
│   ├── layout.tsx            # Root layout (fonts, providers)
│   └── globals.css           # Base styles (Tailwind + typography)
├── components/
│   ├── ui/                   # Design system primitives
│   ├── charts/               # Visualization components (lazy)
│   ├── features/             # Domain composites (WhoopCard, StravaTimeline)
│   └── layout/               # Shells (Navbar, Sidebar, Footer)
├── lib/
│   ├── api/                  # REST clients, fetch wrappers
│   ├── hooks/                # Custom hooks (responsive, shortcuts)
│   ├── utils/                # Pure utilities (formatters, math)
│   └── validations/          # Zod schemas shared client <-> server
├── styles/                   # Tailwind config extensions + tokens
└── types/                    # Domain-driven TypeScript interfaces
```

### Feature Module Contract
- **Directory**: `src/features/<domain>`
- **Exports**: `index.ts` re-exporting presentation + hooks + schemas.
- **Testing**: Co-located Vitest + Testing Library tests (`*.test.tsx`).
- **Storybook (optional)**: Stories under `src/features/<domain>/__stories__`.

---

## ⚡ Performance Playbook

| Concern | Strategy | Tooling |
|---------|----------|---------|
| Bundle Size | Route-level code splitting, dynamic imports with suspense fallbacks | `next-bundle-analyzer` |
| Rendering | Server Components by default, client components only when needed | ESLint rule `prefer-rsc` |
| Data Fetching | Cache revalidation, stale-while-revalidate via React Query | `@tanstack/react-query-devtools` |
| Images | `next/image` with remote loader config | Vercel Image Optimization |
| Accessibility | Lighthouse ≥ 98, Axe CI | `pnpm test:a11y` |
| Internationalization | `next-intl` (planned) | Locale detection middleware |

> **Budget:** Maintain < 100 KB JavaScript per critical route (post-gzip). Track via `pnpm analyze`.

---

## ✅ Quality Gates
1. **Lint & Format**
   ```bash
   pnpm lint
   pnpm format:check
   ```
2. **Type Safety**
   ```bash
   pnpm typecheck
   ```
3. **Unit & Component Tests**
   ```bash
   pnpm test -- --runInBand
   ```
4. **Visual Regression** (optional)
   - Happo or Chromatic; snapshots stored per feature.

Pull requests must include Storybook/Playwright evidence for UI-heavy changes.

---

## 🔗 References
- `docs/frontend/COMPONENTS.md` – Design system primitives and tokens.
- `docs/frontend/STATE_MANAGEMENT.md` – Server/client state patterns.
- `docs/frontend/API_INTEGRATION.md` – REST client contracts and error handling.
- `docs/frontend/DEPLOYMENT.md` – Vercel pipeline and environment configuration.
- `docs/operations/MONITORING.md` – Frontend observability dashboards.

---

*Last Updated: October 2, 2025*
