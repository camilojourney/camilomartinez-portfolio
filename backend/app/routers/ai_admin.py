"""
AI Admin API Router

Provides Human-in-the-Loop (HITL) endpoints for reviewing and managing
learned patterns from the self-improving RAG system.

Endpoints:
- GET /ai/admin/pending-reviews - Get patterns awaiting review
- POST /ai/admin/approve-pattern/{query_id} - Approve a learned pattern
- POST /ai/admin/reject-pattern/{query_id} - Reject a learned pattern
- GET /ai/admin/improvement-stats - Dashboard statistics
- GET /ai/admin/failure-trends - Analyze recent failure patterns
- POST /ai/admin/validate-embedding/{embedding_id} - Check embedding effectiveness
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel, Field

from app.services.ai.self_improving_agent import self_improving_agent, SelfImprovingAgentError
from app.services.ai.error_handling import handle_exceptions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai/admin", tags=["AI Admin"])


# ==================== REQUEST/RESPONSE MODELS ====================

class PatternApprovalRequest(BaseModel):
    """Request model for approving a learned pattern."""
    notes: Optional[str] = Field(None, description="Optional review notes")


class PatternRejectionRequest(BaseModel):
    """Request model for rejecting a learned pattern."""
    reason: str = Field(..., description="Reason for rejection", min_length=10)


class PendingReviewResponse(BaseModel):
    """Response model for pending review."""
    query_id: int
    question: str
    failure_type: Optional[str]
    confidence: float
    learned_pattern: Dict[str, Any]
    generated_sql: Optional[str]
    error_message: Optional[str]
    created_at: Optional[str]
    corrective_embeddings: List[int]


class ImprovementStatsResponse(BaseModel):
    """Response model for improvement statistics."""
    total_patterns_learned: int
    auto_approved: int
    pending_review: int
    manually_approved: int
    rejected: int
    success_rate_improvement: Optional[float]
    trending_failures: Dict[str, int]
    embeddings_created: int
    validated_embeddings: int


# ==================== AUTH DEPENDENCY (PLACEHOLDER) ====================

async def verify_admin_auth(
    # TODO: Implement actual authentication
    # For now, this is a placeholder
    # admin_token: str = Header(...)
) -> str:
    """
    Verify admin authentication.

    TODO: Implement proper authentication:
    - JWT token validation
    - API key validation
    - Role-based access control (RBAC)

    For now, returns a default admin user.
    """
    # In production, validate token and return user info
    # For development, return placeholder
    return "admin_user"


# ==================== ENDPOINTS ====================

@router.get(
    "/pending-reviews",
    response_model=List[PendingReviewResponse],
    summary="Get pending pattern reviews",
    description="Retrieve learned patterns awaiting human validation"
)
@handle_exceptions("get_pending_reviews")
async def get_pending_pattern_reviews(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of reviews to return"),
    admin_user: str = Depends(verify_admin_auth)
):
    """
    Get learned patterns awaiting human review.

    Returns patterns with status='pending_review', sorted by creation date.
    Includes full context for review decision:
    - Original question
    - Failure type and confidence
    - Generated SQL (if any)
    - Error message
    - Learned pattern details
    - Associated embeddings
    """
    try:
        pending_reviews = await self_improving_agent.get_pending_reviews(limit)
        logger.info(f"Admin {admin_user} retrieved {len(pending_reviews)} pending reviews")
        return pending_reviews

    except Exception as e:
        logger.error(f"Failed to get pending reviews: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve pending reviews: {str(e)}"
        )


@router.post(
    "/approve-pattern/{query_id}",
    summary="Approve a learned pattern",
    description="Approve a learned pattern and activate associated embeddings"
)
@handle_exceptions("approve_pattern")
async def approve_learned_pattern(
    query_id: int,
    request: PatternApprovalRequest,
    admin_user: str = Depends(verify_admin_auth)
):
    """
    Approve a learned pattern.

    Actions:
    1. Updates learned_pattern.status = 'approved'
    2. Records human_reviewer and review_notes
    3. Activates associated embeddings (is_validated = TRUE)
    4. Embeddings become available for RAG retrieval

    Returns:
        Success confirmation with query_id
    """
    try:
        success = await self_improving_agent.approve_pattern(
            query_id=query_id,
            reviewer_id=admin_user,
            notes=request.notes
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Query {query_id} not found or has no learned pattern"
            )

        logger.info(f"Admin {admin_user} approved pattern for query {query_id}")

        return {
            "status": "approved",
            "query_id": query_id,
            "reviewer": admin_user,
            "message": "Pattern approved and embeddings activated"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to approve pattern: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve pattern: {str(e)}"
        )


@router.post(
    "/reject-pattern/{query_id}",
    summary="Reject a learned pattern",
    description="Reject a learned pattern and remove bad embeddings"
)
@handle_exceptions("reject_pattern")
async def reject_learned_pattern(
    query_id: int,
    request: PatternRejectionRequest,
    admin_user: str = Depends(verify_admin_auth)
):
    """
    Reject a learned pattern.

    Actions:
    1. Updates learned_pattern.status = 'rejected'
    2. Records human_reviewer and rejection reason
    3. Deletes associated embeddings (bad patterns removed)
    4. Prevents pattern from being used in future queries

    Returns:
        Success confirmation with query_id and reason
    """
    try:
        success = await self_improving_agent.reject_pattern(
            query_id=query_id,
            reviewer_id=admin_user,
            reason=request.reason
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Query {query_id} not found or has no learned pattern"
            )

        logger.info(f"Admin {admin_user} rejected pattern for query {query_id}: {request.reason}")

        return {
            "status": "rejected",
            "query_id": query_id,
            "reviewer": admin_user,
            "reason": request.reason,
            "message": "Pattern rejected and embeddings deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reject pattern: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject pattern: {str(e)}"
        )


@router.get(
    "/improvement-stats",
    response_model=ImprovementStatsResponse,
    summary="Get improvement statistics",
    description="Dashboard statistics for self-improvement effectiveness"
)
@handle_exceptions("get_improvement_stats")
async def get_improvement_statistics(
    time_window_days: int = Query(30, ge=1, le=365, description="Days to analyze"),
    admin_user: str = Depends(verify_admin_auth)
):
    """
    Get dashboard statistics for the self-improving RAG system.

    Metrics:
    - Total patterns learned
    - Breakdown by status (auto_approved, pending, rejected)
    - Success rate improvement (before vs after)
    - Trending failure types
    - Embeddings created and validated

    Use for:
    - Monitoring system health
    - Identifying improvement opportunities
    - Tracking auto-approval effectiveness
    """
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import select, func, and_
        from app.config.database import async_session_factory
        from app.models.ai_query import QueryHistory, Embedding

        cutoff_date = datetime.utcnow() - timedelta(days=time_window_days)

        async with async_session_factory() as session:
            # Get pattern counts
            result = await session.execute(
                select(QueryHistory)
                .where(
                    and_(
                        QueryHistory.learned_pattern.isnot(None),
                        QueryHistory.created_at >= cutoff_date
                    )
                )
            )
            patterns = result.scalars().all()

            auto_approved = sum(1 for p in patterns if p.learned_pattern.get("status") == "auto_approved")
            manually_approved = sum(1 for p in patterns if p.learned_pattern.get("status") == "approved")
            pending = sum(1 for p in patterns if p.learned_pattern.get("status") == "pending_review")
            rejected = sum(1 for p in patterns if p.learned_pattern.get("status") == "rejected")

            # Get failure distribution
            failure_result = await session.execute(
                select(
                    QueryHistory.failure_type,
                    func.count(QueryHistory.id).label('count')
                )
                .where(
                    and_(
                        QueryHistory.created_at >= cutoff_date,
                        QueryHistory.failure_type.isnot(None)
                    )
                )
                .group_by(QueryHistory.failure_type)
            )
            failure_distribution = {row[0]: row[1] for row in failure_result.fetchall()}

            # Get embedding counts
            embedding_result = await session.execute(
                select(
                    func.count(Embedding.id).label('total'),
                    func.count(Embedding.id).filter(Embedding.is_validated == True).label('validated')
                )
                .where(
                    and_(
                        Embedding.created_at >= cutoff_date,
                        Embedding.embedding_type.in_(['learning', 'hyde'])
                    )
                )
            )
            embedding_counts = embedding_result.first()

            # Calculate success rate improvement (simplified)
            # TODO: Implement more sophisticated before/after comparison
            success_rate_improvement = None

        logger.info(f"Admin {admin_user} retrieved improvement stats for {time_window_days} days")

        return ImprovementStatsResponse(
            total_patterns_learned=len(patterns),
            auto_approved=auto_approved,
            pending_review=pending,
            manually_approved=manually_approved,
            rejected=rejected,
            success_rate_improvement=success_rate_improvement,
            trending_failures=failure_distribution,
            embeddings_created=embedding_counts.total or 0,
            validated_embeddings=embedding_counts.validated or 0
        )

    except Exception as e:
        logger.error(f"Failed to get improvement stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )


@router.get(
    "/failure-trends",
    summary="Analyze failure trends",
    description="Analyze trending failure patterns for proactive improvement"
)
@handle_exceptions("get_failure_trends")
async def get_failure_trends(
    time_window_days: int = Query(7, ge=1, le=30, description="Days to analyze"),
    admin_user: str = Depends(verify_admin_auth)
):
    """
    Analyze trending failure patterns.

    Returns:
    - Failure type distribution
    - Common missing contexts
    - Common logic errors
    - Actionable recommendations

    Use for:
    - Proactive improvements
    - Identifying systemic issues
    - Prioritizing schema enhancements
    """
    try:
        trends = await self_improving_agent.analyze_failure_trends(time_window_days)
        logger.info(f"Admin {admin_user} retrieved failure trends for {time_window_days} days")
        return trends

    except Exception as e:
        logger.error(f"Failed to get failure trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze trends: {str(e)}"
        )


@router.post(
    "/validate-embedding/{embedding_id}",
    summary="Validate embedding effectiveness",
    description="Check if a corrective embedding actually improved outcomes"
)
@handle_exceptions("validate_embedding")
async def validate_embedding_effectiveness(
    embedding_id: int,
    time_window_days: int = Query(14, ge=7, le=90, description="Days to analyze"),
    admin_user: str = Depends(verify_admin_auth)
):
    """
    Validate if a corrective embedding is effective.

    Compares success rates before and after embedding creation.
    Recommends "Keep" or "Remove" based on impact.

    Returns:
    - Success rate before/after
    - Improvement percentage
    - Recommendation (Keep/Remove)
    - Query counts before/after

    Use for:
    - Quality control
    - Removing ineffective embeddings
    - Measuring learning effectiveness
    """
    try:
        validation_result = await self_improving_agent.validate_embedding_effectiveness(
            embedding_id, time_window_days
        )

        if "error" in validation_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=validation_result["error"]
            )

        logger.info(
            f"Admin {admin_user} validated embedding {embedding_id}: "
            f"{validation_result.get('recommendation')}"
        )

        return validation_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to validate embedding: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate embedding: {str(e)}"
        )


@router.post(
    "/run-improvement-cycle",
    summary="Run improvement cycle manually",
    description="Manually trigger the daily improvement cycle"
)
@handle_exceptions("run_improvement_cycle")
async def run_improvement_cycle_manually(
    admin_user: str = Depends(verify_admin_auth)
):
    """
    Manually trigger the daily improvement cycle.

    Actions:
    1. Auto-approve high-confidence patterns (>= 0.95)
    2. Analyze failure trends
    3. Generate recommendations

    Normally runs automatically via cron/Celery, but can be triggered manually
    for testing or immediate improvements.

    Returns:
        Summary of improvements applied
    """
    try:
        logger.info(f"Admin {admin_user} manually triggered improvement cycle")
        summary = await self_improving_agent.run_daily_improvement_cycle()

        return {
            **summary,
            "triggered_by": admin_user,
            "trigger_type": "manual"
        }

    except Exception as e:
        logger.error(f"Failed to run improvement cycle: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run improvement cycle: {str(e)}"
        )


# ==================== HEALTH CHECK ====================

@router.get(
    "/health",
    summary="Health check",
    description="Check if the AI admin service is operational"
)
async def health_check():
    """
    Health check endpoint for monitoring.

    Returns:
        Service status and version
    """
    return {
        "status": "healthy",
        "service": "ai_admin",
        "version": "1.0.0",
        "features": [
            "pattern_review",
            "auto_approval",
            "embedding_validation",
            "failure_analysis"
        ]
    }
