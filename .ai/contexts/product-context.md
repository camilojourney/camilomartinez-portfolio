# Camilo Martinez Portfolio Product Context

> This file provides product and business context to all AI agents. Update it as your product evolves.

## Overview

Camilo Martinez Portfolio is an **AI-powered fitness analytics platform** that combines data from wearables (WHOOP, Strava) with AI analysis to provide actionable fitness insights.

**Vision:** Help athletes make data-driven decisions about training, recovery, and performance optimization.

## Target Users

**Primary Audience:** Camilo Martinez (personal use), with potential to expand to other athletes

**User Personas:**
- **Primary user:** Endurance athlete tracking training load, sleep quality, and recovery
- **Visitor:** Portfolio visitor learning about Camilo's projects and skills via AI chatbot

## Core Problem

**Problem Statement:**
Fitness data is fragmented across multiple platforms (WHOOP, Strava, etc.) and lacks intelligent analysis. Athletes struggle to understand patterns and make informed training decisions.

**Current Solution:**
Manual data export, spreadsheet analysis, disconnected dashboards

**Why This Matters:**
Integrated, AI-analyzed fitness data enables better training decisions, injury prevention, and performance optimization.

## Tech Stack

- **Framework:** Next.js 16 (frontend) + FastAPI (backend)
- **Language:** TypeScript + Python
- **Database:** PostgreSQL with pgvector extension
- **AI/ML:** OpenAI GPT-4, text-embedding-3-small
- **Key Dependencies:**
  - WHOOP API: Sleep, recovery, strain data
  - Strava API: Workout activities, routes, performance
  - pgvector: Vector similarity search for RAG
  - Redis: Rate limiting, caching

## Domain Entities

Core concepts in this project:

| Entity | Description | Key Fields |
|--------|-------------|------------|
| Workout | Exercise activity from Strava | id, activity_type, duration, distance, heart_rate |
| Sleep | Sleep session from WHOOP | id, start_time, duration, efficiency, stages |
| Recovery | Daily recovery score from WHOOP | id, date, hrv, resting_hr, recovery_score |
| Query | User AI query and response | id, question, answer, sql_generated, feedback |
| Embedding | Vector embedding for RAG | id, content, vector, document_type, metadata |

**Entity Relationships:**
```
User
  ├── has many Workouts
  ├── has many Sleep records
  ├── has many Recovery scores
  └── has many Queries
```

## External Dependencies

### WHOOP API
- **Purpose:** Sleep, recovery, and strain data
- **Key Operations:** Daily fetch, historical import
- **Constraints:** OAuth required, rate limited

### Strava API
- **Purpose:** Workout activities and routes
- **Key Operations:** Webhook sync, historical import
- **Constraints:** OAuth required, 15-min rate limit windows

### OpenAI API
- **Purpose:** Chat completions, embeddings, AI analysis
- **Key Operations:** Query processing, document embedding
- **Constraints:** Token limits, cost per request

## Key Constraints

- **Performance:** AI responses under 5s, dashboard loads under 2s
- **Scale:** Single-user MVP, architecture supports multi-user
- **Compliance:** Personal health data, stored securely
- **Budget:** OpenAI costs managed via caching and rate limiting
- **Technical:** Async-first Python, React Server Components

## Folder Structure

```
camilomartinez-portfolio/
├── src/                    # Next.js frontend
│   ├── app/                # App router pages and API routes
│   ├── components/         # Reusable UI components
│   └── lib/                # Utilities and helpers
├── backend/                # FastAPI backend
│   ├── app/                # Main application
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── models/         # Pydantic models
│   │   └── config/         # Settings
│   └── tests/              # Backend tests
├── .ai/                    # AI agent system
│   ├── agents/             # Agent definitions
│   ├── contexts/           # Product context
│   ├── standards/          # Code standards
│   └── workflows/          # Workflow guides
├── docs/                   # Documentation
└── specs/                  # Feature specifications
```

## Development Phases

### MVP (0-8 weeks) - Current
**Goal:** Stable core with reliable data flow

**Scope:**
- ✅ FastAPI backend with AI endpoints
- ✅ WHOOP data ingestion (manual)
- ✅ RAG-powered chatbot for portfolio
- ✅ Basic test coverage
- 🚧 Strava integration
- 🚧 Automated data sync

**Success Criteria:**
- AI queries return accurate answers
- Test coverage > 50%
- CI/CD pipeline working

### V1.5 (8-16 weeks)
**Goal:** Automated data pipelines and richer analytics

**Scope:**
- Automated WHOOP/Strava sync
- Sleep and recovery dashboards
- Training load analysis
- Trend visualization

### V2 (16+ weeks)
**Goal:** AI-driven recommendations

**Scope:**
- Personalized training recommendations
- Recovery predictions
- Performance optimization suggestions
- Multi-user support

## Product-Specific Patterns

### API Design
- All endpoints return `APIResponse` model with status, data, message, timestamp
- Use `handle_ai_service_error()` for consistent error handling
- Rate limit AI endpoints (5 queries/day for anonymous users)

### RAG Pipeline
1. User query → Embed query → Vector search → Context retrieval
2. Context + Query → GPT-4 → SQL generation (if needed)
3. SQL execution → Format response → Return to user

### Data Sync
1. OAuth token refresh (if needed)
2. Fetch new data from API
3. Transform to internal schema
4. Upsert to database
5. Update embeddings (if content changed)

## How to Update This File

- Update when product vision changes
- Update when adding new domain entities
- Update when changing tech stack
- Update at major milestones (MVP shipped, V1.5 complete)

Last updated: 2026-02-07
