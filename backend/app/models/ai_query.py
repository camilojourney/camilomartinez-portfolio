"""
AI Query models for self-improving RAG system.
Supports unified embeddings and enhanced query history with learning patterns.
"""

from sqlalchemy import Column, Integer, BigInteger, String, DateTime, Float, Text, Boolean, ForeignKey, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from app.config.database import Base


class Embedding(Base):
    """
    Unified embedding storage for schema, profile, and self-learning contexts.

    Replaces: schema_embeddings, embedding_documents
    """
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=False)  # pgvector type
    embedding_type = Column(String(50), nullable=False)  # schema, profile, learning, hyde
    metadata_ = Column("metadata", JSONB, nullable=False, server_default='{}')  # Use metadata_ to avoid reserved name conflict
    confidence_score = Column(Float)
    source_query_id = Column(Integer, ForeignKey("query_history.id", ondelete="SET NULL"))
    is_validated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    source_query = relationship("QueryHistory", foreign_keys=[source_query_id], back_populates="generated_embeddings")


class QueryHistory(Base):
    """
    Enhanced query history with self-improvement capabilities.

    Tracks failures, learned patterns, and corrective actions.
    """
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)

    # Request & Response
    user_question = Column(Text, nullable=False)  # Keep original name for compatibility
    question = Column(Text)  # Alias for user_question
    retrieved_context = Column(Text)
    generated_sql = Column(Text)
    execution_result = Column(JSONB)
    natural_language_response = Column(Text)

    # Success Tracking
    was_successful = Column(Boolean)
    failure_type = Column(String(50))  # MISSING_CONTEXT, SYNTAX_ERROR, INCORRECT_LOGIC, etc.
    error_message = Column(Text)
    user_feedback = Column(Integer)  # -1, 0, 1

    # Self-Improvement Engine
    improvement_applied = Column(Boolean, default=False)
    learned_pattern = Column(JSONB)
    corrective_embeddings = Column(ARRAY(Integer))  # Array of embedding IDs

    # Performance Metrics
    latency_ms = Column(Integer)
    tokens_used = Column(Integer)
    retrieval_confidence = Column(Float)

    # Metadata
    user_id = Column(String(255))
    session_id = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    generated_embeddings = relationship("Embedding", foreign_keys="Embedding.source_query_id", back_populates="source_query")


# Pydantic models for API serialization

class EmbeddingBase(BaseModel):
    """Base embedding model."""
    content: str
    embedding_type: str
    metadata: Dict[str, Any] = {}
    confidence_score: Optional[float] = None
    is_validated: bool = False


class EmbeddingCreate(EmbeddingBase):
    """Embedding creation model."""
    embedding: List[float]
    source_query_id: Optional[int] = None


class EmbeddingResponse(EmbeddingBase):
    """Embedding response model."""
    id: int
    source_query_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QueryHistoryBase(BaseModel):
    """Base query history model."""
    user_question: str
    retrieved_context: Optional[str] = None
    generated_sql: Optional[str] = None
    execution_result: Optional[Dict[str, Any]] = None
    natural_language_response: Optional[str] = None
    was_successful: Optional[bool] = None
    failure_type: Optional[str] = None
    error_message: Optional[str] = None
    user_feedback: Optional[int] = None
    latency_ms: Optional[int] = None
    tokens_used: Optional[int] = None
    retrieval_confidence: Optional[float] = None


class QueryHistoryCreate(QueryHistoryBase):
    """Query history creation model."""
    user_id: Optional[str] = None
    session_id: Optional[str] = None


class QueryHistoryResponse(QueryHistoryBase):
    """Query history response model."""
    id: int
    improvement_applied: bool = False
    learned_pattern: Optional[Dict[str, Any]] = None
    corrective_embeddings: Optional[List[int]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QueryHistoryUpdate(BaseModel):
    """Query history update model (mainly for feedback)."""
    user_feedback: Optional[int] = None
    was_successful: Optional[bool] = None
    improvement_applied: Optional[bool] = None
    learned_pattern: Optional[Dict[str, Any]] = None


class LearnedPattern(BaseModel):
    """
    Structured learned pattern model matching the JSONB schema.

    Used for query_history.learned_pattern field.
    """
    pattern_type: str  # MISSING_CONTEXT, INCORRECT_LOGIC, SYNTAX_ERROR
    status: str  # pending_review, approved, rejected, auto_approved
    confidence: float

    # Optional fields based on pattern_type
    missing_context: Optional[Dict[str, Any]] = None
    incorrect_logic: Optional[Dict[str, Any]] = None
    syntax_error: Optional[Dict[str, Any]] = None

    # Metadata
    analyzed_at: str
    analyzer_version: str
    human_reviewer: Optional[str] = None
    review_notes: Optional[str] = None


class AIQueryRequest(BaseModel):
    """AI query request model."""
    question: str
    bypass_rate_limit: bool = False
    include_context: bool = True
    max_results: int = 10


class AIQueryResponse(BaseModel):
    """AI query response model."""
    answer: str
    query_id: Optional[int] = None
    context_used: Optional[List[str]] = None
    sql_generated: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    latency_ms: Optional[int] = None


class AIQueryFeedback(BaseModel):
    """AI query feedback model."""
    query_id: int
    feedback: int  # -1, 0, 1
