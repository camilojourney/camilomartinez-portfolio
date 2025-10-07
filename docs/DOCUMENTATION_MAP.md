# �️ Complete Project Structure Map

> **Last Updated**: October 2, 2025  
> **Purpose**: Visual index of the entire portfolio repository - where everything lives and what each directory contains

---

## 🏗️ Repository Overview

This is a **full-stack AI-powered fitness analytics platform** with:
- **Frontend**: Next.js 15 + React 19 (TypeScript)
- **Backend**: FastAPI + PostgreSQL (Python)
- **AI**: OpenAI GPT-4 + RAG pipeline with pgvector
- **Integrations**: WHOOP, Strava, OpenAI APIs
- **Infrastructure**: Vercel (frontend), Railway (backend), PostgreSQL database

---

## � Root Level Structure

```
camilomartinez-portfolio/
├── 🎨 src/                    # Frontend application (Next.js)
├── ⚙️ backend/                # Backend API (FastAPI + data)
├── 📚 docs/                   # Documentation hub
├── 🔧 scripts/                # Automation & utility scripts (organized)
├── 📦 public/                 # Static assets
├── ⚙️ Config Files            # Root-level configuration
└── 📄 Meta Files              # README, logs, gitignore
```

---

## ⚙️ Root Level Configuration Files

Located at the repository root - these control the entire project:

```
📄 Configuration & Meta Files
├── package.json           # Node.js dependencies & scripts (frontend)
├── pnpm-lock.yaml         # Lockfile for pnpm package manager
├── tsconfig.json          # TypeScript compiler configuration
├── next-env.d.ts          # Next.js TypeScript declarations
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── vercel.json            # Vercel deployment config
├── README.md              # Project overview
├── dev.log                # Development log file
└── .env                   # Environment variables (not in git)
```

**Key Environment Variables** (from `.env`):
- Database connection (PostgreSQL)
- API keys (OpenAI, WHOOP, Strava)
- Authentication tokens (stored in DB, not `.env`)

---

## 🎨 Frontend Application (`/src/`)

**Tech Stack**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS

### `/src/app/` - Next.js App Router (Pages & API Routes)

The main application structure using Next.js 15's app router:

```
src/app/
├── (main)/                # Main site pages (grouped route)
│   └── page.tsx           # Home page (/)
├── ai-trainer/            # AI Trainer interface
│   └── page.tsx           # /ai-trainer
├── api/                   # API routes (backend proxy)
│   ├── auth/              # Authentication endpoints
│   ├── whoop/             # WHOOP data endpoints
│   ├── strava/            # Strava data endpoints
│   └── ai/                # AI query endpoints
├── api-test/              # API testing page
│   └── page.tsx           # /api-test
├── health/                # Health check endpoint
│   └── route.ts           # /health
├── og/                    # Open Graph image generation
│   └── route.tsx          # /og
├── rss/                   # RSS feed
│   └── route.ts           # /rss
├── layout.tsx             # Root layout (wrapper for all pages)
├── not-found.tsx          # 404 page
├── robots.ts              # Robots.txt generation
└── sitemap.ts             # Sitemap generation
```

**File Count**: 10 route files

### `/src/components/` - React Components (25 files)

Reusable UI components organized by purpose:

```
src/components/
├── common/                # Common utilities
│   └── theme-provider.tsx
├── features/              # Feature-specific components
│   ├── ai/                # AI Trainer components
│   ├── analytics/         # Analytics visualizations
│   ├── whoop/             # WHOOP dashboard components
│   └── strava/            # Strava activity components
├── shared/                # Shared across features
│   ├── navigation/        # Nav, header, footer
│   ├── layout/            # Page layouts
│   └── charts/            # Chart components (Recharts)
└── ui/                    # Base UI primitives (shadcn/ui)
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    └── ...                # Other shadcn components
```

**Total Components**: 25 `.tsx` files

### `/src/lib/` - Business Logic & Utilities (21 files)

Core application logic separated from UI:

```
src/lib/
├── api/                   # API client abstractions
│   ├── client.ts          # Base API client
│   ├── whoop.ts           # WHOOP API client
│   ├── strava.ts          # Strava API client
│   └── openai.ts          # OpenAI API client
├── config/                # App configuration
│   ├── constants.ts       # App-wide constants
│   └── features.ts        # Feature flags
├── db/                    # Database utilities (if any frontend DB)
├── services/              # Business logic services
│   ├── analytics.ts       # Analytics calculations
│   ├── ai-trainer.ts      # AI trainer logic
│   └── data-sync.ts       # Data synchronization
├── types/                 # TypeScript type definitions
│   ├── whoop.ts           # WHOOP data types
│   ├── strava.ts          # Strava data types
│   ├── ai.ts              # AI types
│   └── api.ts             # API response types
└── utils/                 # Helper functions
    ├── date.ts            # Date formatting
    ├── format.ts          # Data formatting
    └── validation.ts      # Input validation
```

**Total Library Files**: 21 `.ts` files

### `/src/styles/` - Global Styles

```
src/styles/
└── globals.css            # Global CSS + Tailwind directives
```

### `/src/pages/` - Legacy Pages (if any)

Any remaining pages from Pages Router (likely empty or minimal).

---

## ⚙️ Backend API (`/backend/`)

**Tech Stack**: FastAPI + Python 3.11+ + SQLAlchemy 2.0 + PostgreSQL 15

### Backend Structure Overview

```
backend/
├── app/                   # Main application code
│   ├── main.py            # FastAPI app entry point
│   ├── __init__.py        
│   ├── routers/           # API route handlers
│   ├── services/          # Business logic
│   ├── models/            # SQLAlchemy models
│   ├── config/            # Configuration
│   ├── middleware/        # Middleware (CORS, auth, etc.)
│   └── utils/             # Utilities
├── alembic/               # Database migrations (Alembic)
│   ├── versions/          # Migration version files
│   ├── env.py             # Alembic environment
│   └── script.py.mako     # Migration template
├── projects_quarto/       # Quarto project documentation
│   ├── astoria-conquest/  # Astoria running project
│   └── social-media-pipeline/
├── alembic.ini            # Alembic configuration
├── docker-compose.yml     # Docker services (PostgreSQL)
├── Dockerfile             # Docker image for backend
├── poetry.lock            # Python dependency lockfile
├── pyproject.toml         # Poetry configuration
├── setup.py               # Python package setup
└── README.md              # Backend documentation
```

### `/backend/app/routers/` - API Endpoints (5 files)

FastAPI routers defining REST endpoints:

```
backend/app/routers/
├── ai.py                  # /api/ai/* - AI query endpoints
├── analytics.py           # /api/analytics/* - Analytics data
├── integrations.py        # /api/integrations/* - WHOOP/Strava
├── system.py              # /api/system/* - Health, status
└── tools.py               # /api/tools/* - Utility endpoints
```

**API Structure**:
- `/api/ai/query` - Text-to-SQL queries
- `/api/ai/trainer` - AI trainer chat
- `/api/analytics/summary` - Dashboard data
- `/api/integrations/whoop/sync` - WHOOP data sync
- `/api/integrations/strava/webhook` - Strava webhooks
- `/api/system/health` - Health check

### `/backend/app/services/` - Business Logic

Service layer handling business logic:

```
backend/app/services/
├── ai/                    # AI services
│   ├── rag_service.py     # RAG pipeline
│   ├── query_planner.py   # SQL query planning
│   ├── embeddings.py      # Vector embeddings
│   └── trainer_agent.py   # AI trainer logic
└── rate_limiting/         # Rate limiting
    └── rate_limiter.py    # Rate limit enforcement
```

### `/backend/app/models/` - Database Models (7 files)

SQLAlchemy ORM models:

```
backend/app/models/
├── user.py                # User model
├── whoop.py               # WHOOP data models
├── strava.py              # Strava data models
├── ai_query.py            # AI query history
├── rate_limiting.py       # Rate limit tracking
└── __init__.py
```

### `/backend/app/config/` - Configuration

Application configuration management:

```
backend/app/config/
├── settings.py            # Environment variables
├── database.py            # Database connection
└── logging.py             # Logging configuration
```

### `/backend/app/middleware/` - Middleware

Request/response middleware:

```
backend/app/middleware/
├── cors.py                # CORS configuration
├── auth.py                # Authentication
└── error_handling.py      # Global error handler
```

### `/backend/alembic/` - Database Migrations

Alembic migration system:

```
backend/alembic/
├── versions/              # Migration files (auto-generated)
│   ├── 001_initial.py
│   ├── 002_add_whoop.py
│   └── ...
├── env.py                 # Alembic environment config
└── script.py.mako         # Template for new migrations
```

---

## 🗄️ Database Migrations (`/migrations/`)

**SQL migration files** for PostgreSQL schema changes (16 files):

```
migrations/
├── database-schema-v2.sql                    # Base schema
├── create_strava_users_table.sql             # Strava users
├── create_strava_runs_table.sql              # Strava activities
├── extend_strava_runs_sept_2025.sql          # Strava extensions
├── create_ai_trainer_tables.sql              # AI trainer tables
├── create_query_history_table.sql            # Query logging
├── create_question_rate_limits_table.sql     # Rate limiting
├── simplify_activity_correlations.sql        # Activity correlations baseline
├── create_materialized_views_sept_2025.sql   # Performance views
├── add_hnsw_index_sept_2025.sql              # Vector search index
├── add_token_columns_to_users.sql            # OAuth tokens
├── add_recovery_cycles_relationship.sql      # WHOOP relationships
├── add_relationship_whoop_sleep_workouts.sql # Sleep relationships
├── fix_sleep_foreign_key_null.sql            # Bug fix
├── schema_standardization_sept_2025.sql      # Naming standards
└── standardize_milli_to_ms_sept_2025.sql     # Unit conversion
```

**Total Migrations**: 16 SQL files

**Key Tables Created**:
- `users` - User accounts
- `whoop_sleep`, `whoop_recovery`, `whoop_workout`, `whoop_cycle` - WHOOP data
- `strava_users`, `strava_runs` - Strava data
- `ai_query_history` - AI query logging
- `question_rate_limits`, `user_rate_limits` - Rate limiting
- `activity_correlations` - Analytics
- `embeddings`, `embedding_sources` - Vector search

---

## 🔧 Scripts (`/scripts/`)

Lean utility layer broken into three focused directories:

### `/scripts/db/` – Database administration

```
scripts/db/
├── enable-vector-support.js        # Install pgvector extension
├── enable-postgis.js               # Install PostGIS extension
├── check-vector-support.js         # Verify pgvector availability
├── get-database-schema.js          # Export schema snapshot
└── setup-astoria-database.sql      # Seed Astoria-specific tables
```

**Purpose**: One-time or low-frequency database enablement and verification tasks.

### `/scripts/one-off/` – Special utilities

```
scripts/one-off/
├── generate_astoria_base_map.py    # Create baseline GeoJSON for Astoria project
├── update_astoria_progress.py      # Refresh Astoria progress data (invoked by Celery)
└── analyze-sleep-data.js           # Ad-hoc WHOOP sleep exploration
```

**Purpose**: Rare operations tied to the Astoria conquest project or exploratory analysis.

### `/scripts/testing/` – Diagnostics & health checks

```
scripts/testing/
├── check-database-schema.js        # Ensure tables/views exist pre-deploy
├── check-rate-limit.js             # Exercise rate limiting middleware
├── check-recent-data.js            # Verify latest WHOOP/Strava ingests
├── diagnose-whoop-cron.js          # Troubleshoot WHOOP automation
├── debug-strava-response.js        # Inspect raw Strava API payloads
├── activity-correlation.js         # Validate Strava↔WHOOP matching logic
└── whoop-cli.js                    # Manual WHOOP sync/testing CLI
```

**Purpose**: Manual diagnostics and validation scripts for day-to-day development.

---

## 📦 Public Assets (`/public/`)

**Static files** served directly by Next.js:

```
public/
├── bot.png                               # Bot avatar
├── data/                                 # Static data files
│   └── astoria-conquest/                 # Astoria project data
│       ├── streets.json
│       └── progress.json
└── maps/                                 # Map visualizations
    └── astoria/                          # Astoria maps
        ├── base-map.png
        └── progress-map.png
```

**Purpose**: 
- Images and icons
- Static JSON data for visualization
- Pre-generated maps

---

## 📊 Data Science Projects (`/astoria_conquest_data/`)

**Data science project artifacts**:

```
astoria_conquest_data/
└── astoria_graph.pkl                     # Pickled graph data
```

**Purpose**: Data science artifacts for the Astoria running conquest project (Python pickle files).

---

## 📚 Documentation (`/docs/`)

**Comprehensive documentation** in enterprise structure (40+ files):

### Structure Overview

```
docs/
├── README.md                             # Documentation hub
├── ARCHITECTURE.md                       # System architecture
├── GETTING_STARTED.md                    # Developer onboarding
├── TECH_STACK.md                         # Technology decisions
├── DOCUMENTATION_MAP.md                  # This file!
├── overview/                             # Portfolio storytelling & marketing copy
│   └── PORTFOLIO_OVERVIEW.md
├── updates/                              # Change logs and implementation summaries
│   ├── 2025-01_IMPLEMENTATION_SUMMARY.md
│   └── 2025-10_WORKERS_MIGRATION_SUMMARY.md
├── ai/                                   # AI platform docs (6 files)
│   ├── README.md
│   ├── RAG_SYSTEM.md
│   ├── EMBEDDINGS.md
│   ├── TRAINING.md
│   ├── EVALUATION.md
│   └── PROMPTS.md
├── backend/                              # Backend docs (6 files)
│   ├── README.md
│   ├── DEVELOPER_GUIDE.md
│   ├── ALEMBIC_GUIDE.md
│   ├── agents/
│   │   ├── AGENT_ARCHITECTURE.md
│   │   └── AUTO_EMBEDDING_AGENT.md
│   └── workers/
│       └── README.md
├── data/                                 # Data platform docs (5 files)
│   ├── README.md
│   ├── SCHEMA.md
│   ├── ANALYTICS.md
│   ├── DATA_QUALITY.md
│   └── ETL_PROCESSES.md
├── frontend/                             # Frontend docs (6 files)
│   ├── README.md
│   ├── COMPONENTS.md
│   ├── STATE_MANAGEMENT.md
│   ├── API_INTEGRATION.md
│   ├── DEPLOYMENT.md
│   └── POSITIONING.md
├── integrations/                         # Integration docs (4 files)
│   ├── README.md
│   ├── OPENAI.md
│   ├── STRAVA.md
│   └── WHOOP.md
├── knowledge/                            # Knowledge base (5 files)
│   ├── README.md
│   ├── CAMILO_PROFILE.md
│   ├── GLOSSARY.md
│   ├── PROJECT_HISTORY.md
│   └── REFERENCES.md
├── operations/                           # Operations docs & runbooks
│   ├── README.md
│   ├── RUNBOOKS.md
│   ├── MONITORING.md
│   ├── TROUBLESHOOTING.md
│   ├── CRON_JOBS.md
│   ├── SCRIPTS_CLEANUP_PLAN.md
│   └── scripts/
│       └── README.md
└── projects/                             # Quarto projects & storytelling assets
│   └── quarto/
│       ├── SETUP_GUIDE.md
│       ├── PROJECT_TEMPLATE.md
│       └── social-media-pipeline/
│           └── README.md
```

**Total Documentation**: 54 markdown files organized across 9 domains

For detailed documentation structure, see the sections below.

---

## 📊 Project Statistics

### File Counts by Type
- **Frontend Components**: 25 `.tsx` files
- **Frontend Logic**: 21 `.ts` files  
- **Backend Routes**: 5 Python files
- **Backend Models**: 7 Python files
- **Database Migrations**: 16 SQL files
- **Automation Scripts**: 30+ JavaScript/Python files
- **Documentation**: 36 Markdown files

### Lines of Code (Estimated)
- **Frontend**: ~8,000 lines (TypeScript + React)
- **Backend**: ~5,000 lines (Python + FastAPI)
- **Scripts**: ~3,000 lines (JavaScript + Python)
- **Documentation**: ~15,000 lines (Markdown)

### Technology Mix
- **Languages**: TypeScript (60%), Python (30%), SQL (5%), Shell (5%)
- **Frameworks**: Next.js, FastAPI, React, SQLAlchemy
- **Databases**: PostgreSQL with pgvector extension
- **AI**: OpenAI GPT-4, text-embedding-3-small

---

## 🔄 Data Flow Architecture

### Request Flow (Simplified)

```
User Browser
    ↓
Next.js Frontend (Vercel)
    ↓ API Route (/src/app/api/*)
    ↓
FastAPI Backend (Railway)
    ↓ Router → Service → Model
    ↓
PostgreSQL Database (Railway)
    ↓ pgvector for AI queries
    ↓
OpenAI API (Embeddings + GPT-4)
```

### Integration Flow

```
WHOOP API → Backend Service → PostgreSQL (whoop_* tables)
Strava API → Webhook → Backend Service → PostgreSQL (strava_* tables)
User Query → RAG Pipeline → SQL Generation → PostgreSQL → Response
```

---

## 🚀 Deployment Architecture

### Frontend (Vercel)
- **Platform**: Vercel
- **Build**: `pnpm build` → Static generation + SSR
- **Environment**: Production, Preview
- **Domain**: Custom domain via Vercel

### Backend (Railway)
- **Platform**: Railway
- **Runtime**: Python 3.11 + uvicorn
- **Database**: PostgreSQL 15 with pgvector
- **Services**: FastAPI app + PostgreSQL instance

### Cron Jobs
- **WHOOP Sync**: Daily at 6 AM
- **Strava Webhook**: Real-time webhook events
- **View Refresh**: Hourly materialized view updates

---

## 📖 Documentation Structure Details

## 📋 Core Documentation (Root Level)

### `/docs/README.md`
**Purpose**: Master navigation hub with role-based entry points
```
# 📚 Documentation Hub
├── TL;DR
├── Table of Contents
├── Information Architecture
│   ├── Multi-Layer Model
│   └── Canonical Directory Map
├── Role-Based Entry Points
│   ├── Full-Stack Engineer
│   ├── AI / ML Engineer
│   ├── Data Engineer / Analyst
│   ├── Operations / DevOps
│   ├── Integrations Specialist
│   └── Stakeholders & Leadership
└── AI-Augmented Navigation
```

### `/docs/ARCHITECTURE.md`
**Purpose**: High-level system overview and component interactions
```
# 🏗️ System Architecture Overview
├── Architectural Intent
│   ├── Mission
│   └── Quality Attributes
├── Context & Personas
├── System Topology
│   ├── Layered View
│   └── Deployment Targets
├── Domain Boundaries
└── Data Architecture
    ├── Storage Strategy
    ├── Data Flow
    └── Governance
```

### `/docs/GETTING_STARTED.md`
**Purpose**: Developer onboarding and setup instructions
```
# 🚀 Getting Started Guide
├── Preflight Checklist
├── Environment Setup
│   ├── Clone & Bootstrap
│   ├── Environment Variables
│   └── Docker Services
├── First 30 Minutes
│   ├── Backend API (0-10 min)
│   ├── Frontend (10-20 min)
│   └── AI Features (20-30 min)
└── Common Issues
```

### `/docs/TECH_STACK.md`
**Purpose**: Technology decisions and rationale
```
# 🛠️ Technology Stack & Decisions
├── Guiding Principles
├── Stack Overview
├── Experience Layer (Frontend)
│   ├── Next.js 15 + React 19
│   ├── TypeScript & State
│   └── Alternatives Reviewed
├── Orchestration Layer (Backend)
│   ├── FastAPI + Pydantic
│   ├── SQLAlchemy + Alembic
│   └── Async Toolkit
└── Data & Persistence
```

---

## 🤖 AI Platform Documentation (`/docs/ai/`)

### `/docs/ai/README.md`
**Purpose**: AI platform overview and architecture
```
# 🤖 AI Platform Overview
├── System Architecture
├── Retrieval Layer
├── Reasoning Layer
├── Safety & Governance
├── Evaluation & Feedback
└── Tooling & Automation
```

### `/docs/ai/RAG_SYSTEM.md`
**Purpose**: Retrieval-Augmented Generation pipeline
```
# 🧠 RAG System: Text-to-SQL Intelligence
├── Pipeline Overview
├── Inputs & Context Assembly
├── Planning & Validation
│   ├── Planner Prompt
│   └── Validation Layers
├── Execution & Post-Processing
├── Failure Modes & Mitigations
└── KPIs & Monitoring
```

### `/docs/ai/EMBEDDINGS.md`
**Purpose**: Vector embeddings strategy and management
```
# 🧠 Embeddings Strategy & Manifest
├── Embedding Corpora
│   └── Source Configuration (YAML)
├── Generation Pipeline
├── Storage Model
│   ├── Tables
│   ├── Indexes
│   └── Versioning
├── Drift Monitoring
└── Operations
```

### `/docs/ai/TRAINING.md`
**Purpose**: AI training and evaluation data generation
```
# 🧪 Training & Evaluation Data Generation
├── Objectives
├── Data Generation Pipeline
│   ├── Seed Library
│   ├── Augmentation
│   ├── Validation
│   └── Evaluation
├── Annotation & Labelling
├── Dataset Management
│   ├── Storage
│   ├── Versioning
│   └── Tooling
└── Fine-Tuning Roadmap
```

### `/docs/ai/EVALUATION.md`
**Purpose**: AI quality assurance and evaluation cycles
```
# 📊 AI Evaluation & Quality Assurance
├── Evaluation Cycle
│   └── Step-by-Step
├── Metrics & Dashboards
├── Feedback Loop
│   ├── User Feedback
│   └── Prioritization Matrix
├── Incident Response
└── Tooling
```

### `/docs/ai/PROMPTS.md`
**Purpose**: Prompt library and governance
```
# 🗣️ Prompt Library & Governance
├── Prompt Taxonomy
├── Template Structure
├── Evaluation Metadata
├── Guardrails & Policies
├── Editing Workflow
└── Rollout Strategy
```

---

## ⚙️ Backend Architecture (`/docs/backend/`)

### `/docs/backend/README.md`
**Purpose**: Backend architecture and development guide
```
# ⚙️ Backend Architecture Guide
├── System Overview
├── Project Structure
├── Request Lifecycle
├── Layered Responsibilities
│   ├── Routers
│   ├── Services
│   ├── Repositories
│   └── Workers
└── Cross-Cutting Concerns
    ├── Configuration
    ├── Security
    └── Observability
```

### `/docs/backend/ALEMBIC_GUIDE.md`
**Purpose**: Complete guide to database migrations with Alembic
```
# 🗄️ Alembic Database Migrations Guide
├── What is Alembic?
├── Quick Start
├── Common Commands
├── Creating Migrations
│   ├── Auto-Generate (recommended)
│   └── Manual Migrations
├── Understanding Migration Files
├── Applying Migrations
├── Rolling Back Changes
├── Migration Chain
├── Best Practices
├── Troubleshooting
├── Real-World Scenarios
└── Quick Quiz
```

---

## 📊 Data Platform Documentation (`/docs/data/`)

### `/docs/data/README.md`
**Purpose**: Data platform overview
```
# 📊 Data Platform Overview
├── Architecture Summary
├── Ingestion & Integrations
├── Storage Layers
├── Analytics & BI
├── AI Enablement
└── Governance & Security
```

### `/docs/data/SCHEMA.md`
**Purpose**: Database schema and data models
```
# 🗃️ Database Schema & Data Model
├── Domain Model
├── Core Entities
│   ├── users
│   └── user_rate_limits
├── WHOOP Domain
├── Strava Domain
├── AI & Telemetry
├── Materialized Views
├── Analytics Marts
├── Constraints & Indexes
└── Migration Workflow
```

### `/docs/data/ETL_PROCESSES.md`
**Purpose**: ETL pipelines and data workflows
```
# 🔄 ETL & Data Pipelines
├── Ingestion Pipelines
│   ├── WHOOP Sync
│   └── Strava Sync
├── Transformation Jobs
├── Scheduling
├── Error Handling & Retries
└── Logging & Auditing
```

### `/docs/data/ANALYTICS.md`
**Purpose**: Analytics metrics and models
```
# 📈 Analytics Metrics & Models
├── KPI Overview
├── Recovery & Readiness
│   ├── Recovery Score
│   └── HRV RMSSD
├── Performance & Training Load
│   ├── Daily Strain
│   ├── Training Load Ratio
│   └── Running Pace
└── Sleep & Regeneration
    ├── Total Sleep Hours
    ├── Sleep Consistency
    └── Sleep Debt
```

### `/docs/data/DATA_QUALITY.md`
**Purpose**: Data quality validation and monitoring
```
# ✅ Data Quality & Validation Playbook
├── Quality Objectives
├── Validation Matrix
├── Tooling & Automation
├── Incident Management
└── Monitoring & Alerts
```

---

## 🎨 Frontend Architecture (`/docs/frontend/`)

### `/docs/frontend/README.md`
**Purpose**: Frontend architecture overview
```
# 🎨 Frontend Architecture Guide
├── Architectural Overview
│   ├── Stack Snapshot
│   └── Rendering Modes
├── Rendering & Data Flow
│   ├── Tiered Data Strategy
│   └── API Access Paths
├── Module Organization
│   └── Feature Module Contract
├── Performance Playbook
└── Quality Gates
```

### `/docs/frontend/COMPONENTS.md`
**Purpose**: Component system and design language
```
# 🧩 Component System & Design Language
├── Design Principles
├── Tokens & Theming
│   ├── Token Layers
│   ├── Dark Mode Strategy
│   └── Typography
├── Primitives
│   └── Accessibility Checklist
├── Composites
│   ├── Feature Shells
│   └── Interaction Patterns
└── Data Visualization
    └── Charting Stack
```

### `/docs/frontend/STATE_MANAGEMENT.md`
**Purpose**: State management patterns
```
# 🔄 State Management & Data Flow
├── State Taxonomy
├── Server-First Data Layer
│   ├── Server Actions
│   └── Server Components
├── React Query Patterns
│   ├── Query Keys
│   ├── Fetcher Pattern
│   ├── Mutations & Optimistic Updates
│   └── Prefetching
└── Zustand Microstores
    ├── Principles
    └── AI Session Store
```

### `/docs/frontend/API_INTEGRATION.md`
**Purpose**: API integration and data contracts
```
# 🔌 API Integration & Data Contracts
├── Architecture Overview
├── Client Abstractions
│   ├── API Client Factory
│   ├── Fetcher
│   └── DTO Validation
├── Authentication Flow
│   ├── Auth Tokens
│   ├── Protected Routes
│   └── OAuth Integrations
└── Error Handling & Retries
    ├── Error Taxonomy
    └── Retry Strategy
```

### `/docs/frontend/DEPLOYMENT.md`
**Purpose**: Frontend deployment procedures
```
# 🚀 Frontend Deployment & Delivery
├── Environments
├── Environment Variables
├── Build Pipeline
├── Post-Deploy Verification
├── Monitoring & Observability
└── Rollback & Disaster Recovery
```

### `/docs/frontend/POSITIONING.md`
**Purpose**: Product positioning and messaging
```
# 🧭 Product Positioning & Narrative
├── Value Proposition
├── Target Audiences
├── Messaging Pillars
├── Page-by-Page Blueprint
│   ├── Home
│   ├── Projects
│   ├── WHOOP Dashboard
│   ├── AI Lab
│   └── About
├── Interaction Guidelines
└── Content Voice & Tone
```

---

## 🔌 Integrations Documentation (`/docs/integrations/`)

### `/docs/integrations/README.md`
**Purpose**: Integrations platform overview
```
# 🔌 Integrations Overview
├── Integration Architecture
├── Authentication Standards
├── Shared Clients & Utilities
├── Monitoring & SLAs
└── Testing Strategy
```

### `/docs/integrations/OPENAI.md`
**Purpose**: OpenAI API integration guide
```
# 🤖 OpenAI Integration Guide
├── Configuration
├── Client Abstractions
├── Model Portfolio
├── Cost & Rate Limits
├── Safety Controls
└── Testing & Mocking
```

### `/docs/integrations/STRAVA.md`
**Purpose**: Strava API integration guide
```
# 🏃 Strava Integration Guide
├── Authentication Flow
├── Webhook Lifecycle
├── API Endpoints
├── Data Mapping
├── Rate Limits & Scheduling
├── Failure Handling
└── Testing & Sandbox
```

### `/docs/integrations/WHOOP.md`
**Purpose**: WHOOP API integration guide
```
# 💤 WHOOP Integration Guide
├── Authentication Flow
├── API Endpoints
├── Data Mapping
├── Scheduling & Rate Limits
├── Error Handling
└── Testing & Sandbox
```

---

## 🎓 Knowledge Base (`/docs/knowledge/`)

### `/docs/knowledge/README.md`
**Purpose**: Knowledge base overview
```
# 🎓 Knowledge Base Overview
├── Documents
├── Usage Guidelines
├── AI Integration
└── Maintenance Cadence
```

### `/docs/knowledge/CAMILO_PROFILE.md`
**Purpose**: Professional profile for AI embeddings
```
# 👤 Camilo Martinez: Professional Profile
├── Identity & Background
├── Education & Learning
├── Technical Mastery
│   ├── Core Skills
│   └── Languages & Tools
├── Signature Projects
│   ├── AI Fitness Platform
│   ├── Trainer Agent
│   └── Documentation Architecture
├── Health & Performance Philosophy
├── Professional Values
└── Communication Style
```

### `/docs/knowledge/GLOSSARY.md`
**Purpose**: Terminology and definitions
```
# 📚 Glossary & Terminology
├── AI & Data
├── Fitness & Health
├── Product & Operations
└── Templates
```

### `/docs/knowledge/PROJECT_HISTORY.md`
**Purpose**: Project timeline and decision log
```
# 📜 Project History & Decision Log
├── 2025 Timeline
│   ├── Documentation Revamp
│   ├── AI Evaluation Loop
│   ├── RAG Pipeline v2
│   └── Dashboard Launch
├── Decision Template
└── Incident Template
```

### `/docs/knowledge/REFERENCES.md`
**Purpose**: External references and inspiration
```
# 🔗 References & Inspiration
├── Documentation Excellence
├── AI & ML
├── Data & Analytics
├── Product & UX
└── Performance & Health
```

---

## 🛠️ Operations Documentation (`/docs/operations/`)

### `/docs/operations/README.md`
**Purpose**: Operations platform overview
```
# 🛠️ Operations Overview
├── Infrastructure Map
├── Deployments
├── Observability
├── Schedules & Jobs
├── Incident Management
└── Security & Compliance
```

### `/docs/operations/RUNBOOKS.md`
**Purpose**: Incident response procedures
```
# 🚨 Operations Runbooks
├── How to Use This Runbook
│   └── Severity Matrix
├── Sev1: Production Outage
│   ├── Triggers
│   ├── Immediate Actions
│   ├── Diagnostics
│   ├── Mitigation
│   ├── Communication
│   └── Recovery
└── Sev2: Degraded Performance
    └── Immediate Actions
```

### `/docs/operations/MONITORING.md`
**Purpose**: Monitoring and alerting configuration
```
# 📈 Monitoring & Alerting Playbook
├── Observability Stack
├── Metrics Catalog
├── Logging Strategy
├── Tracing
├── Alert Routing
└── Setup Instructions
```

### `/docs/operations/TROUBLESHOOTING.md`
**Purpose**: Common issues and solutions
```
# 🧯 Troubleshooting Guide
├── Deployments
│   ├── Railway Failures
│   └── Vercel 404s
├── AI Services
│   ├── Fallback Messages
│   └── High Latency
├── Integrations
│   ├── WHOOP Sync Stalled
│   └── Strava Webhook Failures
└── Data Pipelines
    ├── View Refresh Fails
    └── Data Quality Alerts
```

### `/docs/operations/CRON_JOBS.md`
**Purpose**: Scheduled jobs and automation
```
# 🕒 Job Schedule & Automation
├── Job Inventory
├── Implementation Notes
├── Validation Checklist
├── Failure Handling
└── References
```

---

## 📊 Documentation Statistics

- **Total Files**: 36 documentation files
- **Total Sections**: ~250+ documented sections
- **Coverage Areas**: 8 major domains
- **Documentation Depth**: 3-4 levels deep
- **Update Frequency**: Last updated October 2, 2025

---

## 🎯 How to Use This Map

### For Developers
1. Start with `README.md` for navigation
2. Read `GETTING_STARTED.md` for setup
3. Explore domain-specific folders based on your work

### For AI Systems
1. Use `CAMILO_PROFILE.md` for context about Camilo
2. Reference technical docs for implementation details
3. Follow cross-references between related documents

### For Operations
1. Start with `operations/README.md`
2. Keep `RUNBOOKS.md` bookmarked for incidents
3. Monitor `TROUBLESHOOTING.md` for common issues

---

*This map is automatically maintained and should be updated whenever documentation structure changes.*
