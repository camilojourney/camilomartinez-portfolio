 # FastAPI Backend Implementation Documentation

## Overview
This document tracks the progressive implementation of Camilo's AI Analytics FastAPI backend, migrating from 62+ Next.js serverless functions to a centralized, high-performance Python architecture.

## Implementation Phases

### ✅ Phase 1: FastAPI Foundation (Completed)
**Implemented:** Core application structure with modern Python best practices

#### What Was Added:
- **Project Structure**: Complete backend directory with organized modules
- **Poetry Configuration** (`pyproject.toml`): Modern dependency management with dev tools
  - FastAPI 0.104.1+ with async support
  - SQLAlchemy 2.0+ for database operations
  - Pydantic Settings for configuration management
  - Development tools: Black, Ruff, MyPy, pytest
- **Application Factory** (`app/main.py`): FastAPI app with lifespan management
- **Configuration System** (`app/config/`):
  - `settings.py`: Pydantic Settings with environment variable validation
  - `database.py`: Async SQLAlchemy 2.0+ with connection pooling
- **Docker Support**:
  - `Dockerfile`: Production-ready containerization
  - `docker-compose.yml`: Development stack with Redis and PostgreSQL
- **Development Setup** (`setup.py`): Automated environment configuration script

#### Technical Decisions:
- **SQLAlchemy 2.0+**: Chosen over `databases` library for better async support and maintenance
- **Poetry**: Superior to pip/requirements.txt for deterministic builds
- **Async-First**: All database operations use async/await patterns
- **Connection Pooling**: Configured for production with pool_size=20

---

### ✅ Phase 2: Database Layer Migration (Completed)
**Implemented:** Complete SQLAlchemy models mirroring existing PostgreSQL schema

#### What Was Added:
- **User Models** (`app/models/user.py`):
  - `User`: Application users with OAuth token storage
  - Pydantic models: `UserCreate`, `UserResponse`, `UserUpdate`
  - Password hashing support and authentication fields

- **Strava Models** (`app/models/strava.py`):
  - `StravaUser`: Athlete profiles with OAuth tokens
  - `StravaRun`: Activity data with performance metrics and polyline mapping
  - API models with validation for distance, speed, and heart rate data
  - Relationship mapping between users and activities

- **WHOOP Models** (`app/models/whoop.py`):
  - `WHOOPUser`: User profiles with token management
  - `WHOOPCycle`: Daily physiological cycles
  - `WHOOPSleep`: Sleep data with V1/V2 API compatibility (UUID + integer IDs)
  - `WHOOPRecovery`: Recovery scores with biometric data
  - `WHOOPWorkout`: Workout activities with heart rate zones
  - All models support both V1 (integer) and V2 (UUID) API formats

- **AI Query Models** (`app/models/ai_query.py`):
  - `QueryHistory`: AI trainer performance tracking
  - `EvaluationCycle`: AI evaluation runs with success metrics
  - `SchemaEmbedding`: RAG system with pgvector support (1536 dimensions)
  - API models for requests, responses, and feedback

- **Rate Limiting Models** (`app/models/rate_limiting.py`):
  - `QuestionRateLimit`: IP-based limits (5 queries/day)
  - `UserRateLimit`: User-based limits (20 queries/day for authenticated users)
  - `RateLimitBypass`: Internal service bypass tokens
  - Enhanced models for premium users and usage tracking

- **Database Migrations** (`alembic/`):
  - Complete Alembic configuration with async support
  - Migration templates and environment setup
  - All models registered for auto-migration generation

#### Technical Decisions:
- **Async SQLAlchemy 2.0+**: Modern ORM with full async support
- **Pydantic Integration**: Automatic validation and serialization
- **PostgreSQL INET Type**: Proper IP address storage for rate limiting
- **pgvector Support**: Vector embeddings for RAG with HNSW indexing
- **V1/V2 Compatibility**: Maintains backwards compatibility for WHOOP API versions

#### Database Schema Compatibility:
- ✅ Mirrors existing `whoop_*` tables exactly
- ✅ Maintains `strava_users` and `strava_runs` structure
- ✅ Preserves `query_history` and `evaluation_cycles` for AI trainer
- ✅ Compatible with existing `question_rate_limits` table
- ✅ Supports `schema_embeddings` with vector operations

---

## Next Phase: Rate Limiting Infrastructure
**Planned:** Redis-based rate limiting with fastapi-limiter integration

### What Will Be Implemented:
- Redis connection and configuration
- FastAPI middleware for rate limiting
- IP-based and user-based limit strategies
- AI trainer bypass system
- Rate limit response handling and error messages

---

## Architecture Decisions

### Why FastAPI?
- **Performance**: Comparable to Node.js with better async patterns
- **Data Processing**: Python's superior ecosystem for AI/ML and analytics
- **Type Safety**: Pydantic models with automatic validation
- **Documentation**: Auto-generated OpenAPI docs

### Why SQLAlchemy 2.0+?
- **Async Support**: Native async/await with proper connection pooling
- **Modern ORM**: Improved syntax and performance over 1.x
- **pgvector Integration**: Direct support for vector operations
- **Migration Support**: Seamless integration with Alembic

### Why Poetry?
- **Deterministic Builds**: Lock file ensures consistent dependencies
- **Dev Dependencies**: Clean separation of production and development packages
- **Virtual Environment**: Automatic management and isolation
- **Modern Standards**: PEP 518 compliance with pyproject.toml

---

## Performance Considerations

### Database Optimizations:
- **Connection Pooling**: 20 connections with overflow disabled
- **Async Operations**: Non-blocking database operations
- **Indexes**: Proper indexing for user_id, ip_address, and date fields
- **Vector Search**: HNSW indexes for fast similarity search

### API Optimizations:
- **Async Endpoints**: All routes use async/await patterns  
- **Response Models**: Pydantic models exclude sensitive data
- **Connection Reuse**: Persistent connections to external APIs
- **Background Tasks**: Non-blocking operations for data processing

---

## Security Implementation

### Authentication:
- **JWT Tokens**: Secure token-based authentication
- **OAuth Integration**: Strava and WHOOP OAuth flows
- **Password Hashing**: bcrypt for secure password storage
- **Token Refresh**: Automatic token renewal for external APIs

### Rate Limiting:
- **IP-Based Limits**: 5 queries/day for anonymous users
- **User-Based Limits**: 20 queries/day for authenticated users  
- **Bypass Tokens**: Internal service exemptions
- **Premium Users**: Unlimited access for premium accounts

### Data Protection:
- **Input Validation**: Pydantic models validate all inputs
- **SQL Injection Protection**: Parameterized queries via SQLAlchemy
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variables**: Secure configuration management

---

## Migration Status

### Completed Migrations:
- [x] **Project Foundation**: FastAPI, Poetry, Docker setup
- [x] **Database Models**: All existing tables mapped to SQLAlchemy
- [x] **Configuration**: Environment-based settings with validation
- [x] **Development Environment**: Docker compose with Redis and PostgreSQL

### In Progress:
- [ ] **Rate Limiting**: Redis-based implementation
- [ ] **AI Services**: OpenAI client and RAG system
- [ ] **Authentication**: JWT and OAuth flows
- [ ] **API Endpoints**: Strava and WHOOP integrations

### Planned:
- [ ] **Background Tasks**: Celery or FastAPI background tasks
- [ ] **Testing**: Comprehensive pytest suite
- [ ] **Production**: CI/CD pipeline and monitoring
- [ ] **Frontend Integration**: Next.js backend calls

---

## Development Workflow

### Setup Commands:
```bash
# Install dependencies
poetry install

# Start development services
docker-compose up -d redis postgres

# Run database migrations  
poetry run alembic upgrade head

# Start development server
poetry run uvicorn app.main:app --reload

# Run tests
poetry run pytest

# Format code
poetry run black .
poetry run ruff . --fix
```

### Database Operations:
```bash
# Create new migration
poetry run alembic revision --autogenerate -m "Description"

# Apply migrations
poetry run alembic upgrade head

# Check migration status
poetry run alembic current
```

---

## External Dependencies

### Required Services:
- **PostgreSQL 14+**: Primary database with pgvector extension
- **Redis 6+**: Rate limiting and caching
- **OpenAI API**: GPT-4 and text-embedding-3-small models

### API Integrations:
- **Strava API**: OAuth + activity data synchronization
- **WHOOP API**: OAuth + health metrics (V1/V2 compatibility)
- **Neon Database**: Production PostgreSQL hosting

---

## Phase 3: Rate Limiting Infrastructure ✅ COMPLETED

### Overview
Implemented comprehensive Redis-based rate limiting system with multiple strategies to replace existing Next.js serverless limitations while maintaining current 5 queries/day constraint for unauthenticated users.

### Components Created

#### 3.1 Redis Configuration (`app/config/redis.py`)
- **Purpose**: Async Redis connection management for rate limiting backend
- **Features**: Connection pooling, health checks, graceful shutdown
- **Architecture**: Singleton pattern with Redis client factory
- **Integration**: Used by rate limiting service for persistent counters

#### 3.2 Rate Limiting Service (`app/services/rate_limiting/service.py`)
- **Purpose**: Multi-strategy rate limiting (IP, User, Bypass tokens)
- **Core Functions**:
  - `check_rate_limit()`: Validates requests against configured limits
  - `increment_usage()`: Tracks API consumption with Redis counters
  - `create_bypass_token()`: Admin bypass token generation
- **Strategies**:
  - **IP-based**: 5 queries/day for anonymous users (maintains current limits)
  - **User-based**: Higher limits for authenticated users (future enhancement)
  - **Bypass tokens**: Admin override capability for development/testing
- **Redis Keys**: Structured keys with TTL for automatic cleanup

#### 3.3 FastAPI Middleware (`app/middleware/`)
- **Rate Limiting Middleware** (`rate_limiting.py`):
  - Pre-request validation with early 429 responses
  - IP extraction from various proxy headers (X-Forwarded-For, X-Real-IP)
  - Integration with database sessions for user context
  - Structured error responses with rate limit headers
- **Logging Middleware** (`logging.py`):
  - Request correlation IDs for tracing
  - Structured logging with timing information
  - Rate limit violation logging for monitoring

#### 3.4 Utility Functions (`app/utils/rate_limiting.py`)
- **IP Extraction**: Handles proxy headers, IPv6 normalization
- **Token Management**: Bypass token validation and generation
- **Rate Limit Headers**: Standard HTTP rate limiting headers
- **Error Responses**: Consistent 429 Too Many Requests formatting

#### 3.5 System Router (`app/routers/system.py`)
- **Health Checks**: `/health` endpoint with database/Redis connectivity
- **Rate Limit Debug**: `/rate-limit/check` for development testing
- **Token Management**: `/rate-limit/bypass` for admin operations
- **System Monitoring**: Performance metrics and status information

#### 3.6 Application Integration (`app/main.py`)
- **Router Organization**: Structured API routes with consistent prefixes
  - `/api/ai/*` - AI Services (Phase 4)
  - `/api/integrations/*` - Strava/WHOOP (Phases 6-7)
  - `/api/analytics/*` - Analytics Dashboard (Phase 8)
  - `/api/system/*` - System Operations
- **Middleware Stack**: Rate limiting → Logging → CORS → Security
- **Error Handling**: Global exception handlers with rate limit context

### Migration Strategy
- **Zero Downtime**: Rate limiting activates after Poetry installation
- **Backward Compatible**: Maintains existing 5 queries/day IP limits
- **Database Integration**: Reuses existing user tables for authenticated limits
- **Monitoring Ready**: Structured logging and health checks for production

### Technical Decisions
- **Redis over In-Memory**: Persistent counters survive application restarts
- **Middleware Pattern**: Early request rejection reduces database load
- **Multi-Strategy Design**: Supports current anonymous + future authenticated users
- **Async Throughout**: Non-blocking Redis operations with connection pooling

### Testing Strategy
```bash
# Start services
docker-compose up -d  # PostgreSQL + Redis

# Install dependencies
poetry install

# Test rate limiting
curl -X GET "http://localhost:8000/api/system/rate-limit/check"

# Health check
curl -X GET "http://localhost:8000/api/system/health"
```

### Next Phase Preparation
- ✅ Rate limiting infrastructure complete
- ✅ Placeholder routers created for all domains
- ✅ System monitoring endpoints ready
- 🎯 **Ready for Phase 4**: OpenAI client and RAG services migration

---

## Phase 4: Core AI Services Migration ✅ COMPLETED

### Overview
Complete migration of AI services from TypeScript to Python, implementing OpenAI client, RAG operations, query processing, and AI trainer evaluation with comprehensive FastAPI endpoints.

### Components Created

#### 4.1 OpenAI Client Service (`app/services/ai/openai_client.py`)
- **Purpose**: Async OpenAI integration for GPT-4 chat and text-embedding-3-small
- **Features**:
  - GPT-4 chat completions with prompt engineering
  - text-embedding-3-small for vector embeddings  
  - Automatic retry with exponential backoff
  - Token usage tracking and cost estimation
  - Comprehensive error handling with tenacity
- **Architecture**: Async client with connection pooling, rate limit handling
- **Integration**: Used by all AI services for OpenAI API calls

#### 4.2 RAG Service Core (`app/services/ai/rag_service.py`)
- **Purpose**: Vector embeddings and similarity search with PostgreSQL pgvector
- **Core Functions**:
  - `embed_document()`: Document chunking and vector storage
  - `similarity_search()`: Cosine similarity search with filtering
  - `get_context_for_query()`: Context retrieval for AI queries
- **Features**:
  - Smart document chunking with overlap (1000 chars, 200 overlap)
  - Duplicate detection with content hashing
  - User access control and document filtering
  - Automatic batch embedding processing
- **Architecture**: Document chunker + vector storage with pgvector integration

#### 4.3 AI Query Processing (`app/services/ai/query_processor.py`)
- **Purpose**: Query processing with context augmentation and response generation
- **Core Functions**:
  - `process_query()`: Full query processing pipeline
  - `_build_comprehensive_context()`: RAG + user data integration
  - `_generate_ai_response()`: GPT-4 response with proper prompting
- **Context Sources**:
  - RAG knowledge base similarity search
  - Recent Strava activities (30 days, 10 activities)
  - WHOOP recovery and sleep data (14 days)
  - User goals and preferences
- **Prompt Engineering**: Specialized prompts for fitness coaching, data analysis, performance insights

#### 4.4 AI Trainer Evaluation (`app/services/ai/trainer_service.py`)
- **Purpose**: Performance analysis and training recommendations
- **Core Analysis**:
  - Performance trends (pace, volume, consistency)
  - Recovery correlation with training load
  - Training phase detection and periodization
  - Risk factor identification
- **Recommendation Engine**:
  - AI-generated training plans with GPT-4
  - Structured action items with priorities
  - Confidence scoring based on data quality
  - Evaluation history tracking
- **Features**: 90-day analysis windows, comparison periods, personalized recommendations

#### 4.5 Comprehensive AI Router (`app/routers/ai.py`)
- **Endpoints Created**: 12 comprehensive endpoints replacing 62+ Next.js routes
- **Chat Services**:
  - `POST /chat/completion` - GPT-4 chat completions
  - `POST /chat/query` - AI query with context augmentation
  - `GET /chat/history` - Query history retrieval
- **Embedding Services**:
  - `POST /embeddings/create` - Text embedding creation
  - `POST /embeddings/documents` - Document embedding with chunking
  - `POST /embeddings/search` - Vector similarity search
  - `GET /embeddings/stats` - Embedding statistics
- **Trainer Services**:
  - `POST /trainer/evaluate` - Comprehensive athlete evaluation
  - `GET /trainer/history` - Evaluation history
- **System Services**:
  - `GET /health` - AI services health check
  - `GET /` - Service information and documentation

#### 4.6 Error Handling & Validation (`app/services/ai/error_handling.py`)
- **Error Categories**: Validation, Authentication, Rate Limit, External API, Database, Processing, System
- **Error Recovery**: Exponential backoff retry, fallback responses, circuit breaker patterns
- **Input Validation**: Query text sanitization, user ID validation, document content validation
- **Structured Errors**: APIError base class with severity levels, error codes, retry guidance
- **Exception Handling**: Decorator pattern for consistent error handling across services

### API Route Migration Summary
**Next.js Routes Replaced** (62+ endpoints consolidated):
- `/api/ai/*` → `/api/ai/chat/*`, `/api/ai/embeddings/*`, `/api/ai/trainer/*`
- `/api/openai/*` → Integrated into AI services
- `/api/chat/*` → `/api/ai/chat/*`
- `/api/rag/*` → `/api/ai/embeddings/*`
- `/api/training/*` → `/api/ai/trainer/*`
- `/api/performance/*` → `/api/ai/trainer/*`

### Data Integration
- **Strava Integration**: Recent activities, pace trends, volume analysis, consistency metrics
- **WHOOP Integration**: Recovery scores, HRV trends, sleep quality, strain correlation
- **RAG Integration**: Knowledge base context, document similarity, personalized responses
- **User Context**: Goals, preferences, historical interactions, evaluation history

### Technical Architecture
- **Async Throughout**: All services built with async/await patterns
- **Service Layer**: Clean separation with dependency injection patterns
- **Error Resilience**: Comprehensive error handling with recovery strategies
- **Type Safety**: Pydantic models for all request/response validation
- **Logging**: Structured logging with correlation IDs and context
- **Rate Limiting**: Integrated with existing rate limiting middleware

### Performance Characteristics
- **Embedding Model**: text-embedding-3-small (1536 dimensions, 8K token limit)
- **Chat Model**: GPT-4 (1000 token responses, temperature 0.7)
- **Context Windows**: Up to 4000 chars combined context (RAG + user data)
- **Chunking Strategy**: 1000 chars with 200 char overlap, minimum 100 chars
- **Similarity Threshold**: 0.7 default, configurable per query

### Testing Strategy
```bash
# Start services
docker-compose up -d  # PostgreSQL + Redis

# Install dependencies
poetry install

# Test AI services
curl -X POST "http://localhost:8000/api/ai/chat/completion" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'

# Test embeddings
curl -X POST "http://localhost:8000/api/ai/embeddings/create" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test embedding"}'

# Health check
curl -X GET "http://localhost:8000/api/ai/health"
```

### Next Phase Preparation
- ✅ Core AI services fully implemented
- ✅ All major Next.js AI routes migrated
- ✅ Comprehensive error handling and validation
- ✅ Health monitoring and service discovery
- 🎯 **Ready for Phase 5**: Authentication & User Management Services

---

This documentation will be updated after each implementation phase to track progress and architectural decisions.

## 2025-09-27 – Frontend/Backend Integration Review

- Validated that the FastAPI service (`backend/app/main.py`) now boots cleanly with the new SQLAlchemy models (`backend/app/models/ai_query.py:1`, `backend/app/models/whoop.py:1`, etc.) and required dependency `greenlet` added in `backend/pyproject.toml:11`.
- Confirmed the AI router provides production-ready endpoints under `/api/ai/*`, but Strava/WHOOP integrations remain placeholders (`backend/app/routers/integrations.py:10`) and analytics routes are still stubs (`backend/app/routers/analytics.py:10`).
- Audited the Next.js API layer (`src/app/api/*`) and found each route still executes legacy TypeScript handlers (for example `src/app/api/strava/sync/weekly/route.ts:1`), with no environment variable or helper pointing to the FastAPI service. The previously created proxy helper was removed, so no front-end requests reach the Python backend yet.
- Because the backend integrations for Strava/WHOOP/Cron pipelines are not implemented, wiring the front-end endpoints to FastAPI would break existing behavior. Migration will continue once those services are delivered in Phases 6–8.
- Added a FastAPI-aware API client with graceful fallback logic (`src/lib/api/config.ts:33`). Client components now attempt FastAPI endpoints first and automatically fall back to the existing Next.js routes when the Python services are not yet implemented. The WHOOP dashboard (`src/app/(main)/whoop-dashboard/page.tsx:1`), data-collection tools (`src/components/features/whoop/DataCollectionTools.tsx:1`), daily sync control (`src/components/features/whoop/DailyFetchControl.tsx:1`), and social media pipeline page (`src/app/(main)/tools/social-media-pipeline/page.tsx:1`) all use the new services. This keeps the UI operational today while routing AI functionality through FastAPI and preparing Strava/WHOOP/Cron flows for the upcoming Python implementations.
