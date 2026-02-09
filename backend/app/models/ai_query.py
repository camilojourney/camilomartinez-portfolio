"""
AI Query models for self-improving RAG system.
Supports unified embeddings and enhanced query history with learning patterns.
"""

from datetime import datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from pydantic import BaseModel
from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

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
    metadata: dict[str, Any] = {}
    confidence_score: float | None = None
    is_validated: bool = False


class EmbeddingCreate(EmbeddingBase):
    """Embedding creation model."""
    embedding: list[float]
    source_query_id: int | None = None


class EmbeddingResponse(EmbeddingBase):
    """Embedding response model."""
    id: int
    source_query_id: int | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QueryHistoryBase(BaseModel):
    """Base query history model."""
    user_question: str
    retrieved_context: str | None = None
    generated_sql: str | None = None
    execution_result: dict[str, Any] | None = None
    natural_language_response: str | None = None
    was_successful: bool | None = None
    failure_type: str | None = None
    error_message: str | None = None
    user_feedback: int | None = None
    latency_ms: int | None = None
    tokens_used: int | None = None
    retrieval_confidence: float | None = None


class QueryHistoryCreate(QueryHistoryBase):
    """Query history creation model."""
    user_id: str | None = None
    session_id: str | None = None


class QueryHistoryResponse(QueryHistoryBase):
    """Query history response model."""
    id: int
    improvement_applied: bool = False
    learned_pattern: dict[str, Any] | None = None
    corrective_embeddings: list[int] | None = None
    user_id: str | None = None
    session_id: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class QueryHistoryUpdate(BaseModel):
    """Query history update model (mainly for feedback)."""
    user_feedback: int | None = None
    was_successful: bool | None = None
    improvement_applied: bool | None = None
    learned_pattern: dict[str, Any] | None = None


class LearnedPattern(BaseModel):
    """
    Structured learned pattern model matching the JSONB schema.

    Used for query_history.learned_pattern field.
    """
    pattern_type: str  # MISSING_CONTEXT, INCORRECT_LOGIC, SYNTAX_ERROR
    status: str  # pending_review, approved, rejected, auto_approved
    confidence: float

    # Optional fields based on pattern_type
    missing_context: dict[str, Any] | None = None
    incorrect_logic: dict[str, Any] | None = None
    syntax_error: dict[str, Any] | None = None

    # Metadata
    analyzed_at: str
    analyzer_version: str
    human_reviewer: str | None = None
    review_notes: str | None = None


class AIQueryRequest(BaseModel):
    """AI query request model."""
    question: str
    bypass_rate_limit: bool = False
    include_context: bool = True
    max_results: int = 10


class AIQueryResponse(BaseModel):
    """AI query response model."""
    answer: str
    query_id: int | None = None
    context_used: list[str] | None = None
    sql_generated: str | None = None
    data: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None
    latency_ms: int | None = None


class AIQueryFeedback(BaseModel):
    """AI query feedback model."""
    query_id: int
    feedback: int  # -1, 0, 1
