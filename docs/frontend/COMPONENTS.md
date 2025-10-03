# 🧩 Component System & Design Language

> **Status:** Stable · **Domain:** UI Primitives & Feature Components · **Last Updated:** October 2, 2025  
> **Owner:** Design Engineering · **Reviewer:** Frontend Guild

---

## TL;DR
- The design system is token-driven, accessible by default, and optimized for data storytelling and AI interactions.
- Components are organized into four tiers (tokens → primitives → composites → experiences) with strict contracts and documentation.
- Use this guide to assemble new features without visual drift, performance regressions, or accessibility debt.

---

## Table of Contents
- [🎨 Design Principles](#-design-principles)
- [🎛️ Tokens & Theming](#️-tokens--theming)
- [🔹 Primitives](#-primitives)
- [🔶 Composites](#-composites)
- [📊 Data Visualization](#-data-visualization)
- [🤖 AI Experience Components](#-ai-experience-components)
- [🧪 Documentation & Testing](#-documentation--testing)
- [🔗 References](#-references)

---

## 🎨 Design Principles
1. **Clarity** – Minimal cognitive load, progressive disclosure of complexity.
2. **Motion with Intent** – Framer Motion choreography to reinforce state changes.
3. **Data Integrity** – Visualizations emphasize accuracy, context, and comparability.
4. **Accessibility** – WCAG 2.2 AA baseline; semantic HTML + aria labelling checklists.
5. **AI Transparency** – Responses show provenance, confidence, and controls.

---

## 🎛️ Tokens & Theming

### Token Layers
- **Global Tokens** (`styles/tokens.css`): color palette, typography scale, spacing.
- **Alias Tokens** (`styles/alias.css`): component-level references (e.g., `--button-primary-bg`).
- **Component Tokens**: local CSS variables scoped in component files.

```css
:root {
  /* Global */
  --color-background: #04070d;
  --color-surface: #0f172a;
  --color-primary: #38bdf8;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --radius-lg: 1rem;
}
```

### Dark Mode Strategy
- `ThemeProvider` wraps layout; persists preference (system or user).
- Tailwind config uses CSS variables for color tokens -> instant theme swapping.

### Typography
- Primary font: `Inter` (variable font for performance).
- Numeric font: `DM Sans` for dashboards (monospaced metrics, align decimals).

---

## 🔹 Primitives

| Component | Location | Purpose | Notes |
|-----------|----------|---------|-------|
| `Button` | `components/ui/button.tsx` | CTA variations | Supports icon slots, loading state |
| `Input` | `components/ui/input.tsx` | Text inputs | Integrated with React Hook Form |
| `Card` | `components/ui/card.tsx` | Surfaces | Slots: `Header`, `Content`, `Footer` |
| `Tabs` | `components/ui/tabs.tsx` | Navigation | Keyboard accessible, aria attributes |
| `Tooltip` | `components/ui/tooltip.tsx` | Context hints | Uses Radix primitives |
| `Badge` | `components/ui/badge.tsx` | Status tokens | Semantic color mapping |

> **Rule:** Never bypass primitives with ad-hoc Tailwind classes in features—extend via `cn()` helper or compose new primitives.

### Accessibility Checklist (per component)
- Keyboard navigable? (Tab order, Enter/Space triggers).
- `aria-*` attributes applied correctly.
- Focus states visible with ≥ 3:1 contrast ratio.
- Motion respects `prefers-reduced-motion`.

---

## 🔶 Composites

### Feature Shells
- `AnalyticsCard` – Merges KPI, trend sparkline, and delta indicator.
- `ActivityFeed` – Virtualized list with skeleton state.
- `InsightPanel` – Expandable drawer summarizing AI insights + actions.

### Interaction Patterns
- **Skeleton Loading** – Use `<Skeleton>` primitive; mimic final layout; avoid layout shift.
- **Empty States** – Provide copy, CTA, and optional illustration (refer to content guidelines).
- **Error States** – Include troubleshooting steps; link to `docs/operations/TROUBLESHOOTING.md` when relevant.

---

## 📊 Data Visualization

### Charting Stack
- **Recharts** for line/bar/radar charts (custom components in `components/charts/`).
- **Tremor** wrappers for consistent styling and responsive layout.
- **Canvas vs SVG** – Default to SVG (accessibility, interactivity); consider Canvas for >2k points.

### Patterns
- Provide raw values + derived metrics; do not rely solely on color coding.
- Use `aria-label` and `aria-describedby` to expose chart summaries.
- Export data: `Download CSV` action backed by server action (streaming).

### Performance
```tsx
const HeartRateChart = dynamic(() => import("@/components/charts/HeartRateChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full" />,
});
```

---

## 🤖 AI Experience Components

| Component | Purpose | Implementation Notes |
|-----------|---------|----------------------|
| `ChatComposer` | Collects user prompts | Debounced input, command palette shortcuts |
| `MessageStream` | Streams assistant replies | Server-sent events + Suspense boundaries |
| `CitationList` | Displays SQL + sources | Toggle to reveal underlying SQL, copy buttons |
| `InsightActions` | Suggests next steps | Hooks into `ai/recommendations` endpoint |

Design ensures **trust**: each AI answer surfaces the SQL snippet, tables touched, and confidence score (progress bar).

---

## 🧪 Documentation & Testing

- **Storybook** (optional): `pnpm storybook` -> previews, accessibility audits, visual regression.
- **Chromatic/Happo**: Visual diff on PRs for core components.
- **Testing Library**: Interaction tests per composite component.
- **Axe-core**: `pnpm test:a11y` snapshots for key routes.

Component documentation lives alongside source (`/** @component */` JSDoc) and within Storybook MDX stories.

---

## 🔗 References
- `docs/frontend/STATE_MANAGEMENT.md` – Hook patterns and stores powering components.
- `docs/frontend/POSITIONING.md` – Brand voice, storytelling guidelines for UI copy.
- `docs/frontend/DEPLOYMENT.md` – Asset budgets and bundler configuration.
- `docs/ai/README.md` – AI UX contract (messages, metadata, capabilities).

---

*Last Updated: October 2, 2025*
