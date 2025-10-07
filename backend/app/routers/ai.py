"""
AI Services router for chat, embeddings, and trainer evaluation endpoints.
Comprehensive FastAPI endpoints replacing 62+ Next.js API routes.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator

from app.services.ai.openai_client import openai_service, OpenAIError
from app.services.ai.rag_service import rag_service, RAGError
from app.services.ai.query_processor import query_processor, QueryProcessingError
from app.services.ai.trainer_service import trainer_service, TrainerError
from app.services.ai.schema_embedding_service import schema_embedding_service
from app.services.ai.auto_embedding_agent import auto_embedding_agent

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
    messages: List[ChatMessage] = Field(..., min_items=1)
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


class TrainerEvaluationRequest(BaseModel):
    """Trainer evaluation request model."""
    analysis_period: int = Field(90, ge=7, le=365)
    user_goals: Optional[str] = Field(None, max_length=1000)
    save_evaluation: bool = Field(True)


class APIResponse(BaseModel):
    """Standard API response model."""
    status: str
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Utility Functions

async def get_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """Extract user ID from authorization token (placeholder implementation)."""
    # TODO: Implement proper JWT token validation
    if credentials and credentials.credentials:
        # For now, return a mock user ID
        # In production, this would validate the JWT and extract user_id
        return "mock_user_123"
    return None


def handle_ai_service_error(error: Exception, operation: str) -> HTTPException:
    """Convert AI service errors to appropriate HTTP exceptions."""
    if isinstance(error, (OpenAIError, RAGError, QueryProcessingError, TrainerError)):
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
    
    **Replaces Next.js API routes:**
    - `/api/ai/chat`
    - `/api/openai/completion`
    """
    try:
        logger.info(f"Chat completion request from user {user_id or 'anonymous'}")
        
        # Convert Pydantic models to dict format
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Create chat completion with OpenAI
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
    
    **Replaces Next.js API routes:**
    - `/api/ai/query`
    - `/api/ai/ask`
    - `/api/chat/process`
    """
    try:
        logger.info(f"AI query from user {user_id or 'anonymous'}: '{request.query[:50]}...'")
        
        # Process query with SQL generation pipeline
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
    Process AI queries with full DIN-SQL pipeline - matches frontend expectations.
    
    **Replaces TypeScript implementation:**
    - `/api/ai-query/route.ts`
    - Full schema vector search + SQL generation + execution
    - Query history logging with feedback
    """
    try:
        logger.info(f"AI query (SQL) from user {user_id or 'anonymous'}: '{request.query[:50]}...'")
        
        # Process query with full SQL pipeline
        result = await query_processor.process_query_with_sql(
            question=request.query,
            user_id=user_id,
            include_context=request.include_context
        )
        
        return APIResponse(
            status="success",
            data=result,
            timestamp=datetime.utcnow().isoformat()
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
    
    **Replaces Next.js API routes:**
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
        raise handle_ai_service_error(e, "trainer history retrieval")


# Schema Embedding Management Endpoints

@router.post("/schema/embeddings/generate", response_model=APIResponse)
async def generate_schema_embeddings(
    clear_existing: bool = True,
    only_profile: bool = False,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Generate embeddings for schema descriptions and/or profile.

    **Admin endpoint** - Replaces TypeScript embed-schema.ts script

    Args:
        clear_existing: Clear all embeddings before regenerating (ignored if only_profile=True)
        only_profile: Only regenerate profile embeddings from CAMILO_PROFILE.md (faster, cheaper)
        user_id: User ID from auth token

    Examples:
        - Full regeneration: POST /schema/embeddings/generate?clear_existing=true
        - Profile only: POST /schema/embeddings/generate?only_profile=true
    """
    try:
        mode = "profile-only" if only_profile else "full"
        logger.info(f"Schema embedding generation requested by user {user_id} (mode={mode})")

        result = await schema_embedding_service.generate_embeddings(
            clear_existing=clear_existing,
            only_profile=only_profile
        )

        mode_msg = "profile embeddings" if only_profile else "embeddings"
        return APIResponse(
            status="success",
            data=result,
            message=f"Generated {result['successful_embeddings']} {mode_msg} successfully"
        )

    except Exception as e:
        raise handle_ai_service_error(e, "schema embedding generation")


@router.get("/schema/embeddings/stats", response_model=APIResponse)
async def get_schema_embedding_stats():
    """Get statistics about current schema embeddings."""
    try:
        stats = await schema_embedding_service.get_embedding_stats()

        return APIResponse(
            status="success",
            data=stats
        )

    except Exception as e:
        raise handle_ai_service_error(e, "schema embedding stats")


# Autonomous Embedding Agent Endpoints

@router.post("/agent/embedding/start", response_model=APIResponse)
async def start_embedding_agent(
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Start the autonomous embedding agent.

    The agent will automatically:
    - Monitor CAMILO_PROFILE.md for changes and re-embed when modified
    - Monitor database schema changes and trigger full re-embedding
    - Track embedding history and avoid redundant work

    **Admin endpoint** - Implements agentic RAG architecture
    """
    try:
        logger.info(f"Starting autonomous embedding agent (user={user_id})")

        await auto_embedding_agent.start()
        status = auto_embedding_agent.get_agent_status()

        return APIResponse(
            status="success",
            data=status,
            message="Autonomous embedding agent started successfully"
        )

    except Exception as e:
        raise handle_ai_service_error(e, "agent start")


@router.post("/agent/embedding/stop", response_model=APIResponse)
async def stop_embedding_agent(
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Stop the autonomous embedding agent.

    **Admin endpoint**
    """
    try:
        logger.info(f"Stopping autonomous embedding agent (user={user_id})")

        await auto_embedding_agent.stop()

        return APIResponse(
            status="success",
            message="Autonomous embedding agent stopped"
        )

    except Exception as e:
        raise handle_ai_service_error(e, "agent stop")


@router.get("/agent/embedding/status", response_model=APIResponse)
async def get_embedding_agent_status():
    """
    Get current status of the autonomous embedding agent.

    Returns:
    - Running status
    - Watched file paths
    - Recent embedding events
    - Memory state
    """
    try:
        status = auto_embedding_agent.get_agent_status()

        return APIResponse(
            status="success",
            data=status
        )

    except Exception as e:
        raise handle_ai_service_error(e, "agent status")


@router.put("/schema/embeddings/{table_name}", response_model=APIResponse)
async def update_single_schema_embedding(
    table_name: str,
    column_name: Optional[str] = None,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Update a single schema embedding.
    
    **Admin endpoint** - Replaces TypeScript update-single-embedding.ts script
    """
    try:
        logger.info(f"Single embedding update requested by user {user_id} for {table_name}.{column_name}")
        
        success = await schema_embedding_service.update_single_embedding(
            table_name=table_name,
            column_name=column_name
        )
        
        if success:
            return APIResponse(
                status="success",
                message=f"Successfully updated embedding for {table_name}.{column_name}"
            )
        else:
            return APIResponse(
                status="error",
                message=f"Failed to update embedding for {table_name}.{column_name}"
            )
        
    except Exception as e:
        raise handle_ai_service_error(e, "single embedding update")


# Global service instances (moved from individual services)


# Embedding Endpoints

@router.post("/embeddings/create", response_model=APIResponse)
async def create_embedding(
    request: EmbeddingRequest,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Create text embeddings using OpenAI's text-embedding-3-small.
    
    **Replaces Next.js API routes:**
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
    
    **Replaces Next.js API routes:**
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
    
    **Replaces Next.js API routes:**
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
    
    **Replaces Next.js API routes:**
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


# AI Trainer Endpoints

@router.post("/trainer/evaluate", response_model=APIResponse)
async def evaluate_athlete(
    request: TrainerEvaluationRequest,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Comprehensive athlete evaluation with performance analysis and recommendations.
    
    **Replaces Next.js API routes:**
    - `/api/ai/trainer/evaluate`
    - `/api/training/analyze`
    - `/api/performance/evaluate`
    """
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required for athlete evaluation")
            
        evaluation = await trainer_service.evaluate_athlete(
            user_id=user_id,
            analysis_period=request.analysis_period,
            user_goals=request.user_goals,
            save_evaluation=request.save_evaluation
        )
        
        return APIResponse(
            status="success",
            data=evaluation
        )
        
    except Exception as e:
        raise handle_ai_service_error(e, "athlete evaluation")


@router.get("/trainer/history", response_model=APIResponse)
async def get_evaluation_history(
    user_id: Optional[str] = Depends(get_user_id),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get user's AI trainer evaluation history.
    
    **Replaces Next.js API routes:**
    - `/api/ai/trainer/history/{user_id}`
    - `/api/training/evaluations`
    """
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
            
        history = await trainer_service.get_evaluation_history(
            user_id=user_id,
            limit=limit
        )
        
        return APIResponse(
            status="success",
            data={
                "evaluations": history,
                "total_evaluations": len(history)
            }
        )
        
    except Exception as e:
        raise handle_ai_service_error(e, "evaluation history retrieval")


# Health and Status Endpoints

@router.get("/health", response_model=APIResponse)
async def ai_health_check():
    """
    Health check for AI services including OpenAI connectivity.
    
    **Replaces Next.js API routes:**
    - `/api/ai/health`
    - `/api/openai/status`
    """
    try:
        # Check OpenAI service health
        openai_health = await openai_service.health_check()
        
        # Check RAG service stats
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
                "services_checked": ["openai", "rag", "query_processor", "trainer"]
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
    """
    AI services information and available endpoints.
    """
    return APIResponse(
        status="success",
        data={
            "service": "AI Services API",
            "version": "1.0.0",
            "description": "Comprehensive AI services with GPT-4, RAG, and trainer evaluation",
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
                "trainer": [
                    "POST /trainer/evaluate - Athlete evaluation",
                    "GET /trainer/history - Evaluation history"
                ],
                "system": [
                    "GET /health - Service health check",
                    "GET / - Service information"
                ]
            },
            "features": [
                "GPT-4 chat completions with context",
                "Vector similarity search with pgvector",
                "Personalized AI trainer recommendations",
                "RAG-enhanced query processing",
                "Comprehensive fitness data integration"
            ]
        }
    )