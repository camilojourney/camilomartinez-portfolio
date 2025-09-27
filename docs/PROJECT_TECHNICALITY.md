# 🏗️ PROJECT TECHNICALITY: Architecture & Workflow Guide

**Document Version**: 1.0  
**Last Updated**: September 27, 2025  
**Author**: Camilo Martinez  

---

## 📋 TABLE OF CONTENTS

1. [Architecture Overview](#-architecture-overview)
2. [Workflow Changes: Before vs After](#-workflow-changes-before-vs-after)
3. [Technical Stack Deep Dive](#-technical-stack-deep-dive)
4. [Development Workflow](#-development-workflow)
5. [Deployment & Production](#-deployment--production)
6. [Team Collaboration Guide](#-team-collaboration-guide)
7. [Troubleshooting Common Issues](#-troubleshooting-common-issues)
8. [API Endpoint Migration Map](#-api-endpoint-migration-map)

---

## 🏛️ ARCHITECTURE OVERVIEW

### **Current Architecture: Microservices**

```mermaid
graph TB
    User[👤 User] --> Frontend[🌐 Next.js Frontend<br/>localhost:3000]
    Frontend --> Backend[⚡ FastAPI Backend<br/>localhost:9000]
    Backend --> DB[(🗄️ PostgreSQL Database<br/>Docker Container)]
    Backend --> AI[🤖 OpenAI API]
    Backend --> Cache[📦 Redis Cache]
```

### **Architecture Components**

| Component | Technology | Port | Purpose |
|-----------|------------|------|---------|
| **Frontend** | Next.js 15 + React 19 | 3000 | UI, routing, SSR/SSG |
| **Backend** | FastAPI + Python 3.11 | 9000 | APIs, business logic, AI services |
| **Database** | PostgreSQL 15 | 5432 | Data persistence |
| **Cache** | Redis | 6379 | Session management, rate limiting |
| **AI Engine** | OpenAI GPT-4 | - | Natural language processing |

---

## 🔄 WORKFLOW CHANGES: Before vs After

### **📊 BEFORE: Monolithic Next.js**

```bash
# Single command development
pnpm dev                    # → http://localhost:3000
# ✅ Everything runs on one server (Frontend + API routes)
```

**Structure:**
```
src/
├── app/
│   ├── (pages)/
│   └── api/                # 🔴 All APIs mixed with frontend
│       ├── ai-query/
│       ├── analytics/
│       └── whoop-collector/
├── components/
└── lib/
```

**Issues:**
- ❌ Frontend and backend tightly coupled
- ❌ Limited scaling capabilities
- ❌ API routes can't be independently deployed
- ❌ Difficult to optimize performance separately

### **📊 AFTER: Microservices Architecture**

```bash
# Multi-service development
Terminal 1: pnpm dev                                    # → Frontend (3000)
Terminal 2: cd backend && poetry run uvicorn app.main:app --port 9000  # → Backend (9000)
Terminal 3: docker-compose up -d                        # → Database (5432)
```

**Structure:**
```
# Frontend (Next.js)
src/
├── app/(main)/             # Pages and UI components
├── components/             # Reusable UI components  
└── lib/api/config.ts       # API client configuration

# Backend (FastAPI)
backend/
├── app/
│   ├── routers/            # API endpoints
│   │   ├── ai.py           # AI services
│   │   └── analytics.py    # Data analytics
│   ├── services/           # Business logic
│   └── models/             # Database models
├── pyproject.toml          # Python dependencies
└── docker-compose.yml      # Database setup
```

**Benefits:**
- ✅ Independent scaling and deployment
- ✅ Specialized technology stacks
- ✅ Better performance optimization
- ✅ Cleaner separation of concerns

---

## 🛠️ TECHNICAL STACK DEEP DIVE

### **Frontend Stack (Next.js)**

```json
// package.json - Key Dependencies
{
  "dependencies": {
    "next": "^15.3.4",           // React framework with App Router
    "react": "19.1.0",           // Latest React with concurrent features
    "typescript": "5.3.3",       // Type safety
    "framer-motion": "^12.23.12", // Animations
    "tailwindcss": "^3.4.13",    // Utility-first CSS
    "recharts": "^3.0.2",        // Data visualization
    "openai": "^5.15.0"          // AI integration (fallback)
  }
}
```

**Key Features:**
- **App Router**: New Next.js 13+ routing system
- **Server Components**: Improved performance with RSC
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first styling with custom design system

### **Backend Stack (FastAPI)**

```toml
# pyproject.toml - Key Dependencies
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.1"          # Modern async Python web framework
uvicorn = "^0.24.0"           # ASGI server
sqlalchemy = "^2.0.23"        # Database ORM
pydantic = "^2.5.0"           # Data validation
openai = "^1.3.7"             # AI services
pandas = "^2.1.4"             # Data processing
redis = "^5.0.1"              # Caching and sessions
```

**Key Features:**
- **FastAPI**: Automatic API documentation (Swagger/OpenAPI)
- **SQLAlchemy 2.0**: Modern async database ORM
- **Pydantic**: Runtime type validation and serialization
- **Poetry**: Dependency management and virtual environments

### **Database & Infrastructure**

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: camilo_portfolio
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

**Database Schema:**
- **Users**: Authentication and user management
- **WHOOP Data**: Fitness metrics (sleep, recovery, strain)
- **Strava Data**: Running activities and performance
- **AI Data**: Query history, embeddings, trainer evaluations

---

## 💻 DEVELOPMENT WORKFLOW

### **Daily Development Setup**

```bash
# 1. Start Database (one-time per session)
docker-compose up -d

# 2. Start Backend API Server
cd backend
poetry install                           # Install dependencies (first time)
poetry run uvicorn app.main:app --reload --port 9000

# 3. Start Frontend Development Server  
pnpm dev                                 # In project root

# 4. Access Applications
# Frontend: http://localhost:3000
# Backend API: http://localhost:9000
# API Docs: http://localhost:9000/docs
```

### **Port Configuration**

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Next.js Frontend | 3000 | http://localhost:3000 | User interface |
| FastAPI Backend | 9000 | http://localhost:9000 | API services |
| PostgreSQL | 5432 | localhost:5432 | Database |
| Redis | 6379 | localhost:6379 | Cache (optional) |

### **Development Commands**

```bash
# Frontend Commands (package.json)
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm start                  # Start production server

# Backend Commands (Poetry)
cd backend
poetry install              # Install dependencies
poetry run uvicorn app.main:app --reload --port 9000  # Dev server
poetry run pytest           # Run tests
poetry run black .          # Format code
poetry run ruff check .     # Lint code

# Database Commands
docker-compose up -d         # Start database
docker-compose down          # Stop database
docker-compose logs postgres # View database logs
```

---

## 🚀 DEPLOYMENT & PRODUCTION

### **Production Architecture**

```mermaid
graph TB
    Internet[🌐 Internet] --> CDN[🔥 Vercel Edge Network]
    CDN --> Frontend[🌐 Next.js App<br/>Vercel]
    Frontend --> API[⚡ FastAPI Backend<br/>Railway/AWS]
    API --> ProdDB[(🗄️ PostgreSQL<br/>Supabase/AWS RDS)]
    API --> ProdCache[📦 Redis<br/>Upstash/AWS ElastiCache]
```

### **Environment Configuration**

```bash
# .env (Frontend - Next.js)
NEXT_PUBLIC_FASTAPI_URL=https://api.camilomartinez.co
NEXTAUTH_URL=https://camilomartinez.co
NEXTAUTH_SECRET=your_secret_key

# backend/.env (Backend - FastAPI)
DATABASE_URL=postgresql://user:pass@host:5432/db
OPENAI_API_KEY=sk-your-openai-key
REDIS_URL=redis://user:pass@host:6379
JWT_SECRET_KEY=your-jwt-secret
```

### **Deployment Steps**

**Frontend (Vercel):**
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Auto-deploy on push to main branch

**Backend (Railway/AWS):**
1. Deploy FastAPI app to cloud provider
2. Configure environment variables
3. Set up production database connection

---

## 👥 TEAM COLLABORATION GUIDE

### **New Developer Onboarding**

```bash
# 1. Clone Repository
git clone https://github.com/your-username/camilomartinez-portfolio.git
cd camilomartinez-portfolio

# 2. Install Frontend Dependencies
pnpm install

# 3. Install Backend Dependencies
cd backend
poetry install
cd ..

# 4. Set Up Environment Variables
cp .env.example .env                    # Frontend config
cp backend/.env.example backend/.env    # Backend config

# 5. Start Database
docker-compose up -d

# 6. Run Database Migrations (if needed)
cd backend
poetry run alembic upgrade head
cd ..

# 7. Start Development Servers
# Terminal 1
pnpm dev

# Terminal 2
cd backend && poetry run uvicorn app.main:app --reload --port 9000
```

### **Development Best Practices**

**Frontend Development:**
- Use TypeScript for all new code
- Follow existing component patterns
- Implement responsive design with Tailwind
- Add proper error handling and loading states

**Backend Development:**
- Follow FastAPI best practices
- Add proper validation with Pydantic models
- Implement comprehensive error handling
- Write tests for all endpoints

**Database Changes:**
- Use Alembic migrations for schema changes
- Never modify database directly in production
- Test migrations thoroughly

---

## 🐛 TROUBLESHOOTING COMMON ISSUES

### **"Connection Refused" Errors**

```bash
# Issue: Frontend can't connect to backend
# Solution: Ensure both servers are running

# Check if FastAPI is running
curl http://localhost:9000/api/system/health

# Check if Next.js is running  
curl http://localhost:3000

# Start missing servers
pnpm dev                                    # Frontend
cd backend && poetry run uvicorn app.main:app --port 9000  # Backend
```

### **"Database Connection Failed"**

```bash
# Issue: Backend can't connect to database
# Solution: Start PostgreSQL container

docker-compose up -d
docker-compose ps  # Check container status

# Check database logs
docker-compose logs postgres
```

### **"Module Not Found" Errors**

```bash
# Frontend dependency issues
rm -rf node_modules package-lock.json
pnpm install

# Backend dependency issues
cd backend
poetry install --no-cache
```

### **"Port Already in Use"**

```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:9000 | xargs kill -9  # Backend
```

---

## 🗺️ API ENDPOINT MIGRATION MAP

### **Migrated Endpoints (✅ Complete)**

| Old Next.js Route | New FastAPI Endpoint | Status |
|-------------------|---------------------|---------|
| `/api/ai-query` | `/api/ai/chat/query` | ✅ Migrated |
| `/api/ai-trainer/run-cycle` | `/api/ai/trainer/evaluate` | ✅ Migrated |
| `/api/ai-trainer/history` | `/api/ai/trainer/history` | ✅ Migrated |
| `/api/analytics/*` | `/api/analytics/*` | ✅ Migrated |
| `/api/view-data` | `/api/analytics/view-data` | ✅ Migrated |

### **API Client Usage**

```typescript
// src/lib/api/config.ts
import { aiService, analyticsService } from '@/lib/api/config';

// AI Services
const response = await aiService.query("What's my average strain?");
const history = await aiService.getHistory(20);
const evaluation = await aiService.evaluateAthlete(90);

// Analytics Services  
const strainData = await analyticsService.getStrainData();
const monthlyData = await analyticsService.getMonthlyStrainData();
const workoutData = await analyticsService.getWorkoutData();
```

### **Authentication Flow (🔄 In Progress)**

```typescript
// Future implementation
const authenticatedRequest = await ApiClient.get('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${getAuthToken()}`
  }
});
```

---

## 📊 PERFORMANCE METRICS

### **Current Performance**

| Metric | Frontend | Backend | Target |
|--------|----------|---------|---------|
| **Response Time** | ~200ms | ~150ms | <300ms |
| **Bundle Size** | ~400KB | N/A | <500KB |
| **API Latency** | N/A | ~100ms | <200ms |
| **Database Queries** | N/A | ~50ms | <100ms |

### **Optimization Strategies**

**Frontend:**
- Implement code splitting for routes
- Optimize images with Next.js Image component
- Use React Server Components for data fetching
- Implement proper caching strategies

**Backend:**
- Add Redis caching for frequent queries
- Optimize database queries with indexes
- Implement connection pooling
- Use async processing for heavy operations

---

## 🎯 FUTURE ENHANCEMENTS

### **Phase 6: Enhanced Authentication**
- JWT token management
- Role-based access control
- OAuth integration (Google, GitHub)

### **Phase 7: Real-time Features**
- WebSocket connections for live data
- Real-time notifications
- Live chat functionality

### **Phase 8: Advanced Analytics**
- Machine learning predictions
- Advanced data visualizations
- Custom dashboard builder

### **Phase 9: Mobile Optimization**
- Progressive Web App (PWA)
- Mobile-specific UI components
- Offline data synchronization

---

## 📝 CHANGELOG

### Version 1.0 (September 2025)
- ✅ Migrated from monolithic Next.js to microservices
- ✅ Implemented FastAPI backend with 5 core routers
- ✅ Created centralized API client configuration
- ✅ Migrated analytics and AI services endpoints
- ✅ Established development workflow documentation

---

## 🤝 CONTRIBUTING

### **Code Review Process**
1. Create feature branch from `main`
2. Implement changes with tests
3. Submit pull request with detailed description
4. Address review feedback
5. Merge after approval

### **Testing Requirements**
- Frontend: Component tests with Jest/Testing Library
- Backend: API tests with pytest
- Integration: End-to-end tests with Playwright

### **Documentation Standards**
- Update this document for architectural changes
- Add JSDoc comments for complex functions
- Maintain API documentation in FastAPI

---

**🎉 This architecture provides a solid foundation for scaling your AI-powered portfolio platform while maintaining excellent developer experience and performance.**