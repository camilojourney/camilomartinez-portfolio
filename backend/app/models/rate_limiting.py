"""
Rate limiting models for IP-based and user-based query limits.
Maintains the existing 5 queries/day limit with bypass capabilities.
"""

from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import INET
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime, date
import ipaddress

from app.config.database import Base


class QuestionRateLimit(Base):
    """IP-based rate limiting for AI queries."""
    __tablename__ = "question_rate_limits"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(INET, nullable=False, unique=True, index=True)
    question_count = Column(Integer, nullable=False, default=0)
    last_reset_date = Column(Date, nullable=False, default=func.current_date())
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserRateLimit(Base):
    """User-based rate limiting for authenticated users."""
    __tablename__ = "user_rate_limits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    question_count = Column(Integer, nullable=False, default=0)
    last_reset_date = Column(Date, nullable=False, default=func.current_date())
    
    # Enhanced limits for authenticated users
    daily_limit = Column(Integer, default=20)  # Higher limit for authenticated users
    is_premium = Column(Boolean, default=False)  # Premium users get unlimited
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RateLimitBypass(Base):
    """Rate limit bypass tokens for internal services."""
    __tablename__ = "rate_limit_bypasses"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(String(500))  # e.g., "AI Trainer Evaluation", "Admin Panel"
    is_active = Column(Boolean, default=True)
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# Pydantic models for API serialization

class RateLimitCheck(BaseModel):
    """Rate limit check request model."""
    ip_address: Optional[str] = None
    user_id: Optional[int] = None
    bypass_token: Optional[str] = None
    
    @validator('ip_address', pre=True)
    def validate_ip_address(cls, v):
        """Validate IP address format."""
        if v:
            try:
                ipaddress.ip_address(v)
                return v
            except ValueError:
                raise ValueError("Invalid IP address format")
        return v


class RateLimitResponse(BaseModel):
    """Rate limit check response model."""
    allowed: bool
    limit: int
    current_count: int
    remaining: int
    reset_date: date
    bypass_used: bool = False
    message: Optional[str] = None


class QuestionRateLimitBase(BaseModel):
    """Base rate limit model for IP addresses."""
    question_count: int = 0
    last_reset_date: date


class QuestionRateLimitCreate(QuestionRateLimitBase):
    """Rate limit creation model."""
    ip_address: str


class QuestionRateLimitResponse(QuestionRateLimitBase):
    """Rate limit response model."""
    id: int
    ip_address: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserRateLimitBase(BaseModel):
    """Base user rate limit model."""
    question_count: int = 0
    last_reset_date: date
    daily_limit: int = 20
    is_premium: bool = False


class UserRateLimitCreate(UserRateLimitBase):
    """User rate limit creation model."""
    user_id: int


class UserRateLimitResponse(UserRateLimitBase):
    """User rate limit response model."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RateLimitBypassBase(BaseModel):
    """Base rate limit bypass model."""
    token: str
    description: Optional[str] = None
    is_active: bool = True


class RateLimitBypassCreate(RateLimitBypassBase):
    """Rate limit bypass creation model."""
    pass


class RateLimitBypassResponse(RateLimitBypassBase):
    """Rate limit bypass response model."""
    id: int
    usage_count: int
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RateLimitStatus(BaseModel):
    """Overall rate limiting status model."""
    ip_limits: Optional[QuestionRateLimitResponse] = None
    user_limits: Optional[UserRateLimitResponse] = None
    current_limit: int
    current_count: int
    remaining: int
    is_bypassed: bool = False
    reset_date: date