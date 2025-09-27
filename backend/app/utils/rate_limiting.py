"""
Utility functions for rate limiting operations.
Includes client IP extraction, bypass token management, and helper functions.
"""

from fastapi import Request, Header, Depends
from typing import Optional, Dict, Any
import ipaddress
import secrets
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> Optional[str]:
    """
    Extract client IP address from FastAPI request.
    Handles various proxy headers and direct connections.
    """
    
    # Priority order for IP extraction
    ip_headers = [
        "x-forwarded-for",      # Most common proxy header
        "x-real-ip",            # Nginx real IP
        "x-client-ip",          # Alternative client IP
        "cf-connecting-ip",     # Cloudflare
        "x-forwarded",          # Standard forwarded
        "forwarded-for",        # Alternative format
        "forwarded"             # RFC 7239
    ]
    
    # Check proxy headers
    for header in ip_headers:
        ip_value = request.headers.get(header)
        if ip_value:
            # Handle comma-separated IPs (multiple proxies)
            first_ip = ip_value.split(",")[0].strip()
            if _is_valid_ip(first_ip):
                return first_ip
    
    # Fall back to direct client connection
    if hasattr(request, "client") and request.client:
        return request.client.host
    
    return None


def get_bypass_token(
    authorization: Optional[str] = Header(None),
    x_bypass_token: Optional[str] = Header(None, alias="X-Bypass-Token")
) -> Optional[str]:
    """
    Extract bypass token from request headers.
    Supports both Authorization: Bypass <token> and X-Bypass-Token formats.
    """
    
    # Check Authorization header
    if authorization and authorization.startswith("Bypass "):
        return authorization[7:]  # Remove "Bypass " prefix
    
    # Check X-Bypass-Token header
    if x_bypass_token:
        return x_bypass_token
    
    return None


def get_user_id_from_request(request: Request) -> Optional[int]:
    """
    Extract user ID from authenticated request.
    This will be enhanced when JWT authentication is implemented.
    """
    
    # For now, check test header
    user_id_header = request.headers.get("x-user-id")
    if user_id_header:
        try:
            return int(user_id_header)
        except ValueError:
            logger.warning(f"Invalid user ID header: {user_id_header}")
            return None
    
    # TODO: Extract from JWT token when authentication is implemented
    # if hasattr(request.state, "user"):
    #     return request.state.user.id
    
    return None


def generate_bypass_token(prefix: str = "bypass") -> str:
    """
    Generate a secure bypass token for internal services.
    
    Args:
        prefix: Token prefix for identification
        
    Returns:
        Secure token string
    """
    
    random_part = secrets.token_urlsafe(32)
    return f"{prefix}_{random_part}"


def format_rate_limit_response(
    allowed: bool,
    limit: int,
    current_count: int,
    remaining: int,
    reset_date,
    message: Optional[str] = None,
    bypass_used: bool = False
) -> Dict[str, Any]:
    """
    Format rate limit response for consistent API responses.
    """
    
    return {
        "allowed": allowed,
        "limit": limit,
        "current_count": current_count,
        "remaining": remaining,
        "reset_date": reset_date.isoformat() if reset_date else None,
        "bypass_used": bypass_used,
        "message": message or ("Request allowed" if allowed else "Rate limit exceeded"),
        "retry_after": "24 hours" if not allowed else None
    }


def create_rate_limit_headers(
    limit: int,
    remaining: int,
    reset_date,
    bypass_used: bool = False
) -> Dict[str, str]:
    """
    Create rate limiting headers for HTTP responses.
    Follows standard rate limiting header conventions.
    """
    
    headers = {
        "X-RateLimit-Limit": str(limit),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": reset_date.isoformat() if reset_date else "",
    }
    
    if bypass_used:
        headers["X-RateLimit-Bypass"] = "true"
    
    if remaining <= 0:
        headers["Retry-After"] = "86400"  # 24 hours in seconds
    
    return headers


def is_rate_limited_path(path: str) -> bool:
    """
    Check if a request path should be rate limited.
    
    Args:
        path: Request path to check
        
    Returns:
        True if path should be rate limited
    """
    
    # Paths that require rate limiting
    rate_limited_paths = {
        "/api/ai/query",
        "/api/ai/query/",
        "/api/ai/trainer/run-cycle", 
        "/api/ai/trainer/run-cycle/",
        "/api/chatbot",
        "/api/chatbot/",
        "/api/chat",
        "/api/chat/"
    }
    
    # Check exact matches
    if path in rate_limited_paths:
        return True
    
    # Check path prefixes
    rate_limited_prefixes = [
        "/api/ai/",
    ]
    
    return any(path.startswith(prefix) for prefix in rate_limited_prefixes)


def should_bypass_rate_limiting(path: str) -> bool:
    """
    Check if a request path should bypass rate limiting entirely.
    
    Args:
        path: Request path to check
        
    Returns:
        True if rate limiting should be bypassed
    """
    
    # Paths that bypass rate limiting
    bypass_paths = {
        "/health",
        "/",
        "/docs",
        "/redoc", 
        "/openapi.json",
        "/api/system/health",
        "/api/system/status"
    }
    
    # Check exact matches
    if path in bypass_paths:
        return True
    
    # Check path prefixes that bypass rate limiting
    bypass_prefixes = [
        "/static/",
        "/assets/",
        "/favicon.ico"
    ]
    
    return any(path.startswith(prefix) for prefix in bypass_prefixes)


def _is_valid_ip(ip_string: str) -> bool:
    """
    Validate IP address format.
    
    Args:
        ip_string: IP address string to validate
        
    Returns:
        True if valid IP address
    """
    
    try:
        ipaddress.ip_address(ip_string)
        return True
    except ValueError:
        return False


def log_rate_limit_event(
    event_type: str,
    ip_address: Optional[str] = None,
    user_id: Optional[int] = None,
    bypass_token: Optional[str] = None,
    limit: Optional[int] = None,
    count: Optional[int] = None,
    **kwargs
):
    """
    Log rate limiting events for monitoring and debugging.
    
    Args:
        event_type: Type of event (check, increment, bypass, etc.)
        ip_address: Client IP address
        user_id: User ID if authenticated
        bypass_token: Bypass token if used (will be redacted)
        limit: Rate limit value
        count: Current count
        **kwargs: Additional data to log
    """
    
    log_data = {
        "event": f"rate_limit_{event_type}",
        "ip_address": ip_address,
        "user_id": user_id,
        "bypass_token": "[REDACTED]" if bypass_token else None,
        "limit": limit,
        "count": count,
        "timestamp": datetime.utcnow().isoformat(),
        **kwargs
    }
    
    # Remove None values
    log_data = {k: v for k, v in log_data.items() if v is not None}
    
    logger.info(f"Rate limiting event: {event_type}", extra=log_data)