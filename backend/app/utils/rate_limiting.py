"""
Utilities and lightweight service stubs for rate limiting operations.

The original implementation relied on a dedicated rate-limiting service module.
To keep the runtime happy without reintroducing that dependency, we expose a
minimal in-memory service here alongside the helper utilities that other
modules expect.
"""

import ipaddress
import logging
import secrets
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from fastapi import Header, Request

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Request helper utilities
# ---------------------------------------------------------------------------


def get_client_ip(request: Request) -> str | None:
    """
    Extract client IP address from FastAPI requests, respecting common proxy
    headers before falling back to the direct client host.
    """

    ip_headers = [
        "x-forwarded-for",
        "x-real-ip",
        "x-client-ip",
        "cf-connecting-ip",
        "x-forwarded",
        "forwarded-for",
        "forwarded",
    ]

    for header in ip_headers:
        ip_value = request.headers.get(header)
        if not ip_value:
            continue
        first_ip = ip_value.split(",")[0].strip()
        if _is_valid_ip(first_ip):
            return first_ip

    if hasattr(request, "client") and request.client:
        return request.client.host

    return None


def get_bypass_token(
    authorization: str | None = Header(None),
    x_bypass_token: str | None = Header(None, alias="X-Bypass-Token"),
) -> str | None:
    """Extract bypass token from supported headers."""

    if authorization and authorization.startswith("Bypass "):
        return authorization[7:]

    if x_bypass_token:
        return x_bypass_token

    return None


def get_user_id_from_request(request: Request) -> int | None:
    """
    Extract user id using the provisional `x-user-id` header that we leverage
    during development. Real authentication will replace this in the future.
    """

    user_id_header = request.headers.get("x-user-id")
    if not user_id_header:
        return None

    try:
        return int(user_id_header)
    except ValueError:
        logger.warning("Invalid user ID header: %s", user_id_header)
        return None


def generate_bypass_token(prefix: str = "bypass") -> str:
    """Generate a secure bypass token identifier."""

    random_part = secrets.token_urlsafe(32)
    return f"{prefix}_{random_part}"


def format_rate_limit_response(
    allowed: bool,
    limit: int,
    current_count: int,
    remaining: int,
    reset_date: datetime,
    message: str | None = None,
    bypass_used: bool = False,
) -> dict[str, Any]:
    """Return a consistent response payload for rate limit checks."""

    return {
        "allowed": allowed,
        "limit": limit,
        "current_count": current_count,
        "remaining": remaining,
        "reset_date": reset_date.isoformat() if reset_date else None,
        "bypass_used": bypass_used,
        "message": message or ("Request allowed" if allowed else "Rate limit exceeded"),
        "retry_after": "24 hours" if not allowed else None,
    }


def create_rate_limit_headers(
    limit: int,
    remaining: int,
    reset_date: datetime,
    bypass_used: bool = False,
) -> dict[str, str]:
    """Build HTTP headers describing the current rate limit state."""

    headers = {
        "X-RateLimit-Limit": str(limit),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": reset_date.isoformat() if reset_date else "",
    }

    if bypass_used:
        headers["X-RateLimit-Bypass"] = "true"

    if remaining <= 0:
        headers["Retry-After"] = "86400"

    return headers


def is_rate_limited_path(path: str) -> bool:
    """Determine whether the request path should be subject to rate limiting."""

    rate_limited_paths = {
        "/api/ai/query",
        "/api/ai/query/",
        "/api/ai/trainer/run-cycle",
        "/api/ai/trainer/run-cycle/",
        "/api/chatbot",
        "/api/chatbot/",
        "/api/chat",
        "/api/chat/",
    }

    if path in rate_limited_paths:
        return True

    prefixes = ["/api/ai/"]
    return any(path.startswith(prefix) for prefix in prefixes)


def should_bypass_rate_limiting(path: str) -> bool:
    """Return True when the request path should bypass rate limiting entirely."""

    bypass_paths = {
        "/health",
        "/",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/system/health",
        "/api/system/status",
    }

    if path in bypass_paths:
        return True

    bypass_prefixes = ["/static/", "/assets/"]
    return any(path.startswith(prefix) for prefix in bypass_prefixes)


def log_rate_limit_event(
    event_type: str,
    ip_address: str | None = None,
    user_id: int | None = None,
    bypass_token: str | None = None,
    limit: int | None = None,
    count: int | None = None,
    **extra: Any,
) -> None:
    """Convenience wrapper for structured logging of rate limit interactions."""

    payload = {
        "event": f"rate_limit_{event_type}",
        "ip_address": ip_address,
        "user_id": user_id,
        "bypass_token": "[REDACTED]" if bypass_token else None,
        "limit": limit,
        "count": count,
        "timestamp": datetime.utcnow().isoformat(),
        **extra,
    }

    payload = {k: v for k, v in payload.items() if v is not None}
    logger.info("Rate limiting event: %s", event_type, extra=payload)


def _is_valid_ip(ip_string: str) -> bool:
    """Return True when the supplied value is a valid IPv4/IPv6 address."""

    try:
        ipaddress.ip_address(ip_string)
        return True
    except ValueError:
        return False


# ---------------------------------------------------------------------------
# Lightweight in-memory service (no-op rate limiting)
# ---------------------------------------------------------------------------

DEFAULT_DAILY_LIMIT = 100
RESET_WINDOW = timedelta(hours=24)


@dataclass
class RateLimitRecord:
    question_count: int = 0
    daily_limit: int = DEFAULT_DAILY_LIMIT
    is_premium: bool = False
    last_reset_date: datetime = field(default_factory=datetime.utcnow)


@dataclass
class RateLimitResult:
    allowed: bool
    message: str
    limit: int
    current_count: int
    remaining: int
    reset_date: datetime
    bypass_used: bool = False


@dataclass
class RateLimitStatus:
    current_limit: int
    current_count: int
    remaining: int
    reset_date: datetime
    is_bypassed: bool = False
    ip_limits: RateLimitRecord | None = None
    user_limits: RateLimitRecord | None = None


@dataclass
class BypassToken:
    token: str
    description: str
    created_at: datetime = field(default_factory=datetime.utcnow)


class RateLimitService:
    """
    Minimal no-op rate limit service. It satisfies the interface expected by
    the middleware and debug routers but does not persist anything or block
    requests. This keeps the application running without the original service.
    """

    def __init__(self, daily_limit: int = DEFAULT_DAILY_LIMIT):
        self.daily_limit = daily_limit

    async def check_rate_limit(
        self,
        db,  # unused placeholder kept for compatibility
        ip_address: str | None = None,
        user_id: int | None = None,
        bypass_token: str | None = None,
    ) -> RateLimitResult:
        reset_at = datetime.utcnow() + RESET_WINDOW
        message = "Rate limiting currently disabled"
        return RateLimitResult(
            allowed=True,
            message=message,
            limit=self.daily_limit,
            current_count=0,
            remaining=self.daily_limit,
            reset_date=reset_at,
            bypass_used=bool(bypass_token),
        )

    async def increment_usage(
        self,
        db,
        ip_address: str | None = None,
        user_id: int | None = None,
        bypass_token: str | None = None,
    ) -> None:
        return None

    async def get_rate_limit_status(
        self,
        db,
        ip_address: str | None = None,
        user_id: int | None = None,
    ) -> RateLimitStatus:
        reset_at = datetime.utcnow() + RESET_WINDOW
        record = RateLimitRecord(last_reset_date=datetime.utcnow())
        return RateLimitStatus(
            current_limit=self.daily_limit,
            current_count=0,
            remaining=self.daily_limit,
            reset_date=reset_at,
            is_bypassed=False,
            ip_limits=record if ip_address else None,
            user_limits=record if user_id else None,
        )

    async def create_bypass_token(
        self,
        db,
        description: str,
    ) -> BypassToken:
        token = generate_bypass_token(prefix="stub")
        return BypassToken(token=token, description=description)


rate_limit_service = RateLimitService()

__all__ = [
    # Helpers
    "get_client_ip",
    "get_bypass_token",
    "get_user_id_from_request",
    "generate_bypass_token",
    "format_rate_limit_response",
    "create_rate_limit_headers",
    "is_rate_limited_path",
    "should_bypass_rate_limiting",
    "log_rate_limit_event",
    # Service exports
    "rate_limit_service",
    "RateLimitService",
    "RateLimitResult",
    "RateLimitStatus",
    "RateLimitRecord",
    "BypassToken",
]
