"""
WHOOP integration models for health metrics, workouts, sleep, and recovery data.
Supports both V1 (integer IDs) and V2 (UUID IDs) API compatibility.
"""

from sqlalchemy import Column, Integer, BigInteger, String, DateTime, Float, Text, Boolean, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.config.database import Base


class WHOOPUser(Base):
    """WHOOP user profile and OAuth token storage."""
    __tablename__ = "whoop_users"

    id = Column(BigInteger, primary_key=True)  # WHOOP user ID
    email = Column(String(255))
    first_name = Column(String(255))
    last_name = Column(String(255))
    
    # OAuth tokens
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expires_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    cycles = relationship("WHOOPCycle", back_populates="user", cascade="all, delete-orphan")
    sleep_records = relationship("WHOOPSleep", back_populates="user", cascade="all, delete-orphan")
    workouts = relationship("WHOOPWorkout", back_populates="user", cascade="all, delete-orphan")
    recovery_records = relationship("WHOOPRecovery", back_populates="user", cascade="all, delete-orphan")


class WHOOPCycle(Base):
    """Daily physiological cycle data."""
    __tablename__ = "whoop_cycles"

    id = Column(BigInteger, primary_key=True)  # WHOOP cycle ID
    user_id = Column(BigInteger, ForeignKey("whoop_users.id"), nullable=False)
    
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    timezone_offset = Column(String(10))
    score_state = Column(Text)
    
    # Strain metrics
    strain = Column(Numeric(8, 6))
    kilojoule = Column(Numeric(12, 4))
    average_heart_rate = Column(Integer)
    max_heart_rate = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("WHOOPUser", back_populates="cycles")
    sleep_records = relationship("WHOOPSleep", back_populates="cycle")
    recovery_record = relationship("WHOOPRecovery", back_populates="cycle", uselist=False)


class WHOOPSleep(Base):
    """Sleep activity data with V1/V2 API compatibility."""
    __tablename__ = "whoop_sleep"

    id = Column(String(36), primary_key=True)  # UUID in V2
    v1_id = Column(BigInteger)  # V1 ID for backwards compatibility
    user_id = Column(BigInteger, ForeignKey("whoop_users.id"), nullable=False)
    cycle_id = Column(BigInteger, ForeignKey("whoop_cycles.id"))  # Optional with SET NULL
    
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    timezone_offset = Column(String(10))
    nap = Column(Boolean)
    score_state = Column(Text)
    
    # Sleep performance metrics
    sleep_performance_percentage = Column(Numeric(5, 2))
    respiratory_rate = Column(Numeric(5, 2))
    sleep_consistency_percentage = Column(Numeric(5, 2))
    sleep_efficiency_percentage = Column(Numeric(5, 2))
    
    # Sleep duration metrics (in milliseconds)
    total_in_bed_time_milli = Column(BigInteger)
    total_awake_time_milli = Column(BigInteger)
    total_no_data_time_milli = Column(BigInteger)
    total_light_sleep_time_milli = Column(BigInteger)
    total_slow_wave_sleep_time_milli = Column(BigInteger)
    total_rem_sleep_time_milli = Column(BigInteger)
    
    # Sleep quality metrics
    sleep_cycle_count = Column(Integer)
    disturbance_count = Column(Integer)
    
    # Sleep need metrics (in milliseconds)
    baseline_milli = Column(BigInteger)
    need_from_sleep_debt_milli = Column(BigInteger)
    need_from_recent_strain_milli = Column(BigInteger)
    need_from_recent_nap_milli = Column(BigInteger)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("WHOOPUser", back_populates="sleep_records")
    cycle = relationship("WHOOPCycle", back_populates="sleep_records")
    recovery_record = relationship("WHOOPRecovery", back_populates="sleep", uselist=False)


class WHOOPRecovery(Base):
    """Daily recovery scores and biometric data."""
    __tablename__ = "whoop_recovery"

    cycle_id = Column(BigInteger, ForeignKey("whoop_cycles.id"), primary_key=True)
    sleep_id = Column(String(36), ForeignKey("whoop_sleep.id"))
    user_id = Column(BigInteger, ForeignKey("whoop_users.id"), nullable=False)
    
    score_state = Column(Text)
    recovery_score = Column(Numeric(5, 2))
    resting_heart_rate = Column(Numeric(5, 2))
    hrv_rmssd_milli = Column(Numeric(8, 4))
    spo2_percentage = Column(Numeric(5, 2))
    skin_temp_celsius = Column(Numeric(4, 2))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("WHOOPUser", back_populates="recovery_records")
    cycle = relationship("WHOOPCycle", back_populates="recovery_record")
    sleep = relationship("WHOOPSleep", back_populates="recovery_record")


class WHOOPWorkout(Base):
    """Workout activity data with V1/V2 API compatibility."""
    __tablename__ = "whoop_workouts"

    id = Column(String(36), primary_key=True)  # UUID in V2
    v1_id = Column(BigInteger)  # V1 ID for backwards compatibility
    user_id = Column(BigInteger, ForeignKey("whoop_users.id"), nullable=False)
    
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    timezone_offset = Column(String(10))
    
    # Sport information
    sport_id = Column(Integer)
    sport_name = Column(String(100))
    score_state = Column(Text)
    
    # Performance metrics
    strain = Column(Numeric(8, 6))
    average_heart_rate = Column(Integer)
    max_heart_rate = Column(Integer)
    kilojoule = Column(Numeric(12, 4))
    
    # Distance and altitude
    distance_meter = Column(Numeric(12, 4))
    altitude_gain_meter = Column(Numeric(12, 4))
    altitude_change_meter = Column(Numeric(12, 4))
    
    # Heart rate zones (in milliseconds)
    zone_zero_milli = Column(BigInteger)
    zone_one_milli = Column(BigInteger)
    zone_two_milli = Column(BigInteger)
    zone_three_milli = Column(BigInteger)
    zone_four_milli = Column(BigInteger)
    zone_five_milli = Column(BigInteger)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("WHOOPUser", back_populates="workouts")


# Pydantic models for API serialization

class WHOOPUserBase(BaseModel):
    """Base WHOOP user model."""
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class WHOOPUserCreate(WHOOPUserBase):
    """WHOOP user creation model."""
    id: int
    access_token: str
    refresh_token: str
    token_expires_at: Optional[datetime] = None


class WHOOPUserResponse(WHOOPUserBase):
    """WHOOP user response model."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WHOOPSleepBase(BaseModel):
    """Base WHOOP sleep model."""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    nap: Optional[bool] = None
    sleep_performance_percentage: Optional[float] = None
    respiratory_rate: Optional[float] = None
    sleep_efficiency_percentage: Optional[float] = None
    total_in_bed_time_milli: Optional[int] = None
    sleep_cycle_count: Optional[int] = None
    disturbance_count: Optional[int] = None


class WHOOPSleepCreate(WHOOPSleepBase):
    """WHOOP sleep creation model."""
    id: str  # UUID
    user_id: int
    cycle_id: Optional[int] = None


class WHOOPSleepResponse(WHOOPSleepBase):
    """WHOOP sleep response model."""
    id: str
    user_id: int
    cycle_id: Optional[int] = None
    created_at: datetime
    
    # Computed properties
    @validator('sleep_performance_percentage', 'respiratory_rate', 'sleep_efficiency_percentage')
    def format_percentage(cls, v):
        """Format percentages for display."""
        if v:
            return round(float(v), 1)
        return v

    class Config:
        from_attributes = True


class WHOOPWorkoutBase(BaseModel):
    """Base WHOOP workout model."""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    sport_name: Optional[str] = None
    strain: Optional[float] = None
    average_heart_rate: Optional[int] = None
    max_heart_rate: Optional[int] = None
    kilojoule: Optional[float] = None
    distance_meter: Optional[float] = None


class WHOOPWorkoutCreate(WHOOPWorkoutBase):
    """WHOOP workout creation model."""
    id: str  # UUID
    user_id: int
    sport_id: Optional[int] = None


class WHOOPWorkoutResponse(WHOOPWorkoutBase):
    """WHOOP workout response model."""
    id: str
    user_id: int
    sport_id: Optional[int] = None
    created_at: datetime
    
    # Computed properties
    @validator('strain', 'kilojoule', 'distance_meter')
    def format_numeric(cls, v):
        """Format numeric values for display."""
        if v:
            return round(float(v), 2)
        return v

    class Config:
        from_attributes = True


class WHOOPRecoveryBase(BaseModel):
    """Base WHOOP recovery model."""
    recovery_score: Optional[float] = None
    resting_heart_rate: Optional[float] = None
    hrv_rmssd_milli: Optional[float] = None
    spo2_percentage: Optional[float] = None
    skin_temp_celsius: Optional[float] = None


class WHOOPRecoveryCreate(WHOOPRecoveryBase):
    """WHOOP recovery creation model."""
    cycle_id: int
    user_id: int
    sleep_id: Optional[str] = None


class WHOOPRecoveryResponse(WHOOPRecoveryBase):
    """WHOOP recovery response model."""
    cycle_id: int
    user_id: int
    sleep_id: Optional[str] = None
    created_at: datetime
    
    # Computed properties
    @validator('recovery_score', 'resting_heart_rate', 'hrv_rmssd_milli', 'spo2_percentage', 'skin_temp_celsius')
    def format_metrics(cls, v):
        """Format metric values for display."""
        if v:
            return round(float(v), 1)
        return v

    class Config:
        from_attributes = True