"""Pydantic models and SQLAlchemy schemas for the application."""

# Import all models to ensure they're registered with SQLAlchemy
from .user import *
from .strava import *
from .whoop import *
from .ai_query import *
__all__ = [
    # User models
    "User", "UserCreate", "UserResponse",
    
    # Strava models  
    "StravaRun", "StravaRunCreate", "StravaRunResponse",
    "StravaUser", "StravaUserCreate", "StravaUserResponse",
    
    # WHOOP models
    "WHOOPWorkout", "WHOOPSleep", "WHOOPRecovery",
    "WHOOPWorkoutCreate", "WHOOPSleepCreate", "WHOOPRecoveryCreate",
    
    # AI Query models
    "QueryHistory", "QueryHistoryCreate", "QueryHistoryResponse",
    "SchemaEmbedding", "SchemaEmbeddingCreate",
    "AITrainerEvaluation", "AITrainerEvaluationResponse",
]
