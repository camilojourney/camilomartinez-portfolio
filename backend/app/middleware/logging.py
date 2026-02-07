"""
Logging middleware for request/response tracking and debugging.
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging
import time
import json
from typing import Dict, Any
import uuid

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive logging middleware for API requests and responses.
    Includes correlation IDs, timing, and structured logging.
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.sensitive_headers = {
            "authorization",
            "x-api-key", 
            "x-bypass-token",
            "cookie",
            "set-cookie"
        }
        self.sensitive_params = {
            "password",
            "token",
            "secret",
            "key"
        }
    
    async def dispatch(self, request: Request, call_next):
        """Process request with comprehensive logging."""
        
        # Use existing X-Request-ID or generate new correlation ID
        correlation_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        
        # Start timing
        start_time = time.time()
        
        # Log request
        request_data = self._build_request_log(request, correlation_id)
        logger.info("Request started", extra=request_data)
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate timing
            process_time = time.time() - start_time
            
            # Log response
            response_data = self._build_response_log(
                request, response, correlation_id, process_time
            )
            
            # Add tracing headers to response
            response.headers["X-Request-ID"] = correlation_id
            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Process-Time"] = f"{process_time:.4f}"
            
            # Log based on status code
            if response.status_code >= 500:
                logger.error("Request failed", extra=response_data)
            elif response.status_code >= 400:
                logger.warning("Request error", extra=response_data)
            else:
                logger.info("Request completed", extra=response_data)
            
            return response
            
        except Exception as e:
            # Calculate timing
            process_time = time.time() - start_time
            
            # Log exception
            error_data = self._build_error_log(
                request, e, correlation_id, process_time
            )
            logger.error("Request exception", extra=error_data, exc_info=True)
            
            # Re-raise the exception
            raise
    
    def _build_request_log(self, request: Request, correlation_id: str) -> Dict[str, Any]:
        """Build structured request log data."""
        
        return {
            "event": "request_started",
            "correlation_id": correlation_id,
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": self._filter_sensitive_data(dict(request.headers)),
            "client_ip": self._get_client_ip(request),
            "user_agent": request.headers.get("user-agent"),
            "timestamp": time.time()
        }
    
    def _build_response_log(
        self, 
        request: Request, 
        response, 
        correlation_id: str, 
        process_time: float
    ) -> Dict[str, Any]:
        """Build structured response log data."""
        
        return {
            "event": "request_completed",
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time": round(process_time, 4),
            "response_headers": self._filter_sensitive_data(dict(response.headers)),
            "client_ip": self._get_client_ip(request),
            "timestamp": time.time()
        }
    
    def _build_error_log(
        self, 
        request: Request, 
        error: Exception, 
        correlation_id: str, 
        process_time: float
    ) -> Dict[str, Any]:
        """Build structured error log data."""
        
        return {
            "event": "request_error",
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "process_time": round(process_time, 4),
            "client_ip": self._get_client_ip(request),
            "timestamp": time.time()
        }
    
    def _filter_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Filter out sensitive information from logs."""
        
        filtered = {}
        for key, value in data.items():
            key_lower = key.lower()
            
            if key_lower in self.sensitive_headers:
                filtered[key] = "[REDACTED]"
            elif any(sensitive in key_lower for sensitive in self.sensitive_params):
                filtered[key] = "[REDACTED]"
            else:
                filtered[key] = value
        
        return filtered
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address."""
        
        # Check forwarded headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fall back to direct client
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"