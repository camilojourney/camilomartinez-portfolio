"""
AI Query Processing Service for handling user queries with RAG and context augmentation.
Integrates with OpenAI, RAG service, and user fitness data for comprehensive responses.
"""

import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, desc, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_database_session, async_session_factory
from app.models.ai_query import QueryHistory
from app.models.user import User
from app.models.strava import StravaRun
from app.models.whoop import WHOOPSleep, WHOOPWorkout, WHOOPRecovery
from app.services.ai.openai_client import openai_service, OpenAIError
from app.services.ai.rag_service import rag_service, RAGError
from app.services.ai.self_improving_agent import self_improving_agent

logger = logging.getLogger(__name__)


class QueryProcessingError(Exception):
    """Custom exception for query processing errors."""
    pass


class PromptTemplates:
    """
    Centralized prompt templates for different types of AI interactions.
    """
    
    SYSTEM_PROMPT = """You are an expert AI fitness coach and data analyst specialized in endurance sports, recovery optimization, and performance analytics.

You have access to the user's comprehensive fitness data including:
- Strava running activities with detailed metrics (pace, heart rate, elevation, etc.)
- WHOOP recovery data (HRV, RHR, sleep quality, strain scores)
- Historical performance trends and correlations

Your responses should be:
- Data-driven and evidence-based
- Actionable with specific recommendations
- Personalized to the user's fitness level and goals
- Clear and accessible while maintaining technical accuracy

When analyzing data, consider:
- Training load and recovery balance
- Seasonal trends and periodization
- Individual response patterns
- Environmental factors (weather, elevation, etc.)

Always cite specific data points when making recommendations and be transparent about limitations."""

    CONTEXT_INTEGRATION_PROMPT = """Based on the following context from the user's fitness data and knowledge base:

{context}

Please answer the user's question: "{query}"

Use the provided context to give a personalized, data-driven response. Reference specific metrics, dates, and trends from the context when relevant."""

    # DIN-SQL System Prompts for Query Decomposition and SQL Generation
    QUERY_THINKER_PROMPT = """You are an expert PostgreSQL data analyst. Your goal is to write accurate, efficient SQL queries based on the user's question and the provided schema context.

IMPORTANT CONTEXT: This is a SINGLE-USER fitness tracking system belonging to Camilo Martinez. All data belongs to one person (Camilo), so treat multi-user questions as personal metrics questions.

Examples of question transformations:
- "Who had the highest strain score?" → "What was your highest strain score?"
- "Which user has the highest average heart rate?" → "What is your average heart rate?"
- "Compare users' performance" → "Compare your performance across different time periods"

CRITICAL SCHEMA RULES:
- The view daily_fitness_snapshot uses the column snapshot_date for every time-based filter. Always rely on snapshot_date for WHERE, ORDER BY, or GROUP BY clauses within that view. Never reference a generic column named date.
- Ensure the query is syntactically correct PostgreSQL
- Use appropriate JOINs, WHERE clauses, and ORDER BY when needed
- The query must be a single, executable SQL statement

COMMON PATTERNS AND EXAMPLES:
1. **Time-based queries**: Use DATE() function on actual date columns, not table names
   ❌ WRONG: WHERE DATE(strava_runs) = '2024-01-01'
   ✅ CORRECT: WHERE DATE(start_date_local) = '2024-01-01'

2. **Aggregation functions**: Always specify the column to aggregate
   ❌ WRONG: SELECT AVG(pace) FROM runs WHERE pace IS NULL
   ✅ CORRECT: SELECT AVG(avg_pace_ms) FROM daily_fitness_snapshot WHERE avg_pace_ms IS NOT NULL

3. **Column existence**: Only use columns that exist in the provided schema context

RESPONSE FORMAT: Return a JSON object with:
{
  "thought": "Step-by-step reasoning about the question",
  "plan": "High-level approach to solve the query",
  "sql": "The complete, executable PostgreSQL query"
}

Schema Context:
{schema_context}

User Question: {question}"""

    SQL_REVIEWER_PROMPT = """You are a PostgreSQL expert reviewing a generated SQL query for correctness and safety.

Review this query plan and SQL:

Plan: {plan}
SQL: {sql}
Original Question: {question}

Check for:
1. SQL syntax correctness
2. Logical consistency with the plan
3. Column and table existence
4. Appropriate use of snapshot_date for time filtering
5. Safety (no DROP, DELETE, UPDATE operations)

If the query is correct, respond with:
{
  "is_valid": true,
  "explanation": "Brief explanation of why it's correct"
}

If there are issues, respond with:
{
  "is_valid": false, 
  "issues": ["List of specific problems"],
  "suggested_fix": "Corrected SQL query if possible"
}"""

    GENERAL_FITNESS_PROMPT = """As an AI fitness coach, please provide guidance on the following question: "{query}"

Focus on evidence-based recommendations and general fitness principles. If this question would benefit from personalized data analysis, suggest what specific data would be helpful."""

    PERFORMANCE_ANALYSIS_PROMPT = """Analyze the user's performance data and provide insights on: "{query}"

Consider the following data context:
{context}

Provide specific insights about:
- Performance trends and patterns
- Training effectiveness
- Recovery optimization opportunities  
- Recommendations for improvement

Be specific about timeframes, metrics, and actionable next steps."""


class UserDataAggregator:
    """
    Service for aggregating and contextualizing user fitness data.
    """
    
    async def get_recent_activities_context(
        self,
        user_id: str,
        days: int = 30,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Get recent Strava activities for context.
        
        Args:
            user_id: User identifier
            days: Days to look back
            limit: Maximum activities to include
            
        Returns:
            Dict with activity summary and detailed metrics
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            async with get_database_session() as session:
                query = select(StravaRun).where(
                    StravaRun.user_id == user_id,
                    StravaRun.start_date >= cutoff_date
                ).order_by(desc(StravaRun.start_date)).limit(limit)
                
                result = await session.execute(query)
                activities = result.scalars().all()
                
                if not activities:
                    return {"status": "no_data", "activities": []}
                    
                # Aggregate metrics
                total_distance = sum(a.distance or 0 for a in activities)
                total_time = sum(a.moving_time or 0 for a in activities)
                avg_pace = sum(a.average_pace or 0 for a in activities if a.average_pace) / len([a for a in activities if a.average_pace])
                
                activity_summaries = []
                for activity in activities:
                    summary = {
                        "date": activity.start_date.strftime("%Y-%m-%d") if activity.start_date else None,
                        "distance_km": round(activity.distance / 1000, 2) if activity.distance else 0,
                        "duration_min": round(activity.moving_time / 60, 1) if activity.moving_time else 0,
                        "avg_pace": activity.average_pace,
                        "avg_hr": activity.average_heartrate,
                        "elevation_gain": activity.total_elevation_gain,
                        "activity_type": activity.activity_type or "Run"
                    }
                    activity_summaries.append(summary)
                    
                return {
                    "status": "success",
                    "period_days": days,
                    "total_activities": len(activities),
                    "total_distance_km": round(total_distance / 1000, 2),
                    "total_time_hours": round(total_time / 3600, 1),
                    "avg_pace_per_km": round(avg_pace, 2) if avg_pace else None,
                    "activities": activity_summaries
                }
                
        except Exception as e:
            logger.error(f"Error getting activities context for user {user_id}: {e}")
            return {"status": "error", "error": str(e)}

    async def get_recovery_context(
        self,
        user_id: str,
        days: int = 14,
    ) -> Dict[str, Any]:
        """
        Get recent WHOOP recovery data for context.
        
        Args:
            user_id: User identifier
            days: Days to look back
            
        Returns:
            Dict with recovery trends and metrics
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            async with get_database_session() as session:
                # Get recovery data
                recovery_query = select(WHOOPRecovery).where(
                    WHOOPRecovery.user_id == user_id,
                    WHOOPRecovery.cycle_start >= cutoff_date
                ).order_by(desc(WHOOPRecovery.cycle_start))
                
                recovery_result = await session.execute(recovery_query)
                recoveries = recovery_result.scalars().all()
                
                # Get sleep data
                sleep_query = select(WHOOPSleep).where(
                    WHOOPSleep.user_id == user_id,
                    WHOOPSleep.start_time >= cutoff_date
                ).order_by(desc(WHOOPSleep.start_time))
                
                sleep_result = await session.execute(sleep_query)
                sleeps = sleep_result.scalars().all()
                
                if not recoveries and not sleeps:
                    return {"status": "no_data"}
                    
                # Aggregate recovery metrics
                recovery_summary = {}
                if recoveries:
                    recovery_scores = [r.recovery_score for r in recoveries if r.recovery_score]
                    hrv_scores = [r.hrv_rmssd_milli for r in recoveries if r.hrv_rmssd_milli]
                    rhr_values = [r.resting_heart_rate for r in recoveries if r.resting_heart_rate]
                    
                    recovery_summary = {
                        "avg_recovery_score": round(sum(recovery_scores) / len(recovery_scores), 1) if recovery_scores else None,
                        "avg_hrv": round(sum(hrv_scores) / len(hrv_scores), 1) if hrv_scores else None,
                        "avg_rhr": round(sum(rhr_values) / len(rhr_values), 1) if rhr_values else None,
                        "latest_recovery": recovery_scores[-1] if recovery_scores else None,
                        "recovery_trend": "improving" if len(recovery_scores) >= 3 and recovery_scores[-1] > recovery_scores[-3] else "stable"
                    }
                    
                # Aggregate sleep metrics
                sleep_summary = {}
                if sleeps:
                    sleep_durations = [s.sleep_performance_percentage for s in sleeps if s.sleep_performance_percentage]
                    sleep_efficiencies = [s.sleep_efficiency_percentage for s in sleeps if s.sleep_efficiency_percentage]
                    
                    sleep_summary = {
                        "avg_sleep_performance": round(sum(sleep_durations) / len(sleep_durations), 1) if sleep_durations else None,
                        "avg_sleep_efficiency": round(sum(sleep_efficiencies) / len(sleep_efficiencies), 1) if sleep_efficiencies else None,
                        "recent_sleep_quality": "good" if sleep_durations and sleep_durations[-1] > 80 else "needs_improvement"
                    }
                    
                return {
                    "status": "success",
                    "period_days": days,
                    "recovery": recovery_summary,
                    "sleep": sleep_summary,
                    "data_points": len(recoveries) + len(sleeps)
                }
                
        except Exception as e:
            logger.error(f"Error getting recovery context for user {user_id}: {e}")
            return {"status": "error", "error": str(e)}


class QueryProcessor:
    """
    Main service for processing AI queries with context augmentation and response generation.
    """
    
    def __init__(self):
        """Initialize query processor with dependencies."""
        self.data_aggregator = UserDataAggregator()
        self.max_context_length = 4000  # Maximum context for GPT-4
        
        logger.info("Query processor initialized")

    async def process_query(
        self,
        query: str,
        user_id: Optional[str] = None,
        include_context: bool = True,
        context_days: int = 30,
    ) -> Dict[str, Any]:
        """
        Process a user query with context augmentation and AI response generation.
        
        Args:
            query: User's question or request
            user_id: User identifier for personalized context
            include_context: Whether to include RAG and user data context
            context_days: Days of user data to include in context
            
        Returns:
            Dict with AI response, context used, and metadata
            
        Raises:
            QueryProcessingError: For processing failures
        """
        try:
            if not query or not query.strip():
                raise QueryProcessingError("Query cannot be empty")
                
            logger.info(f"Processing query for user {user_id or 'anonymous'}: '{query[:100]}...'")
            
            # Start building response data
            response_data = {
                "query": query,
                "user_id": user_id,
                "timestamp": datetime.utcnow(),
                "context_included": include_context,
            }
            
            # Build context if requested
            context_text = ""
            context_sources = []
            
            if include_context:
                context_data = await self._build_comprehensive_context(
                    query=query,
                    user_id=user_id,
                    context_days=context_days
                )
                context_text = context_data["context_text"]
                context_sources = context_data["sources"]
                
                response_data.update({
                    "context_length": len(context_text),
                    "context_sources": len(context_sources),
                    "rag_matches": context_data.get("rag_matches", 0),
                    "user_data_included": context_data.get("user_data_included", False)
                })
                
            # Generate AI response
            ai_response = await self._generate_ai_response(
                query=query,
                context=context_text,
                user_id=user_id
            )
            
            response_data.update({
                "response": ai_response["content"],
                "ai_model": ai_response["model"],
                "tokens_used": ai_response["usage"]["total_tokens"],
                "finish_reason": ai_response["finish_reason"],
            })
            
            # Save to query history
            if user_id:
                await self._save_query_history(
                    user_id=user_id,
                    query=query,
                    response=ai_response["content"],
                    context_sources=context_sources,
                    tokens_used=ai_response["usage"]["total_tokens"]
                )
                
            logger.info(f"Query processed successfully: {ai_response['usage']['total_tokens']} tokens used")
            return response_data
            
        except (OpenAIError, RAGError) as e:
            logger.error(f"AI service error processing query: {e}")
            raise QueryProcessingError(f"AI processing failed: {e}")
            
        except Exception as e:
            logger.error(f"Unexpected error processing query: {e}")
            raise QueryProcessingError(f"Query processing failed: {e}")

    async def _build_comprehensive_context(
        self,
        query: str,
        user_id: Optional[str],
        context_days: int
    ) -> Dict[str, Any]:
        """
        Build comprehensive context from RAG and user data.
        
        Args:
            query: User's query for context relevance
            user_id: User ID for personalized data
            context_days: Days of user data to include
            
        Returns:
            Dict with combined context and source information
        """
        context_parts = []
        all_sources = []
        rag_matches = 0
        user_data_included = False
        
        try:
            # Get RAG context from knowledge base
            rag_context = await rag_service.get_context_for_query(
                query=query,
                max_context_length=2000,  # Leave room for user data
                user_id=user_id
            )
            
            if rag_context["context"]:
                context_parts.append(f"# Knowledge Base Context\n{rag_context['context']}")
                all_sources.extend(rag_context["sources"])
                rag_matches = rag_context["sources_count"]
                
        except Exception as e:
            logger.warning(f"Failed to get RAG context: {e}")
            
        try:
            # Get user's recent activity context
            if user_id:
                activities_context = await self.data_aggregator.get_recent_activities_context(
                    user_id=user_id,
                    days=context_days,
                    limit=10
                )
                
                if activities_context["status"] == "success":
                    activity_text = self._format_activities_context(activities_context)
                    context_parts.append(f"# Recent Training Data\n{activity_text}")
                    user_data_included = True
                    
                # Get recovery context
                recovery_context = await self.data_aggregator.get_recovery_context(
                    user_id=user_id,
                    days=min(context_days, 14)  # Recovery data is more recent
                )
                
                if recovery_context["status"] == "success":
                    recovery_text = self._format_recovery_context(recovery_context)
                    context_parts.append(f"# Recovery & Sleep Data\n{recovery_text}")
                    user_data_included = True
                    
        except Exception as e:
            logger.warning(f"Failed to get user data context: {e}")
            
        # Combine all context parts
        combined_context = "\n\n".join(context_parts)
        
        # Truncate if too long
        if len(combined_context) > self.max_context_length:
            combined_context = combined_context[:self.max_context_length - 3] + "..."
            
        return {
            "context_text": combined_context,
            "sources": all_sources,
            "rag_matches": rag_matches,
            "user_data_included": user_data_included,
        }

    def _format_activities_context(self, activities_data: Dict[str, Any]) -> str:
        """Format activities data for context inclusion."""
        if activities_data["status"] != "success":
            return "No recent activity data available."
            
        summary = f"""Recent {activities_data['period_days']} days summary:
- Total activities: {activities_data['total_activities']}
- Total distance: {activities_data['total_distance_km']} km
- Total time: {activities_data['total_time_hours']} hours
- Average pace: {activities_data['avg_pace_per_km']} min/km

Recent activities:"""
        
        for activity in activities_data["activities"][:5]:  # Limit to 5 most recent
            activity_line = f"- {activity['date']}: {activity['distance_km']}km in {activity['duration_min']}min"
            if activity["avg_hr"]:
                activity_line += f" (HR: {activity['avg_hr']})"
            summary += f"\n{activity_line}"
            
        return summary

    def _format_recovery_context(self, recovery_data: Dict[str, Any]) -> str:
        """Format recovery data for context inclusion."""
        if recovery_data["status"] != "success":
            return "No recent recovery data available."
            
        context_parts = []
        
        if recovery_data.get("recovery"):
            recovery = recovery_data["recovery"]
            recovery_text = f"Recovery metrics (last {recovery_data['period_days']} days):"
            if recovery.get("avg_recovery_score"):
                recovery_text += f"\n- Average recovery score: {recovery['avg_recovery_score']}%"
            if recovery.get("avg_hrv"):
                recovery_text += f"\n- Average HRV: {recovery['avg_hrv']}ms"
            if recovery.get("avg_rhr"):
                recovery_text += f"\n- Average resting HR: {recovery['avg_rhr']} bpm"
            if recovery.get("recovery_trend"):
                recovery_text += f"\n- Trend: {recovery['recovery_trend']}"
            context_parts.append(recovery_text)
            
        if recovery_data.get("sleep"):
            sleep = recovery_data["sleep"]
            sleep_text = "Sleep metrics:"
            if sleep.get("avg_sleep_performance"):
                sleep_text += f"\n- Average sleep performance: {sleep['avg_sleep_performance']}%"
            if sleep.get("avg_sleep_efficiency"):
                sleep_text += f"\n- Average sleep efficiency: {sleep['avg_sleep_efficiency']}%"
            if sleep.get("recent_sleep_quality"):
                sleep_text += f"\n- Recent sleep quality: {sleep['recent_sleep_quality']}"
            context_parts.append(sleep_text)
            
        return "\n\n".join(context_parts)

    async def _generate_ai_response(
        self,
        query: str,
        context: str,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Generate AI response using GPT-4 with appropriate prompt template.
        
        Args:
            query: User's query
            context: Augmented context text
            user_id: User identifier
            
        Returns:
            Dict with AI response and metadata
        """
        # Choose appropriate prompt template
        if context:
            user_message = PromptTemplates.CONTEXT_INTEGRATION_PROMPT.format(
                context=context,
                query=query
            )
        else:
            user_message = PromptTemplates.GENERAL_FITNESS_PROMPT.format(query=query)
            
        messages = [
            {"role": "system", "content": PromptTemplates.SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ]
        
        return await openai_service.create_chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
            user_id=user_id
        )

    async def _save_query_history(
        self,
        user_id: str,
        query: str,
        response: str,
        context_sources: List[Dict[str, Any]],
        tokens_used: int
    ) -> None:
        """Save query and response to history."""
        try:
            async with get_database_session() as session:
                history_entry = QueryHistory(
                    user_id=user_id,
                    query_text=query,
                    response_text=response,
                    context_sources=context_sources,
                    tokens_used=tokens_used,
                    created_at=datetime.utcnow()
                )
                session.add(history_entry)
                await session.commit()
                
        except Exception as e:
            logger.error(f"Failed to save query history: {e}")
            # Don't raise - this is not critical to the main flow

    async def get_query_history(
        self,
        user_id: str,
        limit: int = 20,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get user's query history.
        
        Args:
            user_id: User identifier
            limit: Maximum number of queries to return
            days: Days to look back
            
        Returns:
            List of query history entries
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            async with get_database_session() as session:
                query = select(QueryHistory).where(
                    QueryHistory.user_id == user_id,
                    QueryHistory.created_at >= cutoff_date
                ).order_by(desc(QueryHistory.created_at)).limit(limit)
                
                result = await session.execute(query)
                histories = result.scalars().all()
                
                return [{
                    "id": h.id,
                    "query": h.query_text,
                    "response": h.response_text,
                    "tokens_used": h.tokens_used,
                    "created_at": h.created_at.isoformat() if h.created_at else None,
                    "context_sources_count": len(h.context_sources) if h.context_sources else 0
                } for h in histories]
                
        except Exception as e:
            logger.error(f"Error getting query history for user {user_id}: {e}")
            raise QueryProcessingError(f"Failed to get query history: {e}")

    async def generate_sql_query(
        self,
        question: str,
        schema_context: str,
        max_attempts: int = 3
    ) -> Dict[str, Any]:
        """
        Generate SQL query using DIN-SQL decomposition approach.
        
        Args:
            question: User's natural language question
            schema_context: Relevant schema context from vector search
            max_attempts: Maximum number of generation attempts
            
        Returns:
            Dict with SQL query, thought process, and metadata
            
        Raises:
            QueryProcessingError: For generation failures
        """
        try:
            logger.info(f"Generating SQL for: '{question[:50]}...'")
            
            for attempt in range(max_attempts):
                try:
                    # Step 1: Query decomposition and SQL generation
                    thinker_response = await openai_service.create_chat_completion(
                        messages=[{
                            "role": "system",
                            "content": PromptTemplates.QUERY_THINKER_PROMPT.format(
                                schema_context=schema_context,
                                question=question
                            )
                        }],
                        temperature=0.0,
                        max_tokens=1000,
                        response_format={"type": "json_object"}
                    )

                    # Parse the response
                    thinker_data = json.loads(thinker_response["content"])
                    
                    required_keys = ["thought", "plan", "sql"]
                    if not all(key in thinker_data for key in required_keys):
                        raise ValueError(f"Missing required keys in thinker response: {required_keys}")
                    
                    # Step 2: Self-correction and validation
                    reviewer_response = await openai_service.create_chat_completion(
                        messages=[{
                            "role": "system", 
                            "content": PromptTemplates.SQL_REVIEWER_PROMPT.format(
                                plan=thinker_data["plan"],
                                sql=thinker_data["sql"],
                                question=question
                            )
                        }],
                        temperature=0.0,
                        max_tokens=500,
                        response_format={"type": "json_object"}
                    )
                    
                    reviewer_data = json.loads(reviewer_response["content"])
                    
                    if reviewer_data.get("is_valid", False):
                        # Query is valid
                        return {
                            "sql": thinker_data["sql"],
                            "thought": thinker_data["thought"],
                            "plan": thinker_data["plan"],
                            "validation": reviewer_data.get("explanation", "Query validated"),
                            "attempts": attempt + 1
                        }
                    else:
                        # Query has issues
                        if attempt == max_attempts - 1:
                            # Last attempt, return the issues
                            raise QueryProcessingError(
                                f"SQL generation failed after {max_attempts} attempts. "
                                f"Final issues: {reviewer_data.get('issues', ['Unknown validation error'])}"
                            )
                        
                        # Use suggested fix if available
                        if "suggested_fix" in reviewer_data:
                            thinker_data["sql"] = reviewer_data["suggested_fix"]
                            continue
                        
                        logger.warning(f"Attempt {attempt + 1} failed: {reviewer_data.get('issues')}")
                        
                except json.JSONDecodeError as e:
                    logger.error(f"JSON parsing error on attempt {attempt + 1}: {e}")
                    if attempt == max_attempts - 1:
                        raise QueryProcessingError(f"Failed to parse AI response after {max_attempts} attempts")
                
                except Exception as e:
                    logger.error(f"SQL generation attempt {attempt + 1} failed: {e}")
                    if attempt == max_attempts - 1:
                        raise QueryProcessingError(f"SQL generation failed: {e}")
            
            raise QueryProcessingError("Unexpected error in SQL generation loop")
            
        except Exception as e:
            logger.error(f"Error in SQL generation: {e}")
            raise QueryProcessingError(f"Failed to generate SQL query: {e}")

    async def execute_safe_query(
        self,
        sql: str,
        timeout_seconds: int = 30
    ) -> Dict[str, Any]:
        """
        Execute SQL query with safety constraints.
        
        Args:
            sql: SQL query to execute
            timeout_seconds: Query timeout
            
        Returns:
            Dict with query results and metadata
            
        Raises:
            QueryProcessingError: For execution errors
        """
        try:
            # Basic safety checks
            sql_upper = sql.upper().strip()
            
            # Block dangerous operations
            dangerous_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE']
            for keyword in dangerous_keywords:
                if keyword in sql_upper:
                    raise QueryProcessingError(f"Query contains dangerous operation: {keyword}")
            
            # Ensure query has LIMIT
            if 'LIMIT' not in sql_upper:
                sql = f"{sql.rstrip(';')} LIMIT 100"
            
            logger.info(f"Executing safe query: {sql[:100]}...")
            
            async with async_session_factory() as session:
                # Set query timeout
                await session.execute(text(f"SET statement_timeout = '{timeout_seconds}s'"))
                
                # Execute query
                result = await session.execute(text(sql))
                rows = result.fetchall()
                
                # Get column names
                columns = list(result.keys()) if hasattr(result, 'keys') else []
                
                # Convert to list of dicts
                data = []
                for row in rows:
                    row_dict = {}
                    for i, col in enumerate(columns):
                        value = row[i] if i < len(row) else None
                        # Handle datetime objects
                        if value is not None and hasattr(value, 'isoformat'):
                            value = value.isoformat()
                        row_dict[col] = value
                    data.append(row_dict)
                
                logger.info(f"Query executed successfully, returned {len(data)} rows")
                
                return {
                    "data": data,
                    "columns": columns,
                    "row_count": len(data),
                    "sql_executed": sql
                }
                
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            raise QueryProcessingError(f"Query execution failed: {e}")

    async def process_query_with_sql(
        self,
        question: str,
        user_id: Optional[str] = None,
        include_context: bool = True
    ) -> Dict[str, Any]:
        """
        Process user query using the complete DIN-SQL pipeline.
        
        This is the main method that integrates schema search, SQL generation,
        execution, and natural language response generation.
        
        Args:
            question: User's natural language question
            user_id: User identifier for personalized responses
            include_context: Whether to include RAG context
            
        Returns:
            Dict with response, data, explanations, and metadata
        """
        start_time = datetime.utcnow()
        logger.info(f"Processing query with SQL: '{question[:50]}...'")

        try:
            # Step 1: Schema context retrieval using RAG
            logger.info("Step 1: Retrieving schema context...")
            schema_context = await rag_service.schema_vector_search(question, limit=12)

            if not schema_context:
                raise QueryProcessingError("No relevant schema context found")

            # Step 2: SQL generation using DIN-SQL approach
            logger.info("Step 2: Generating SQL query...")
            sql_result = await self.generate_sql_query(question, schema_context)

            # Step 3: Safe query execution
            logger.info("Step 3: Executing query...")
            query_result = await self.execute_safe_query(sql_result["sql"])

            # Step 4: Generate natural language response
            logger.info("Step 4: Generating natural language response...")

            response_prompt = f"""
            Original Question: "{question}"
            
            Query Results: {json.dumps(query_result["data"], indent=2)}
            
            Please provide a natural, conversational response about Camilo's fitness data. 
            Focus on the key insights from the results. Keep it concise but informative (2-3 sentences max).
            Use fitness terminology appropriately and maintain a professional but friendly tone.
            Always refer to data in third person (e.g., "Camilo's average recovery score is..." rather than "Your average...").
            """
            
            nl_response = await openai_service.create_chat_completion(
                messages=[{
                    "role": "system",
                    "content": "You are analyzing Camilo Martinez's fitness data. Provide insights in third person."
                }, {
                    "role": "user", 
                    "content": response_prompt
                }],
                temperature=0.7,
                max_tokens=200
            )
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            # Prepare response
            response_data = {
                "response": nl_response["content"],
                "data": query_result["data"],
                "explanation": {
                    "thought": sql_result["thought"],
                    "plan": sql_result["plan"],
                    "sql": sql_result["sql"]
                },
                "result_count": query_result["row_count"],
                "processing_time_ms": int(processing_time),
                "history_id": None  # Will be set after saving to history
            }
            
            # Step 5: Save to query history
            if user_id:
                try:
                    async with async_session_factory() as session:
                        history_entry = QueryHistory(
                            user_question=question,
                            retrieved_context=schema_context[:1000],  # Truncate for storage
                            generated_sql=sql_result["sql"],
                            was_successful=True,
                            latency_ms=int(processing_time)
                        )
                        session.add(history_entry)
                        await session.commit()
                        await session.refresh(history_entry)
                        
                        response_data["history_id"] = history_entry.id
                        
                except Exception as e:
                    logger.error(f"Failed to save query history: {e}")
                    # Don't fail the main response for history issues

            logger.info(f"Query processed successfully in {processing_time:.0f}ms")
            return response_data

        except Exception as e:
            # Log failure to history
            if user_id:
                try:
                    async with async_session_factory() as session:
                        history_entry = QueryHistory(
                            user_question=question,
                            retrieved_context=schema_context if 'schema_context' in locals() else None,
                            generated_sql=sql_result["sql"] if 'sql_result' in locals() else None,
                            was_successful=False,
                            latency_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000)
                        )
                        session.add(history_entry)
                        await session.commit()
                        
                        # Trigger automatic learning from this failure
                        try:
                            result = await self_improving_agent.learn_from_feedback(
                                query_id=history_entry.id
                            )
                            logger.info(f"Self-improving agent triggered for query {history_entry.id}: {result.get('status')}")
                        except Exception as learn_e:
                            # Don't let learning failures crash the query response
                            logger.error(f"Failed to trigger self-improving agent: {learn_e}")
                            
                except Exception as hist_e:
                    logger.error(f"Failed to log failed query: {hist_e}")

            logger.error(f"Error processing query: {e}")
            # Provide a graceful fallback response rather than bubbling the error
            return self._fallback_response(question, user_id=user_id)

    # ------------------------------------------------------------------
    # Fallback Helpers
    # ------------------------------------------------------------------

    def _fallback_response(
        self,
        question: str,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Return an honest error response when the query pipeline fails.
        No fake data - just tell the user we couldn't process their request.
        """

        logger.warning(f"Fallback response triggered for question: {question}")

        return {
            "response": (
                "I wasn't able to process that query. This could mean:\n"
                "- The data you're asking about isn't available yet\n"
                "- The question couldn't be translated to a database query\n"
                "- There was a technical issue\n\n"
                "Try rephrasing your question or ask about specific metrics like recovery scores, "
                "sleep data, or training activities."
            ),
            "data": [],
            "explanation": {
                "thought": "Query processing failed",
                "plan": "Unable to generate valid SQL or retrieve data",
                "sql": None,
            },
            "result_count": 0,
            "processing_time_ms": 0,
            "history_id": None,
            "metadata": {
                "user_id": user_id or "demo_user",
                "fallback": True,
                "error": True,
            },
        }


# Global service instance
query_processor = QueryProcessor()
