# 🏛️ Software Architecture Patterns Guide

> **Purpose**: Comprehensive guide to modern software architecture patterns, trade-offs, and when to use each
> **Audience**: Engineers planning new projects or refactoring existing systems
> **Status**: Living Document · Last Updated: October 7, 2025

---

## Table of Contents

- [Quick Reference Card](#quick-reference-card)
- [Architecture Pattern Overview](#architecture-pattern-overview)
- [Monolithic Architecture](#1-monolithic-architecture)
- [Microservices Architecture](#2-microservices-architecture)
- [Monorepo Architecture](#3-monorepo-architecture)
- [Serverless Architecture](#4-serverless-architecture)
- [Event-Driven Architecture](#5-event-driven-architecture)
- [Clean/Hexagonal Architecture](#6-cleanhexagonal-architecture)
- [Our Current Architecture](#our-current-architecture-hybrid)
- [Decision Matrix](#decision-matrix-choosing-an-architecture)
- [Migration Paths](#migration-paths)

---

## Quick Reference Card

> One-page cheat sheet for choosing the right architecture pattern before diving into the deep-dive sections below.

### Decision Tree

```
START: New Project
│
├─ Team Size < 5?
│  └─ YES → Monolith or Serverless
│
├─ Team Size 5-20?
│  ├─ Multiple related apps (web + mobile + api)?
│  │  └─ YES → Monorepo
│  └─ NO → Modular Monolith
│
└─ Team Size > 20?
   ├─ Complex domain (multiple bounded contexts)?
   │  └─ YES → Microservices
   └─ NO → Monorepo or Modular Monolith
```

### Pattern Cheat Sheet

| Pattern | Team Size | Best For | Avoid When |
|---------|-----------|----------|------------|
| **Monolith** | 1-10 | MVP, simple apps | Team > 50 |
| **Microservices** | 20+ | Complex domains, scale | Team < 5 |
| **Monorepo** | 5-50 | Related projects | Independent teams |
| **Serverless** | Any | Spiky traffic, events | Long processes |
| **Event-Driven** | 10+ | Async workflows | Simple CRUD |

### Tech Stack Templates

**Solo/Small Team**
```
Frontend:  Next.js / React
Backend:   FastAPI / Django / Rails
Database:  PostgreSQL
Deploy:    Vercel + Railway
```

**Medium/Large Team**
```
Frontend:  Next.js
API Gateway: Kong / NGINX
Services: FastAPI + Node.js + Go (polyglot)
Queue: Kafka / RabbitMQ
Database: PostgreSQL (per service)
Deploy: Kubernetes / Docker Swarm
```

**Startup Monorepo**
```
Tooling: Turborepo / Nx
Apps: web/ + api/ + mobile/
Packages: types/ + ui/ + database/
Deploy: Vercel (frontend) + Railway (backend)
```

**Event-Driven / Serverless**
```
Functions: AWS Lambda / Vercel Functions
Database: DynamoDB / Supabase
Queue: SQS / EventBridge
Deploy: AWS SAM / Serverless Framework
```

### Migration Signals

**Monolith → Microservices**
- ✅ Team > 20 people
- ✅ Deploy conflicts or blocking releases
- ✅ Divergent scaling profiles between modules
- ✅ Clear bounded contexts identified
- ❌ Avoid if boundaries unclear or DevOps maturity low

**Scripts → Workers**
- ✅ Need retries/monitoring/observability
- ✅ Multiple chained tasks with dependencies
- ✅ Cron logic becoming complex
- ❌ Keep scripts if ad-hoc, one-off, or developer-operated

### Real-World Examples

| Company | Architecture | Why |
|---------|--------------|-----|
| **Basecamp** | Monolith (Rails) | Small team, focused product |
| **Shopify** | Modular Monolith | Shared codebase, disciplined teams |
| **Netflix** | Microservices (600+) | Massive scale, independent teams |
| **Google** | Monorepo | Shared tooling, code visibility |
| **Airbnb** | Microservices + Monorepo | Autonomy with shared platform |

### Cost Comparison (Indicative)

| Pattern | Infrastructure | Operational | Development |
|---------|----------------|-------------|-------------|
| Monolith | $ | $ | $ |
| Modular Monolith | $$ | $ | $$ |
| Microservices | $$$$ | $$$ | $$$ |
| Serverless | $ (pay-per-use) | $ | $$ |

### Snapshot: Camilo's Stack

**Pattern**: Hybrid Modular Monolith + Worker Microservices

```
Frontend:  Next.js (Vercel)
API:       FastAPI (Railway) - Modular monolith
Workers:   Celery (Railway) - Microservice-like
Database:  PostgreSQL + Redis
```

- ✅ Team of 1 → API stays monolithic.
- ✅ Workers split out for retries, scheduling, and observability.
- ✅ Shared database keeps analytics and AI pipelines consistent.
- 📈 Future: introduce API gateway + dedicated microservices once team/scale grows.

### Quick Commands

```bash
# Start Celery worker + beat
cd backend
poetry run celery -A app.workers.celery_app worker -B --loglevel=info

# Inspect running tasks
celery -A app.workers.celery_app inspect active

# Launch Flower dashboard
poetry run celery -A app.workers.celery_app flower  # http://localhost:5555
```

### Further Reading

- `docs/ARCHITECTURE.md` – Full system blueprint and data flows.
- `docs/backend/workers/README.md` – Celery topology, schedules, and troubleshooting.
- `docs/updates/2025-10_WORKERS_MIGRATION_SUMMARY.md` – Background workers migration narrative.
- `docs/operations/scripts/README.md` – Script catalogue and automation audit.

---

## Architecture Pattern Overview

### The Spectrum

```
Simple ←─────────────────────────────────────────────→ Complex
Low Cost ←────────────────────────────────────────→ High Cost
Fast Dev ←────────────────────────────────────────→ Slow Dev

Monolith → Modular Monolith → Monorepo → Microservices → Distributed
```

### Key Decision Factors

| Factor | Questions to Ask |
|--------|------------------|
| **Team Size** | Solo? 2-5? 5-20? 100+? |
| **Domain Complexity** | Single bounded context or multiple? |
| **Scale Requirements** | 100 users? 1M users? 100M users? |
| **Deploy Frequency** | Monthly? Weekly? Multiple times/day? |
| **Technology Diversity** | Single stack or polyglot? |
| **Operational Maturity** | Starting out or experienced DevOps team? |

---

## 1. Monolithic Architecture

### What It Is

All code in one codebase, deployed as a single unit.

```
┌────────────────────────────────────┐
│        Monolithic Application       │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │   UI     │  │   API    │       │
│  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐       │
│  │ Business │  │   Data   │       │
│  │  Logic   │  │  Access  │       │
│  └──────────┘  └──────────┘       │
│                                     │
│         Single Database             │
└────────────────────────────────────┘
        Single Deployment Unit
```

### Example Structure

```
my-app/
├── src/
│   ├── controllers/    # HTTP handlers
│   ├── services/       # Business logic
│   ├── models/         # Data models
│   └── views/          # UI templates
├── tests/
└── main.py            # Application entry point
```

### When to Use

✅ **Use monolith when:**
- Starting a new project (MVP, proof of concept)
- Team < 10 people
- Single bounded domain (e-commerce, blog, CMS)
- Limited resources/budget
- Fast iteration needed

❌ **Avoid monolith when:**
- Team > 50 people (deployment conflicts)
- Multiple independent domains
- Need independent scaling of components
- Polyglot requirements (different services need different languages)

### Pros & Cons

| Pros ✅ | Cons ❌ |
|---------|---------|
| Simple to develop and test | Tight coupling over time |
| Easy to deploy (one artifact) | Scaling limitations |
| No network latency between components | Long rebuild/deploy times at scale |
| Straightforward debugging | Technology lock-in |
| Lower operational complexity | Risk of becoming "big ball of mud" |

### Real-World Examples

- **Shopify** (started as Rails monolith, still partially monolithic)
- **Basecamp** (proudly monolithic)
- **WordPress** (monolithic CMS)

### Tech Stack Examples

```python
# Python Monolith
Flask/Django + PostgreSQL + Redis

# Node.js Monolith
Express.js + MongoDB + React SSR

# Ruby Monolith
Rails + PostgreSQL + Sidekiq
```

---

## 2. Microservices Architecture

### What It Is

Application decomposed into small, independent services that communicate over the network.

```
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                         │
└─────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │ Auth   │    │ Users  │    │Orders  │    │Payment │
    │Service │    │Service │    │Service │    │Service │
    └────────┘    └────────┘    └────────┘    └────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │Auth DB │    │Users DB│    │Orders  │    │Payment │
    │        │    │        │    │  DB    │    │  DB    │
    └────────┘    └────────┘    └────────┘    └────────┘
```

### Example Structure

```
microservices-app/
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── user-service/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── order-service/
│       ├── src/
│       ├── Dockerfile
│       └── pom.xml
├── shared/
│   └── proto/           # gRPC schemas
└── docker-compose.yml
```

### When to Use

✅ **Use microservices when:**
- Team > 20 people (Conway's Law)
- Multiple bounded contexts (auth, billing, inventory, etc.)
- Need independent scaling (high-traffic payment service)
- Different technology requirements per service
- Multiple teams working independently
- Frequent deployments (CI/CD for each service)

❌ **Avoid microservices when:**
- Team < 5 people (overhead too high)
- Unclear domain boundaries
- Limited DevOps expertise
- Network reliability concerns
- Budget constraints (more infrastructure needed)

### Pros & Cons

| Pros ✅ | Cons ❌ |
|---------|---------|
| Independent deployment & scaling | Operational complexity (monitoring, logging) |
| Technology diversity | Network latency & failures |
| Team autonomy | Distributed transactions are hard |
| Fault isolation | Testing complexity (integration tests) |
| Easier to understand (each service is small) | Data consistency challenges |

### Real-World Examples

- **Netflix** (600+ microservices)
- **Uber** (2000+ microservices)
- **Amazon** (thousands of microservices)
- **Spotify** (hundreds of microservices)

### Communication Patterns

**Synchronous (REST/gRPC)**:
```python
# Service A calls Service B
response = requests.post(
    'http://user-service/api/users',
    json={'name': 'John'}
)
```

**Asynchronous (Message Queue)**:
```python
# Service A publishes event
publisher.publish('user.created', {'user_id': 123})

# Service B subscribes to event
@subscriber.on('user.created')
def handle_user_created(event):
    send_welcome_email(event['user_id'])
```

---

## 3. Monorepo Architecture

### What It Is

Multiple projects/services in one repository with shared tooling and dependencies.

```
monorepo/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── api/              # FastAPI backend
│   ├── workers/          # Celery workers
│   └── mobile/           # React Native app
├── packages/
│   ├── ui/               # Shared UI components
│   ├── types/            # Shared TypeScript types
│   ├── database/         # Shared DB models
│   └── config/           # Shared configs
├── tools/
│   └── scripts/          # Build & deploy scripts
├── turbo.json           # Turborepo config
└── package.json         # Root workspace config
```

### Repository Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Monorepo Root                        │
│                                                          │
│  Apps (Deployable)          Packages (Shared)           │
│  ┌────────┐ ┌────────┐     ┌────────┐ ┌────────┐      │
│  │  Web   │ │  API   │     │   UI   │ │  Types │      │
│  └────────┘ └────────┘     └────────┘ └────────┘      │
│  ┌────────┐ ┌────────┐     ┌────────┐ ┌────────┐      │
│  │Workers │ │ Mobile │     │Database│ │ Config │      │
│  └────────┘ └────────┘     └────────┘ └────────┘      │
│                                                          │
│  Shared: Build tools, CI/CD, Linting, Testing           │
└─────────────────────────────────────────────────────────┘
```

### When to Use

✅ **Use monorepo when:**
- Multiple related projects (web + mobile + api)
- Need shared code/types between services
- Want atomic cross-service changes
- Team wants consistent tooling
- Google/Meta-style development workflow

❌ **Avoid monorepo when:**
- Projects are completely independent
- Large binary assets (monorepo gets huge)
- Teams want full autonomy
- Complex access control needs (can't share repo)

### Pros & Cons

| Pros ✅ | Cons ❌ |
|---------|---------|
| Shared code/types (no duplication) | Repo can get very large |
| Atomic cross-project changes | Slower CI/CD (more to build) |
| Consistent tooling & standards | Requires tooling (Turborepo, Nx) |
| Easier code reviews across projects | Potential merge conflicts |
| Simplified dependency management | Not all tools support monorepos well |

### Real-World Examples

- **Google** (entire company in one monorepo, 2B+ LOC)
- **Meta/Facebook** (monorepo for all projects)
- **Microsoft** (Windows in one repo)
- **Vercel** (Turbo repo creators use it)

### Tooling

**Turborepo** (JavaScript/TypeScript):
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Nx** (JavaScript/TypeScript):
```json
{
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nrwl/workspace/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test"]
      }
    }
  }
}
```

**Bazel** (Polyglot - Google's tool):
```python
# BUILD file
py_binary(
    name = "my_app",
    srcs = ["main.py"],
    deps = ["//packages/utils:utils"]
)
```

---

## 4. Serverless Architecture

### What It Is

Functions-as-a-Service (FaaS) - code runs on-demand without managing servers.

```
┌─────────────────────────────────────────────────────────┐
│                   API Gateway / HTTP                    │
└─────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │Lambda  │    │Lambda  │    │Lambda  │    │Lambda  │
    │GetUser │    │CreateUser   │DeleteUser   │ListUsers│
    └────────┘    └────────┘    └────────┘    └────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   DynamoDB     │
                    │   (Managed)    │
                    └────────────────┘
```

### Example Structure

```
serverless-app/
├── functions/
│   ├── getUser/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── createUser/
│   │   ├── handler.py
│   │   └── requirements.txt
│   └── processImage/
│       ├── handler.js
│       └── package.json
├── layers/              # Shared dependencies
│   └── utils/
└── serverless.yml       # Deployment config
```

### When to Use

✅ **Use serverless when:**
- Unpredictable/spiky traffic (0 to 10K requests suddenly)
- Event-driven workloads (file upload → process)
- Minimal ops team
- Pay-per-use cost model preferred
- Rapid prototyping/experimentation

❌ **Avoid serverless when:**
- Long-running processes (>15 min)
- Need predictable latency (cold starts are an issue)
- Complex state management
- Vendor lock-in concerns
- Need full control over infrastructure

### Pros & Cons

| Pros ✅ | Cons ❌ |
|---------|---------|
| Zero server management | Cold start latency |
| Auto-scaling (0 to ∞) | Vendor lock-in (AWS, GCP, Azure) |
| Pay-per-execution (cost efficient) | Debugging/monitoring harder |
| Built-in high availability | Limited execution time (15 min AWS) |
| Fast iteration | Stateless (need external storage) |

### Real-World Examples

- **Netflix** (uses Lambda for video encoding)
- **Coca-Cola** (vending machines use serverless)
- **iRobot** (Roomba data processing)

### Platforms

- **AWS Lambda** (most popular)
- **Google Cloud Functions**
- **Azure Functions**
- **Cloudflare Workers** (edge computing)
- **Vercel Functions** (Next.js)

---

## 5. Event-Driven Architecture

### What It Is

Services communicate through events instead of direct calls.

```
┌─────────────┐
│  Service A  │ ──Publishes──> │ Order Created │
└─────────────┘                 Event
                                   │
                     ┌─────────────┼─────────────┐
                     ▼             ▼             ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │Service B │  │Service C │  │Service D │
              │(Email)   │  │(Inventory│  │(Analytics│
              └──────────┘  └──────────┘  └──────────┘
                Subscribe    Subscribe     Subscribe
```

### When to Use

✅ **Use event-driven when:**
- Loose coupling needed (services don't know about each other)
- Complex workflows (order → payment → shipping → notification)
- Need audit trail (event sourcing)
- Real-time data processing
- Async communication preferred

❌ **Avoid event-driven when:**
- Simple CRUD operations
- Synchronous responses needed
- Team unfamiliar with async patterns
- Debugging needs to be straightforward

### Pros & Cons

| Pros ✅ | Cons ❌ |
|---------|---------|
| Loose coupling | Eventual consistency |
| Easy to add new consumers | Hard to debug (distributed traces) |
| Scalable (async processing) | Message ordering challenges |
| Audit trail (event log) | Duplicate message handling |

### Technologies

- **Kafka** (high-throughput event streaming)
- **RabbitMQ** (message queue)
- **AWS SNS/SQS** (managed pub/sub)
- **Redis Streams** (lightweight)
- **NATS** (cloud-native messaging)

---

## 6. Clean/Hexagonal Architecture

### What It Is

Organize code around business logic, not frameworks (Ports & Adapters pattern).

```
┌──────────────────────────────────────────────────┐
│              Adapters (Infrastructure)            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │    HTTP   │  │  Database │  │   Queue   │   │
│  │  (Flask)  │  │   (SQL)   │  │  (Redis)  │   │
│  └───────────┘  └───────────┘  └───────────┘   │
│         │               │               │        │
│         └───────────────┼───────────────┘        │
│                         │                        │
│              ┌──────────▼──────────┐             │
│              │    Ports (Interfaces)│             │
│              └──────────┬──────────┘             │
│                         │                        │
│              ┌──────────▼──────────┐             │
│              │   Domain (Business   │             │
│              │       Logic)        │             │
│              │  - Entities         │             │
│              │  - Use Cases        │             │
│              │  - Business Rules   │             │
│              └─────────────────────┘             │
└──────────────────────────────────────────────────┘
```

### Example Structure

```
clean-app/
├── domain/                # Business logic (framework-agnostic)
│   ├── entities/
│   ├── use_cases/
│   └── interfaces/        # Ports (abstract interfaces)
├── adapters/              # Infrastructure
│   ├── http/             # Flask/FastAPI
│   ├── database/         # SQLAlchemy
│   ├── queue/            # Celery
│   └── external/         # External APIs
└── main.py               # Dependency injection
```

### When to Use

✅ **Use clean architecture when:**
- Long-lived project (5+ years)
- Business logic is complex
- Need to swap frameworks/databases
- Testability is critical
- Team values maintainability over speed

❌ **Avoid clean architecture when:**
- Simple CRUD app
- Tight deadlines (more boilerplate)
- Team is small/inexperienced
- Domain logic is trivial

### Pros & Cons

| Pros ✅ | Cons ❌ |
|---------|---------|
| Testable (mock infrastructure) | More files/boilerplate |
| Framework-independent | Steeper learning curve |
| Maintainable | Slower initial development |
| Clear separation of concerns | Can be over-engineered |

---

## Our Current Architecture (Hybrid)

### Current State

```
┌──────────────────────────────────────────────────────┐
│              Frontend (Next.js - Vercel)              │
│  - App Router                                         │
│  - React Server Components                            │
│  - ISR (Incremental Static Regeneration)             │
└──────────────────────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌──────────────────────────────────────────────────────┐
│          Backend API (FastAPI - Railway)              │
│  - /api/v1/* endpoints                                │
│  - AI gateway (/api/ai)                               │
│  - Integration managers (WHOOP, Strava)               │
└──────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │ │ Background   │
│  + pgvector  │ │ (Cache/Queue)│ │   Workers    │
│              │ │              │ │  (Celery)    │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Architecture Classification

**Primary Pattern**: **Modular Monolith → Microservices (Hybrid)**

- **Frontend**: Deployed separately (Vercel)
- **Backend API**: Monolithic Python app (FastAPI)
- **Workers**: Separate service (Celery) - **microservice-like**
- **Database**: Shared PostgreSQL (monolithic data layer)

### Why This Hybrid Approach?

| Aspect | Choice | Reasoning |
|--------|--------|-----------|
| Frontend Deployment | Separate | Vercel Edge, ISR, independent scaling |
| Backend API | Monolithic | Team < 5, single domain, simplicity |
| Workers | Separate Service | CPU-heavy tasks, independent scaling |
| Database | Shared | Data consistency, no distributed transactions |
| Scripts | Moving to Workers | Professional ops, reliability |

### Evolution Path

```
Phase 1 (✅ Complete):
├── Next.js frontend + /api routes
└── PostgreSQL

Phase 2 (✅ Complete):
├── Next.js frontend
├── FastAPI backend (centralized API)
└── PostgreSQL

Phase 3 (🚧 In Progress):
├── Next.js frontend
├── FastAPI backend
├── Celery workers (← YOU ARE HERE)
└── PostgreSQL + Redis

Phase 4 (📋 Future):
├── Next.js frontend
├── API Gateway
├── Auth Service (microservice)
├── Analytics Service (microservice)
├── Integration Service (microservice)
└── PostgreSQL (per-service DBs)
```

---

## Decision Matrix: Choosing an Architecture

### By Team Size

| Team Size | Recommended Architecture |
|-----------|-------------------------|
| 1-3 people | **Monolith** |
| 4-10 people | **Modular Monolith** or **Monorepo** |
| 10-50 people | **Monorepo** or **Microservices (few services)** |
| 50+ people | **Microservices** |

### By Project Type

| Project Type | Best Fit |
|--------------|----------|
| MVP/Prototype | **Monolith** or **Serverless** |
| SaaS Product | **Modular Monolith** → **Microservices** |
| E-commerce | **Microservices** (catalog, cart, payment separate) |
| Content Site | **Serverless** (static + functions) |
| Enterprise | **Microservices** with **Event-Driven** |
| Internal Tool | **Monolith** |

### By Scale

| Scale | Architecture |
|-------|--------------|
| < 1K users | **Monolith** |
| 1K - 100K users | **Modular Monolith** |
| 100K - 1M users | **Microservices** (2-5 services) |
| 1M - 10M users | **Microservices** (5-20 services) |
| 10M+ users | **Microservices** + **Event-Driven** |

---

## Migration Paths

### Monolith → Microservices

**Strangler Fig Pattern**:
```
1. Identify bounded context (e.g., payments)
2. Create new microservice
3. Route new traffic to microservice
4. Migrate old data gradually
5. Decommission monolith module
6. Repeat for next service
```

### Scripts → Background Workers

**Current State** (Camilo's Portfolio):
```
scripts/
├── pipelines/
│   ├── strava-weekly-sync.js
│   └── activity-correlation-etl.js
└── one-off/
    └── update_astoria_progress.py
```

**Target State**:
```
backend/app/workers/
├── tasks/
│   ├── strava.py          (← strava-weekly-sync.js)
│   ├── correlation.py     (← activity-correlation-etl.js)
│   └── astoria.py         (← update_astoria_progress.py)
└── celeryconfig.py        (← schedule definitions)
```

**Migration Steps**:
1. ✅ Set up Celery + Redis
2. ✅ Port first script (correlation) to Python task
3. ⏳ Test task execution
4. ⏳ Port remaining scripts
5. ⏳ Update deployment (Docker Compose)
6. ⏳ Archive old scripts

---

## Key Takeaways

### Start Simple

> **Premature optimization is the root of all evil.** - Donald Knuth

- **MVP**: Monolith
- **Traction**: Modular Monolith
- **Scale**: Microservices

### When to Evolve

Evolve your architecture when:
- ✅ Team grows (Conway's Law)
- ✅ Scale demands it (performance bottlenecks)
- ✅ Deployment conflicts (multiple teams blocking each other)
- ✅ Technology diversity needed (polyglot requirements)

**DON'T** evolve when:
- ❌ Just because it's trendy
- ❌ Solving non-existent future problems
- ❌ Team doesn't have the expertise

### The Right Architecture

> **The best architecture is the one that solves your current problems without creating new ones.**

---

## References

- [Martin Fowler - Microservices](https://martinfowler.com/articles/microservices.html)
- [Sam Newman - Building Microservices](https://samnewman.io/books/building_microservices/)
- [Robert C. Martin - Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Monorepo.tools](https://monorepo.tools/)
- [AWS Serverless](https://aws.amazon.com/serverless/)

---

*Last Updated: October 7, 2025*
*Maintainer: Camilo Martinez*
