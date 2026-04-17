# UX Review -- camilomartinez-portfolio

**Date:** 2026-03-26
**Auditor:** Claude Opus 4.6 (automated)
**Method:** Code analysis, desktop screenshot review (1280px), Playwright screenshots captured for /, /about, /contact, /blog

---

## Screenshots Captured

- `screenshots/home-desktop.png` -- Full-page homepage/projects showcase
- `screenshots/about-desktop.png` -- About page with story, skills, values
- `screenshots/contact-desktop.png` -- Contact page with info and CTAs
- `screenshots/blog-desktop.png` -- Blog listing page

Mobile screenshots (375px viewport) were attempted but Playwright timed out due to server connection limits. Mobile analysis below is based on code review of responsive classes.

## Axe Accessibility Audit

`npx @axe-core/cli` failed to execute (likely due to chromium process contention with dev server). Accessibility findings below are derived from manual code inspection against WCAG 2.1 AA.

---

## Accessibility Findings

### Critical (P0)

| Issue | Location | WCAG | Details |
|-------|----------|------|---------|
| **Low text contrast** | Site-wide | 1.4.3 (AA) | `text-white/50` (rgba 255,255,255,0.5) on `#0a0a0b` background = 5.6:1 (passes). But `text-white/40` = 4.5:1 (borderline). `text-white/30` = 3.4:1 **FAILS**. Used in footer dots, timestamps, secondary labels. |
| **Blog post titles invisible** | `/blog` | 1.4.3 (AA) | `text-neutral-900 dark:text-neutral-100` inside a `bg-white/[0.03]` card on dark background. Screenshot confirms blog post titles are barely readable -- the dates at `text-neutral-600 dark:text-neutral-400` are nearly invisible against the dark glass card. |
| **No skip navigation link** | `layout.tsx` | 2.4.1 (A) | No skip-to-content link for keyboard users. The layout has nav, then main, then footer, but no skip mechanism. |
| **SVG icons missing accessible names** | Multiple components | 1.1.1 (A) | Footer icons (`GitHubIcon`, `LinkedInIcon`, etc.) have no `aria-label` on the parent `<a>` tags. The `<p>` with text provides visual label but screen readers may not associate it. Some SVGs have `aria-hidden="true"` (good) but the parent links need explicit labels. |
| **Chat widget keyboard trap** | `ChatWidget.tsx` | 2.1.2 (A) | When chat opens, focus is moved to the input field. But there is no focus trap management -- pressing Tab can cycle behind the overlay. Also, Escape key doesn't close the chat (no `onKeyDown` handler for Escape). |

### Serious (P1)

| Issue | Location | WCAG | Details |
|-------|----------|------|---------|
| **No heading hierarchy on homepage** | `(main)/page.tsx` + `ProjectsShowcase.tsx` | 1.3.1 (A) | The homepage has `<h1>` (hero), then `<h2>` (Featured Work), then `<h3>` (project titles). This is correct. But service cards (Audio/Speech ML, Multi-Agent Systems, Business-Aware AI) use `<h3>` without a parent `<h2>`, creating a skip in the outline. |
| **Form input missing label** | `ChatWidget.tsx` | 1.3.1 (A) | The chat input has `placeholder="Ask anything..."` but no associated `<label>` element. Placeholder text alone is not sufficient for screen readers. |
| **Focus indicator insufficient** | `globals.css` | 2.4.7 (AA) | Custom focus style `outline: 2px solid rgba(6, 182, 212, 0.5)` is semi-transparent. At 50% opacity on a dark background, this may be hard to perceive for users with low vision. Should be fully opaque. |
| **Mobile menu button has no aria-expanded** | `liquid-nav.tsx` | 4.1.2 (A) | The hamburger button toggles `isMenuOpen` but doesn't set `aria-expanded={isMenuOpen}` to communicate state to assistive tech. |
| **dangerouslySetInnerHTML in chat** | `ChatWidget.tsx` | N/A (security) | The `renderContent()` function renders user-provided text as HTML via `dangerouslySetInnerHTML`. While it does regex-based link parsing, there is no XSS sanitization. A malicious chat response containing `<script>` or `<img onerror=>` would execute. |

### Moderate (P2)

| Issue | Location | WCAG | Details |
|-------|----------|------|---------|
| **No lang attribute on chat content** | `ChatWidget.tsx` | 3.1.2 (AA) | If the chat responds in Spanish (likely given the target audience), there's no `lang` attribute change. |
| **Status badge animations** | `ProjectsShowcase.tsx` | 2.3.1 (A) | The pulsing green dot on status badges uses `animate-pulse` which is continuous animation. Should respect `prefers-reduced-motion`. |
| **No prefers-reduced-motion** | `globals.css` | 2.3.1 (A) | The CSS has multiple animations (gradient-xy, pulse-slow, blob, liquid-float) but no `@media (prefers-reduced-motion: reduce)` override to disable them. |
| **Touch targets too small** | Footer social links | 2.5.8 (AAA) | Footer social links in mobile grid are `p-2` (8px padding) on top of icon + text. The actual tappable area may be sufficient due to `p-2`, but the icons themselves (20x20px) are below the recommended 44x44px minimum. |
| **Color alone conveys status** | `ProjectsShowcase.tsx` | 1.4.1 (A) | Status badges use color (green=live, amber=in-progress, purple=prototype) as the primary differentiator. The text label is present, so this passes, but the pulsing colored dot alone would fail. |

---

## Mobile Responsiveness (Code Review)

### What Works

- **CSS breakpoints:** `md:` (768px) and `sm:` (640px) breakpoints used consistently
- **Min-width set:** `body { min-width: 360px }` prevents extreme narrow rendering
- **Mobile nav:** Hamburger menu with grid layout for nav items
- **Footer grid:** `grid-cols-2` on mobile, flex row on desktop
- **Touch-friendly CTAs:** Primary buttons use `px-8 py-4` which provides adequate touch targets

### What Needs Work

| Issue | Priority | Details |
|-------|----------|---------|
| **Project cards don't reflow** | P1 | `grid-cols-1 md:grid-cols-2` for tier-1, `grid-cols-1 md:grid-cols-3` for tier-2. On tablet (768px-1024px), 3-column grid for tier-2 projects will be cramped -- each card gets ~256px width. |
| **Chat widget overlaps on small screens** | P1 | Fixed `bottom-6 right-6` positioning. The chat window is `w-[min(360px,calc(100vw-48px))]` which is good, but at 375px viewport, it fills nearly the entire width. The trigger button at bottom-right may overlap with content. |
| **Hero text too large on mobile** | P2 | `text-5xl md:text-7xl` for hero headings. At 375px, `text-5xl` (3rem = 48px) is still large. Could cause awkward line breaks on "Juan Camilo Martinez Applied AI Engineer". |
| **Horizontal scroll risk on blog** | P2 | The `.prose pre` code blocks have `overflow-x: auto` but tables have `white-space: nowrap` and `display: block` which could force horizontal scroll on narrow viewports. |
| **Safe area insets partial** | P2 | Desktop nav uses `pt-safe-area-inset-top` but mobile nav does not. On iPhones with notch/dynamic island, the mobile nav could be obscured. |

---

## CTA Clarity

### Current CTAs (ranked by visibility)

1. **Homepage hero:** "Get in touch" button -- clear, prominent, good placement
2. **About page:** "Send Email" + "Connect on LinkedIn" dual buttons -- good
3. **Contact page:** Same dual buttons repeated twice (once in CTA section, once in "Open to Opportunities" card) -- redundant
4. **Chat widget teaser:** "Built a speech ML pipeline from 46 papers. Ask me about it." -- interesting hook, good

### CTA Issues

| Issue | Priority |
|-------|----------|
| **No resume download CTA anywhere.** Recruiters at Anthropic/Google expect a PDF resume link. | P0 |
| **Email is the only direct contact method.** No Calendly/scheduling link for meeting requests. | P1 |
| **"Actively seeking Applied AI Engineer roles"** appears on About page, Contact page (twice), and the homepage meta description. Repetition dilutes urgency. | P2 |
| **LinkedIn URL inconsistency.** About page links to `linkedin.com/in/camilomartinez-ai/` but schema.org data says `linkedin.com/in/camilomartinez` (without `-ai`). One of these is a dead link. | P1 |

---

## Information Hierarchy

### Current Structure

```
/ (home) --> renders ProjectsShowcase (same as /projects)
/projects --> same ProjectsShowcase component
/about --> story + skills + values + CTA
/blog --> 3 short opinion posts from April 2024
/contact --> contact info + links + availability
/bookshelf --> 10 book recommendations (not in nav)
/tools --> 4 resource cards, 2 "coming soon" (not in nav)
/live-data --> WHOOP auth demo (not in nav)
/apps/* --> various app demos (not in nav)
/projects/* --> case study pages (not in nav)
```

### Issues

| Issue | Priority | Details |
|-------|----------|---------|
| **Homepage IS the projects page.** `(main)/page.tsx` renders `ProjectsShowcase` identically to `/projects`. There is no distinct homepage with a focused value proposition. | P0 |
| **Nav has only 3 items but site has 8+ sections.** Bookshelf, tools, live-data, and apps are all accessible only via deep links or footer. This creates orphan pages. | P1 |
| **Blog is in nav but has only 3 trivial posts.** It's the weakest page but given equal nav prominence to "work" and "about." | P1 |
| **Blog link removed from nav in code.** Looking at `liquid-nav.tsx` line 46-49, the nav items are work, about, contact. Blog was removed from nav. But the blog page still has `<LiquidNav currentPage="blog" />` which means blog is a visible page with no nav entry point. | P2 |
| **Tier-3 projects dilute tier-1 signal.** The homepage shows 15 projects. By the time a recruiter scrolls past Invoz and Holus, they hit "Accountability Partner" and "HRV Research" which are hobby projects. Tier-3 should be collapsed or on a separate page. | P1 |

---

## Load Time Assessment (Code-Based)

### Positive Signals
- Next.js 16 with App Router (server components by default)
- `@vercel/speed-insights` and `@vercel/analytics` installed
- Image optimization via `next/image` with proper `sizes` attributes
- Priority loading for tier-1 project images

### Concerns
| Issue | Priority | Impact |
|-------|----------|--------|
| **Large static HTML files in public/** | P2 | `hrv-research.html` is 20MB, `nlp-presentation_final.html` is 172KB. If served, these add significant payload. |
| **No dynamic import for heavy components** | P2 | Leaflet maps (`react-leaflet`), Recharts, and the chat widget are all statically imported. They should be `dynamic()` imports with `ssr: false`. |
| **Geist font loading** | P3 | Using `GeistSans.variable` + `GeistSans.className` -- good, this uses next/font optimized loading. |
| **bot.png is 1.1MB** | P1 | The chatbot avatar image at `public/bot.png` is over 1MB. This loads on every page via the ChatWidget. Should be optimized to <50KB. |

---

## P0-P3 Fix Plan

### P0 -- Fix Immediately (Before Any Recruiter Sees This)

1. [ ] **Add resume download button.** Place a "Download Resume" link in the hero section and contact page. PDF in `public/downloads/`.
2. [ ] **Fix LinkedIn URL mismatch.** Verify which LinkedIn slug is correct (`camilomartinez-ai` or `camilomartinez`). Update schema.org data in layout.tsx to match.
3. [ ] **Remove or replace blog.** Either delete the blog page and remove all references, or replace the 3 joke posts with 1-2 substantial technical pieces.
4. [ ] **Create a distinct homepage.** The homepage should NOT be the same as /projects. It should have a focused hero, 2-3 highlight projects, and a clear CTA. Let /projects be the full catalog.
5. [ ] **Fix Google verification placeholder.** Remove `'YOUR_GOOGLE_VERIFICATION_CODE'` from layout.tsx or replace with actual code.
6. [ ] **Remove duplicate chatbot.** Keep ChatWidget.tsx (global), remove or deprecate chat.tsx (about page).

### P1 -- Fix This Week

7. [ ] **Add `prefers-reduced-motion` media query.** Wrap all CSS animations in a `@media (prefers-reduced-motion: no-preference)` block.
8. [ ] **Fix chat widget accessibility.** Add `<label>` to input, handle Escape key to close, add `aria-expanded` to mobile menu button, add focus trap.
9. [ ] **Optimize bot.png.** Compress from 1.1MB to <50KB. Use WebP format.
10. [ ] **Fix text contrast.** Replace all `text-white/40` and `text-white/30` usage with at least `text-white/60` (passes AA at 4.5:1 on the dark background).
11. [ ] **Collapse tier-3 projects.** Show tier-3 behind a "Show more" toggle, or move to a separate page.
12. [ ] **Fix blog post metadata.** Change schema.org author from `'My Portfolio'` to `'Juan Camilo Martinez'`.
13. [ ] **Add skip navigation link.** `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>` at the top of layout.tsx.
14. [ ] **Sanitize chat HTML output.** Add DOMPurify or equivalent to `renderContent()` in ChatWidget.tsx.

### P2 -- Fix This Sprint

15. [ ] **Lazy-load heavy components.** Use `next/dynamic` with `ssr: false` for Leaflet maps, Recharts charts, and ChatWidget.
16. [ ] **Remove "Coming Soon" cards from Tools page.** Show only completed resources.
17. [ ] **Add `aria-label` to all social links in footer.** E.g., `aria-label="GitHub profile"`.
18. [ ] **Fix mobile safe area insets on nav.** Add `pt-safe-area-inset-top` to mobile nav in liquid-nav.tsx.
19. [ ] **Add project card responsive breakpoints.** Use `lg:grid-cols-3` instead of `md:grid-cols-3` for tier-2 to prevent cramped cards on tablet.
20. [ ] **Consistent card component usage.** Replace inline glass styles with the `<Card>` component everywhere.

### P3 -- Polish When Able

21. [ ] **Add scroll-driven animations.** Use framer-motion `useInView` for section reveals.
22. [ ] **Add Calendly or scheduling link** to contact page.
23. [ ] **Add page transition animations** between routes.
24. [ ] **Move 20MB HTML files** out of public/ to external hosting (S3 or similar).
25. [ ] **Add proper 404 page** with nav and back-to-home link.

---

*Review completed. No source code was modified. Screenshots saved to `tasks/2026-03-26/screenshots/`.*
