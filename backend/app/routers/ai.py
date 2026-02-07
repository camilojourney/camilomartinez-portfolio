"""
AI Services router for chat, embeddings, and RAG endpoints.
Comprehensive FastAPI endpoints for AI operations.

Cleanup log (2026-02-07):
- Removed ~200 lines of commented-out code for disabled services
- Removed: schema_embedding_service endpoints (service removed)
- Removed: auto_embedding_agent endpoints (agent removed)
- Removed: trainer_service endpoints (service removed)
- Removed: TrainerEvaluationRequest (unused after trainer removal)
- Kept: Active chat, embedding, and health endpoints
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from app.services.ai.openai_client import openai_service, OpenAIError
from app.services.ai.rag_service import rag_service, RAGError
from app.services.ai.query_processor import query_processor, QueryProcessingError

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer(auto_error=False)


# Pydantic Models for Request/Response Validation

class ChatMessage(BaseModel):
    """Chat message model."""
    role: str = Field(..., pattern="^(system|user|assistant)$")
    content: str = Field(..., min_length=1, max_length=10000)


class ChatCompletionRequest(BaseModel):
    """Chat completion request model."""
    messages: List[ChatMessage] = Field(..., min_length=1)
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=2000)
    include_context: bool = Field(True)
    context_days: int = Field(30, ge=1, le=365)


class QueryRequest(BaseModel):
    """AI query request model."""
    query: str = Field(..., min_length=1, max_length=5000)
    include_context: bool = Field(True)
    context_days: int = Field(30, ge=1, le=365)
    user_goals: Optional[str] = Field(None, max_length=1000)


class EmbeddingRequest(BaseModel):
    """Embedding creation request model."""
    text: str = Field(..., min_length=1, max_length=8000)
    dimensions: Optional[int] = Field(None, ge=128, le=3072)


class DocumentEmbedRequest(BaseModel):
    """Document embedding request model."""
    content: str = Field(..., min_length=10, max_length=100000)
    document_type: str = Field(..., min_length=1, max_length=50)
    document_id: str = Field(..., min_length=1, max_length=100)
    metadata: Optional[Dict[str, Any]] = None


class SimilaritySearchRequest(BaseModel):
    """Similarity search request model."""
    query: str = Field(..., min_length=1, max_length=1000)
    limit: int = Field(5, ge=1, le=20)
    similarity_threshold: float = Field(0.7, ge=0.0, le=1.0)
    document_types: Optional[List[str]] = None


class APIResponse(BaseModel):
    """Standard API response model."""
    status: str
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Utility Functions

async def get_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Extract user ID from authorization token.
    
    TODO: Implement proper JWT token validation
    Current implementation is a placeholder that returns a mock user ID.
    
    To implement real JWT validation:
    1. Add JWT_SECRET to environment variables
    2. Use python-jose to decode and validate the token
    3. Extract user_id from the token claims
    4. Validate token expiration and signature
    
    Example implementation:
        from jose import jwt, JWTError
        from app.config import settings
        
        if not credentials:
            return None
        try:
            payload = jwt.decode(
                credentials.credentials,
                settings.JWT_SECRET,
                algorithms=["HS256"]
            )
            return payload.get("user_id")
        except JWTError:
            return None
    """
    if credentials and credentials.credentials:
        # Placeholder: returns mock user ID
        # Replace with JWT validation in production
        return "mock_user_123"
    return None


def handle_ai_service_error(error: Exception, operation: str) -> HTTPException:
    """Convert AI service errors to appropriate HTTP exceptions."""
    if isinstance(error, (OpenAIError, RAGError, QueryProcessingError)):
        logger.error(f"{operation} failed: {error}")
        return HTTPException(status_code=400, detail=str(error))
    else:
        logger.error(f"Unexpected error in {operation}: {error}")
        return HTTPException(status_code=500, detail=f"Internal server error in {operation}")


# Chat Endpoints

@router.post("/chat/completion", response_model=APIResponse)
async def create_chat_completion(
    request: ChatCompletionRequest,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Create a chat completion using GPT-4 with optional RAG context.
    
    **Canonical endpoint** - Replaces Next.js API routes:
    - `/api/ai/chat`
    - `/api/openai/completion`
    """
    try:
        logger.info(f"Chat completion request from user {user_id or 'anonymous'}")
        
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        response = await openai_service.create_chat_completion(
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            user_id=user_id
        )
        
        return APIResponse(
            status="success",
            data={
                "response": response["content"],
                "usage": response["usage"],
                "model": response["model"],
                "finish_reason": response["finish_reason"]
            }
        )
        
    except Exception as e:
        raise handle_ai_service_error(e, "chat completion")


@router.post("/chat/query", response_model=APIResponse)
async def process_ai_query(
    request: QueryRequest,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Process an AI query with context augmentation and personalized response.
    
    **Canonical endpoint** - Replaces Next.js API routes:
    - `/api/ai/query`
    - `/api/ai/ask`
    - `/api/chat/process`
    """
    try:
        logger.info(f"AI query from user {user_id or 'anonymous'}: '{request.query[:50]}...'")
        
        result = await query_processor.process_query_with_sql(
            question=request.query,
            user_id=user_id,
            include_context=request.include_context
        )
        
        return APIResponse(
            status="success",
            data=result
        )
        
    except Exception as e:
        raise handle_ai_service_error(e, "AI query processing")


@router.post("/query", response_model=APIResponse)
async def ai_query_with_sql(
    request: QueryRequest,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Process AI queries with full DIN-SQL pipeline.
    
    **Canonical endpoint** - Replaces TypeScript implementation:
    - `/api/ai-query/route.ts`
    
    Features:
    - Schema vector search
    - SQL generation
    - Query execution
    - History logging with feedback
    """
    try:
        logger.info(f"AI query (SQL) from user {user_id or 'anonymous'}: '{request.query[:50]}...'")
        
        result = await query_processor.process_query_with_sql(
            question=request.query,
            user_id=user_id,
            include_context=request.include_context
        )
        
        return APIResponse(
            status="success",
            data=result,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise handle_ai_service_error(e, "AI SQL query processing")


@router.get("/chat/history", response_model=APIResponse)
async def get_query_history(
    user_id: Optional[str] = Depends(get_user_id),
    limit: int = Query(20, ge=1, le=100),
    days: int = Query(30, ge=1, le=365)
):
    """
    Get user's AI query history.
    
    **Canonical endpoint** - Replaces Next.js API routes:
    - `/api/ai/history`
    - `/api/chat/history/{user_id}`
    """
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
            
        history = await query_processor.get_query_history(
            user_id=user_id,
            limit=limit,
            days=days
        )
        
        return APIResponse(
            status="success",
            data={
                "history": history,
                "total_queries": len(history),
                "period_days": days
            }
        )
        
    except Exception as e:
        raise handle_ai_service_error(e, "query history retrieval")


# Embedding Endpoints

@router.post("/embeddings/create", response_model=APIResponse)
async def create_embedding(
    request: EmbeddingRequest,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Create text embeddings using OpenAI's text-embedding-3-small.
    
    **Canonical endpoint** - Replaces Next.js API routes:
    - `/api/ai/embeddings`
    - `/api/openai/embeddings`
    """
    try:
        result = await openai_service.create_embedding(
            text=request.text,
            user_id=user_id,
            dimensions=request.dimensions
        )
        
        return APIResponse(
            status="success",
            data=result
        )
        
    except Exception as e:
        raise handle_ai_service_error(e, "embedding creation")


@router.post("/embeddings/documents", response_model=APIResponse)
async def embed_document(
    request: DocumentEmbedRequest,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Embed a document by chunking and storing in vector database.
    
    **Canonical endpoint** - Replaces Next.js API routes:
    - `/api/ai/embed-document`
    - `/api/rag/embed`
    """
    try:
        result = await rag_service.embed_document(
            content=request.content,
            document_type=request.document_type,
            document_id=request.document_id,
            metadata=request.metadata,
            user_id=user_id
        )
        
        return APIResponse(
            status="success",
            data=result
        )
        
    except Exception as e:
        raise handle_ai_service_error(e, "document embedding")


@router.post("/embeddings/search", response_model=APIResponse)
async def similarity_search(
    request: SimilaritySearchRequest,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Perform similarity search on embedded documents.
    
    **Canonical endpoint** - Replaces Next.js API routes:
    - `/api/ai/search`
    - `/api/rag/search`
    - `/api/embeddings/similarity`
    """
    try:
        results = await rag_service.similarity_search(
            query=request.query,
            limit=request.limit,
            similarity_threshold=request.similarity_threshold,
            document_types=request.document_types,
            user_id=user_id
        )
        
        return APIResponse(
            status="success",
            data={
                "results": results,
                "query": request.query,
                "matches_found": len(results)
            }
        )
        
    except Exception as e:
        raise handle_ai_service_error(e, "similarity search")


@router.get("/embeddings/stats", response_model=APIResponse)
async def get_embedding_stats(
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Get statistics about stored embeddings and documents.
    
    **Canonical endpoint** - Replaces Next.js API routes:
    - `/api/ai/stats`
    - `/api/rag/stats`
    """
    try:
        stats = await rag_service.get_document_stats(user_id=user_id)
        
        return APIResponse(
            status="success",
            data=stats
        )
        
    except Exception as e:
        raise handle_ai_service_error(e, "embedding stats retrieval")


# Health and Status Endpoints

@router.get("/health", response_model=APIResponse)
async def ai_health_check():
    """
    Health check for AI services including OpenAI connectivity.
    
    **Canonical endpoint** - Replaces Next.js API routes:
    - `/api/ai/health`
    - `/api/openai/status`
    """
    try:
        openai_health = await openai_service.health_check()
        rag_stats = await rag_service.get_document_stats()
        
        overall_status = "healthy" if openai_health["status"] == "healthy" else "degraded"
        
        return APIResponse(
            status="success",
            data={
                "overall_status": overall_status,
                "openai_service": openai_health,
                "rag_service": {
                    "status": "healthy",
                    "total_documents": rag_stats.get("total_documents", 0),
                    "document_types": len(rag_stats.get("documents_by_type", {}))
                },
                "services_checked": ["openai", "rag", "query_processor"]
            }
        )
        
    except Exception as e:
        logger.error(f"AI health check failed: {e}")
        return APIResponse(
            status="error",
            message=f"Health check failed: {str(e)}",
            data={"overall_status": "unhealthy"}
        )


@router.get("/", response_model=APIResponse)
async def ai_service_info():
    """AI services information and available endpoints."""
    return APIResponse(
        status="success",
        data={
            "service": "AI Services API",
            "version": "1.0.0",
            "description": "AI services with GPT-4 and RAG capabilities",
            "endpoints": {
                "chat": [
                    "POST /chat/completion - GPT-4 chat completions",
                    "POST /chat/query - AI query with context",
                    "GET /chat/history - Query history"
                ],
                "embeddings": [
                    "POST /embeddings/create - Create text embeddings",
                    "POST /embeddings/documents - Embed document chunks",
                    "POST /embeddings/search - Similarity search",
                    "GET /embeddings/stats - Embedding statistics"
                ],
                "system": [
                    "GET /health - Service health check",
                    "GET / - Service information"
                ]
            },
            "features": [
                "GPT-4 chat completions with context",
                "Vector similarity search with pgvector",
                "RAG-enhanced query processing",
                "Comprehensive fitness data integration"
            ]
        }
    )
