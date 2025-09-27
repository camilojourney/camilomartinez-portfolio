"""Database configuration and session management with SQLAlchemy 2.0+ async support."""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
import logging

from .settings import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


# Create async engine with connection pooling
engine = create_async_engine(
    settings.database_url_async,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    pool_size=20,         # Connection pool size
    max_overflow=0,       # Don't allow overflow connections
    pool_pre_ping=True,   # Validate connections before use
    pool_recycle=3600,    # Recycle connections every hour
)

# Create session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting a database session in FastAPI endpoints.
    
    Usage in endpoints:
        async def my_endpoint(db: AsyncSession = Depends(get_db_session)):
            # Use db session here
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_database():
    """Initialize database tables. Call this on app startup."""
    async with engine.begin() as conn:
        # Import all models here to ensure they're registered
        from app.models import user, strava, whoop, ai_query  # noqa: F401
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized")


async def close_database():
    """Close database connections. Call this on app shutdown."""
    await engine.dispose()
    logger.info("Database connections closed")


# Compatibility alias for existing code
get_database_session = get_db_session