# Target — camilomartinez-portfolio

## Primary Persona: Technical Evaluator

**Who:** Sarah, 42, Engineering Manager / Technical Lead at an AI-forward company (Series B tech, fintech with AI investment, or established company building an AI team). Evaluating Camilo as a potential senior data scientist, AI engineer, or freelance consultant. Has 15 minutes to assess whether to schedule a call.

**Problem:** Camilo's LinkedIn profile says the right things. But Sarah has seen hundreds of resumes that claim "production ML experience." She needs evidence, not claims. She wants to see: Does this person actually build things? Are they running real systems in production? Can they handle the full stack from data ingestion to frontend presentation?

**Context:** Sarah found the portfolio via LinkedIn, GitHub, or a referral. She'll land on the homepage, skim for 30 seconds, and click into either the fitness dashboard (technical signal) or the projects section (domain breadth). She's evaluating in parallel with 5 other candidates. If the site is slow, broken, or shows stale data — she moves on.

**What success looks like for Sarah:** She opens the fitness dashboard. It loads in 2 seconds. She sees Camilo's live WHOOP recovery trend + last 3 Strava runs. She thinks: "This is a real API integration with real data in production. He built the ingestion, the backend, and the frontend. He keeps it running." She clicks the contact button.

**What success looks like for Camilo:** 2-3 inbound messages per month from qualified hiring managers or consulting prospects who found the site and reached out without Camilo having to cold outreach.

**Frustrations (if the site fails her):**
- "The fitness dashboard shows data from 3 weeks ago. Either the integrations broke or he doesn't maintain it."
- "The site is beautiful but it takes 8 seconds to load. If he can't optimize his own site..."
- "I can't find any proof he's actually built something that runs in production."

---

## Secondary Persona: Camilo (Owner / Daily User)

**Who:** Camilo, the portfolio owner. Uses the fitness dashboard daily to track his training. Needs: accurate data, correct analytics, fresh syncs. If the dashboard is wrong about his HRV, it's useless for its actual purpose.

**Context:** Camilo is a secondary user of the site but the primary user of the fitness features. The portfolio exists for hiring managers — but the data integrity exists for Camilo's own training decisions.

---

## Anti-Persona

**LinkedIn recruiter doing keyword screening:** Will find Camilo on LinkedIn, not the portfolio. The portfolio is for post-LinkedIn-screen discovery, not for first contact. Don't optimize the copy for keyword density.

**General public / social media audience:** The site is not a personal blog, not a social platform, not for casual browsing. No comment sections, no "follow me" CTAs for general audiences.

---

## Design Tiebreaker

When UX decisions conflict, optimize for **the technical evaluator's first 30 seconds**.

The most important moment: Sarah's first viewport on the homepage. She needs to understand in under 5 seconds: (1) who Camilo is, (2) what he builds, (3) where to click next. The fitness dashboard is the proof — it should be prominently linked from the homepage. Not buried in navigation.

---

## Tone of Voice

- "Show, don't tell." No "passionate about AI" or "results-driven professional." Show the dashboard. Show the projects. Let the work speak.
- Precise and technical when describing projects. "Built a hybrid BM25 + vector search engine deployed to 3 clients" > "Worked on AI-powered document search."
- Confident without bragging. The live data makes the case — copy supports it, not inflates it.
- Professional, not casual. This is a portfolio targeting senior technical roles, not a personal blog.
- No buzzwords in project descriptions: no "leveraged", "utilized", "synergized." Direct verb-object construction: "Built", "Deployed", "Reduced", "Integrated."
