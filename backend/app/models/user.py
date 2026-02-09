"""
User models for authentication and user management.
Supports both application users and OAuth-connected external users.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.config.database import Base


class User(Base):
    """Application user model for authentication."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    first_name = Column(String(255))
    last_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    hashed_password = Column(String(255))

    # OAuth tokens (can be null if using password auth)
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expires_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# Pydantic models for API serialization

class UserBase(BaseModel):
    """Base user model with common fields."""
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    is_active: bool = True


class UserCreate(UserBase):
    """User creation model."""
    password: str


class UserUpdate(BaseModel):
    """User update model."""
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    is_active: bool | None = None
    password: str | None = None


class UserResponse(UserBase):
    """User response model (excludes sensitive data)."""
    id: int
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    """User model including hashed password (for internal use)."""
    hashed_password: str
