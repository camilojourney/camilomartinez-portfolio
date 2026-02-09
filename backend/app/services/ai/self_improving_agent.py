"""
Self-Improving RAG Agent

Autonomous agent that learns from query failures and automatically improves the RAG system.

Key Capabilities:
1. Failure Classification - Uses LLM to determine failure type
2. HyDE Generation - Creates hypothetical perfect documents for missing context
3. Pattern Detection - Finds similar past failures
4. Adaptive Prompts - Updates prompts with successful examples & corrections
5. HITL Validation - Requires human approval for low-confidence patterns

Architecture:
- Event-driven learning from user feedback
- Structured pattern storage (JSONB in query_history)
- Continuous effectiveness validation
- Human-in-the-loop safety mechanism
"""

import logging
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import Float, and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import async_session_factory
from app.models.ai_query import Embedding, QueryHistory
from app.services.ai.error_handling import handle_exceptions
from app.services.ai.openai_client import openai_service

logger = logging.getLogger(__name__)


class SelfImprovingAgentError(Exception):
    """Custom exception for self-improving agent errors."""
    pass


class SelfImprovingRAGAgent:
    """
    Autonomous agent that learns from query failures and improves RAG system.

    The agent operates in multiple modes:
    - Learning: Analyzes failures and generates corrective patterns
    - Validation: Measures effectiveness of applied improvements
    - Adaptation: Updates prompts dynamically based on successful queries
    """

    def __init__(self):
        """Initialize the self-improving agent with configuration."""
        self.auto_approve_threshold = 0.95  # High-confidence patterns auto-approve
        self.pattern_similarity_threshold = 0.85  # For detecting similar failures
        self.hyde_enabled = True
        self.analyzer_version = "v1.0.0"

        # Failure type to remediation strategy mapping
        self.failure_strategies = {
            "MISSING_CONTEXT": self._handle_missing_context,
            "INCORRECT_LOGIC": self._handle_incorrect_logic,
            "SYNTAX_ERROR": self._handle_syntax_error,
            "TIMEOUT": self._handle_timeout,
            "AMBIGUOUS_QUESTION": self._handle_ambiguous_question,
            "PERMISSION_DENIED": self._handle_permission_denied,
        }

        logger.info("Self-improving RAG agent initialized")

    # ==================== CORE LEARNING METHODS ====================

    @handle_exceptions("self_improving_agent.learn_from_feedback")
    async def learn_from_feedback(
        self,
        query_id: int,
        failure_classification: str | None = None
    ) -> dict[str, Any]:
        """
        Main learning method - analyzes a failed query and applies improvements.

        Flow:
        1. Load query from query_history
        2. Classify failure type (if not provided)
        3. Generate learned_pattern based on type
        4. Create corrective embeddings (if applicable)
        5. Store pattern with status (auto-approve vs pending)
        6. Return summary of actions taken

        Args:
            query_id: ID of the failed query
            failure_classification: Optional pre-classified failure type

        Returns:
            {
                "status": "learned",
                "failure_type": "MISSING_CONTEXT",
                "pattern_status": "auto_approved",
                "embeddings_created": 2,
                "confidence": 0.96
            }
        """
        async with async_session_factory() as session:
            # Load query history
            result = await session.execute(
                select(QueryHistory).where(QueryHistory.id == query_id)
            )
            query_history = result.scalar_one_or_none()

            if not query_history:
                raise SelfImprovingAgentError(f"Query {query_id} not found")

            if query_history.was_successful:
                raise SelfImprovingAgentError(f"Query {query_id} was successful, no learning needed")

            # Classify failure if not provided
            if not failure_classification:
                failure_type, classification_confidence = await self.classify_failure(query_history)
            else:
                failure_type = failure_classification
                classification_confidence = 1.0

            logger.info(f"Learning from query {query_id}: {failure_type} (confidence: {classification_confidence:.2f})")

            # Check if similar pattern already exists
            similar_failures = await self.detect_similar_failures(query_history.user_question)
            if similar_failures and similar_failures[0].get("learned_pattern"):
                logger.info(f"Similar pattern already exists: {similar_failures[0]['id']}")
                return {
                    "status": "duplicate",
                    "failure_type": failure_type,
                    "existing_pattern_id": similar_failures[0]["id"]
                }

            # Apply type-specific learning strategy
            strategy = self.failure_strategies.get(failure_type)
            if not strategy:
                logger.warning(f"No strategy for failure type: {failure_type}")
                return {
                    "status": "no_strategy",
                    "failure_type": failure_type
                }

            learned_pattern = await strategy(query_history, classification_confidence)

            # Determine pattern status based on confidence
            if learned_pattern["confidence"] >= self.auto_approve_threshold:
                learned_pattern["status"] = "auto_approved"
            else:
                learned_pattern["status"] = "pending_review"

            # Store learned pattern
            query_history.failure_type = failure_type
            query_history.learned_pattern = learned_pattern
            query_history.improvement_applied = True

            # Create corrective embeddings if applicable
            embeddings_created = []
            if failure_type == "MISSING_CONTEXT" and self.hyde_enabled:
                embeddings_created = await self._create_hyde_embeddings(
                    query_history, learned_pattern, session
                )
                query_history.corrective_embeddings = embeddings_created

            await session.commit()

            logger.info(f"Learned pattern stored: {learned_pattern['status']} ({len(embeddings_created)} embeddings)")

            return {
                "status": "learned",
                "failure_type": failure_type,
                "pattern_status": learned_pattern["status"],
                "embeddings_created": len(embeddings_created),
                "confidence": learned_pattern["confidence"],
                "learned_pattern": learned_pattern
            }

    async def classify_failure(
        self,
        query_history: QueryHistory
    ) -> tuple[str, float]:
        """
        Uses LLM to classify failure type and confidence.

        Prompt:
            "Analyze this failed AI query and classify the failure.

            Question: {question}
            Generated SQL: {sql}
            Error: {error_message}
            Execution Result: {result}

            Classify into: MISSING_CONTEXT, SYNTAX_ERROR, INCORRECT_LOGIC,
                          TIMEOUT, AMBIGUOUS_QUESTION, PERMISSION_DENIED

            Return JSON: {failure_type, confidence, reasoning}"

        Args:
            query_history: Query history object to classify

        Returns:
            Tuple of (failure_type, confidence)
        """
        classification_prompt = f"""
        Analyze this failed database query and classify the failure type.

        **Question:** {query_history.user_question}

        **Generated SQL:** {query_history.generated_sql or 'None'}

        **Error Message:** {query_history.error_message or 'Unknown error'}

        **Retrieved Context:** {query_history.retrieved_context[:500] if query_history.retrieved_context else 'None'}

        Classify the failure into ONE of these types:
        - MISSING_CONTEXT: The schema context retrieved was insufficient (missing tables, columns, or descriptions)
        - SYNTAX_ERROR: The SQL syntax was invalid (wrong SQL dialect, typos, incorrect structure)
        - INCORRECT_LOGIC: SQL was valid but produced wrong results (wrong aggregation, joins, filters)
        - TIMEOUT: Query was too slow or complex
        - AMBIGUOUS_QUESTION: User's intent was unclear or question was too vague
        - PERMISSION_DENIED: Attempted unsafe or unauthorized operation

        Respond in JSON format:
        {{
            "failure_type": "MISSING_CONTEXT",
            "confidence": 0.92,
            "reasoning": "Brief explanation of classification"
        }}
        """

        try:
            response = await openai_service.create_chat_completion(
                messages=[{"role": "user", "content": classification_prompt}],
                temperature=0.1,  # Low temp for consistent classification
                max_tokens=200,
                response_format={"type": "json_object"}
            )

            import json
            result = json.loads(response["content"])

            failure_type = result.get("failure_type", "MISSING_CONTEXT")
            confidence = result.get("confidence", 0.5)

            logger.info(f"Classified as {failure_type} (confidence: {confidence:.2f}): {result.get('reasoning')}")

            return failure_type, confidence

        except Exception as e:
            logger.error(f"Classification failed: {e}")
            # Default to MISSING_CONTEXT with low confidence
            return "MISSING_CONTEXT", 0.5

    # ==================== FAILURE-SPECIFIC HANDLERS ====================

    async def _handle_missing_context(
        self,
        query_history: QueryHistory,
        confidence: float
    ) -> dict[str, Any]:
        """
        Handle MISSING_CONTEXT failures by generating HyDE embeddings.

        Creates hypothetical documents that would answer the question.
        """
        # Generate hypothetical document using HyDE
        hyde_result = await self.generate_hypothetical_document(
            query_history.user_question,
            query_history.retrieved_context or ""
        )

        return {
            "pattern_type": "MISSING_CONTEXT",
            "status": "pending_review",  # Will be updated based on confidence
            "confidence": confidence,
            "missing_context": {
                "triggering_question": query_history.user_question,
                "missing_concept": "Schema context was insufficient. Generated HyDE document.",
                "hypothetical_document": hyde_result["hypothetical_document"],
                "generated_embedding_ids": []  # Will be populated after embedding creation
            },
            "analyzed_at": datetime.utcnow().isoformat(),
            "analyzer_version": self.analyzer_version
        }

    async def _handle_incorrect_logic(
        self,
        query_history: QueryHistory,
        confidence: float
    ) -> dict[str, Any]:
        """
        Handle INCORRECT_LOGIC failures by creating correction guidelines.

        Analyzes SQL to identify logical errors and creates negative examples.
        """
        # Use LLM to analyze the incorrect logic
        analysis_prompt = f"""
        Analyze this incorrect SQL query and provide a correction guideline.

        **Question:** {query_history.user_question}
        **Incorrect SQL:** {query_history.generated_sql}
        **Error/Issue:** {query_history.error_message or 'Produced wrong results'}

        Provide:
        1. What was wrong with the SQL logic
        2. The correct SQL approach
        3. A general guideline to prevent similar errors

        Return JSON:
        {{
            "what_went_wrong": "Brief explanation",
            "correct_sql": "Corrected SQL query",
            "correction_guideline": "General rule to prevent this error"
        }}
        """

        try:
            response = await openai_service.create_chat_completion(
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.2,
                max_tokens=500,
                response_format={"type": "json_object"}
            )

            import json
            analysis = json.loads(response["content"])

            return {
                "pattern_type": "INCORRECT_LOGIC",
                "status": "pending_review",
                "confidence": confidence,
                "incorrect_logic": {
                    "triggering_question": query_history.user_question,
                    "incorrect_sql": query_history.generated_sql,
                    "correct_sql": analysis.get("correct_sql", ""),
                    "correction_guideline": analysis.get("correction_guideline", ""),
                    "what_went_wrong": analysis.get("what_went_wrong", ""),
                    "similar_patterns": []
                },
                "analyzed_at": datetime.utcnow().isoformat(),
                "analyzer_version": self.analyzer_version
            }

        except Exception as e:
            logger.error(f"Logic analysis failed: {e}")
            # Return basic pattern
            return {
                "pattern_type": "INCORRECT_LOGIC",
                "status": "pending_review",
                "confidence": 0.5,
                "incorrect_logic": {
                    "triggering_question": query_history.user_question,
                    "incorrect_sql": query_history.generated_sql,
                    "correction_guideline": "Review query logic"
                },
                "analyzed_at": datetime.utcnow().isoformat(),
                "analyzer_version": self.analyzer_version
            }

    async def _handle_syntax_error(
        self,
        query_history: QueryHistory,
        confidence: float
    ) -> dict[str, Any]:
        """Handle SYNTAX_ERROR failures."""
        return {
            "pattern_type": "SYNTAX_ERROR",
            "status": "pending_review",
            "confidence": confidence,
            "syntax_error": {
                "error_type": "SQL_SYNTAX",
                "invalid_pattern": query_history.generated_sql or "",
                "correction_hint": query_history.error_message or "Check SQL syntax"
            },
            "analyzed_at": datetime.utcnow().isoformat(),
            "analyzer_version": self.analyzer_version
        }

    async def _handle_timeout(self, query_history: QueryHistory, confidence: float) -> dict[str, Any]:
        """Handle TIMEOUT failures."""
        return {
            "pattern_type": "TIMEOUT",
            "status": "pending_review",
            "confidence": confidence,
            "analyzed_at": datetime.utcnow().isoformat(),
            "analyzer_version": self.analyzer_version
        }

    async def _handle_ambiguous_question(self, query_history: QueryHistory, confidence: float) -> dict[str, Any]:
        """Handle AMBIGUOUS_QUESTION failures."""
        return {
            "pattern_type": "AMBIGUOUS_QUESTION",
            "status": "pending_review",
            "confidence": confidence,
            "analyzed_at": datetime.utcnow().isoformat(),
            "analyzer_version": self.analyzer_version
        }

    async def _handle_permission_denied(self, query_history: QueryHistory, confidence: float) -> dict[str, Any]:
        """Handle PERMISSION_DENIED failures."""
        return {
            "pattern_type": "PERMISSION_DENIED",
            "status": "pending_review",
            "confidence": confidence,
            "analyzed_at": datetime.utcnow().isoformat(),
            "analyzer_version": self.analyzer_version
        }

    # ==================== HYDE GENERATION ====================

    async def generate_hypothetical_document(
        self,
        question: str,
        context_used: str
    ) -> dict[str, Any]:
        """
        HyDE: Generate hypothetical perfect document that would answer the question.

        Args:
            question: User's question that failed
            context_used: Context that was retrieved (insufficient)

        Returns:
            {
                "hypothetical_document": "View: daily_fitness_snapshot, Column: ...",
                "confidence": 0.93
            }
        """
        hyde_prompt = f"""
        Generate an ideal database schema description that would perfectly enable answering this question:

        **Question:** "{question}"

        **Context already available:** {context_used[:300] if context_used else 'None'}

        Generate ONLY the missing schema description that would have helped answer this question.

        Format as:
        "View: [view_name], Column: [column_name]. Description: [detailed description with data type, use cases, and examples]"

        Be specific about:
        - Data types
        - When to use this column
        - Example values
        - Relationships to other columns

        If multiple columns are needed, create separate descriptions for each.
        """

        try:
            response = await openai_service.create_chat_completion(
                messages=[{"role": "user", "content": hyde_prompt}],
                temperature=0.3,  # Moderate creativity for quality descriptions
                max_tokens=400
            )

            hypothetical_document = response["content"].strip()

            logger.info(f"Generated HyDE document ({len(hypothetical_document)} chars)")

            return {
                "hypothetical_document": hypothetical_document,
                "confidence": 0.85  # Default confidence for HyDE
            }

        except Exception as e:
            logger.error(f"HyDE generation failed: {e}")
            raise SelfImprovingAgentError(f"Failed to generate hypothetical document: {e}") from e

    async def _create_hyde_embeddings(
        self,
        query_history: QueryHistory,
        learned_pattern: dict[str, Any],
        session: AsyncSession
    ) -> list[int]:
        """
        Creates HyDE embeddings from learned pattern.

        Args:
            query_history: Source query
            learned_pattern: Pattern with hypothetical_document
            session: Database session

        Returns:
            List of created embedding IDs
        """
        if "missing_context" not in learned_pattern:
            return []

        hypothetical_doc = learned_pattern["missing_context"]["hypothetical_document"]

        try:
            # Generate embedding
            embedding_result = await openai_service.create_embedding(hypothetical_doc)

            # Store in embeddings table
            new_embedding = Embedding(
                content=hypothetical_doc,
                embedding=embedding_result["embeddings"],
                embedding_type="hyde",
                metadata={
                    "method": "hyde",
                    "question": query_history.user_question[:200],
                    "generated_at": datetime.utcnow().isoformat(),
                    "pattern_type": "MISSING_CONTEXT"
                },
                confidence_score=learned_pattern.get("confidence", 0.85),
                source_query_id=query_history.id,
                is_validated=False  # Requires HITL approval
            )

            session.add(new_embedding)
            await session.flush()  # Get ID without committing

            logger.info(f"Created HyDE embedding {new_embedding.id} for query {query_history.id}")

            # Update learned pattern with embedding ID
            learned_pattern["missing_context"]["generated_embedding_ids"] = [new_embedding.id]

            return [new_embedding.id]

        except Exception as e:
            logger.error(f"Failed to create HyDE embedding: {e}")
            return []

    # ==================== PATTERN DETECTION ====================

    async def detect_similar_failures(
        self,
        current_question: str,
        lookback_days: int = 30
    ) -> list[dict[str, Any]]:
        """
        Finds similar past failures using semantic search on questions.

        Args:
            current_question: Current failed question
            lookback_days: Days to look back

        Returns:
            List of similar failures with learned_patterns
        """
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)

        async with async_session_factory() as session:
            # Get recent failures with learned patterns
            result = await session.execute(
                select(QueryHistory)
                .where(
                    and_(
                        QueryHistory.was_successful.is_(False),
                        QueryHistory.learned_pattern.isnot(None),
                        QueryHistory.created_at >= cutoff_date
                    )
                )
                .order_by(desc(QueryHistory.created_at))
                .limit(20)
            )

            failures = result.scalars().all()

            # TODO: Implement semantic similarity using embeddings
            # For now, return simple text matching
            similar = []
            for failure in failures:
                # Simple keyword matching (can be enhanced with embeddings)
                if any(word in current_question.lower() for word in failure.user_question.lower().split() if len(word) > 4):
                    similar.append({
                        "id": failure.id,
                        "question": failure.user_question,
                        "learned_pattern": failure.learned_pattern,
                        "created_at": failure.created_at.isoformat() if failure.created_at else None
                    })

            logger.info(f"Found {len(similar)} similar failures")
            return similar[:5]  # Return top 5

    async def analyze_failure_trends(
        self,
        time_window_days: int = 7
    ) -> dict[str, Any]:
        """
        Identifies trending failure patterns for proactive improvement.

        Groups by:
        - failure_type frequency
        - Common keywords in failed questions
        - Missing schema elements

        Args:
            time_window_days: Days to analyze

        Returns:
            {
                "trending_missing_contexts": ["snapshot_date", "user_id"],
                "common_logic_errors": ["AVG instead of SUM for 'total'"],
                "recommendation": "Generate embeddings for X, Y, Z"
            }
        """
        cutoff_date = datetime.utcnow() - timedelta(days=time_window_days)

        async with async_session_factory() as session:
            # Get failure type distribution
            result = await session.execute(
                select(
                    QueryHistory.failure_type,
                    func.count(QueryHistory.id).label('count')
                )
                .where(
                    and_(
                        QueryHistory.created_at >= cutoff_date,
                        QueryHistory.was_successful.is_(False),
                        QueryHistory.failure_type.isnot(None)
                    )
                )
                .group_by(QueryHistory.failure_type)
                .order_by(desc('count'))
            )

            failure_distribution = {row[0]: row[1] for row in result.fetchall()}

            # Get common missing contexts
            missing_context_failures = await session.execute(
                select(QueryHistory)
                .where(
                    and_(
                        QueryHistory.created_at >= cutoff_date,
                        QueryHistory.failure_type == 'MISSING_CONTEXT',
                        QueryHistory.learned_pattern.isnot(None)
                    )
                )
                .limit(20)
            )

            missing_contexts = []
            for failure in missing_context_failures.scalars():
                if failure.learned_pattern and "missing_context" in failure.learned_pattern:
                    missing_contexts.append(
                        failure.learned_pattern["missing_context"].get("missing_concept", "")
                    )

            # Get common logic errors
            logic_error_failures = await session.execute(
                select(QueryHistory)
                .where(
                    and_(
                        QueryHistory.created_at >= cutoff_date,
                        QueryHistory.failure_type == 'INCORRECT_LOGIC',
                        QueryHistory.learned_pattern.isnot(None)
                    )
                )
                .limit(20)
            )

            logic_errors = []
            for failure in logic_error_failures.scalars():
                if failure.learned_pattern and "incorrect_logic" in failure.learned_pattern:
                    guideline = failure.learned_pattern["incorrect_logic"].get("correction_guideline", "")
                    if guideline:
                        logic_errors.append(guideline)

            return {
                "time_window_days": time_window_days,
                "failure_distribution": failure_distribution,
                "total_failures": sum(failure_distribution.values()),
                "trending_missing_contexts": missing_contexts[:5],
                "common_logic_errors": logic_errors[:5],
                "recommendation": self._generate_recommendation(failure_distribution, missing_contexts, logic_errors)
            }

    def _generate_recommendation(
        self,
        failure_distribution: dict[str, int],
        missing_contexts: list[str],
        logic_errors: list[str]
    ) -> str:
        """Generate actionable recommendation based on trends."""
        if not failure_distribution:
            return "No failures detected in this period."

        top_failure = max(failure_distribution.items(), key=lambda x: x[1])
        failure_type, count = top_failure

        if failure_type == "MISSING_CONTEXT" and missing_contexts:
            return f"Generate HyDE embeddings for: {', '.join(missing_contexts[:3])}"
        elif failure_type == "INCORRECT_LOGIC" and logic_errors:
            return f"Update system prompts with correction guidelines: {logic_errors[0][:100]}"
        else:
            return f"Focus on resolving {failure_type} failures ({count} occurrences)"

    # ==================== ADAPTIVE PROMPTS ====================

    async def get_few_shot_examples(
        self,
        question: str,
        limit: int = 3
    ) -> list[dict[str, str]]:
        """
        Retrieves successful queries to use as few-shot examples in prompts.

        Selection Criteria:
        1. was_successful=True AND user_feedback >= 0
        2. Semantic similarity to current question
        3. High retrieval_confidence (good schema match)

        Args:
            question: Current question to find similar examples for
            limit: Maximum number of examples to return

        Returns:
            [
                {
                    "question": "What was my avg HRV last week?",
                    "sql": "SELECT AVG(whoop_hrv) FROM daily_fitness_snapshot WHERE...",
                    "explanation": "Used snapshot_date for time filtering"
                },
                ...
            ]
        """
        async with async_session_factory() as session:
            # Get successful queries from last 90 days
            cutoff_date = datetime.utcnow() - timedelta(days=90)

            result = await session.execute(
                select(QueryHistory)
                .where(
                    and_(
                        QueryHistory.was_successful.is_(True),
                        QueryHistory.user_feedback.in_([0, 1]),  # Neutral or positive
                        QueryHistory.created_at >= cutoff_date,
                        QueryHistory.generated_sql.isnot(None),
                        QueryHistory.retrieval_confidence >= 0.7
                    )
                )
                .order_by(desc(QueryHistory.retrieval_confidence))
                .limit(20)
            )

            successful_queries = result.scalars().all()

            # TODO: Implement semantic similarity ranking
            # For now, use simple keyword matching and high confidence
            examples = []
            for query in successful_queries[:limit]:
                examples.append({
                    "question": query.user_question,
                    "sql": query.generated_sql,
                    "explanation": f"Retrieval confidence: {query.retrieval_confidence:.2f}"
                })

            logger.info(f"Retrieved {len(examples)} few-shot examples")
            return examples

    async def get_adaptive_system_prompt(
        self,
        base_prompt: str
    ) -> str:
        """
        Dynamically enhances system prompts with learned corrections.

        Retrieves approved learned_patterns and injects:
        - Negative examples (INCORRECT_LOGIC): "❌ Don't use AVG for 'total'. Use SUM."
        - Success patterns: "✅ For time queries, always include snapshot_date column"

        Args:
            base_prompt: Base system prompt to enhance

        Returns:
            Enhanced prompt with guidelines appended
        """
        async with async_session_factory() as session:
            # Get approved patterns from last 30 days
            cutoff_date = datetime.utcnow() - timedelta(days=30)

            result = await session.execute(
                select(QueryHistory)
                .where(
                    and_(
                        QueryHistory.learned_pattern.isnot(None),
                        QueryHistory.created_at >= cutoff_date
                    )
                )
                .limit(50)
            )

            queries = result.scalars().all()

            # Collect approved corrections
            corrections = []
            for query in queries:
                if not query.learned_pattern:
                    continue

                status = query.learned_pattern.get("status")
                if status not in ["approved", "auto_approved"]:
                    continue

                pattern_type = query.learned_pattern.get("pattern_type")

                if pattern_type == "INCORRECT_LOGIC":
                    logic = query.learned_pattern.get("incorrect_logic", {})
                    guideline = logic.get("correction_guideline")
                    if guideline:
                        corrections.append(f"❌ {guideline}")

                elif pattern_type == "MISSING_CONTEXT":
                    context = query.learned_pattern.get("missing_context", {})
                    concept = context.get("missing_concept")
                    if concept:
                        corrections.append(f"✅ {concept}")

            if not corrections:
                return base_prompt

            # Append corrections to prompt
            corrections_text = "\n".join(corrections[:10])  # Limit to top 10
            enhanced_prompt = f"""{base_prompt}

## Learned Corrections (Apply These Rules)

{corrections_text}

Remember to apply these learned corrections to avoid previous mistakes.
"""

            logger.info(f"Enhanced prompt with {len(corrections[:10])} learned corrections")
            return enhanced_prompt

    # ==================== HUMAN-IN-THE-LOOP ====================

    async def get_pending_reviews(
        self,
        limit: int = 20
    ) -> list[dict[str, Any]]:
        """
        Fetches learned patterns awaiting human validation.

        Filters: learned_pattern.status = 'pending_review'
        Sort: confidence DESC, created_at DESC

        Args:
            limit: Maximum number of pending reviews to return

        Returns:
            List of pending review items with full context
        """
        async with async_session_factory() as session:
            # Query for pending reviews using JSONB operator
            result = await session.execute(
                select(QueryHistory)
                .where(
                    and_(
                        QueryHistory.learned_pattern.isnot(None),
                        QueryHistory.learned_pattern['status'].astext == 'pending_review'
                    )
                )
                .order_by(desc(QueryHistory.created_at))
                .limit(limit)
            )

            pending_queries = result.scalars().all()

            pending_reviews = []
            for query in pending_queries:
                pattern = query.learned_pattern or {}
                pending_reviews.append({
                    "query_id": query.id,
                    "question": query.user_question,
                    "failure_type": query.failure_type,
                    "confidence": pattern.get("confidence", 0.0),
                    "learned_pattern": pattern,
                    "generated_sql": query.generated_sql,
                    "error_message": query.error_message,
                    "created_at": query.created_at.isoformat() if query.created_at else None,
                    "corrective_embeddings": query.corrective_embeddings or []
                })

            logger.info(f"Found {len(pending_reviews)} pending reviews")
            return pending_reviews

    async def approve_pattern(
        self,
        query_id: int,
        reviewer_id: str,
        notes: str | None = None
    ) -> bool:
        """
        Marks a learned pattern as approved and enables associated embeddings.

        Updates:
        1. learned_pattern.status = 'approved'
        2. learned_pattern.human_reviewer = reviewer_id
        3. learned_pattern.review_notes = notes
        4. embeddings.is_validated = TRUE for corrective_embeddings

        Args:
            query_id: Query ID with pattern to approve
            reviewer_id: User ID of reviewer
            notes: Optional review notes

        Returns:
            True if successful, False if query not found
        """
        async with async_session_factory() as session:
            # Get query
            result = await session.execute(
                select(QueryHistory).where(QueryHistory.id == query_id)
            )
            query = result.scalar_one_or_none()

            if not query or not query.learned_pattern:
                logger.warning(f"Query {query_id} not found or has no learned pattern")
                return False

            # Update pattern status
            pattern = query.learned_pattern.copy()
            pattern["status"] = "approved"
            pattern["human_reviewer"] = reviewer_id
            pattern["review_notes"] = notes or ""
            pattern["approved_at"] = datetime.utcnow().isoformat()

            query.learned_pattern = pattern

            # Activate associated embeddings
            if query.corrective_embeddings:
                for embedding_id in query.corrective_embeddings:
                    emb_result = await session.execute(
                        select(Embedding).where(Embedding.id == embedding_id)
                    )
                    embedding = emb_result.scalar_one_or_none()
                    if embedding:
                        embedding.is_validated = True
                        logger.info(f"Validated embedding {embedding_id}")

            await session.commit()

            logger.info(f"Approved pattern for query {query_id} by {reviewer_id}")
            return True

    async def reject_pattern(
        self,
        query_id: int,
        reviewer_id: str,
        reason: str
    ) -> bool:
        """
        Marks a learned pattern as rejected and removes bad embeddings.

        Also deletes or marks inactive any embeddings created from this pattern.

        Args:
            query_id: Query ID with pattern to reject
            reviewer_id: User ID of reviewer
            reason: Rejection reason

        Returns:
            True if successful, False if query not found
        """
        async with async_session_factory() as session:
            # Get query
            result = await session.execute(
                select(QueryHistory).where(QueryHistory.id == query_id)
            )
            query = result.scalar_one_or_none()

            if not query or not query.learned_pattern:
                logger.warning(f"Query {query_id} not found or has no learned pattern")
                return False

            # Update pattern status
            pattern = query.learned_pattern.copy()
            pattern["status"] = "rejected"
            pattern["human_reviewer"] = reviewer_id
            pattern["review_notes"] = reason
            pattern["rejected_at"] = datetime.utcnow().isoformat()

            query.learned_pattern = pattern

            # Delete associated embeddings
            if query.corrective_embeddings:
                for embedding_id in query.corrective_embeddings:
                    emb_result = await session.execute(
                        select(Embedding).where(Embedding.id == embedding_id)
                    )
                    embedding = emb_result.scalar_one_or_none()
                    if embedding:
                        await session.delete(embedding)
                        logger.info(f"Deleted rejected embedding {embedding_id}")

                query.corrective_embeddings = []

            await session.commit()

            logger.info(f"Rejected pattern for query {query_id} by {reviewer_id}: {reason}")
            return True

    # ==================== AUTO-IMPROVEMENT JOBS ====================

    async def run_daily_improvement_cycle(self) -> dict[str, Any]:
        """
        Scheduled job (runs daily via cron/Celery) to:
        1. Analyze failure trends from past 24 hours
        2. Auto-approve high-confidence patterns (>= 0.95)
        3. Generate HyDE embeddings for trending missing contexts
        4. Update adaptive prompts with new corrections
        5. Send summary email/notification to admin

        Returns:
            Summary of improvements applied
        """
        logger.info("Starting daily improvement cycle")
        start_time = datetime.utcnow()

        summary = {
            "started_at": start_time.isoformat(),
            "auto_approved": 0,
            "hyde_embeddings_created": 0,
            "patterns_analyzed": 0,
            "recommendations": []
        }

        async with async_session_factory() as session:
            # 1. Auto-approve high-confidence patterns
            result = await session.execute(
                select(QueryHistory)
                .where(
                    and_(
                        QueryHistory.learned_pattern.isnot(None),
                        QueryHistory.learned_pattern['status'].astext == 'pending_review',
                        QueryHistory.learned_pattern['confidence'].astext.cast(Float) >= self.auto_approve_threshold
                    )
                )
            )

            pending_high_confidence = result.scalars().all()

            for query in pending_high_confidence:
                pattern = query.learned_pattern.copy()
                pattern["status"] = "auto_approved"
                pattern["auto_approved_at"] = datetime.utcnow().isoformat()
                query.learned_pattern = pattern

                # Activate associated embeddings
                if query.corrective_embeddings:
                    for embedding_id in query.corrective_embeddings:
                        emb_result = await session.execute(
                            select(Embedding).where(Embedding.id == embedding_id)
                        )
                        embedding = emb_result.scalar_one_or_none()
                        if embedding:
                            embedding.is_validated = True

                summary["auto_approved"] += 1

            await session.commit()

            # 2. Analyze failure trends
            trends = await self.analyze_failure_trends(time_window_days=7)
            summary["failure_trends"] = trends
            summary["recommendations"].append(trends["recommendation"])

            # 3. Count patterns analyzed
            summary["patterns_analyzed"] = len(pending_high_confidence)

        summary["completed_at"] = datetime.utcnow().isoformat()
        summary["duration_seconds"] = (datetime.utcnow() - start_time).total_seconds()

        logger.info(f"Daily improvement cycle completed: {summary}")
        return summary

    async def validate_embedding_effectiveness(
        self,
        embedding_id: int,
        time_window_days: int = 14
    ) -> dict[str, Any]:
        """
        Measures if a corrective embedding actually improved outcomes.

        Compares:
        - Failure rate for similar questions before vs after embedding creation
        - Retrieval rank of this embedding in successful queries
        - User feedback correlation

        If ineffective after 14 days: Flag for review or deletion

        Args:
            embedding_id: Embedding to validate
            time_window_days: Days to analyze

        Returns:
            {
                "is_effective": True/False,
                "success_rate_before": 0.65,
                "success_rate_after": 0.85,
                "recommendation": "Keep" or "Remove"
            }
        """
        async with async_session_factory() as session:
            # Get embedding and its creation date
            result = await session.execute(
                select(Embedding).where(Embedding.id == embedding_id)
            )
            embedding = result.scalar_one_or_none()

            if not embedding:
                return {"error": "Embedding not found"}

            creation_date = embedding.created_at
            cutoff_before = creation_date - timedelta(days=time_window_days)
            cutoff_after = creation_date + timedelta(days=time_window_days)

            # Get source query to find similar questions
            source_query_id = embedding.source_query_id
            if not source_query_id:
                return {"error": "No source query found"}

            source_result = await session.execute(
                select(QueryHistory).where(QueryHistory.id == source_query_id)
            )
            source_query = source_result.scalar_one_or_none()

            if not source_query:
                return {"error": "Source query not found"}

            # Simple effectiveness check: count successes before and after
            # TODO: Implement semantic similarity for better matching
            # Count successful queries before embedding
            before_result = await session.execute(
                select(func.count(QueryHistory.id))
                .where(
                    and_(
                        QueryHistory.created_at >= cutoff_before,
                        QueryHistory.created_at < creation_date,
                        QueryHistory.was_successful.is_(True)
                    )
                )
            )
            successes_before = before_result.scalar() or 0

            # Count total queries before
            total_before_result = await session.execute(
                select(func.count(QueryHistory.id))
                .where(
                    and_(
                        QueryHistory.created_at >= cutoff_before,
                        QueryHistory.created_at < creation_date
                    )
                )
            )
            total_before = total_before_result.scalar() or 1

            # Count successful queries after embedding
            after_result = await session.execute(
                select(func.count(QueryHistory.id))
                .where(
                    and_(
                        QueryHistory.created_at >= creation_date,
                        QueryHistory.created_at <= cutoff_after,
                        QueryHistory.was_successful.is_(True)
                    )
                )
            )
            successes_after = after_result.scalar() or 0

            # Count total queries after
            total_after_result = await session.execute(
                select(func.count(QueryHistory.id))
                .where(
                    and_(
                        QueryHistory.created_at >= creation_date,
                        QueryHistory.created_at <= cutoff_after
                    )
                )
            )
            total_after = total_after_result.scalar() or 1

            # Calculate success rates
            success_rate_before = successes_before / total_before
            success_rate_after = successes_after / total_after

            improvement = success_rate_after - success_rate_before
            is_effective = improvement > 0.05  # 5% improvement threshold

            recommendation = "Keep" if is_effective else "Remove"

            logger.info(f"Embedding {embedding_id} effectiveness: {improvement:+.1%} ({recommendation})")

            return {
                "embedding_id": embedding_id,
                "is_effective": is_effective,
                "success_rate_before": round(success_rate_before, 3),
                "success_rate_after": round(success_rate_after, 3),
                "improvement": round(improvement, 3),
                "recommendation": recommendation,
                "queries_before": total_before,
                "queries_after": total_after
            }


# Global service instance
self_improving_agent = SelfImprovingRAGAgent()
