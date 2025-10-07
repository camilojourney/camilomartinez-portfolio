# Camilo's AI Analytics FastAPI Backend 🚀

A high-performance Python FastAPI backend for AI-powered fitness analytics, migrated from 62+ Next.js serverless functions to a centralized, scalable architecture.

## 🏗️ Architecture Overview

```
backend/
├── app/                    # Core application
│   ├── config/            # Configuration & database setup
│   ├── models/            # Pydantic models & SQLAlchemy schemas
│   ├── routers/           # API endpoints organized by domain
│   ├── services/          # Business logic layer
│   ├── utils/             # Utilities & helpers
│   └── middleware/        # FastAPI middleware
├── scripts/               # Data processing & automation
├── tests/                 # Comprehensive test suite
├── alembic/              # Database migrations
└── docker/               # Containerization
```

## 🚀 Key Features

- **High-Performance Async**: Built with FastAPI + SQLAlchemy 2.0+ async patterns
- **AI-Powered Analytics**: OpenAI GPT-4 integration with vector RAG search
- **Multi-Platform Fitness**: Strava & WHOOP API integrations with OAuth
- **Smart Rate Limiting**: Redis-based limits with user/IP strategies
- **Vector Search**: PostgreSQL pgvector for semantic similarity
- **Background Tasks**: Celery integration for data processing
- **Production Ready**: Docker, monitoring, logging, and CI/CD

## 🛠️ Tech Stack

- **Framework**: FastAPI with uvicorn ASGI server
- **Database**: PostgreSQL with pgvector extension
- **ORM**: SQLAlchemy 2.0+ with async support
- **Cache/Queue**: Redis for rate limiting and Celery tasks
- **AI/ML**: OpenAI GPT-4, text-embedding-3-small
- **Auth**: JWT with OAuth2 flows for Strava/WHOOP
- **Testing**: pytest with async support and coverage
- **Code Quality**: Black, Ruff, MyPy for formatting and linting

## 🔧 Development Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 14+ with pgvector
- Redis 6+
- Poetry for dependency management

### Installation

```bash
# Clone and navigate to backend
cd backend/

# Install Poetry (if not already installed)
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Activate virtual environment
poetry shell

# Copy environment configuration
cp .env.example .env
# Edit .env with your database and API credentials

# Run database migrations
alembic upgrade head

# Start development server
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

### Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dbname

# Redis Configuration
REDIS_URL=redis://localhost:6379

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Strava API
STRAVA_CLIENT_ID=REPLACE_ME
STRAVA_CLIENT_SECRET=REPLACE_ME

# WHOOP API
WHOOP_CLIENT_ID=REPLACE_ME
WHOOP_CLIENT_SECRET=REPLACE_ME

# Security
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Rate Limiting
RATE_LIMIT_DEFAULT=5
RATE_LIMIT_WINDOW=86400  # 24 hours in seconds
```

## 📡 API Endpoints

### AI & Analytics
- `POST /api/ai/query` - AI-powered data analysis with RAG
- `POST /api/ai/query/feedback` - Query feedback collection
- `POST /api/ai/trainer/run-cycle` - AI evaluation cycles
- `GET /api/ai/trainer/history` - Training history

### Fitness Integrations
- `GET /api/strava/sync/status` - Sync status monitoring
- `POST /api/strava/sync/weekly` - Weekly data synchronization
- `POST /api/whoop/collect` - WHOOP data collection
- `GET /api/integrations/health` - Overall integration health

### System Operations
```bash
# Health check endpoint
curl -s http://localhost:9000/api/system/health

# Detailed health check (includes database and Redis status)
curl -s http://localhost:9000/api/system/health/detailed

# System status information
curl -s http://localhost:9000/api/system/status

# Debug: Check rate limit status
curl -s http://localhost:9000/api/system/debug/rate-limit

# Debug: Test rate limiting
curl -X POST http://localhost:9000/api/system/debug/test-rate-limit

# Debug: Create bypass token (for testing)
curl -X POST "http://localhost:9000/api/system/debug/create-bypass-token?description=test"
```

## 🧪 Testing

```bash
# Run full test suite
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_ai_services.py

# Run async tests
pytest -k "async" -v
```

## 🚀 Production Deployment

### Docker
```bash
# Build image
docker build -t camilo-analytics-backend .

# Run container
docker run -p 8000:8000 --env-file .env camilo-analytics-backend
```

### Performance Monitoring
- **Metrics**: Built-in FastAPI metrics endpoint
- **Logging**: Structured JSON logging with correlation IDs
- **Health Checks**: Comprehensive health endpoints for all services
- **Caching**: Redis-based caching for frequently accessed data

## 🔒 Security Features

- **Rate Limiting**: Redis-based with IP and user-based strategies
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **OAuth2 Integration**: Strava and WHOOP OAuth flows
- **Input Validation**: Pydantic models for all request/response data
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries

## 📊 Migration Status

**Migrated from Next.js:**
- ✅ AI Query Engine (62+ endpoints consolidated)
- ✅ Rate Limiting System (5 queries/day with bypass)
- ✅ Database Operations (PostgreSQL with pgvector)
- 🚧 Strava Integration (in progress)
- 🚧 WHOOP Integration (in progress)
- 📋 Background Tasks (planned)
- 📋 Frontend Integration (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run code quality checks (`black . && ruff . && mypy .`)
5. Run tests (`pytest`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📝 License

This project is private and proprietary to Camilo Martinez's portfolio.

---

**Built with ❤️ by Camilo Martinez**  
*AI-Powered Fitness Analytics Platform*