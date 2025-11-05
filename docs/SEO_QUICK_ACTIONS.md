# 🚀 Portfolio SEO Quick Actions (Next 48 Hours)

## Status: 80% Complete ✅

We've implemented all the **technical SEO** (the hard engineer stuff). Now you need the **operational SEO** (the 1-2 hour setup stuff).

---

## Priority 1: Google Search Console (15 min)

**Why:** Google needs to know you own this site. Without it, you won't see search data.

1. Go to https://search.google.com/search-console/about
2. Click "Add property"
3. Enter your domain: `camilomartinez.co`
4. Choose "URL prefix" method
5. Copy the `<meta>` tag with the verification code
6. Update `/src/app/layout.tsx`:
   ```typescript
   verification: {
     google: 'YOUR_CODE_HERE'
   }
   ```
7. Save, deploy, verify in GSC

**Done when:** GSC shows "Verification successful"

---

## Priority 2: Create OG Image (30 min)

**Why:** When you share your portfolio on LinkedIn/Twitter, it shows a preview. Right now it's probably blank.

1. Go to https://www.canva.com/create/open-graph-image/
2. Use template or create custom 1200x630px image with:
   - Your name: "Camilo Martinez"
   - Subtitle: "AI Engineer | Full-Stack Developer"
   - Logo or visual
   - Colors: Match your portfolio (dark theme)
3. Download as PNG
4. Save to `/public/og-image.png`
5. Redeploy

**Test:** Share your portfolio link on Twitter/LinkedIn, check the preview card

---

## Priority 3: Create robots.txt (5 min)

**Why:** Tells search engines which pages to crawl. Improves crawl efficiency.

1. Create file: `/public/robots.txt`
2. Add this content:
   ```
   User-agent: *
   Allow: /
   Allow: /projects/
   Disallow: /api
   Disallow: /admin

   Sitemap: https://camilomartinez.co/sitemap.xml
   ```
3. Redeploy

**Done when:** File is in production at `https://camilomartinez.co/robots.txt`

---

## Priority 4: Audit Alt Text on Images (20 min)

**Why:** Search engines can't "see" images. Good alt text = SEO + accessibility.

1. Open each project page
2. For each image, check the alt text in code
3. Make it descriptive and keyword-rich:
   - ❌ Bad: `alt="image"`
   - ✅ Good: `alt="Invoz.ai real-time speech coach interface showing pronunciation feedback dashboard"`
4. Update in component files

**Key images to update:**
- `/src/app/(main)/projects/invoz-ai/page.tsx` ✅ Already done
- Other project pages

---

## Priority 5: Add Internal Linking (Breadcrumbs) (45 min)

**Why:** Helps Google understand site structure. Helps users navigate.

Add breadcrumb navigation to all project pages:

```tsx
<nav className="mb-8 text-sm text-white/60">
  <a href="/" className="hover:text-white">Home</a>
  <span className="mx-2">/</span>
  <a href="/projects" className="hover:text-white">Projects</a>
  <span className="mx-2">/</span>
  <span>Invoz.ai</span>
</nav>
```

**Where:** Add to top of each project page before main header

---

## Optional: Advanced SEO (Next Week)

- [ ] **Blog posts** about your projects (drives organic traffic)
- [ ] **LinkedIn profile** link to portfolio
- [ ] **GitHub README** link to portfolio
- [ ] **Submit to ProductHunt** (drives backlinks)
- [ ] **Guest post** on tech blogs mentioning your work

---

## Verify Everything Works

After doing above, test:

1. **Google Search Console:** https://search.google.com/search-console
   - Check "Coverage" → All pages indexed?
   - Check "Performance" → Impressions and clicks appearing?

2. **PageSpeed Insights:** https://pagespeed.web.dev/
   - Enter `camilomartinez.co`
   - Verify "Good" rating

3. **Rich Results Test:** https://search.google.com/test/rich-results
   - Paste your homepage URL
   - Should show "Person" rich result

4. **Social Preview:**
   - Go to https://www.opengraph.xyz/
   - Enter `https://camilomartinez.co`
   - Verify OG image appears

---

## Timeline

| Task | Time | By When |
|------|------|---------|
| Google Search Console | 15 min | Today |
| OG Image | 30 min | Tomorrow |
| robots.txt | 5 min | Tomorrow |
| Alt Text Audit | 20 min | This week |
| Breadcrumbs | 45 min | This week |
| **Total** | **~2 hours** | **This week** |

---

## Expected Results (30 Days)

After implementing above:
- ✅ Portfolio appears in Google search results
- ✅ Rich snippets show (Person + projects)
- ✅ Appears when searching "Camilo Martinez"
- ✅ Appears when searching "AI engineer portfolio"
- ✅ LinkedIn/Twitter previews look professional
- ✅ ~50-100 organic impressions/month
- ✅ Backlink opportunities from being searchable

---

## Questions?

Refer to `/docs/SEO_OPTIMIZATION.md` for full technical details and keywords strategy.

