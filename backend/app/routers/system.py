"""
System operation routers for health checks, monitoring, and debugging.
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional
import time
from datetime import datetime

from app.config.database import get_db_session
from app.services.rate_limiting import rate_limit_service
from app.utils.rate_limiting import get_client_ip, get_user_id_from_request
from app.config.settings import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "service": "camilo-ai-analytics-backend"
    }


@router.get("/health/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db_session)):
    """Detailed health check with database connectivity."""
    
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "service": "camilo-ai-analytics-backend",
        "checks": {}
    }
    
    # Database connectivity check
    try:
        # Simple query to test database
        await db.execute("SELECT 1")
        health_data["checks"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_data["status"] = "unhealthy"
        health_data["checks"]["database"] = {
            "status": "unhealthy", 
            "message": f"Database connection failed: {str(e)}"
        }
    
    # Redis connectivity check (if configured)
    try:
        from app.config.redis import get_redis
        redis_client = await get_redis()
        await redis_client.ping()
        health_data["checks"]["redis"] = {
            "status": "healthy",
            "message": "Redis connection successful"
        }
    except Exception as e:
        health_data["checks"]["redis"] = {
            "status": "degraded",
            "message": f"Redis connection failed: {str(e)} (non-critical)"
        }
    
    return health_data


@router.get("/status")
async def system_status():
    """System status information."""
    return {
        "service": "camilo-ai-analytics-backend",
        "version": settings.VERSION,
        "environment": "development" if settings.DEBUG else "production",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": "N/A",  # TODO: Track actual uptime
        "features": {
            "rate_limiting": True,
            "ai_services": False,  # Will be True when implemented
            "strava_integration": False,  # Will be True when implemented
            "whoop_integration": False,  # Will be True when implemented
            "authentication": False  # Will be True when implemented
        }
    }


@router.get("/debug/rate-limit")
async def debug_rate_limit(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Debug endpoint to check rate limit status."""
    
    ip_address = get_client_ip(request)
    user_id = get_user_id_from_request(request)
    
    # Get current rate limit status
    status = await rate_limit_service.get_rate_limit_status(
        db=db,
        ip_address=ip_address,
        user_id=user_id
    )
    
    return {
        "ip_address": ip_address,
        "user_id": user_id,
        "rate_limit_status": {
            "current_limit": status.current_limit,
            "current_count": status.current_count,
            "remaining": status.remaining,
            "reset_date": status.reset_date.isoformat(),
            "is_bypassed": status.is_bypassed
        },
        "ip_limits": {
            "question_count": status.ip_limits.question_count if status.ip_limits else 0,
            "last_reset_date": status.ip_limits.last_reset_date.isoformat() if status.ip_limits else None
        } if status.ip_limits else None,
        "user_limits": {
            "question_count": status.user_limits.question_count if status.user_limits else 0,
            "daily_limit": status.user_limits.daily_limit if status.user_limits else None,
            "is_premium": status.user_limits.is_premium if status.user_limits else False,
            "last_reset_date": status.user_limits.last_reset_date.isoformat() if status.user_limits else None
        } if status.user_limits else None
    }


@router.post("/debug/test-rate-limit")
async def test_rate_limit(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Test rate limiting by simulating an AI query."""
    
    ip_address = get_client_ip(request)
    user_id = get_user_id_from_request(request)
    
    # Check rate limit
    rate_limit_result = await rate_limit_service.check_rate_limit(
        db=db,
        ip_address=ip_address,
        user_id=user_id
    )
    
    if not rate_limit_result.allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": rate_limit_result.message,
                "limit": rate_limit_result.limit,
                "current_count": rate_limit_result.current_count,
                "remaining": rate_limit_result.remaining,
                "reset_date": rate_limit_result.reset_date.isoformat()
            }
        )
    
    # Increment usage (simulate successful query)
    await rate_limit_service.increment_usage(
        db=db,
        ip_address=ip_address,
        user_id=user_id
    )
    
    return {
        "message": "Rate limit test successful",
        "ip_address": ip_address,
        "user_id": user_id,
        "rate_limit_info": {
            "limit": rate_limit_result.limit,
            "count_before": rate_limit_result.current_count,
            "count_after": rate_limit_result.current_count + 1,
            "remaining": rate_limit_result.remaining - 1,
            "reset_date": rate_limit_result.reset_date.isoformat()
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/debug/create-bypass-token")
async def create_bypass_token(
    description: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new bypass token for testing. (Remove in production!)"""
    
    # TODO: Add authentication check for admin users
    
    bypass = await rate_limit_service.create_bypass_token(
        db=db,
        description=f"Test bypass: {description}"
    )
    
    return {
        "message": "Bypass token created successfully",
        "token": bypass.token,
        "description": bypass.description,
        "created_at": bypass.created_at.isoformat(),
        "usage_instructions": {
            "header": f"Authorization: Bypass {bypass.token}",
            "alternative": f"X-Bypass-Token: {bypass.token}"
        }
    }