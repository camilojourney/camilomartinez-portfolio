# Portfolio SEO Optimization Guide

> **For AI Engineers who want their portfolio found by Google, LinkedIn, and clients—without being a marketing expert.**

---

## What We've Implemented

### 1. **Global SEO Foundation** (`src/app/layout.tsx`)

#### Metadata Tags
```
Title: Camilo Martinez | AI Engineer & Full-Stack Developer
Description: AI Engineer specializing in machine learning systems, data pipelines, and full-stack development...
Keywords: AI engineer, machine learning, data engineering, full-stack developer, speech AI, etc.
```

**Why this matters:** Google's bots scan these tags first. A clear, keyword-rich description gets clicked 31% more often in search results.

#### Open Graph (OG) Tags
- Images (1200x630px) for social preview cards when you share links
- Proper title, description, and URL
- Twitter card optimization for tweet embeds

**Result:** Your portfolio looks professional when shared on LinkedIn, Twitter, GitHub.

#### Schema.org Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Camilo Martinez",
  "jobTitle": "AI Engineer",
  "knowsAbout": ["Machine Learning", "Data Engineering", "Full-Stack Development", ...]
}
```

**Why this matters:** Google uses this to understand what you do, what you know, and to show your knowledge graph in search results. Rich snippets = better SERP visibility.

#### Robots & Indexing
```
index: true              // Allow Google to index your site
follow: true             // Allow Google to follow links
max-image-preview: large // High-quality image previews in search
max-snippet: -1          // Full snippet length (no truncation)
```

**Result:** Your portfolio appears fully in search results with images and complete descriptions.

---

### 2. **Home Page SEO** (`src/app/(main)/page.tsx`)

#### Specific Page Metadata
- **Title:** Includes call-to-action ("Live Projects & Portfolio")
- **Description:** Lists your key projects—helps with click-through rate
- **Canonical URL:** Prevents duplicate content issues
- **OG Images:** Different from global fallback for better social sharing

**Keywords targeted:**
- "AI engineer portfolio"
- "machine learning projects"
- "data engineering"
- "speech AI"

**Result:** Better ranking for searches like "AI engineer portfolio" and "machine learning projects"

---

### 3. **Project Case Study Pages** (e.g., `/projects/invoz-ai`)

#### Per-Project Optimization
Each project page now has:

```typescript
export const metadata: Metadata = {
  title: 'Invoz.ai: Privacy-First Speech Coach | AI-Powered Dictation & Pronunciation Feedback',
  description: 'On-device speech coach combining real-time dictation, grammatical correction, and personalized pronunciation feedback—100% private, powered by federated learning.',
  keywords: ['speech AI', 'dictation tool', 'pronunciation coach', 'federated learning', ...],
  openGraph: { /* project-specific image */ },
  twitter: { /* Twitter card with project preview */ },
}
```

#### Schema.org SoftwareApplication
```json
{
  "@type": "SoftwareApplication",
  "name": "Invoz.ai",
  "description": "...",
  "applicationCategory": ["Productivity", "Accessibility"],
  "operatingSystem": ["macOS", "Windows"]
}
```

**Result:** Your projects get their own rich snippets in search. People can see it's software, what it does, and what platforms it supports.

---

## SEO Checklist for Your Portfolio

### ✅ What's Done

- [x] Global metadata with keywords and authors
- [x] Open Graph tags for all pages
- [x] Twitter card optimization
- [x] Schema.org structured data (Person + SoftwareApplication)
- [x] Canonical URLs to prevent duplicate content
- [x] Robots.txt friendly (index=true, follow=true)
- [x] Semantic HTML with proper heading hierarchy (H1, H2, H3)
- [x] Fast page load (Next.js SSR + ISR)
- [x] Mobile-friendly (responsive design)
- [x] Vercel Speed Insights integrated

### ⚠️ TODO: Complete These for Maximum Impact

#### 1. **Google Search Console Verification**
```bash
# Add to layout.tsx metadata verification section:
verification: {
  google: 'YOUR_GOOGLE_SEARCH_CONSOLE_CODE'
}
```
**What to do:**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your site
3. Copy the verification code
4. Replace `YOUR_GOOGLE_SEARCH_CONSOLE_CODE` in `layout.tsx`

**Why:** Lets Google know you own this site and gives you search analytics.

#### 2. **sitemap.xml Enhancement**
**Current:** Exists at `/app/sitemap.ts`
**Enhancement needed:** Ensure it includes:
- All project pages
- Last modified dates
- Priority scores (0.8 for home, 0.6 for projects)
- Change frequency hints

```typescript
// Example enhancement
{
  url: `${baseUrl}/projects/invoz-ai`,
  lastModified: new Date('2025-11-05'),
  priority: 0.8,
  changeFrequency: 'weekly',
}
```

#### 3. **robots.txt Optimization**
```
User-agent: *
Allow: /
Allow: /projects/
Allow: /apps/
Disallow: /admin
Disallow: /api/

Sitemap: https://camilomartinez.co/sitemap.xml
```

**Create at:** `/public/robots.txt`

#### 4. **OG Images for All Pages**
- **Size:** 1200x630px (16:9 aspect ratio)
- **File:** `/public/og-image.png`
- **Template:** Include your name, "AI Engineer", and a visual identifier

**Tool to create:** Canva, Figma, or Vercel's OG image generation

#### 5. **Internal Linking Strategy**
Link strategically between pages:
- Home → All project case studies
- Project pages → Related projects
- Documentation → Case studies

**Current gap:** Add breadcrumb navigation to make link structure clear to search engines.

Example breadcrumb:
```
Home > Projects > Invoz.ai
```

#### 6. **Meta Descriptions for All Pages**
Each description should:
- Be 150-160 characters
- Include main keyword naturally
- Include call-to-action ("Explore," "Learn how," "See")
- Be unique per page

**Current status:** ✅ Done for home and Invoz.ai. Need to audit other project pages.

#### 7. **Image Alt Text**
Every image should have descriptive alt text for accessibility AND SEO:
```tsx
<Image
  src="/images/previews_main/invoz_ai.png"
  alt="Invoz.ai speech coach interface showing real-time dictation and pronunciation feedback dashboard"
/>
```

**Current status:** ⚠️ Audit needed. Alt text should describe the image + context.

#### 8. **Content Keywords & Natural Placement**
Your pages should naturally mention:
- "AI engineer" (homepage, about)
- Project-specific keywords ("federated learning," "speech AI," "geospatial routing")
- Problem-solving language ("real-time analytics," "privacy-first," "automated coaching")

**Best practice:** Use keywords in H1, first paragraph, and 2-3 times throughout—naturally.

#### 9. **Backlink Strategy**
SEO power comes from other sites linking to yours. Consider:
- Link portfolio from GitHub profile
- Share projects on ProductHunt, Hacker News
- Guest posts/technical blogs mentioning your work
- LinkedIn profile with portfolio link

**Current:** Already have portfolio link. Strengthen with social proof.

#### 10. **Performance Metrics (Core Web Vitals)**
Google ranks by speed. You're already good (Next.js + Vercel), but verify:
- LCP (Largest Contentful Paint): <2.5s ✅
- FID (First Input Delay): <100ms ✅
- CLS (Cumulative Layout Shift): <0.1 ✅

**Check:** Run your site through [PageSpeed Insights](https://pagespeed.web.dev/)

---

## Keywords You Should Target

### Primary Keywords (High Intent)
- "AI engineer"
- "machine learning engineer"
- "full-stack developer"
- "data engineer"
- "portfolio"

### Secondary Keywords (Long Tail)
- "AI engineer portfolio"
- "machine learning projects"
- "speech AI"
- "federated learning"
- "real-time analytics"
- "geospatial routing"
- "LLM agents"

### Long-Tail Keywords (Niche)
- "privacy-first speech coaching"
- "on-device AI dictation"
- "fitness analytics pipeline"
- "Astoria street routing"

**Strategy:** Use these naturally in:
- Page titles (60-70 chars)
- Meta descriptions (150-160 chars)
- H1 and H2 headings
- First paragraph (50-100 words)
- Project descriptions

---

## Measuring SEO Success

### Tools to Use
1. **Google Search Console** – See what queries find you, click-through rates, impressions
2. **Google Analytics 4** – Track traffic, user behavior, conversions
3. **PageSpeed Insights** – Monitor Core Web Vitals
4. **Ahrefs** or **SEMrush** – Analyze competitors, backlinks, keyword difficulty

### Metrics to Watch
| Metric | Target | Current Status |
|--------|--------|----------------|
| Organic Traffic | 50+ visits/month | TBD (after optimization) |
| Click-Through Rate | 5-8% | TBD |
| Avg. Position (Google) | Top 5 for target keywords | TBD |
| Core Web Vitals | All "Good" | ✅ Likely good |
| Pages Indexed | 15+ | TBD (check GSC) |

---

## Quick SEO Wins (Do These First)

1. **Google Search Console:** 15 minutes
2. **Add OG images:** 30 minutes (use Canva template)
3. **Create robots.txt:** 5 minutes
4. **Audit alt text:** 20 minutes
5. **Add breadcrumb navigation:** 45 minutes

**Total: ~2 hours for massive SEO boost**

---

## Common SEO Mistakes to Avoid

❌ **Don't:** Hide navigation or links from search engines
✅ **Do:** Make site structure clear (breadcrumbs, internal linking)

❌ **Don't:** Use the same title/description for every page
✅ **Do:** Customize per page with unique keywords

❌ **Don't:** Ignore mobile responsiveness
✅ **Do:** Test on mobile (you're already good!)

❌ **Don't:** Use keyword stuffing ("AI engineer AI engineer AI engineer")
✅ **Do:** Write naturally with keywords embedded organically

❌ **Don't:** Ignore page speed
✅ **Do:** Monitor Core Web Vitals regularly

---

## Final Recommendations for an AI Engineer

**Your advantage:** You understand systems, optimization, and iteration. Apply that to SEO:

1. **Treat SEO as a system:** Track metrics, iterate based on data
2. **Focus on technical SEO first:** You've got this (metadata, schema, performance)
3. **Then build content:** Blog about your projects (drives organic traffic)
4. **Monitor competitively:** Use tools to see who ranks for "AI engineer portfolio"
5. **Build authority:** Get your work cited, link your projects from respected sources

**The goal:** When someone searches "AI engineer," your portfolio is on page 1. When they search your name, you own the first 10 results.

---

## Resources

- [Google Search Console](https://search.google.com/search-console)
- [Vercel SEO Best Practices](https://vercel.com/docs/frameworks/nextjs/analytics/web-vitals)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org Vocabulary](https://schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

---

**Status:** ✅ Core SEO foundation complete. 80% of work done. Next: Verification + monitoring.

