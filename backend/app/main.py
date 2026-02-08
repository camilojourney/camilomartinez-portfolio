"""
FastAPI application factory and main entry point.
Consolidates 62+ Next.js API routes into organized FastAPI routers.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
import time

from app.config import settings, init_database, close_database
from app.config.logging_config import configure_logging
from app.middleware.rate_limiting import RateLimitMiddleware
from app.middleware.logging import LoggingMiddleware
# Import all routers
from app.routers.ai import router as ai_router
from app.routers.ai_admin import router as ai_admin_router
from app.routers.integrations import router as integrations_router
from app.routers.analytics import router as analytics_router
from app.routers.system import router as system_router
from app.routers.tools import router as tools_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown events."""
    # Configure logging first
    configure_logging(
        debug=settings.DEBUG,
        json_logs=not settings.DEBUG  # JSON in prod, human-readable in dev
    )
    
    # Startup
    logger.info("Starting Camilo AI Analytics Backend...")
    await init_database()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await close_database()
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    """
    FastAPI application factory.
    Creates and configures the FastAPI app with all middleware and routers.
    """
    
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="""
        High-performance Python FastAPI backend for AI-powered fitness analytics.
        
        **Migrated from 62+ Next.js serverless functions to centralized architecture.**
        
        Key Features:
        - 🤖 AI-powered analytics with OpenAI GPT-4 + RAG
        - 🏃‍♂️ Strava & WHOOP fitness data integration
        - ⚡ Async operations with SQLAlchemy 2.0+
        - 🛡️ Redis-based rate limiting (5 queries/day)
        - 🔍 Vector search with PostgreSQL pgvector
        - 🚀 Production-ready with comprehensive monitoring
        """,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
        debug=settings.DEBUG,
    )
    
    # Security middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.trusted_hosts_list
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Custom middleware
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(LoggingMiddleware)
    
    # Add timing middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
    
    # Include routers (organized by domain)
    app.include_router(
        ai_router,
        prefix="/api/ai",
        tags=["AI & Analytics"]
    )

    app.include_router(
        ai_admin_router,
        tags=["AI Admin (HITL)"]
    )

    app.include_router(
        integrations_router,
        prefix="/api/integrations",
        tags=["External Integrations"]
    )
    
    app.include_router(
        analytics_router,
        prefix="/api/analytics",
        tags=["Data Analytics"]
    )
    
    app.include_router(
        system_router,
        prefix="/api/system",
        tags=["System Operations"]
    )
    
    app.include_router(
        tools_router,
        prefix="/api/tools",
        tags=["Productivity Tools"]
    )
    
    # Root endpoint
    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "message": "Camilo AI Analytics Backend",
            "version": settings.VERSION,
            "status": "operational",
            "docs": "/docs",
            "endpoints": {
                "ai": "/api/ai",
                "integrations": "/api/integrations",
                "analytics": "/api/analytics", 
                "system": "/api/system",
                "tools": "/api/tools"
            }
        }
    
    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Simple health check endpoint."""
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": settings.VERSION
        }
    
    return app


# Create the app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
