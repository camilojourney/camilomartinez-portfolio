"""Authentication utilities for protected FastAPI endpoints."""

from __future__ import annotations

import secrets
from typing import Optional

from fastapi import HTTPException, Request, status

from app.config.settings import settings


def _extract_bearer_token(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    parts = auth_header.split(" ", 1)
    if len(parts) != 2:
        return None

    scheme, token = parts
    if scheme.lower() != "bearer":
        return None

    token = token.strip()
    return token if token else None


def _get_expected_admin_tokens() -> list[str]:
    values = [
        settings.ADMIN_API_KEY,
        settings.CRON_SECRET,
    ]
    return [value.strip() for value in values if value and value.strip()]


async def verify_admin_request(request: Request) -> str:
    """
    FastAPI dependency for admin-only routes.

    Accepts:
    - Authorization: Bearer <ADMIN_API_KEY>
    - Authorization: Bearer <CRON_SECRET> (for existing automation compatibility)
    """
    expected_tokens = _get_expected_admin_tokens()
    if not expected_tokens:
        if settings.DEBUG:
            return "dev_admin"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin authentication is not configured."
        )

    candidate = _extract_bearer_token(request) or request.headers.get("X-Admin-Token")
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing admin authentication token."
        )

    for expected in expected_tokens:
        if secrets.compare_digest(candidate, expected):
            return "admin_user"

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid admin authentication token."
    )
