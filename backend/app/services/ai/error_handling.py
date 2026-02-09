"""
Error handling utilities for AI services.
Comprehensive exception handling, validation, and recovery patterns.
"""

import logging
import traceback
from datetime import datetime
from enum import Enum
from functools import wraps
from typing import Any

import openai
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ErrorSeverity(Enum):
    """Error severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    """Error category classifications."""
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    RATE_LIMIT = "rate_limit"
    EXTERNAL_API = "external_api"
    DATABASE = "database"
    PROCESSING = "processing"
    SYSTEM = "system"


class ErrorResponse(BaseModel):
    """Standardized error response model."""
    error: bool = True
    error_code: str
    error_category: ErrorCategory
    message: str
    details: dict[str, Any] | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: str | None = None
    retry_after: int | None = None  # Seconds to wait before retry


class APIError(Exception):
    """Base exception for API errors with structured information."""

    def __init__(
        self,
        message: str,
        error_code: str,
        category: ErrorCategory,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        details: dict[str, Any] | None = None,
        retry_after: int | None = None
    ):
        self.message = message
        self.error_code = error_code
        self.category = category
        self.severity = severity
        self.details = details or {}
        self.retry_after = retry_after
        super().__init__(message)


class ValidationError(APIError):
    """Validation-specific error."""

    def __init__(self, message: str, field: str = None, value: Any = None):
        details = {}
        if field:
            details["field"] = field
        if value is not None:
            details["invalid_value"] = str(value)

        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            category=ErrorCategory.VALIDATION,
            severity=ErrorSeverity.LOW,
            details=details
        )


class OpenAIServiceError(APIError):
    """OpenAI service-specific errors."""

    def __init__(
        self,
        message: str,
        openai_error: Exception | None = None,
        retry_after: int | None = None
    ):
        details = {}
        if openai_error:
            details["openai_error_type"] = type(openai_error).__name__
            details["openai_message"] = str(openai_error)

        # Determine error code based on OpenAI error type
        error_code = "OPENAI_ERROR"
        severity = ErrorSeverity.MEDIUM

        if isinstance(openai_error, openai.AuthenticationError):
            error_code = "OPENAI_AUTH_ERROR"
            severity = ErrorSeverity.HIGH
        elif isinstance(openai_error, openai.RateLimitError):
            error_code = "OPENAI_RATE_LIMIT"
            severity = ErrorSeverity.LOW
            retry_after = retry_after or 60
        elif isinstance(openai_error, openai.APITimeoutError):
            error_code = "OPENAI_TIMEOUT"
            retry_after = retry_after or 30
        elif isinstance(openai_error, openai.BadRequestError):
            error_code = "OPENAI_BAD_REQUEST"
            severity = ErrorSeverity.LOW

        super().__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.EXTERNAL_API,
            severity=severity,
            details=details,
            retry_after=retry_after
        )


class DatabaseError(APIError):
    """Database operation errors."""

    def __init__(self, message: str, operation: str = None, table: str = None):
        details = {}
        if operation:
            details["operation"] = operation
        if table:
            details["table"] = table

        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            category=ErrorCategory.DATABASE,
            severity=ErrorSeverity.HIGH,
            details=details
        )


class RateLimitError(APIError):
    """Rate limiting errors."""

    def __init__(self, message: str, retry_after: int = 3600):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_EXCEEDED",
            category=ErrorCategory.RATE_LIMIT,
            severity=ErrorSeverity.LOW,
            retry_after=retry_after,
            details={"limit_type": "api_calls"}
        )


class ErrorHandler:
    """
    Centralized error handling and logging service.
    """

    def __init__(self):
        """Initialize error handler."""
        self.error_counts = {}

    def log_error(
        self,
        error: Exception,
        context: dict[str, Any] | None = None,
        request_id: str | None = None
    ) -> None:
        """
        Log error with context and tracking.

        Args:
            error: Exception to log
            context: Additional context information
            request_id: Request identifier for tracing
        """
        error_type = type(error).__name__

        # Track error frequency
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1

        # Prepare log context
        log_context = {
            "error_type": error_type,
            "error_message": str(error),
            "request_id": request_id,
            "error_count": self.error_counts[error_type]
        }

        if context:
            log_context.update(context)

        # Include stack trace for unexpected errors
        if not isinstance(error, APIError):
            log_context["stack_trace"] = traceback.format_exc()

        # Determine log level based on error type
        if isinstance(error, APIError):
            if error.severity in [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]:
                logger.error("API Error", extra=log_context)
            elif error.severity == ErrorSeverity.MEDIUM:
                logger.warning("API Warning", extra=log_context)
            else:
                logger.info("API Info", extra=log_context)
        else:
            logger.error("Unexpected Error", extra=log_context)

    def convert_to_http_exception(
        self,
        error: Exception,
        request_id: str | None = None
    ) -> HTTPException:
        """
        Convert various error types to FastAPI HTTPException.

        Args:
            error: Exception to convert
            request_id: Request identifier

        Returns:
            HTTPException with appropriate status code and details
        """
        # Log the error
        self.log_error(error, request_id=request_id)

        if isinstance(error, APIError):
            # Convert APIError to HTTPException
            status_code = self._get_http_status_code(error)

            error_response = ErrorResponse(
                error_code=error.error_code,
                error_category=error.category,
                message=error.message,
                details=error.details,
                request_id=request_id,
                retry_after=error.retry_after
            )

            return HTTPException(
                status_code=status_code,
                detail=error_response.dict(),
                headers={"Retry-After": str(error.retry_after)} if error.retry_after else None
            )

        # Handle known external exceptions
        elif isinstance(error, openai.OpenAIError):
            openai_error = OpenAIServiceError(
                message=f"OpenAI service error: {str(error)}",
                openai_error=error
            )
            return self.convert_to_http_exception(openai_error, request_id)

        # Handle validation errors from Pydantic
        elif hasattr(error, 'errors'):  # Pydantic ValidationError
            validation_error = ValidationError(
                message="Request validation failed",
                details={"validation_errors": error.errors()}
            )
            return self.convert_to_http_exception(validation_error, request_id)

        # Generic error handling
        else:
            generic_error = APIError(
                message="An unexpected error occurred",
                error_code="INTERNAL_ERROR",
                category=ErrorCategory.SYSTEM,
                severity=ErrorSeverity.HIGH,
                details={"original_error": str(error)}
            )
            return self.convert_to_http_exception(generic_error, request_id)

    def _get_http_status_code(self, error: APIError) -> int:
        """Map APIError to appropriate HTTP status code."""
        category_mapping = {
            ErrorCategory.VALIDATION: status.HTTP_400_BAD_REQUEST,
            ErrorCategory.AUTHENTICATION: status.HTTP_401_UNAUTHORIZED,
            ErrorCategory.AUTHORIZATION: status.HTTP_403_FORBIDDEN,
            ErrorCategory.RATE_LIMIT: status.HTTP_429_TOO_MANY_REQUESTS,
            ErrorCategory.EXTERNAL_API: status.HTTP_502_BAD_GATEWAY,
            ErrorCategory.DATABASE: status.HTTP_503_SERVICE_UNAVAILABLE,
            ErrorCategory.PROCESSING: status.HTTP_422_UNPROCESSABLE_ENTITY,
            ErrorCategory.SYSTEM: status.HTTP_500_INTERNAL_SERVER_ERROR,
        }

        return category_mapping.get(error.category, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_error_statistics(self) -> dict[str, Any]:
        """Get error occurrence statistics."""
        total_errors = sum(self.error_counts.values())

        return {
            "total_errors": total_errors,
            "error_types": dict(self.error_counts),
            "most_common_error": max(self.error_counts.items(), key=lambda x: x[1])[0] if self.error_counts else None
        }


# Global error handler instance
error_handler = ErrorHandler()


def handle_exceptions(operation_name: str = "operation"):
    """
    Decorator for consistent exception handling across AI services.

    Args:
        operation_name: Name of the operation for logging context
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                # Add operation context
                context = {
                    "operation": operation_name,
                    "function": func.__name__,
                    "args_count": len(args),
                    "kwargs_keys": list(kwargs.keys())
                }

                # Convert to HTTP exception
                http_exception = error_handler.convert_to_http_exception(e)
                logger.exception("Unhandled exception", extra={"context": context})
                raise http_exception from e

        return wrapper
    return decorator


class InputValidator:
    """
    Advanced input validation utilities for AI services.
    """

    @staticmethod
    def validate_query_text(text: str, max_length: int = 5000) -> str:
        """
        Validate and sanitize query text.

        Args:
            text: Input text to validate
            max_length: Maximum allowed length

        Returns:
            Sanitized text

        Raises:
            ValidationError: For invalid input
        """
        if not text or not text.strip():
            raise ValidationError("Query text cannot be empty", field="text")

        text = text.strip()

        if len(text) > max_length:
            raise ValidationError(
                f"Query text exceeds maximum length of {max_length} characters",
                field="text",
                value=f"{len(text)} characters"
            )

        # Remove potentially harmful characters
        forbidden_chars = ['\x00', '\x01', '\x02', '\x03', '\x04', '\x05']
        for char in forbidden_chars:
            if char in text:
                text = text.replace(char, '')

        return text

    @staticmethod
    def validate_user_id(user_id: str | None) -> str | None:
        """
        Validate user ID format.

        Args:
            user_id: User identifier to validate

        Returns:
            Validated user ID or None

        Raises:
            ValidationError: For invalid user ID
        """
        if user_id is None:
            return None

        if not isinstance(user_id, str):
            raise ValidationError("User ID must be a string", field="user_id", value=type(user_id))

        user_id = user_id.strip()

        if len(user_id) < 1:
            raise ValidationError("User ID cannot be empty", field="user_id")

        if len(user_id) > 100:
            raise ValidationError("User ID too long", field="user_id", value=len(user_id))

        # Basic format validation (alphanumeric, hyphens, underscores)
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', user_id):
            raise ValidationError(
                "User ID contains invalid characters",
                field="user_id",
                value=user_id
            )

        return user_id

    @staticmethod
    def validate_document_content(content: str, min_length: int = 10, max_length: int = 100000) -> str:
        """
        Validate document content for embedding.

        Args:
            content: Document content to validate
            min_length: Minimum content length
            max_length: Maximum content length

        Returns:
            Validated content

        Raises:
            ValidationError: For invalid content
        """
        if not content or not content.strip():
            raise ValidationError("Document content cannot be empty", field="content")

        content = content.strip()

        if len(content) < min_length:
            raise ValidationError(
                f"Document content too short (minimum {min_length} characters)",
                field="content",
                value=f"{len(content)} characters"
            )

        if len(content) > max_length:
            raise ValidationError(
                f"Document content too long (maximum {max_length} characters)",
                field="content",
                value=f"{len(content)} characters"
            )

        return content

    @staticmethod
    def validate_analysis_period(days: int) -> int:
        """
        Validate analysis period for trainer evaluations.

        Args:
            days: Number of days for analysis

        Returns:
            Validated days

        Raises:
            ValidationError: For invalid period
        """
        if not isinstance(days, int):
            raise ValidationError("Analysis period must be an integer", field="analysis_period", value=type(days))

        if days < 7:
            raise ValidationError("Analysis period must be at least 7 days", field="analysis_period", value=days)

        if days > 365:
            raise ValidationError("Analysis period cannot exceed 365 days", field="analysis_period", value=days)

        return days


class RecoveryStrategy:
    """
    Recovery strategies for failed AI operations.
    """

    @staticmethod
    async def retry_with_backoff(
        operation,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        backoff_factor: float = 2.0
    ):
        """
        Retry operation with exponential backoff.

        Args:
            operation: Async operation to retry
            max_retries: Maximum number of retry attempts
            base_delay: Initial delay in seconds
            max_delay: Maximum delay in seconds
            backoff_factor: Multiplier for delay between retries
        """
        import asyncio

        last_exception = None
        delay = base_delay

        for attempt in range(max_retries + 1):
            try:
                return await operation()
            except Exception as e:
                last_exception = e

                if attempt == max_retries:
                    break

                # Check if error is retryable
                if isinstance(e, APIError):
                    if e.category in [ErrorCategory.VALIDATION, ErrorCategory.AUTHENTICATION]:
                        # Don't retry validation or auth errors
                        break

                logger.warning(f"Operation failed (attempt {attempt + 1}/{max_retries + 1}), retrying in {delay}s: {e}")

                await asyncio.sleep(delay)
                delay = min(delay * backoff_factor, max_delay)

        # All retries exhausted
        raise last_exception

    @staticmethod
    def get_fallback_response(operation_type: str, error: Exception) -> dict[str, Any]:
        """
        Get fallback response for failed operations.

        Args:
            operation_type: Type of operation that failed
            error: The error that occurred

        Returns:
            Fallback response data
        """
        fallback_responses = {
            "chat_completion": {
                "response": "I apologize, but I'm unable to process your request at the moment. Please try again later.",
                "model": "fallback",
                "usage": {"total_tokens": 0},
                "finish_reason": "error"
            },
            "embedding": {
                "embeddings": [],
                "model": "fallback",
                "usage": {"total_tokens": 0}
            },
            "similarity_search": {
                "results": [],
                "matches_found": 0,
                "fallback": True
            },
            "trainer_evaluation": {
                "status": "service_unavailable",
                "message": "AI trainer evaluation is temporarily unavailable",
                "recommendations": ["Please ensure you have sufficient training data and try again later."]
            }
        }

        return fallback_responses.get(operation_type, {
            "status": "error",
            "message": "Service temporarily unavailable",
            "error": str(error)
        })


# Global validator instance
input_validator = InputValidator()
recovery_strategy = RecoveryStrategy()
