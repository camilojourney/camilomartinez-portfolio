"""
Structured logging configuration for the backend.

Provides JSON-formatted logs with consistent fields for:
- Request tracing (correlation IDs)
- Performance monitoring (process time)
- Error tracking (error type, message)
"""

import json
import logging
import sys
from datetime import datetime
from typing import Any


class JSONFormatter(logging.Formatter):
    """
    JSON log formatter for structured logging.

    Output format:
    {
        "timestamp": "2026-02-07T12:00:00.000Z",
        "level": "INFO",
        "logger": "app.routers.ai",
        "message": "Request completed",
        "correlation_id": "abc-123",
        "extra": {...}
    }
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add correlation_id if present
        if hasattr(record, "correlation_id"):
            log_data["correlation_id"] = record.correlation_id

        # Add extra fields (from extra= in logger calls)
        extra_fields = {
            k: v for k, v in record.__dict__.items()
            if k not in (
                "name", "msg", "args", "created", "filename", "funcName",
                "levelname", "levelno", "lineno", "module", "msecs",
                "pathname", "process", "processName", "relativeCreated",
                "stack_info", "exc_info", "exc_text", "thread", "threadName",
                "message", "correlation_id"
            )
        }

        if extra_fields:
            log_data["extra"] = extra_fields

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


class DevelopmentFormatter(logging.Formatter):
    """
    Human-readable formatter for development.

    Output format:
    2026-02-07 12:00:00 | INFO | app.routers.ai | Request completed [correlation_id=abc-123]
    """

    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        color = self.COLORS.get(record.levelname, "")

        correlation_id = getattr(record, "correlation_id", None)
        correlation_str = f" [correlation_id={correlation_id}]" if correlation_id else ""

        base_msg = f"{timestamp} | {color}{record.levelname:8}{self.RESET} | {record.name} | {record.getMessage()}{correlation_str}"

        # Add process time if present
        if hasattr(record, "process_time"):
            base_msg += f" ({record.process_time}s)"

        return base_msg


def configure_logging(debug: bool = False, json_logs: bool = True) -> None:
    """
    Configure application logging.

    Args:
        debug: Enable DEBUG level logging
        json_logs: Use JSON format (True for production, False for development)
    """
    level = logging.DEBUG if debug else logging.INFO

    # Create formatter
    if json_logs:
        formatter = JSONFormatter()
    else:
        formatter = DevelopmentFormatter()

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers
    root_logger.handlers.clear()

    # Add stdout handler
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setFormatter(formatter)
    root_logger.addHandler(stdout_handler)

    # Set levels for noisy loggers
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # Log startup
    logging.info(
        "Logging configured",
        extra={
            "debug": debug,
            "json_logs": json_logs,
            "log_level": logging.getLevelName(level)
        }
    )


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the given name.

    Usage:
        from app.config.logging_config import get_logger
        logger = get_logger(__name__)
        logger.info("Processing request", extra={"user_id": "123"})
    """
    return logging.getLogger(name)
