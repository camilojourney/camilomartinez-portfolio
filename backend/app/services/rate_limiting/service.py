"""
Rate limiting service implementation with Redis backend.
Supports IP-based, user-based, and bypass token strategies.
"""

import redis.asyncio as redis
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any
import json
import ipaddress
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.config.redis import get_redis
from app.config.settings import settings
from app.models.rate_limiting import (
    QuestionRateLimit, 
    UserRateLimit, 
    RateLimitBypass,
    RateLimitResponse,
    RateLimitStatus
)

logger = logging.getLogger(__name__)


class RateLimitService:
    """
    Comprehensive rate limiting service with multiple strategies.
    Maintains compatibility with existing 5 queries/day IP-based system.
    """
    
    def __init__(self):
        self.default_ip_limit = settings.RATE_LIMIT_DEFAULT  # 5
        self.default_user_limit = 20  # Higher for authenticated users
        self.premium_unlimited = 9999  # High limit for premium users
        self.window_seconds = settings.RATE_LIMIT_WINDOW  # 24 hours
    
    async def check_rate_limit(
        self,
        db: AsyncSession,
        ip_address: Optional[str] = None,
        user_id: Optional[int] = None,
        bypass_token: Optional[str] = None
    ) -> RateLimitResponse:
        """
        Check if request is within rate limits.
        Priority: bypass_token > user_id > ip_address
        """
        
        # Check bypass token first
        if bypass_token:
            bypass_result = await self._check_bypass_token(db, bypass_token)
            if bypass_result.allowed:
                return bypass_result
        
        # Check user-based limits (authenticated users)
        if user_id:
            return await self._check_user_limit(db, user_id)
        
        # Fall back to IP-based limits (anonymous users)
        if ip_address:
            return await self._check_ip_limit(db, ip_address)
        
        # No identification provided - deny
        return RateLimitResponse(
            allowed=False,
            limit=0,
            current_count=0,
            remaining=0,
            reset_date=date.today(),
            message="No identification provided for rate limiting"
        )
    
    async def increment_usage(
        self,
        db: AsyncSession,
        ip_address: Optional[str] = None,
        user_id: Optional[int] = None,
        bypass_token: Optional[str] = None
    ) -> bool:
        """
        Increment usage counter after successful request.
        Returns True if increment was successful.
        """
        
        # Update bypass token usage
        if bypass_token:
            await self._increment_bypass_usage(db, bypass_token)
            return True
        
        # Update user usage
        if user_id:
            return await self._increment_user_usage(db, user_id)
        
        # Update IP usage
        if ip_address:
            return await self._increment_ip_usage(db, ip_address)
        
        return False
    
    async def _check_bypass_token(
        self, 
        db: AsyncSession, 
        token: str
    ) -> RateLimitResponse:
        """Check if bypass token is valid."""
        
        query = select(RateLimitBypass).where(
            RateLimitBypass.token == token,
            RateLimitBypass.is_active == True
        )
        result = await db.execute(query)
        bypass = result.scalar_one_or_none()
        
        if bypass:
            return RateLimitResponse(
                allowed=True,
                limit=self.premium_unlimited,
                current_count=0,
                remaining=self.premium_unlimited,
                reset_date=date.today(),
                bypass_used=True,
                message=f"Bypass token used: {bypass.description}"
            )
        
        return RateLimitResponse(
            allowed=False,
            limit=0,
            current_count=0,
            remaining=0,
            reset_date=date.today(),
            message="Invalid bypass token"
        )
    
    async def _check_user_limit(
        self, 
        db: AsyncSession, 
        user_id: int
    ) -> RateLimitResponse:
        """Check user-based rate limits."""
        
        today = date.today()
        
        # Get or create user rate limit record
        query = select(UserRateLimit).where(UserRateLimit.user_id == user_id)
        result = await db.execute(query)
        user_limit = result.scalar_one_or_none()
        
        if not user_limit:
            # Create new record
            user_limit = UserRateLimit(
                user_id=user_id,
                question_count=0,
                last_reset_date=today,
                daily_limit=self.default_user_limit
            )
            db.add(user_limit)
            await db.commit()
            await db.refresh(user_limit)
        
        # Reset counter if it's a new day
        if user_limit.last_reset_date < today:
            user_limit.question_count = 0
            user_limit.last_reset_date = today
            await db.commit()
        
        # Check limits
        effective_limit = self.premium_unlimited if user_limit.is_premium else user_limit.daily_limit
        remaining = max(0, effective_limit - user_limit.question_count)
        
        return RateLimitResponse(
            allowed=user_limit.question_count < effective_limit,
            limit=effective_limit,
            current_count=user_limit.question_count,
            remaining=remaining,
            reset_date=today,
            message=f"User limit: {user_limit.question_count}/{effective_limit}"
        )
    
    async def _check_ip_limit(
        self, 
        db: AsyncSession, 
        ip_address: str
    ) -> RateLimitResponse:
        """Check IP-based rate limits (maintains existing 5/day system)."""
        
        try:
            # Validate IP address
            ipaddress.ip_address(ip_address)
        except ValueError:
            return RateLimitResponse(
                allowed=False,
                limit=0,
                current_count=0,
                remaining=0,
                reset_date=date.today(),
                message="Invalid IP address format"
            )
        
        today = date.today()
        
        # Get or create IP rate limit record
        query = select(QuestionRateLimit).where(QuestionRateLimit.ip_address == ip_address)
        result = await db.execute(query)
        ip_limit = result.scalar_one_or_none()
        
        if not ip_limit:
            # Create new record
            ip_limit = QuestionRateLimit(
                ip_address=ip_address,
                question_count=0,
                last_reset_date=today
            )
            db.add(ip_limit)
            await db.commit()
            await db.refresh(ip_limit)
        
        # Reset counter if it's a new day
        if ip_limit.last_reset_date < today:
            ip_limit.question_count = 0
            ip_limit.last_reset_date = today
            await db.commit()
        
        # Check limits
        remaining = max(0, self.default_ip_limit - ip_limit.question_count)
        
        return RateLimitResponse(
            allowed=ip_limit.question_count < self.default_ip_limit,
            limit=self.default_ip_limit,
            current_count=ip_limit.question_count,
            remaining=remaining,
            reset_date=today,
            message=f"IP limit: {ip_limit.question_count}/{self.default_ip_limit}"
        )
    
    async def _increment_bypass_usage(
        self, 
        db: AsyncSession, 
        token: str
    ):
        """Increment bypass token usage counter."""
        
        query = update(RateLimitBypass).where(
            RateLimitBypass.token == token,
            RateLimitBypass.is_active == True
        ).values(
            usage_count=RateLimitBypass.usage_count + 1,
            last_used_at=datetime.utcnow()
        )
        
        await db.execute(query)
        await db.commit()
    
    async def _increment_user_usage(
        self, 
        db: AsyncSession, 
        user_id: int
    ) -> bool:
        """Increment user usage counter."""
        
        query = update(UserRateLimit).where(
            UserRateLimit.user_id == user_id
        ).values(
            question_count=UserRateLimit.question_count + 1
        )
        
        result = await db.execute(query)
        await db.commit()
        return result.rowcount > 0
    
    async def _increment_ip_usage(
        self, 
        db: AsyncSession, 
        ip_address: str
    ) -> bool:
        """Increment IP usage counter."""
        
        query = update(QuestionRateLimit).where(
            QuestionRateLimit.ip_address == ip_address
        ).values(
            question_count=QuestionRateLimit.question_count + 1
        )
        
        result = await db.execute(query)
        await db.commit()
        return result.rowcount > 0
    
    async def get_rate_limit_status(
        self,
        db: AsyncSession,
        ip_address: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> RateLimitStatus:
        """Get comprehensive rate limit status for debugging/monitoring."""
        
        status = RateLimitStatus(
            current_limit=self.default_ip_limit,
            current_count=0,
            remaining=self.default_ip_limit,
            reset_date=date.today()
        )
        
        if user_id:
            query = select(UserRateLimit).where(UserRateLimit.user_id == user_id)
            result = await db.execute(query)
            user_limit = result.scalar_one_or_none()
            
            if user_limit:
                effective_limit = self.premium_unlimited if user_limit.is_premium else user_limit.daily_limit
                status.user_limits = user_limit
                status.current_limit = effective_limit
                status.current_count = user_limit.question_count
                status.remaining = max(0, effective_limit - user_limit.question_count)
        
        if ip_address:
            query = select(QuestionRateLimit).where(QuestionRateLimit.ip_address == ip_address)
            result = await db.execute(query)
            ip_limit = result.scalar_one_or_none()
            
            if ip_limit:
                status.ip_limits = ip_limit
                if not user_id:  # Only use IP limits if no user
                    status.current_limit = self.default_ip_limit
                    status.current_count = ip_limit.question_count
                    status.remaining = max(0, self.default_ip_limit - ip_limit.question_count)
        
        return status
    
    async def create_bypass_token(
        self,
        db: AsyncSession,
        description: str,
        token: Optional[str] = None
    ) -> RateLimitBypass:
        """Create a new bypass token for internal services."""
        
        if not token:
            import secrets
            token = f"bypass_{secrets.token_urlsafe(32)}"
        
        bypass = RateLimitBypass(
            token=token,
            description=description,
            is_active=True
        )
        
        db.add(bypass)
        await db.commit()
        await db.refresh(bypass)
        
        logger.info(f"Created bypass token: {description}")
        return bypass


# Global rate limiting service instance
rate_limit_service = RateLimitService()