"""
Strava integration models for activities, users, and data synchronization.
Mirrors the existing strava_users and strava_runs tables.
"""

from sqlalchemy import Column, Integer, BigInteger, String, DateTime, Float, Text, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime

from app.config.database import Base


class StravaUser(Base):
    """Strava user profile and OAuth token storage."""
    __tablename__ = "strava_users"

    id = Column(BigInteger, primary_key=True)  # Strava athlete ID
    username = Column(String(255))
    firstname = Column(String(255))
    lastname = Column(String(255))
    email = Column(String(255))
    
    # OAuth tokens
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_expires_at = Column(DateTime(timezone=True))
    
    # Profile info
    profile_picture_url = Column(Text)
    city = Column(String(255))
    state = Column(String(255))
    country = Column(String(255))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    runs = relationship("StravaRun", back_populates="user", cascade="all, delete-orphan")


class StravaRun(Base):
    """Individual Strava activities (runs, rides, etc.)."""
    __tablename__ = "strava_runs"

    id = Column(BigInteger, primary_key=True)  # Strava activity ID
    user_id = Column(BigInteger, ForeignKey("strava_users.id"), nullable=False)
    
    # Activity basics
    name = Column(String(255))
    sport_type = Column(String(50))  # Run, Ride, Walk, etc.
    start_date = Column(DateTime(timezone=True))
    
    # Performance metrics
    distance_meters = Column(Float)  # Distance in meters
    moving_time_seconds = Column(Integer)  # Moving time
    elapsed_time_seconds = Column(Integer)  # Total elapsed time
    total_elevation_gain = Column(Float)  # Elevation gain in meters
    
    # Heart rate data
    average_heartrate = Column(Float)
    max_heartrate = Column(Float)
    
    # Speed/pace data
    average_speed = Column(Float)  # m/s
    max_speed = Column(Float)  # m/s
    
    # Map data for Astoria Conquest
    summary_polyline = Column(Text)  # Encoded polyline for quick display
    detailed_polyline = Column(Text)  # High-resolution polyline
    
    # Location data
    start_latlng = Column(String(50))  # "lat,lng" format
    end_latlng = Column(String(50))
    
    # Metadata
    manual = Column(Boolean, default=False)
    private = Column(Boolean, default=False)
    flagged = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("StravaUser", back_populates="runs")


# Pydantic models for API serialization

class StravaUserBase(BaseModel):
    """Base Strava user model."""
    username: Optional[str] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class StravaUserCreate(StravaUserBase):
    """Strava user creation model."""
    id: int  # Strava athlete ID
    access_token: str
    refresh_token: str
    token_expires_at: Optional[datetime] = None


class StravaUserResponse(StravaUserBase):
    """Strava user response model."""
    id: int
    profile_picture_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StravaRunBase(BaseModel):
    """Base Strava run model."""
    name: Optional[str] = None
    sport_type: Optional[str] = None
    start_date: Optional[datetime] = None
    distance_meters: Optional[float] = None
    moving_time_seconds: Optional[int] = None
    elapsed_time_seconds: Optional[int] = None
    total_elevation_gain: Optional[float] = None
    average_heartrate: Optional[float] = None
    max_heartrate: Optional[float] = None
    average_speed: Optional[float] = None
    max_speed: Optional[float] = None


class StravaRunCreate(StravaRunBase):
    """Strava run creation model."""
    id: int  # Strava activity ID
    user_id: int
    summary_polyline: Optional[str] = None
    detailed_polyline: Optional[str] = None
    start_latlng: Optional[str] = None
    end_latlng: Optional[str] = None


class StravaRunResponse(StravaRunBase):
    """Strava run response model."""
    id: int
    user_id: int
    summary_polyline: Optional[str] = None
    start_latlng: Optional[str] = None
    end_latlng: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    @validator('distance_meters')
    def format_distance(cls, v):
        """Format distance for display."""
        if v:
            return round(v, 2)
        return v
    
    @validator('average_speed', 'max_speed')
    def format_speed(cls, v):
        """Format speed for display."""
        if v:
            return round(v, 2)
        return v

    class Config:
        from_attributes = True


class StravaRunWithUser(StravaRunResponse):
    """Strava run with user information."""
    user: StravaUserResponse


class StravaSync(BaseModel):
    """Model for sync operation results."""
    user_id: int
    activities_synced: int
    new_activities: int
    updated_activities: int
    errors: List[str] = []
    sync_timestamp: datetime