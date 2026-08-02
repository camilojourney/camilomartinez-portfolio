# Portfolio - Acceptance Criteria

Target URL: https://camilomartinez.co
Local preview: http://localhost:3005

## Structure

Each scenario follows **Given-When-Then**:
- **Given** = starting state
- **When** = user action
- **Then** = what must be true

---

## 1. Project Cards - Featured Work (Tier 1)

### AC-001: Invoz card renders
**Priority:** P0

Given the user navigates to /projects
When the page loads
Then "Invoz" title is visible
And "Audio/Speech ML" tag is visible
And a "View live app" link exists

### AC-002: Holus content engine card renders
**Priority:** P0

Given the user navigates to /projects
When the page loads
Then "Social Media Automatization" title is visible
And "Publishing API" tag is visible
And "Federated publishing API" text is in the description
And a "Try content generator" link exists

### AC-003: Holus Observatory card renders (separate from Holus)
**Priority:** P0

Given the user navigates to /projects
When the page loads
Then "Holus Observatory" title is visible
And "Observability" tag is visible
And "observability dashboard" text is in the description
And no live-app link is rendered until Camilo confirms the canonical destination
And the internal case study remains available

---

## 2. Project Cards - More Projects (Tier 2)

### AC-004: Pilaster card renders
**Priority:** P1

Given the user navigates to /projects
When the page loads
Then "Pilaster" title is visible

### AC-005: Genpeli card renders
**Priority:** P1

Given the user navigates to /projects
When the page loads
Then "Genpeli" title is visible
And "Video AI" tag is visible

### AC-006: Job Tracker CRM card renders
**Priority:** P1

Given the user navigates to /projects
When the page loads
Then "Job Tracker CRM" title is visible

### AC-007: Holusight card renders
**Priority:** P1

Given the user navigates to /projects
When the page loads
Then "Holusight" title is visible

### AC-008: AI Advisory Board card renders
**Priority:** P1

Given the user navigates to /projects
When the page loads
Then "AI Advisory Board" title is visible

---

## 3. Deleted / Renamed Projects

### AC-009: Social Media Pipeline is gone
**Priority:** P0

Given the user navigates to /projects
When the page loads
Then "Social Media Pipeline" text is NOT visible anywhere on the page

### AC-010: Chatbot reframed as engineering story
**Priority:** P0

Given the user navigates to /projects
When the page loads
Then "How I Built This Chatbot" title is visible
And "LLM-as-judge evaluation" text is in the description
And "Self-Improving AI Chatbot" is NOT visible as a project title

---

## 4. Case Study Pages

### AC-011: Holus case study loads
**Priority:** P0

Given the user navigates to /projects/holus
When the page loads
Then "Holus Content Engine" title is visible
And "Specialized agents" text is visible
And the page does NOT link to holusight.com

### AC-012: Holus Observatory case study loads
**Priority:** P0

Given the user navigates to /projects/holus-observatory
When the page loads
Then "Holus Observatory" title is visible
And "Multi-Agent Monitoring Dashboard" text is visible
And no "View Live App" link is rendered until the canonical URL decision is resolved

### AC-013: Genpeli case study loads
**Priority:** P1

Given the user navigates to /projects/genpeli
When the page loads
Then "Genpeli" title is visible
And "AI Video Editing Pipeline" text is visible

### AC-014: Invoz case study loads
**Priority:** P1

Given the user navigates to /projects/invoz-ai
When the page loads
Then "Invoz" title is visible

### AC-015: Holusight case study loads
**Priority:** P1

Given the user navigates to /projects/holusight
When the page loads
Then "Holusight" title is visible
And no link to holusight.com exists

### AC-016: Social Media Pipeline case study loads
**Priority:** P0

Given the user navigates to /projects/social-media-pipeline
When the page loads
Then "Social Media Pipeline" title is visible

---

## 5. Navigation

### AC-017: Projects grid → case study → back
**Priority:** P0

Given the user navigates to /projects
When the user clicks "Case study" on the Holus Observatory card
Then the user is on /projects/holus-observatory
When the user clicks "Back to Projects"
Then the user is on /projects

### AC-018: About page loads
**Priority:** P0

Given the user navigates to /about
When the page loads
Then "Juan Camilo Martinez" text is visible

---

## 6. External Links (must resolve)

### AC-019: Holus Observatory demo link works
**Priority:** P0

Given the user opens https://holus-observatory.vercel.app
Then the response is successful, a redirect, or the specific HTTP 401 protected-preview status
And the response is never HTTP 404

### AC-020: Invoz link works
**Priority:** P1

Given the user opens https://invoz.io
Then the page loads successfully (HTTP 200 or redirect)

### AC-021: Pilaster link works
**Priority:** P1

Given the user opens https://pilaster.ai
Then the page loads successfully (HTTP 200 or redirect)

### AC-022: Genpeli link works
**Priority:** P1

Given the user opens https://www.editai.ai
Then the page loads successfully (HTTP 200 or redirect)

### AC-023: Holusight 404 is not linked
**Priority:** P1

Given the user opens https://holusight.com
Then the page returns 404
And the portfolio does not link to that URL

### AC-024: AI Advisor Board link works
**Priority:** P1

Given the user opens https://ai-advisor-board.vercel.app
Then the page loads successfully (HTTP 200)

### AC-025: Job Tracker link works
**Priority:** P1

Given the user opens https://job-tracker-swart-eta.vercel.app
Then the page loads successfully (HTTP 200)

---

## 7. Chatbot

### AC-026: Chatbot renders on about page
**Priority:** P1

Given the user navigates to /about
When the page loads
Then a chat interface or chatbot component is visible

### AC-026A: Chatbot recovers from an unavailable chat API
**Priority:** P1

Given the user opens the chatbot and the chat API is unavailable
When the user sends a message
Then the chatbot states that the AI service is temporarily unavailable
And it states that Camilo is open to Applied AI Engineer roles in NYC, including remote or hybrid teams
And it provides a working email link to juancamilomabe@gmail.com
And the icon-only composer control has the accessible name "Send message"

---

## 8. Responsiveness

### AC-027: Projects page on mobile
**Priority:** P1

Given the viewport is 375x667
When the user navigates to /projects
Then project cards are visible and do not overflow horizontally

### AC-028: About page on mobile
**Priority:** P1

Given the viewport is 375x667
When the user navigates to /about
Then content is visible and does not overflow horizontally
