# Spec 007: Consulting Chatbot — RAG-Powered Lead Generation

**Status:** planned
**Phase:** Phase 2
**Author:** Camilo Martinez
**Created:** 2026-03-01
**Updated:** 2026-03-01

## Problem

Potential clients visit the site but have questions before reaching out: "Can he do X?", "Has he worked with Y?", "What's his rate?", "How does he work?" Currently the only options are reading static pages or sending an email — high friction. Most visitors bounce without converting.

An AI chatbot trained on Camilo's background, projects, and consulting approach can answer these questions instantly, build trust, and guide visitors toward booking a call or sending an inquiry — 24/7.

## Goals

- Answer prospect questions about expertise, experience, approach, and availability
- Capture leads: collect email and/or offer to schedule a call
- Reduce friction between "curious visitor" and "consulting inquiry"
- Demonstrate AI engineering skill (the chatbot itself is a case study)
- Respond in < 2s with streaming output

## Non-Goals

- Replace the contact form — chatbot complements, doesn't replace
- Handle payments or contracts — that's post-engagement
- General-purpose assistant — scoped to consulting-relevant questions
- Hallucinate capabilities — must answer honestly based on real data

## Solution

RAG-powered chatbot using the existing FastAPI backend with pgvector. Knowledge base includes:
- Professional background (MSBA, petroleum → AI pivot, NYC based)
- Technical skills inventory (NLP, RAG, ML pipelines, data engineering, full-stack)
- Project case studies with outcomes and tech details
- Consulting approach (how engagements work, typical timeline, communication style)
- FAQ answers (availability, rate range, timezone, remote/onsite)

### Architecture

```
User Message → Next.js API Route → FastAPI /api/ai/chat
                                        ↓
                                  Embed query (OpenAI)
                                        ↓
                                  pgvector similarity search
                                        ↓
                                  Context + System Prompt → configured chat provider
                                        ↓
                                  Streaming response → Client
```

### Lead Capture Flow

1. After 3+ exchanges, chatbot offers: "Want me to send you a summary? Drop your email."
2. On email capture: stores in `leads` table, sends a follow-up email via Resend/SendGrid
3. Chatbot also surfaces: "You can also [schedule a 15-min call](/contact)" with Calendly link
4. All conversations logged for analytics (what do prospects ask about most?)

## API Contract

```
POST /api/ai/chat

Request:
  message: string — user's question
  conversation_id: string — session identifier
  email?: string — if user provides their email

Response (200, streaming):
  content: string — streamed response chunks
  suggested_actions?: array — ["schedule_call", "share_email", "view_case_study"]
  lead_captured?: boolean — if email was just captured

Errors:
  429 — rate limited (10 msgs/session, 50/day per IP)
  500 — LLM or DB error
```

## Implementation Notes

### Phase 1: Core Chat (MVP)
- Embed ~50 knowledge chunks into pgvector (background, skills, projects, FAQ)
- System prompt: "You are an AI assistant on Camilo Martinez's consulting site. Answer questions about his expertise, projects, and consulting services. Be helpful and professional. If you don't know something, say so honestly. Guide interested visitors toward scheduling a call."
- Streaming responses via Server-Sent Events
- Reuse existing `/api/ai` router, add `/chat` endpoint
- Frontend: floating chat widget on all pages (bottom-right)

### Phase 2: Lead Capture
- `leads` table: id, email, conversation_id, source_page, created_at
- After 3+ messages, surface email capture prompt naturally
- Calendly embed or link for call scheduling
- Weekly digest email to Camilo with new leads + conversation summaries

### Phase 3: Analytics
- Track: most-asked topics, conversion rate (chat → email/call), drop-off points
- Dashboard at `/admin/chat-analytics` (protected)

### Knowledge Base Documents

| Document | Content |
|----------|---------|
| `bio.md` | Background, education, career path |
| `skills.md` | Technical skills with depth levels |
| `projects/*.md` | Each case study as a knowledge doc |
| `consulting-faq.md` | How I work, rates, availability, timeline |
| `approach.md` | Engagement structure, communication style |

### Key Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Embedding model | text-embedding-3-small | Cost-effective, good for short docs |
| Chat model | `llama-3.3-70b-versatile` on Groq by default, `gpt-4.1-mini` on OpenAI fallback | Fast OpenAI-compatible chat while preserving existing proxy deployments |
| Chunk size | 500 tokens | Optimal for consulting Q&A retrieval |
| Top-k retrieval | 5 | Balance relevance vs context window |
| Rate limit | 10 msgs/session | Prevent abuse while allowing real conversation |
| Lead prompt threshold | 3 messages | Enough engagement to suggest email capture |

### Dependencies

- Depends on: Spec 001 (site structure), existing FastAPI backend, pgvector setup
- Depended on by: future analytics dashboard

## Alternatives Considered

### Alternative A: Static FAQ Page
Trade-off: Zero infrastructure cost, but zero engagement. Visitors who have specific questions won't find answers.
Rejected because: Doesn't differentiate from every other consulting site. The chatbot IS the differentiator — it proves AI competence while serving the business.

### Alternative B: Third-party Chat (Intercom, Drift)
Trade-off: Fast to deploy, but expensive ($50-300/mo), no customization, doesn't showcase skills.
Rejected because: Building the chatbot IS the point — it's both a feature and a case study. Plus, full control over the experience and data.

### Alternative C: Simple Form Bot (scripted responses)
Trade-off: No LLM cost, predictable responses, but robotic and limited.
Rejected because: Doesn't handle the long tail of prospect questions. RAG gives natural, contextual answers that build trust.

## Edge Cases & Failure Modes

- **Configured chat provider down**: State that the AI service is temporarily unavailable, show the authoritative recruiter availability from `src/data/recruiter.ts`, and provide a direct `mailto:` link
- **Abusive/off-topic questions**: System prompt guardrails + content filter. Redirect to consulting topics.
- **Rate limit hit**: Friendly message: "I've shared a lot! Ready to chat live? [Schedule a call]"
- **Empty knowledge base match**: Honest "I don't have details on that, but Camilo can answer directly — [email him]"
- **Email already captured**: Don't re-prompt for email in same session

## Observability

- Log: every conversation (anonymized), response latency, retrieval scores
- Metrics: messages/day, unique sessions, email capture rate, Calendly click rate
- Alert: error rate > 5%, p99 latency > 5s

## Acceptance Criteria

- [ ] Chatbot responds to questions about skills, projects, and background accurately
- [ ] Streaming responses render in < 2s first token
- [ ] After 3+ messages, chatbot naturally offers email capture
- [ ] Email stored in `leads` table with conversation context
- [ ] "Schedule a call" link surfaces in appropriate context
- [ ] Rate limiting works (10/session, 50/day per IP)
- [x] Current portfolio widget shows the grounded recruiter fallback and direct email link when the configured chat provider is unavailable
- [x] Icon-only send control has the accessible name `Send message`
- [ ] Chat widget appears on all pages
- [ ] Mobile-responsive chat UI
