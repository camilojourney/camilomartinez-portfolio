# 🎯 Architecture Quick Reference Card

> **One-page guide** to choosing the right architecture for your next project

---

## Decision Tree

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

---

## Pattern Cheat Sheet

| Pattern | Team Size | Best For | Avoid When |
|---------|-----------|----------|------------|
| **Monolith** | 1-10 | MVP, simple apps | Team > 50 |
| **Microservices** | 20+ | Complex domains, scale | Team < 5 |
| **Monorepo** | 5-50 | Related projects | Independent teams |
| **Serverless** | Any | Spiky traffic, events | Long processes |
| **Event-Driven** | 10+ | Async workflows | Simple CRUD |

---

## Tech Stack Templates

### Monolith (Solo/Small Team)
```
Frontend:  Next.js / React
Backend:   FastAPI / Django / Rails
Database:  PostgreSQL
Deploy:    Vercel + Railway
```

### Microservices (Medium/Large Team)
```
Frontend:  Next.js
API Gateway: Kong / NGINX
Services: FastAPI + Node.js + Go (polyglot)
Queue: Kafka / RabbitMQ
Database: PostgreSQL (per service)
Deploy: Kubernetes / Docker Swarm
```

### Monorepo (Startup)
```
Tooling: Turborepo / Nx
Apps: web/ + api/ + mobile/
Packages: types/ + ui/ + database/
Deploy: Vercel (frontend) + Railway (backend)
```

### Serverless (Event-Driven)
```
Functions: AWS Lambda / Vercel Functions
Database: DynamoDB / Supabase
Queue: SQS / EventBridge
Deploy: AWS SAM / Serverless Framework
```

---

## When to Migrate

### Monolith → Microservices

**Migrate when:**
- ✅ Team > 20 people
- ✅ Deploy conflicts (teams blocking each other)
- ✅ Different scaling needs (payment service vs catalog)
- ✅ Clear bounded contexts identified

**Don't migrate when:**
- ❌ Just because it's trendy
- ❌ Team lacks DevOps expertise
- ❌ Domain boundaries are unclear

### Scripts → Workers

**Migrate when:**
- ✅ Need reliability (retries, monitoring)
- ✅ Scheduled tasks becoming complex
- ✅ Multiple related tasks
- ✅ Want professional operations

**Don't migrate when:**
- ❌ One-off maintenance scripts
- ❌ Simple cron jobs work fine
- ❌ Team unfamiliar with task queues

---

## Real-World Examples

| Company | Architecture | Why |
|---------|--------------|-----|
| **Basecamp** | Monolith (Rails) | Small team, simple domain |
| **Shopify** | Modular Monolith | Started monolith, still works |
| **Netflix** | Microservices (600+) | Massive scale, multiple teams |
| **Google** | Monorepo | All code in one repo |
| **Airbnb** | Microservices + Monorepo | Best of both worlds |

---

## Cost Comparison (Rough)

| Pattern | Infrastructure | Operational | Development |
|---------|----------------|-------------|-------------|
| Monolith | $ | $ | $ |
| Modular Monolith | $$ | $ | $$ |
| Microservices | $$$$ | $$$ | $$$ |
| Serverless | $ (pay-per-use) | $ | $$ |

---

## Your Current Stack (Camilo's Portfolio)

**Pattern**: Hybrid Microservices

```
Frontend:  Next.js (Vercel)
API:       FastAPI (Railway) - Monolithic
Workers:   Celery (Railway) - Microservice-like
Database:  PostgreSQL + Redis
```

**Why this works**:
- ✅ Team of 1 (you)
- ✅ API is simple enough for monolith
- ✅ Workers separated for scaling/reliability
- ✅ Shared database (no distributed transactions)

**When to evolve**:
- If you add a team → Consider monorepo
- If API gets complex → Split into microservices
- If scale demands → Add API gateway

---

## Quick Commands

### Start Celery Workers
```bash
cd backend
poetry run celery -A app.workers.celery_app worker -B --loglevel=info
```

### Monitor Tasks (Flower)
```bash
poetry run celery -A app.workers.celery_app flower
# Open: http://localhost:5555
```

### Inspect Running Tasks
```bash
celery -A app.workers.celery_app inspect active
```

---

## Further Reading

- 📖 Full Guide: `/docs/ARCHITECTURE_PATTERNS.md`
- 🏗️ Your Architecture: `/docs/ARCHITECTURE.md`
- 🔧 Workers Guide: `docs/backend/workers/README.md`
- 📝 Migration Summary: `/WORKERS_MIGRATION_SUMMARY.md`

---

*Keep this handy when planning your next project!*
