"""
Redis configuration and connection management for rate limiting and caching.
"""

import redis.asyncio as redis
from typing import Optional
import logging

from app.config.settings import settings

logger = logging.getLogger(__name__)


class RedisManager:
    """Redis connection manager with async support."""
    
    def __init__(self):
        self._redis: Optional[redis.Redis] = None
    
    async def connect(self) -> redis.Redis:
        """Create and return Redis connection."""
        if self._redis is None:
            try:
                self._redis = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_keepalive=True,
                    socket_keepalive_options={},
                    health_check_interval=30,
                )
                
                # Test connection
                await self._redis.ping()
                logger.info("Redis connection established successfully")
                
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                raise
        
        return self._redis
    
    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None
            logger.info("Redis connection closed")
    
    async def get_client(self) -> redis.Redis:
        """Get Redis client, creating connection if needed."""
        if self._redis is None:
            await self.connect()
        return self._redis


# Global Redis manager instance
redis_manager = RedisManager()


async def get_redis() -> redis.Redis:
    """Dependency for getting Redis client in FastAPI endpoints."""
    return await redis_manager.get_client()