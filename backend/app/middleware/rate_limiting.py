"""
Rate limiting middleware for FastAPI.
Integrates with the rate limiting service to enforce query limits.
"""

import logging
import time

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.config.database import async_session_factory
from app.utils.rate_limiting import rate_limit_service

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting.
    Maintains compatibility with existing 5 queries/day system.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.rate_limited_paths = {
            "/api/ai/query",
            "/api/ai/query/",
            "/api/ai/trainer/run-cycle",
            "/api/ai/trainer/run-cycle/",
        }
        self.bypass_paths = {
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/system/health",
            # Temporarily bypass trainer endpoints for development
            "/api/ai/trainer/evaluate",
            "/api/ai/trainer/history",
            # Bypass chat endpoints for testing the full flow
            "/api/ai/chat/query",
            "/api/ai/chat/completion",
            "/api/ai/chat/history",
        }

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with rate limiting checks."""

        # Skip rate limiting for certain paths
        if self._should_skip_rate_limiting(request):
            return await call_next(request)

        # Extract identification from request
        ip_address = self._get_client_ip(request)
        user_id = self._get_user_id(request)
        bypass_token = self._get_bypass_token(request)

        # Check rate limits
        async with async_session_factory() as db:
            try:
                rate_limit_result = await rate_limit_service.check_rate_limit(
                    db=db,
                    ip_address=ip_address,
                    user_id=user_id,
                    bypass_token=bypass_token
                )

                # If rate limit exceeded, return 429
                if not rate_limit_result.allowed:
                    return JSONResponse(
                        status_code=429,
                        content={
                            "error": "Rate limit exceeded",
                            "message": rate_limit_result.message,
                            "limit": rate_limit_result.limit,
                            "current_count": rate_limit_result.current_count,
                            "remaining": rate_limit_result.remaining,
                            "reset_date": rate_limit_result.reset_date.isoformat(),
                            "retry_after": "24 hours"
                        },
                        headers={
                            "Retry-After": "86400",  # 24 hours in seconds
                            "X-RateLimit-Limit": str(rate_limit_result.limit),
                            "X-RateLimit-Remaining": str(rate_limit_result.remaining),
                            "X-RateLimit-Reset": rate_limit_result.reset_date.isoformat(),
                        }
                    )

                # Process the request
                start_time = time.time()
                response = await call_next(request)

                # If request was successful, increment usage
                if response.status_code < 400:
                    await rate_limit_service.increment_usage(
                        db=db,
                        ip_address=ip_address,
                        user_id=user_id,
                        bypass_token=bypass_token
                    )

                # Add rate limit headers to response
                response.headers["X-RateLimit-Limit"] = str(rate_limit_result.limit)
                response.headers["X-RateLimit-Remaining"] = str(max(0, rate_limit_result.remaining - 1))
                response.headers["X-RateLimit-Reset"] = rate_limit_result.reset_date.isoformat()

                if rate_limit_result.bypass_used:
                    response.headers["X-RateLimit-Bypass"] = "true"

                # Add processing time
                process_time = time.time() - start_time
                response.headers["X-Process-Time"] = str(process_time)

                return response

            except Exception as e:
                logger.error(f"Rate limiting error: {e}")
                # Don't block requests if rate limiting fails
                return await call_next(request)

    def _should_skip_rate_limiting(self, request: Request) -> bool:
        """Determine if rate limiting should be skipped for this request."""

        path = request.url.path

        # Skip bypass paths
        if path in self.bypass_paths:
            return True

        # Skip non-AI endpoints (for now)
        if not any(path.startswith(prefix) for prefix in ["/api/ai"]):
            return True

        # Skip non-POST requests to AI endpoints (only limit actual queries)
        if path in self.rate_limited_paths and request.method != "POST":
            return True

        return False

    def _get_client_ip(self, request: Request) -> str | None:
        """Extract client IP address from request."""

        # Check for forwarded headers (common in production)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in case of multiple proxies
            return forwarded_for.split(",")[0].strip()

        # Check for real IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

        # Fall back to direct client IP
        if hasattr(request, "client") and request.client:
            return request.client.host

        return None

    def _get_user_id(self, request: Request) -> int | None:
        """Extract user ID from request (when authenticated)."""

        # This will be implemented when we add JWT authentication
        # For now, check if user_id is passed in headers for testing
        user_id_header = request.headers.get("X-User-ID")
        if user_id_header:
            try:
                return int(user_id_header)
            except ValueError:
                pass

        return None

    def _get_bypass_token(self, request: Request) -> str | None:
        """Extract bypass token from request."""

        # Check Authorization header for bypass token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bypass "):
            return auth_header[7:]  # Remove "Bypass " prefix

        # Check X-Bypass-Token header
        bypass_header = request.headers.get("X-Bypass-Token")
        if bypass_header:
            return bypass_header

        # Check query parameter (for debugging)
        if "bypass_token" in request.query_params:
            return request.query_params["bypass_token"]

        return None
