# Spec 001: Project Overview — Consulting Site

**Status:** in-progress
**Phase:** Phase 1
**Author:** Camilo Martinez
**Created:** 2025-10-01
**Updated:** 2026-03-01

## Problem

The portfolio site showcases personal projects but doesn't convert visitors into consulting clients. It reads as "look at my work" instead of "I can solve your problem." No clear path from browsing → contacting → hiring.

## Goals

- Position Camilo as an AI engineering consultant, not a job seeker
- Drive inbound leads: visitors → email/call → paid engagement
- Showcase case studies (not just projects) with business outcomes
- Provide an AI chatbot that answers prospect questions and captures leads
- Maintain the technical showcase as proof of capability

## Non-Goals

- Multi-user accounts or SaaS features — this is a consulting site
- E-commerce or payment processing on-site — invoicing happens offline
- Blog CMS — blog stays as MDX, manual publishing

## What the Site Does

Consulting site and technical showcase. Demonstrates AI engineering capability while converting visitors into consulting clients.

**Core Value Proposition**:
- Professional consulting positioning: ML Systems, RAG/LLM Integration, Data Engineering
- Case studies showing real systems built from concept to production
- AI chatbot for prospect engagement and lead capture
- Contact flow optimized for booking calls and starting projects

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS 3.4, custom glassmorphism design system
- **Charts/Maps**: Recharts 3, Leaflet + React-Leaflet 5, Turf.js 7
- **Auth**: NextAuth v5 beta
- **Other**: MDX for blog/case studies, OpenAI JS SDK for OpenAI-compatible chat completions

### Backend
- **Framework**: FastAPI (uvicorn)
- **ORM/DB**: SQLAlchemy 2.0, PostgreSQL + pgvector (RAG embeddings), asyncpg
- **Task Queue**: Celery 5.3, Redis 5
- **AI/ML**: OpenAI-compatible chat provider chain, RAG pipeline for chatbot
- **Security**: python-jose, passlib, fastapi-limiter

### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **DB**: Neon Serverless Postgres

## Architecture

```
Frontend (Next.js) → API Routes → Backend (FastAPI)
                                       ↓
                                PostgreSQL (pgvector)
                                       ↓
                                Celery/Redis (async)
```

- 5 FastAPI routers: `/api/ai`, `/integrations`, `/analytics`, `/system`, `/tools`
- RAG pipeline: pgvector embeddings over background, projects, expertise
- Chatbot: streaming responses with lead capture

## Pages

| Page | Purpose |
|------|---------|
| `/` (Home) | Hero + services + case studies grid |
| `/about` | AI chatbot + background |
| `/contact` | "Start a Project" — email, LinkedIn, call booking |
| `/blog` | Technical articles (MDX) |
| `/projects/*` | Individual case study pages |
| `/apps/*` | Live demo apps (fitness dashboard, etc.) |

## Acceptance Criteria

- [ ] Homepage communicates consulting services clearly
- [ ] "Start a Project" CTA on every page path
- [ ] Case studies show business context, not just tech
- [ ] Chatbot answers prospect questions about expertise
- [ ] Chatbot captures email and suggests scheduling a call
- [ ] Site loads < 3s on mobile
- [ ] SEO metadata targets "AI consulting" keywords
