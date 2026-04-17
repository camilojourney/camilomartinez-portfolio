# Taste Audit -- camilomartinez-portfolio

**Date:** 2026-03-26
**Auditor:** Claude Opus 4.6 (automated)
**Benchmark:** Linear, Vercel, Arc, Anthropic, Apple Developer -- the bar for AI company recruiters

---

## Overall Scores

| Dimension | Score (1-10) | Notes |
|-----------|:---:|-------|
| **Visual Craft** | 5 | Competent dark theme but generic. Missing the precision of top-tier portfolios. |
| **Content Quality** | 7 | Strong narrative, good project depth. Blog is skeletal (3 joke MDX posts). |
| **Brand Alignment** | 4 | Reads as "developer portfolio" not "elite AI engineer." No visual identity. |
| **Typography** | 5 | Geist Sans is a fine choice but used without typographic system. |
| **Motion & Interaction** | 4 | Animations exist but feel stock, not purposeful. |
| **Information Architecture** | 6 | Tiered projects are good. Too many nav dead-ends (bookshelf, tools, live-data). |
| **Overall Impression** | 5 | Looks like a capable developer's portfolio. Should look like a product from someone who ships AI systems at scale. |

---

## "Looks Like X, Should Look Like Y"

### 1. Homepage / Projects

**Looks like:** A dark-mode SaaS landing page template with gradient backgrounds and glass cards. Interchangeable with hundreds of Tailwind portfolio templates on GitHub.

**Should look like:** Linear's changelog or Vercel's showcase -- clean, confident, editorial. Projects should feel like products being launched, not items in a grid. Each tier-1 project (Invoz, Holus) deserves a hero treatment: full-width preview, motion on scroll, architecture diagram thumbnail. The current layout treats a speech ML pipeline the same as a bookshelf page.

### 2. Navigation

**Looks like:** A floating pill with 3 items (work, about, contact). No logo, no name. The mobile menu says "Menu" in text, which is generic.

**Should look like:** Linear's nav -- name/mark on the left, minimal nav on the right. The nav should instantly tell a recruiter WHO they're looking at. Right now there's no brand presence in the nav at all. Compare: Vercel.com has the triangle. Linear has the mark. This site has nothing.

### 3. About Page

**Looks like:** A resume formatted as cards. Wall of text in "The Journey" section. Skills cards are generic icon + description blocks.

**Should look like:** Anthropic's team pages or a well-crafted personal story. The narrative is genuinely compelling (petroleum engineering in Colombia, bartending to fund a Master's, reading 46 papers) but it's buried in uniform gray text with no visual hierarchy. The emotional arc deserves better treatment -- pull quotes, timeline markers, or even just strategic bold text to create scanning paths.

### 4. Blog

**Looks like:** An afterthought. Three posts from April 2024: "Spaces vs Tabs", "Vim", "Static Typing." These are generic developer opinion pieces that every bootcamp grad writes.

**Should look like:** Either remove the blog entirely (a weak blog hurts more than no blog) OR populate it with genuine technical writing about speech ML, agent architectures, evaluation systems. Anthropic and OpenAI engineers write about their actual work. The blog titles should signal depth, not Reddit flame wars.

### 5. Contact Page

**Looks like:** A contact info card + social links. Functional but not memorable. The "Open to Opportunities" section repeats the exact same CTA text from the About page.

**Should look like:** A single, confident statement with one clear action. "Let's talk about AI engineering. juancamilomabe@gmail.com" -- nothing else needed. The current page has redundant cards, duplicated CTAs, and LinkedIn repeated 3x (nav-adjacent, professional links card, and CTA section).

### 6. Chat Widget

**Looks like:** A standard customer support chat bubble (Intercom/Drift clone). The bot.png avatar and "AI Assistant" label make it feel like a chatbot product, not a portfolio feature.

**Should look like:** If it stays, it should be positioned as a differentiator -- "Ask me about my architecture decisions" with the person's actual photo, not a cartoon bot icon. But honestly, having TWO chatbots (the ChatWidget on every page AND the chat.tsx on the about page) is confusing. Pick one.

### 7. Footer

**Looks like:** Five social icons (GitHub, LinkedIn, Instagram, X, YouTube) plus legal links. Instagram and YouTube are unexpected for an AI engineer portfolio.

**Should look like:** GitHub + LinkedIn. That's it for a technical portfolio targeting Anthropic/Google/OpenAI. Instagram/YouTube dilute the signal. Add a link to a technical blog or research papers instead.

---

## Critical Design Issues

### P0 -- Actively Hurting Credibility

1. **No visual identity.** No logo, no wordmark, no monogram. The name "Juan Camilo Martinez" only appears in the hero text. Compare: every Anthropic employee who has a personal site has a clear mark.

2. **Blog is a liability.** "Spaces vs Tabs" as a blog post on a portfolio targeting Anthropic sends the wrong signal about depth and taste. Either remove or replace with substantial technical content.

3. **Two competing chatbots.** `ChatWidget.tsx` (global floating bubble) and `chat.tsx` (about page embed) use different APIs, different UIs, and different data. This looks unfinished, not intentional.

4. **Google verification placeholder.** `layout.tsx` line 79: `'YOUR_GOOGLE_VERIFICATION_CODE'` is still a placeholder string. Ships to production as-is.

### P1 -- Undermining Quality Perception

5. **Gradient sameness.** Every page uses the same `from-slate-900 via-purple-900/20 to-blue-900/30` background with the same pulsing orbs. After the first page, it registers as "template." Linear uses solid backgrounds. Vercel uses white space. Differentiation comes from content, not decoration.

6. **Text contrast issues.** `text-white/60`, `text-white/50`, and `text-white/40` are used extensively. On the dark gradient backgrounds, these fall below WCAG AA contrast ratios (4.5:1). The blog post dates at `text-neutral-600` on the dark card are nearly invisible.

7. **Inconsistent card styles.** Some use `<Card>` component (glass variables), others use inline `backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08]`. This creates subtle visual inconsistency.

8. **"Coming Soon" sections on the Tools page.** Two of four cards say "Coming Soon" with pulsing dots. This signals incompleteness, not ambition. Ship it or remove it.

9. **Blog author says "My Portfolio".** In `blog/[slug]/page.tsx` line 99: the schema.org author name is literally `'My Portfolio'` instead of "Juan Camilo Martinez."

### P2 -- Polish & Craft Gaps

10. **No scroll animations.** Content appears fully rendered. Linear and Vercel use intersection-observer-based reveals that give each section weight. Framer Motion is installed but barely used.

11. **Project preview images in purple-bordered containers.** The purple border around preview images creates a "frame within a frame" effect that looks more like a wireframe callout than a showcase. Let the images breathe.

12. **Mobile nav says "Menu".** The literal word "Menu" as the nav header on mobile. Should show the person's name or a mark.

13. **Status badges on every project say "Live" with pulsing green dots.** When 14 of 15 projects are "live," the badge loses meaning. It's noise, not signal.

14. **No favicon or og-image.** References to `/og-image.png` and `/apple-touch-icon.png` exist in layout.tsx but the actual files aren't in the public directory listing. These may 404 in production.

---

## What Would Move This From 5/10 to 8/10

1. **Kill the gradients.** Go solid dark (`#0a0a0a` or `#0c0c0c`). Let the project screenshots and content provide the color. This is the single biggest taste upgrade.

2. **Create a wordmark.** Even just "JCM" or "camilo" in a distinctive weight of Geist. Put it in the nav. Make it the favicon.

3. **Hero project treatment.** Invoz and Holus deserve full-width, immersive presentations. An architecture diagram, a 4-second demo GIF, a performance metric. Not the same card as "Accountability Partner."

4. **Remove or rebuild the blog.** Replace with 2-3 substantial technical posts: "How I evaluated 46 speech ML papers and built a production pipeline," "Designing guardrails for a 32-agent system." Content that makes recruiters forward the link.

5. **One chatbot, done well.** Keep the floating widget, kill the about-page chat. Give it Juan's actual photo, not a bot cartoon.

6. **Typography hierarchy.** Use Geist at different weights and sizes with intention. The current site uses `font-bold` and `text-white/70` uniformly. Establish a clear visual hierarchy: display (hero), heading, subheading, body, caption.

7. **Scroll-driven motion.** Use framer-motion's `useInView` to stagger content in. It's already installed. Every top-tier portfolio does this now.

---

## Competitive Comparison

| Site | What They Do Better |
|------|-------------------|
| **Linear.app** | Solid backgrounds, surgical typography, motion that serves content |
| **Vercel.com** | White space, product-level screenshots, confident minimalism |
| **Arc.net** | Personality without gimmicks, unique visual identity |
| **Anthropic.com** | Editorial quality, trust-building through restraint |
| **Linus Lee (thesephist.com)** | Dev portfolio gold standard: writing-first, tools as art |

The portfolio communicates "I can code" but not "I have taste." For Anthropic/Google/OpenAI, the bar is that your portfolio itself should feel like a product you'd ship.

---

*Audit completed. No source code was modified.*
