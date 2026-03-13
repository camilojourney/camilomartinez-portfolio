# UX Code Map — camilomartinez-portfolio — 2026-03-13

## 1. Routes & Pages
- `/` (home) → `src/components/projects/ProjectsShowcase.tsx` — hero + services + tiered projects
- `/about` → `src/app/(main)/about/page.tsx` — bio + skills + values + CTA
- `/contact` → `src/app/(main)/contact/page.tsx` — contact info + links + availability
- `/projects` → redirects to home (ProjectsShowcase)
- `/projects/[slug]` → case study pages
- `/blog` → hidden from nav but still exists at route
- `/apps/*` → various embedded apps (fitness-dashboard, astoria-conquest, etc.)
- Global: `ChatWidget.tsx` on every page, `LiquidNav` shared navigation

## 2. Button & Touch Target Audit
- `src/components/ChatWidget.tsx:227` — trigger button `width: 52, height: 52` = 52px ✅
- `src/components/ChatWidget.tsx:180` — send button `w-7 h-7` = 28px ❌ (below 44px minimum)
- `src/components/ChatWidget.tsx:121` — close button X uses only icon, no explicit size ❌ (inherits ~16px)
- `src/components/ChatWidget.tsx:155-162` — suggested question buttons `px-3 py-2` ≈ 32px height ❌
- `src/components/shared/liquid-nav.tsx` — mobile menu button (Menu/X icons) — needs check
- `src/app/(main)/about/page.tsx` — no interactive elements below 44px (CTA buttons are large)
- `src/components/projects/ProjectsShowcase.tsx:222` — "Personal Projects" toggle button has no min-height ❌

## 3. Accessibility Gaps
- `src/components/ChatWidget.tsx:121` — close button missing aria-label ❌
- `src/components/ChatWidget.tsx:227` — trigger button has aria-label ✅
- `src/components/ChatWidget.tsx:155` — suggested question buttons: no role="option" or aria-description ⚠️
- `src/components/projects/ProjectsShowcase.tsx` — service section SVG icons inside divs, no alt text ❌
- `src/components/projects/ProjectsShowcase.tsx:133` — status dot uses `bg-current/80` which may not be valid Tailwind ⚠️
- `src/app/(main)/about/page.tsx` — SVG icons in skill cards have no aria-hidden="true" ❌
- `src/app/(main)/contact/page.tsx` — SVG icons properly placed but missing aria-hidden ❌
- `src/components/projects/ProjectsShowcase.tsx:222` — collapsible section needs aria-expanded ❌

## 4. Mobile/Responsive Issues
- `src/components/ChatWidget.tsx:106` — chat modal `w-[360px]` is fixed width — may overflow on screens < 375px ⚠️
- `src/components/projects/ProjectsShowcase.tsx` — tier 1 grid `md:grid-cols-2` OK, but tier 2 `md:grid-cols-3` may be tight on tablets
- About page skills grid `md:grid-cols-2` — OK for mobile
- Contact page `lg:grid-cols-2` — OK, single column on mobile

## 5. Top 10 P0/P1 Issues

### P0 (Conversion-blocking)
1. **ChatWidget send button too small** | `src/components/ChatWidget.tsx:180` | Actual: w-7 h-7 (28px) | Fix: increase to w-10 h-10 (40px) minimum
2. **ChatWidget close button too small** | `src/components/ChatWidget.tsx:121` | Actual: no explicit size | Fix: add w-8 h-8 p-1 minimum
3. **ChatWidget suggested questions too small** | `src/components/ChatWidget.tsx:155-162` | Actual: ~32px | Fix: add py-3 for 44px touch target
4. **ChatWidget fixed 360px width overflows narrow phones** | `src/components/ChatWidget.tsx:106` | Fix: use `w-[min(360px,calc(100vw-48px))]`

### P1 (Significant friction)
5. **Missing aria-label on ChatWidget close button** | `src/components/ChatWidget.tsx:121` | Fix: add `aria-label="Close chat"`
6. **Service section SVGs missing aria-hidden** | `src/components/projects/ProjectsShowcase.tsx:85,92,99` | Fix: add `aria-hidden="true"` to decorative SVGs
7. **About page skill card SVGs missing aria-hidden** | `src/app/(main)/about/page.tsx` | Fix: add `aria-hidden="true"`
8. **Personal Projects toggle missing aria-expanded** | `src/components/projects/ProjectsShowcase.tsx:222` | Fix: add `aria-expanded={showPersonal}`
9. **bg-current/80 is not valid Tailwind** | `src/components/projects/ProjectsShowcase.tsx:133` | Fix: use `bg-current opacity-80` or specific color
10. **ChatWidget teaser close button uses "x" text** | `src/components/ChatWidget.tsx:213` | Fix: use proper X icon with aria-label
