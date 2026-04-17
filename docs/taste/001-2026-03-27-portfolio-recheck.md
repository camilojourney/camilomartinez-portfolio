# Taste Recheck 001 -- 2026-03-27

Auditor: Claude Opus 4.6 (visual-designer + content-critic + brand-strategist)
Target: camilomartinez.com (commit 50d6ee5)

---

## Scores

| # | Dimension | Score | Verdict |
|---|-----------|-------|---------|
| 1 | Homepage hero | 8/10 | Strong but missing OG-image and has no `<meta description>` on the homepage page component itself |
| 2 | Projects page | 8/10 | Premium cards, good stagger, but tier 2 grid lacks stagger animation |
| 3 | About page | 8/10 | Authentic narrative, but no scroll-reveal animations on sections |
| 4 | Blog | 5/10 | Bare-bones listing, no hover states, slug page has broken author and unstyled layout |
| 5 | Live data / WHOOP | 6/10 | Good chart when authenticated, but wrong `currentPage` prop, uses old `LiquidPage`, and has dead "Advanced Analytics" section |
| 6 | Astoria Conquest | 7/10 | Map works, stats are solid, but chart styling is generic (gray bg, no glass treatment) |
| 7 | Animations | 8/10 | Hero stagger, scroll-reveal, card-stagger all work; page transitions are smooth |
| 8 | Contact + Footer + 404 | 8/10 | All three are polished; minor footer mismatch (has Blog link, nav does not) |
| 9 | SEO + Meta | 4/10 | Critical gaps: placeholder Google verification, no static og-image.png, OG route is generic white template, sitemap is stale |
| 10 | Accessibility | 7/10 | Skip-link exists, focus-visible defined, contrast overrides in place, but WCAG contrast hacks override Tailwind globally |
| 11 | Brand consistency | 7/10 | Homepage/projects/about/contact share the dark glass language; blog and live-data feel like different apps |
| 12 | Competitive bar | 6/10 | Would impress a mid-level hiring manager; would not make a Linear/Anthropic designer forward the link yet |

**Overall: 6.8/10** -- Solid foundation, but blog, SEO, live-data, and brand consistency drag it below the bar.

---

## Dimension Details + Exact Fixes

### 1. Homepage Hero -- 8/10

**What works:** The name-as-brand treatment (`Camilo / Martinez` with gradient) is confident. Staggered entrance animations are correctly timed. Credibility markers (46 papers, 32 agents, NYC) are scannable. CTA pair (Get in touch + Resume) is clear.

**What fails:**

1. **Homepage has no page-level metadata.** The root `page.tsx` is `<ProjectsShowcase currentPage="projects" />` with zero metadata export. The root layout metadata covers it via `title.default`, but the homepage should have its own `description` for search snippet differentiation.
   - **Fix:** `src/app/(main)/page.tsx` -- add `export const metadata: Metadata = { description: '...' }` with a homepage-specific description.

2. **No physical `og-image.png` exists in `/public/`.** The root layout references `${baseUrl}/og-image.png` but no such file exists. Social shares will 404 on the image.
   - **Fix:** Create a 1200x630 branded OG image at `public/og-image.png`. Dark background, name, title, gradient accent.

---

### 2. Projects Page -- 8/10

**What works:** Tiered project hierarchy is smart. Card hover effects (shimmer border, mouse-follow radial gradient, lift) are premium. Color-coded tech badges by category. Status badges with pulsing dots. Preview images with gradient overlays.

**What fails:**

1. **Tier 2 and Tier 3 grids do not use `StaggerGrid`.** Only tier 1 gets the stagger entrance animation. Tier 2 uses a plain `<div className="grid ...">` and cards appear instantly.
   - **Fix:** `src/components/projects/ProjectsShowcase.tsx` line 409 -- wrap tier 2 grid in `<StaggerGrid>` instead of plain `<div>`. Same for tier 3 at line 428.

2. **Featured prop does nothing visually meaningful.** `featured` only adds a slightly stronger hover shadow (`hover:shadow-cyan-500/[0.10]` vs `[0.06]`). Not enough visual differentiation for tier 1.
   - **Fix:** Make tier 1 cards span 2 columns on desktop for the first card, or increase padding/image height, or add a "Featured" label badge.

---

### 3. About Page -- 8/10

**What works:** "The Real Version" narrative is authentic and differentiated. Timeline with colored dots and gradient line is well-crafted. Skills grid with hover scaling. Values section with numbered items. Chat widget integration.

**What fails:**

1. **No scroll-reveal animations on any section.** Every section appears instantly on load. The projects page uses `ScrollReveal` and `StaggerGrid`; the about page uses neither.
   - **Fix:** `src/app/(main)/about/page.tsx` -- import `ScrollReveal` from `@/components/shared/scroll-reveal` and wrap each major section (Story, Timeline, Skills, Values, Chat, CTA) in `<ScrollReveal>`.

2. **Timeline dots have `shadow-[0_0_8px_currentColor]`** but `currentColor` may not resolve correctly because the color is set via a conditional class (`bg-amber-400`), not a `color` property.
   - **Fix:** Replace `shadow-[0_0_8px_currentColor]` with explicit shadow colors per timeline item, or use `style={{ boxShadow: '0 0 8px ...' }}` inline.

---

### 4. Blog -- 5/10

This is the weakest page on the site. It needs significant work.

**What fails:**

1. **Blog listing is a barebones text list.** `BlogPosts` component renders `<Link>` elements with just a date and title -- no excerpt, no hover state, no card treatment, no visual rhythm. Compared to the premium project cards, this looks like a skeleton that was never finished.
   - **Fix:** `src/components/features/blog/posts.tsx` -- redesign each post link as a card with glass treatment (`border-white/[0.08] bg-white/[0.02]`), hover lift, summary text, reading time estimate, and transition animations matching the rest of the site.

2. **Blog slug page has zero visual styling.** `src/app/(main)/blog/[slug]/page.tsx` renders a bare `<section>` with no background, no LiquidNav, no page padding, no hero treatment. The title uses `text-2xl` which is undersized compared to every other page title (which use `text-5xl` to `text-7xl`).
   - **Fix:** Add `LiquidNav`, background gradient, proper top padding (`pt-32 md:pt-40`), center the content in `max-w-3xl mx-auto`, increase title size, and add the `prose-premium` class to the article.

3. **Blog post JSON-LD has `author.name: 'My Portfolio'`** -- a placeholder that was never updated.
   - **Fix:** `src/app/(main)/blog/[slug]/page.tsx` line 99 -- change `name: 'My Portfolio'` to `name: 'Juan Camilo Martinez'`.

4. **Blog listing page and blog slug page use different background styles.** The listing page has an animated gradient background; the slug page has no background at all.
   - **Fix:** Apply consistent background treatment to both pages.

---

### 5. Live Data / WHOOP -- 6/10

**What works:** RecoveryChart component is genuinely premium -- gradient bars, green/yellow/red zone coloring, custom tooltip with backdrop blur, reference lines, stat cards with hover lift.

**What fails:**

1. **`currentPage="about"` is wrong.** The live-data page passes `currentPage="about"` to `LiquidPage`, so the nav highlights "about" instead of nothing or a "live data" indicator.
   - **Fix:** `src/app/(main)/live-data/page.tsx` line 45 -- change `currentPage="about"` to `currentPage="my-data"` or remove the prop.

2. **Uses `LiquidPage` component instead of the standard page pattern.** Every other page uses `LiquidNav` + manual background. This page uses a different wrapper (`LiquidPage`) creating visual inconsistency.
   - **Fix:** Refactor to use the same pattern as other pages: `LiquidNav` + fixed background div + manual content layout.

3. **Dead "Advanced Analytics" section.** Lines 167-204 show an "Advanced Analytics Dashboard" section with a description and a link to the fitness dashboard, but no actual charts. The Workout Analytics section (lines 186-204) has empty divs with `{/* Workout Count Chart removed */}` comments. This is shipped dead code visible to users.
   - **Fix:** Either implement the charts or remove the empty sections entirely. A "Charts Available in Fitness Dashboard" placeholder with a link is fine, but two sections saying the same thing is not.

4. **`font-extralight` title** clashes with every other page's `font-bold`/`font-extrabold` titles.
   - **Fix:** `src/app/(main)/live-data/page.tsx` line 50 -- change `font-extralight` to `font-bold`.

---

### 6. Astoria Conquest -- 7/10

**What works:** Dark CARTO tile layer matches the brand. Cyan/magenta color coding for covered/selected streets. Custom zoom controls. Run selector with individual route highlighting. Heart rate zone distribution bar.

**What fails:**

1. **Charts use raw `bg-black/20 rounded-lg` instead of the glass card treatment** used everywhere else. No border, no backdrop-blur, no hover effects. Feels like a different design system.
   - **Fix:** `src/components/features/astoria-conquest/AstoriaStats.tsx` -- replace `bg-black/20 rounded-lg` (lines 98, 140, 278) with `backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl` to match RecoveryChart styling.

2. **StatCard component is minimal.** `bg-black/20 rounded-lg p-4` with no hover effect, no glass border, no animation. Compare to the RecoveryChart stat cards which have `stat-card-hover` class and proper glass treatment.
   - **Fix:** `AstoriaStats.tsx` StatCard function (line 276-285) -- add `border border-white/[0.08] backdrop-blur-lg stat-card-hover rounded-2xl` and increase padding.

3. **Tooltip styling uses gray-700/gray-800 palette** instead of the site's glass black/blur treatment.
   - **Fix:** Replace tooltip `contentStyle` in both charts to match RecoveryChart's tooltip: `{ backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#F3F4F6' }`.

---

### 7. Animations -- 8/10

**What works:** `hero-stagger` entrance with 5 delay tiers. `scroll-reveal` with IntersectionObserver. `card-stagger-in` with blur+scale+translate. Page transition (`route-transition`) with blur fade. `prefers-reduced-motion` is respected across the board.

**What fails:**

1. **Duplicate keyframe definitions.** `globals.css` and `animations.css` both define identical `@keyframes blob`, `@keyframes fade-in`, `@keyframes slide-in`, `@keyframes liquid-float`, `@keyframes concentric-pulse`, `@keyframes loading-shimmer`, and identical animation classes. This is technical debt that adds ~5KB of redundant CSS.
   - **Fix:** Remove all duplicate keyframe and class definitions from `globals.css` that already exist in `animations.css`. Keep one canonical source.

2. **`page-transition` class defined in two places with different animations.** `animations.css` line 152 uses `page-enter` keyframe. `globals.css` line 842 uses `page-fade-in` keyframe (which is never defined). The `page-fade-in` keyframe does not exist, so `globals.css` version is broken.
   - **Fix:** Remove the `.page-transition` rule from `globals.css` line 842-844. Keep only the working definition in `animations.css`.

---

### 8. Contact + Footer + 404 -- 8/10

**What works:** Contact page has proper hero, primary CTA row, social links, info grid with hover states, "What I bring" stats section. Footer has 3-column layout with brand, navigation, connect columns. 404 page has creative "Lost in the latent space" copy with hallucination joke.

**What fails:**

1. **Footer links Blog and Bookshelf, but nav does not.** The footer shows Blog and Bookshelf links; the main `LiquidNav` only shows Work, About, Contact. This mismatch signals incomplete navigation. Users who find Blog via footer have no way to get back to it from the nav.
   - **Fix:** Either add Blog to the main nav (`src/components/shared/liquid-nav.tsx` navItems array), or remove Blog from footer if it is not a first-class page. Given the current blog quality (5/10), adding it to nav only after fixing the blog would be the right call.

2. **Contact page "What I bring" stat `5+` for "Multi-agent systems"** may overcount. The projects list shows Holus, Holus Observatory, and AI Advisory Board as multi-agent systems -- that is 3, not 5+.
   - **Fix:** Either substantiate the 5+ claim or change to `3+` in `src/app/(main)/contact/page.tsx` line 152.

---

### 9. SEO + Meta -- 4/10

This is the most critical gap. A beautiful portfolio with broken SEO is invisible.

**What fails:**

1. **No static `og-image.png` exists.** Root layout references `${baseUrl}/og-image.png` but `public/og-image.png` does not exist. Every social share (LinkedIn, Twitter, Slack) will show a broken image or fallback.
   - **Fix:** Create `public/og-image.png` -- 1200x630, dark branded design with name + title + accent gradient.

2. **Dynamic OG route is a generic white template.** `src/app/og/route.tsx` generates a white background with black text saying "Next.js Portfolio Starter". This is the template that shipped with the Next.js starter and was never customized.
   - **Fix:** Redesign `src/app/og/route.tsx` to use dark background (#050810), white text, cyan-to-blue gradient accent, Geist font, and the site's visual language. Include name and the passed title parameter.

3. **Google verification is a placeholder.** `src/app/layout.tsx` line 79: `google: 'YOUR_GOOGLE_VERIFICATION_CODE'`. This literally ships the string "YOUR_GOOGLE_VERIFICATION_CODE" as a meta tag.
   - **Fix:** Either set up Google Search Console and add the real code, or remove the `verification` field entirely.

4. **Sitemap is stale.** `src/app/sitemap.ts` lists `/apps/trading-bot`, `/apps/think-clear`, `/projects/rag-system`, `/projects/trading-bot` etc. but does not include many current project case study pages (invoz-ai, holus, holus-observatory, pilaster, genpeli, holusight, job-tracker, etc.). The sitemap should be generated from the `projects` data array.
   - **Fix:** `src/app/sitemap.ts` -- import `projects` from `@/data/projects` and dynamically generate project URLs from `projects.map(p => p.caseStudyHref)` instead of hardcoding a stale list.

5. **No `manifest.json` exists in `/public/`.** Root layout references `<link rel="manifest" href="/manifest.json" />` but no such file exists.
   - **Fix:** Create `public/manifest.json` with `name`, `short_name`, `theme_color: "#000000"`, `background_color: "#050810"`, `display: "standalone"`, and icon references.

6. **No `apple-touch-icon.png` or `browserconfig.xml` exists.** Both are referenced in the layout but missing from `/public/`.
   - **Fix:** Create `public/apple-touch-icon.png` (180x180) and `public/browserconfig.xml`.

---

### 10. Accessibility -- 7/10

**What works:** Skip-to-content link. Focus-visible outlines on all interactive elements. Touch target minimums for coarse pointers. `prefers-reduced-motion` respected. `aria-label` on icon buttons. `aria-labelledby` on project sections. `role="contentinfo"` on footer.

**What fails:**

1. **Global CSS overrides Tailwind utility classes for contrast.** `globals.css` lines 685-695 override `.text-white\/50`, `.text-white\/40`, `.text-white\/30` to higher values. This is a blunt instrument -- it changes the meaning of these utility classes site-wide, which will surprise any developer and may cause unintended contrast changes.
   - **Fix:** Instead of overriding Tailwind utilities globally, fix contrast at the component level. Replace instances of `text-white/30` with `text-white/60` directly in the JSX where contrast is needed. Remove the global overrides.

2. **Chat widget messages use `dangerouslySetInnerHTML` with user-processable content.** `ChatWidget.tsx` line 162 renders `renderContent(m.content)` via `dangerouslySetInnerHTML`. While the content comes from the AI API (not direct user input), a response containing HTML could be injected.
   - **Fix:** Sanitize the output of `renderContent()` through a library like `DOMPurify` before setting innerHTML, or switch to a React-based markdown renderer.

3. **Mobile hamburger menu says "Menu" as static text** instead of the site name or a logo. On mobile, the brand identity disappears entirely.
   - **Fix:** `src/components/shared/liquid-nav.tsx` line 89 -- change `<span className="text-white font-semibold text-lg">Menu</span>` to `<a href="/" className="text-white font-semibold text-lg">CM</a>` or the full name.

---

### 11. Brand Consistency -- 7/10

**What works:** Homepage, Projects, About, Contact, and 404 all share: dark background (#050810), glassmorphism cards, cyan/blue gradient accents, Geist Sans font, hero-stagger entrance, and consistent nav + footer.

**What fails:**

1. **Blog listing and blog slug pages feel like a different app.** The listing page has purple-tinted blurred orbs (different from the blue/cyan palette elsewhere). The slug page has no background at all, no nav, no padding -- it renders a bare `<section>` into the root layout.
   - **Fix:** Standardize blog pages to use the same background treatment as projects/about/contact: `bg-[#050810]` base, blue/cyan ambient orbs, LiquidNav. The slug page needs a full layout overhaul (see Blog section above).

2. **Live-data page uses `LiquidPage` wrapper** with different glass card styling and an orange accent divider (`bg-gradient-to-r from-transparent via-orange-400/60 to-transparent`). Orange is not in the brand palette anywhere else.
   - **Fix:** Change the orange divider to cyan (`via-cyan-400/60`) and migrate from `LiquidPage` to the standard page pattern.

3. **Astoria Conquest stats use `bg-black/20 rounded-lg`** instead of the glass card treatment, and chart tooltips use the gray-700 palette. See Astoria section above.

---

### 12. Competitive Bar -- 6/10

**What would make someone at Anthropic/Linear forward this link:**

1. **Case studies that tell engineering stories.** The project descriptions are excellent in data/projects.ts. But clicking through to a case study page -- I did not verify all of them, but the pattern from the blog slug page suggests these may also have minimal styling. If the case study pages are as bare as the blog slug pages, that is a critical gap. A hiring manager clicks "Case study" and gets an unstyled markdown page.

2. **Missing: a signature interaction.** The best portfolios have one moment that makes you go "wow." The project card hover effects are close but not quite there. Consider: a WebGL hero with particles, a terminal-style command-line intro animation, or an interactive demo embedded directly in the homepage.

3. **Missing: social proof or external validation.** No testimonials, no "featured in", no GitHub stars counter, no blog view counts. The narrative is strong ("46 papers, 32 agents") but there is no external signal.

4. **Missing: performance scores.** No Lighthouse scores visible, no Core Web Vitals badge. For an engineer portfolio claiming production quality, showing a 95+ Lighthouse score would be a strong signal.

5. **The blog is a liability.** Right now it hurts more than it helps. Fix it or hide it from navigation until it is polished.

---

## Priority Triage

### P0 -- Fix before sharing with anyone
- [ ] Create `public/og-image.png` (social shares are broken)
- [ ] Fix OG route template (shows "Next.js Portfolio Starter")
- [ ] Remove Google verification placeholder
- [ ] Create `public/manifest.json`, `public/apple-touch-icon.png`
- [ ] Fix blog slug page layout (no nav, no background, no padding)
- [ ] Fix blog JSON-LD author name ("My Portfolio")

### P1 -- Fix before job applications
- [ ] Redesign blog listing with card treatment
- [ ] Update sitemap to dynamically generate from projects data
- [ ] Add scroll-reveal animations to About page sections
- [ ] Add StaggerGrid to tier 2 and tier 3 project grids
- [ ] Fix live-data page `currentPage` prop and remove dead sections
- [ ] Standardize Astoria chart styling to glass treatment
- [ ] Fix mobile nav brand identity ("Menu" -> "CM" or name)

### P2 -- Polish to compete at top tier
- [ ] Remove duplicate CSS keyframes between globals.css and animations.css
- [ ] Remove global Tailwind utility overrides (fix contrast at component level)
- [ ] Sanitize ChatWidget innerHTML
- [ ] Add a signature hero interaction (particles, terminal, or interactive demo)
- [ ] Standardize blog and live-data backgrounds to match brand
- [ ] Verify all case study pages have full styling and layout
- [ ] Add performance badge or Lighthouse score to footer
