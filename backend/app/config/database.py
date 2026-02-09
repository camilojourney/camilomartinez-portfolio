"""Database configuration and session management with SQLAlchemy 2.0+ async support."""

import logging
from collections.abc import AsyncGenerator

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .settings import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


database_url_async = settings.database_url_async

if database_url_async:
    # Create async engine with connection pooling (tuned for Postgres).
    engine = create_async_engine(
        database_url_async,
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
else:
    engine = None
    async_session_factory = None


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting a database session in FastAPI endpoints.

    Usage in endpoints:
        async def my_endpoint(db: AsyncSession = Depends(get_db_session)):
            # Use db session here
    """
    if async_session_factory is None:
        raise HTTPException(status_code=503, detail="Database is not configured for this deployment.")

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
    if engine is None:
        logger.info("DATABASE_URL not set; skipping database initialization.")
        return

    async with engine.begin() as conn:
        # Import all models here to ensure they're registered
        from app.models import ai_query, strava, user, whoop  # noqa: F401

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized")


async def close_database():
    """Close database connections. Call this on app shutdown."""
    if engine is None:
        return
    await engine.dispose()
    logger.info("Database connections closed")


# Compatibility alias for existing code
get_database_session = get_db_session
