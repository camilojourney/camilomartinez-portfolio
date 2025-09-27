"""
AI Query models for query history, schema embeddings, and evaluation cycles.
Supports the AI trainer system and RAG-based query processing.
"""

from sqlalchemy import Column, Integer, BigInteger, String, DateTime, Float, Text, Boolean, ForeignKey, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from app.config.database import Base


class QueryHistory(Base):
    """Query history for AI trainer performance tracking."""
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    user_question = Column(Text, nullable=False)
    retrieved_context = Column(Text)  # RAG context
    generated_sql = Column(Text)
    was_successful = Column(Boolean)
    user_feedback = Column(Integer)  # -1, 0, 1 for downvote, no vote, upvote
    latency_ms = Column(Integer)
    
    # AI Trainer integration
    cycle_id = Column(Integer, ForeignKey("evaluation_cycles.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    evaluation_cycle = relationship("EvaluationCycle", back_populates="queries")


class EvaluationCycle(Base):
    """AI trainer evaluation cycles."""
    __tablename__ = "evaluation_cycles"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    total_questions = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)  # Using Float instead of Numeric for Pydantic compatibility
    failure_analysis = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    queries = relationship("QueryHistory", back_populates="evaluation_cycle", cascade="all, delete-orphan")


class EmbeddingDocument(Base):
    """General-purpose embedding documents for RAG system."""
    __tablename__ = "embedding_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(255), nullable=False, index=True)  # Unique document identifier
    document_type = Column(String(100), nullable=False, index=True)  # e.g., "schema", "docs", "code"
    title = Column(String(500))
    content = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=False, index=True)  # SHA-256 hash for deduplication
    
    # Vector embedding (pgvector extension)
    # Note: In production, this would use pgvector.Vector type
    # For now using ARRAY of floats as placeholder  
    embedding = Column(ARRAY(Float))  # 1536 dimensions for text-embedding-3-small
    
    # Metadata
    doc_metadata = Column(Text)  # JSON string for additional metadata
    user_id = Column(BigInteger, index=True)  # Optional user-specific documents
    source_url = Column(String(1000))
    chunk_index = Column(Integer, default=0)  # For document chunking
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SchemaEmbedding(Base):
    """Schema embeddings for RAG-based query processing."""
    __tablename__ = "schema_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String(255), nullable=False)
    column_name = Column(String(255))
    description = Column(Text, nullable=False)
    content = Column(Text, nullable=False)  # Full text content for embedding
    
    # Vector embedding (pgvector extension)
    # Note: In production, this would use pgvector.Vector type
    # For now using ARRAY of floats as placeholder
    embedding = Column(ARRAY(Float))  # 1536 dimensions for text-embedding-3-small
    
    # Metadata
    schema_version = Column(String(50))
    data_type = Column(String(100))
    is_primary_key = Column(Boolean, default=False)
    is_foreign_key = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AITrainerEvaluation(Base):
    """Stored results from AI trainer athlete evaluations."""
    __tablename__ = "ai_trainer_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    evaluation_data = Column(JSONB, nullable=False)
    analysis_period_days = Column(Integer, default=90)
    confidence_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# Pydantic models for API serialization

class QueryHistoryBase(BaseModel):
    """Base query history model."""
    user_question: str
    retrieved_context: Optional[str] = None
    generated_sql: Optional[str] = None
    was_successful: Optional[bool] = None
    user_feedback: Optional[int] = None
    latency_ms: Optional[int] = None


class QueryHistoryCreate(QueryHistoryBase):
    """Query history creation model."""
    cycle_id: Optional[int] = None


class QueryHistoryResponse(QueryHistoryBase):
    """Query history response model."""
    id: int
    cycle_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QueryHistoryUpdate(BaseModel):
    """Query history update model (mainly for feedback)."""
    user_feedback: Optional[int] = None
    was_successful: Optional[bool] = None


class EvaluationCycleBase(BaseModel):
    """Base evaluation cycle model."""
    total_questions: int = 0
    success_count: int = 0
    success_rate: float = 0.0
    failure_analysis: Optional[str] = None


class EvaluationCycleCreate(EvaluationCycleBase):
    """Evaluation cycle creation model."""
    pass


class EvaluationCycleResponse(EvaluationCycleBase):
    """Evaluation cycle response model."""
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime
    
    # Status computed from success_rate
    @validator('success_rate')
    def format_success_rate(cls, v):
        """Format success rate as percentage."""
        return round(v, 2)
    
    @property
    def status(self) -> str:
        """Compute status from success rate."""
        if self.end_time is None:
            return "running"
        elif self.success_rate >= 95:
            return "excellent"
        elif self.success_rate >= 80:
            return "good"
        elif self.success_rate >= 60:
            return "needs_improvement"
        else:
            return "critical"
    
    @property
    def duration_seconds(self) -> Optional[float]:
        """Calculate duration in seconds."""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return None

    class Config:
        from_attributes = True


class EvaluationCycleUpdate(BaseModel):
    """Evaluation cycle update model."""
    end_time: Optional[datetime] = None
    total_questions: Optional[int] = None
    success_count: Optional[int] = None
    success_rate: Optional[float] = None
    failure_analysis: Optional[str] = None


class SchemaEmbeddingBase(BaseModel):
    """Base schema embedding model."""
    table_name: str
    column_name: Optional[str] = None
    description: str
    content: str
    schema_version: Optional[str] = None
    data_type: Optional[str] = None
    is_primary_key: bool = False
    is_foreign_key: bool = False


class SchemaEmbeddingCreate(SchemaEmbeddingBase):
    """Schema embedding creation model."""
    embedding: Optional[List[float]] = None


class SchemaEmbeddingResponse(SchemaEmbeddingBase):
    """Schema embedding response model."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Exclude embedding from response for performance
    class Config:
        from_attributes = True


class SchemaEmbeddingUpdate(BaseModel):
    """Schema embedding update model."""
    description: Optional[str] = None
    content: Optional[str] = None
    embedding: Optional[List[float]] = None
    schema_version: Optional[str] = None


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


class AITrainerEvaluationBase(BaseModel):
    """Base model for AI trainer evaluations."""
    user_id: str
    evaluation_data: Dict[str, Any]
    analysis_period_days: int = 90
    confidence_score: float = 0.0


class AITrainerEvaluationResponse(AITrainerEvaluationBase):
    """Evaluation record response model."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EmbeddingDocumentBase(BaseModel):
    """Base embedding document model."""
    document_id: str
    document_type: str
    title: Optional[str] = None
    content: str
    doc_metadata: Optional[str] = None
    user_id: Optional[int] = None
    source_url: Optional[str] = None
    chunk_index: int = 0


class EmbeddingDocumentCreate(EmbeddingDocumentBase):
    """Embedding document creation model."""
    content_hash: str
    embedding: Optional[List[float]] = None


class EmbeddingDocumentResponse(EmbeddingDocumentBase):
    """Embedding document response model."""
    id: int
    content_hash: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EmbeddingDocumentUpdate(BaseModel):
    """Embedding document update model."""
    title: Optional[str] = None
    content: Optional[str] = None
    doc_metadata: Optional[str] = None
    embedding: Optional[List[float]] = None
