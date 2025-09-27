"""
AI Trainer Evaluation Service for performance analysis and training recommendations.
Migrates TypeScript AI trainer logic to Python with advanced analytics and feedback loops.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import statistics
from sqlalchemy import select, func, and_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_database_session
from app.models.user import User
from app.models.strava import StravaRun
from app.models.whoop import WHOOPSleep, WHOOPWorkout, WHOOPRecovery
from app.models.ai_query import AITrainerEvaluation
from app.services.ai.openai_client import openai_service, OpenAIError

logger = logging.getLogger(__name__)


class TrainerError(Exception):
    """Custom exception for AI trainer errors."""
    pass


class TrainingPhase(Enum):
    """Training phase classifications."""
    BASE_BUILDING = "base_building"
    BUILD = "build" 
    PEAK = "peak"
    RECOVERY = "recovery"
    MAINTENANCE = "maintenance"


class PerformanceMetric(Enum):
    """Performance metrics for analysis."""
    PACE_IMPROVEMENT = "pace_improvement"
    ENDURANCE_GAIN = "endurance_gain"
    RECOVERY_TREND = "recovery_trend"
    CONSISTENCY = "consistency"
    TRAINING_LOAD = "training_load"


@dataclass
class TrainingMetrics:
    """Structured training metrics for analysis."""
    total_distance: float
    total_time: float
    avg_pace: float
    avg_heart_rate: Optional[float]
    elevation_gain: float
    training_load: float
    recovery_score: Optional[float]
    hrv_trend: Optional[str]
    consistency_score: float
    

@dataclass
class PerformanceAnalysis:
    """Comprehensive performance analysis results."""
    period_days: int
    training_metrics: TrainingMetrics
    performance_trends: Dict[str, Any]
    recommendations: List[str]
    risk_factors: List[str]
    training_phase: TrainingPhase
    confidence_score: float


class PerformanceAnalyzer:
    """
    Advanced performance analysis engine for training metrics.
    """
    
    def __init__(self):
        """Initialize performance analyzer."""
        self.min_activities_for_analysis = 5
        self.pace_improvement_threshold = 0.02  # 2% improvement
        self.consistency_threshold = 0.8  # 80% consistency target
        
    async def analyze_performance_trends(
        self,
        user_id: str,
        analysis_period: int = 90,
        comparison_period: int = 30
    ) -> Dict[str, Any]:
        """
        Analyze performance trends over specified periods.
        
        Args:
            user_id: User identifier
            analysis_period: Main analysis period in days
            comparison_period: Recent period for trend comparison
            
        Returns:
            Dict with comprehensive trend analysis
        """
        try:
            current_date = datetime.utcnow()
            analysis_start = current_date - timedelta(days=analysis_period)
            comparison_start = current_date - timedelta(days=comparison_period)
            
            async with get_database_session() as session:
                # Get all activities in analysis period
                full_period_query = select(StravaRun).where(
                    StravaRun.user_id == user_id,
                    StravaRun.start_date >= analysis_start
                ).order_by(asc(StravaRun.start_date))
                
                full_activities = (await session.execute(full_period_query)).scalars().all()
                
                # Get recent activities for comparison
                recent_query = select(StravaRun).where(
                    StravaRun.user_id == user_id,
                    StravaRun.start_date >= comparison_start
                ).order_by(asc(StravaRun.start_date))
                
                recent_activities = (await session.execute(recent_query)).scalars().all()
                
                if len(full_activities) < self.min_activities_for_analysis:
                    return {
                        "status": "insufficient_data",
                        "message": f"Need at least {self.min_activities_for_analysis} activities for analysis",
                        "activities_found": len(full_activities)
                    }
                    
                # Analyze pace trends
                pace_analysis = self._analyze_pace_trends(full_activities, recent_activities)
                
                # Analyze volume trends
                volume_analysis = self._analyze_volume_trends(full_activities, recent_activities)
                
                # Analyze consistency
                consistency_analysis = self._analyze_consistency(full_activities)
                
                # Get recovery correlation if available
                recovery_analysis = await self._analyze_recovery_correlation(
                    session, user_id, analysis_start
                )
                
                return {
                    "status": "success",
                    "analysis_period_days": analysis_period,
                    "comparison_period_days": comparison_period,
                    "total_activities": len(full_activities),
                    "pace_trends": pace_analysis,
                    "volume_trends": volume_analysis,
                    "consistency": consistency_analysis,
                    "recovery_correlation": recovery_analysis,
                    "overall_trend": self._determine_overall_trend(
                        pace_analysis, volume_analysis, consistency_analysis
                    )
                }
                
        except Exception as e:
            logger.error(f"Error analyzing performance trends for user {user_id}: {e}")
            raise TrainerError(f"Performance analysis failed: {e}")

    def _analyze_pace_trends(
        self,
        full_activities: List[StravaRun],
        recent_activities: List[StravaRun]
    ) -> Dict[str, Any]:
        """Analyze pace improvement trends."""
        # Calculate average paces
        full_paces = [a.average_pace for a in full_activities if a.average_pace and a.average_pace > 0]
        recent_paces = [a.average_pace for a in recent_activities if a.average_pace and a.average_pace > 0]
        
        if not full_paces or not recent_paces:
            return {"status": "no_pace_data"}
            
        full_avg_pace = statistics.mean(full_paces)
        recent_avg_pace = statistics.mean(recent_paces)
        
        # Calculate improvement (lower pace is better)
        pace_change_percent = ((full_avg_pace - recent_avg_pace) / full_avg_pace) * 100
        
        # Determine trend
        if pace_change_percent >= self.pace_improvement_threshold * 100:
            trend = "improving"
        elif pace_change_percent <= -self.pace_improvement_threshold * 100:
            trend = "declining"
        else:
            trend = "stable"
            
        # Calculate pace consistency
        pace_std = statistics.stdev(full_paces) if len(full_paces) > 1 else 0
        pace_cv = (pace_std / full_avg_pace) * 100 if full_avg_pace > 0 else 0
        
        return {
            "status": "success",
            "full_period_avg_pace": round(full_avg_pace, 2),
            "recent_avg_pace": round(recent_avg_pace, 2),
            "pace_change_percent": round(pace_change_percent, 2),
            "trend": trend,
            "pace_consistency_cv": round(pace_cv, 2),
            "fastest_pace": min(full_paces),
            "activities_analyzed": len(full_paces)
        }

    def _analyze_volume_trends(
        self,
        full_activities: List[StravaRun],
        recent_activities: List[StravaRun]
    ) -> Dict[str, Any]:
        """Analyze training volume trends."""
        # Calculate weekly averages
        full_period_weeks = len(full_activities) / 7 if full_activities else 1
        recent_period_weeks = len(recent_activities) / 7 if recent_activities else 1
        
        full_weekly_distance = sum(a.distance or 0 for a in full_activities) / 1000 / full_period_weeks
        recent_weekly_distance = sum(a.distance or 0 for a in recent_activities) / 1000 / recent_period_weeks
        
        full_weekly_time = sum(a.moving_time or 0 for a in full_activities) / 3600 / full_period_weeks
        recent_weekly_time = sum(a.moving_time or 0 for a in recent_activities) / 3600 / recent_period_weeks
        
        # Calculate trends
        distance_change = ((recent_weekly_distance - full_weekly_distance) / full_weekly_distance * 100) if full_weekly_distance > 0 else 0
        time_change = ((recent_weekly_time - full_weekly_time) / full_weekly_time * 100) if full_weekly_time > 0 else 0
        
        return {
            "full_period_weekly_km": round(full_weekly_distance, 1),
            "recent_weekly_km": round(recent_weekly_distance, 1),
            "distance_change_percent": round(distance_change, 1),
            "full_period_weekly_hours": round(full_weekly_time, 1),
            "recent_weekly_hours": round(recent_weekly_time, 1),
            "time_change_percent": round(time_change, 1),
            "volume_trend": "increasing" if distance_change > 10 else ("decreasing" if distance_change < -10 else "stable")
        }

    def _analyze_consistency(self, activities: List[StravaRun]) -> Dict[str, Any]:
        """Analyze training consistency."""
        if not activities:
            return {"status": "no_data"}
            
        # Calculate weekly consistency
        total_weeks = len(activities) / 7
        activities_per_week = len(activities) / total_weeks if total_weeks > 0 else 0
        
        # Calculate distance consistency
        distances = [a.distance/1000 for a in activities if a.distance]
        distance_cv = (statistics.stdev(distances) / statistics.mean(distances) * 100) if len(distances) > 1 else 0
        
        # Consistency score (lower CV = higher consistency)
        consistency_score = max(0, 100 - distance_cv) / 100
        
        return {
            "activities_per_week": round(activities_per_week, 1),
            "distance_consistency_cv": round(distance_cv, 1),
            "consistency_score": round(consistency_score, 2),
            "consistency_rating": "high" if consistency_score >= 0.8 else ("medium" if consistency_score >= 0.6 else "low")
        }

    async def _analyze_recovery_correlation(
        self,
        session: AsyncSession,
        user_id: str,
        start_date: datetime
    ) -> Dict[str, Any]:
        """Analyze correlation between training and recovery."""
        try:
            # Get recovery data
            recovery_query = select(WHOOPRecovery).where(
                WHOOPRecovery.user_id == user_id,
                WHOOPRecovery.cycle_start >= start_date
            ).order_by(asc(WHOOPRecovery.cycle_start))
            
            recoveries = (await session.execute(recovery_query)).scalars().all()
            
            if len(recoveries) < 7:  # Need at least a week of data
                return {"status": "insufficient_recovery_data"}
                
            # Calculate recovery trends
            recovery_scores = [r.recovery_score for r in recoveries if r.recovery_score]
            hrv_values = [r.hrv_rmssd_milli for r in recoveries if r.hrv_rmssd_milli]
            
            if not recovery_scores:
                return {"status": "no_recovery_scores"}
                
            avg_recovery = statistics.mean(recovery_scores)
            recovery_trend = "improving" if len(recovery_scores) >= 7 and recovery_scores[-3:] > recovery_scores[:3] else "stable"
            
            return {
                "status": "success",
                "avg_recovery_score": round(avg_recovery, 1),
                "recovery_trend": recovery_trend,
                "recovery_consistency": round(statistics.stdev(recovery_scores) if len(recovery_scores) > 1 else 0, 1),
                "data_points": len(recovery_scores)
            }
            
        except Exception as e:
            logger.warning(f"Could not analyze recovery correlation: {e}")
            return {"status": "error", "message": str(e)}

    def _determine_overall_trend(
        self,
        pace_analysis: Dict[str, Any],
        volume_analysis: Dict[str, Any],
        consistency_analysis: Dict[str, Any]
    ) -> str:
        """Determine overall performance trend."""
        positive_indicators = 0
        
        # Check pace trend
        if pace_analysis.get("trend") == "improving":
            positive_indicators += 2
        elif pace_analysis.get("trend") == "stable":
            positive_indicators += 1
            
        # Check volume trend
        if volume_analysis.get("volume_trend") == "increasing":
            positive_indicators += 1
            
        # Check consistency
        if consistency_analysis.get("consistency_rating") == "high":
            positive_indicators += 1
            
        if positive_indicators >= 3:
            return "strong_improvement"
        elif positive_indicators >= 2:
            return "moderate_improvement"
        elif positive_indicators >= 1:
            return "stable"
        else:
            return "needs_attention"


class TrainingRecommendationEngine:
    """
    AI-powered training recommendation engine with personalized guidance.
    """
    
    def __init__(self):
        """Initialize recommendation engine."""
        self.performance_analyzer = PerformanceAnalyzer()
        
    async def generate_training_recommendations(
        self,
        user_id: str,
        performance_analysis: Dict[str, Any],
        user_goals: Optional[str] = None,
        upcoming_events: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized training recommendations based on performance analysis.
        
        Args:
            user_id: User identifier
            performance_analysis: Results from performance analysis
            user_goals: User's stated training goals
            upcoming_events: List of upcoming races/events
            
        Returns:
            Dict with structured recommendations and action items
        """
        try:
            if performance_analysis["status"] != "success":
                return {
                    "status": "cannot_recommend",
                    "reason": "Insufficient performance data for recommendations"
                }
                
            logger.info(f"Generating training recommendations for user {user_id}")
            
            # Build context for AI recommendations
            context = self._build_recommendation_context(
                performance_analysis, user_goals, upcoming_events
            )
            
            # Generate AI-powered recommendations
            ai_recommendations = await self._generate_ai_recommendations(
                context, user_id
            )
            
            # Add structured action items
            action_items = self._generate_action_items(performance_analysis)
            
            # Calculate priority scores
            priorities = self._calculate_recommendation_priorities(performance_analysis)
            
            return {
                "status": "success",
                "user_id": user_id,
                "generated_at": datetime.utcnow().isoformat(),
                "ai_recommendations": ai_recommendations,
                "action_items": action_items,
                "priorities": priorities,
                "next_review_date": (datetime.utcnow() + timedelta(days=14)).date().isoformat(),
                "confidence_score": self._calculate_confidence_score(performance_analysis)
            }
            
        except Exception as e:
            logger.error(f"Error generating recommendations for user {user_id}: {e}")
            raise TrainerError(f"Recommendation generation failed: {e}")

    def _build_recommendation_context(
        self,
        performance_analysis: Dict[str, Any],
        user_goals: Optional[str],
        upcoming_events: Optional[List[Dict[str, Any]]]
    ) -> str:
        """Build context string for AI recommendation generation."""
        context_parts = [
            "# Performance Analysis Summary",
            f"- Overall trend: {performance_analysis.get('overall_trend', 'unknown')}",
            f"- Total activities: {performance_analysis.get('total_activities', 0)}",
            f"- Analysis period: {performance_analysis.get('analysis_period_days', 0)} days"
        ]
        
        # Add pace analysis
        pace_data = performance_analysis.get("pace_trends", {})
        if pace_data.get("status") == "success":
            context_parts.extend([
                "\n# Pace Analysis",
                f"- Recent average pace: {pace_data.get('recent_avg_pace', 'N/A')} min/km",
                f"- Pace trend: {pace_data.get('trend', 'unknown')}",
                f"- Pace change: {pace_data.get('pace_change_percent', 0)}%"
            ])
            
        # Add volume analysis
        volume_data = performance_analysis.get("volume_trends", {})
        context_parts.extend([
            "\n# Training Volume",
            f"- Recent weekly distance: {volume_data.get('recent_weekly_km', 0)} km",
            f"- Volume trend: {volume_data.get('volume_trend', 'unknown')}",
            f"- Distance change: {volume_data.get('distance_change_percent', 0)}%"
        ])
        
        # Add consistency analysis
        consistency_data = performance_analysis.get("consistency", {})
        context_parts.extend([
            "\n# Training Consistency",
            f"- Activities per week: {consistency_data.get('activities_per_week', 0)}",
            f"- Consistency rating: {consistency_data.get('consistency_rating', 'unknown')}",
            f"- Consistency score: {consistency_data.get('consistency_score', 0)}"
        ])
        
        # Add recovery if available
        recovery_data = performance_analysis.get("recovery_correlation", {})
        if recovery_data.get("status") == "success":
            context_parts.extend([
                "\n# Recovery Analysis",
                f"- Average recovery score: {recovery_data.get('avg_recovery_score', 'N/A')}%",
                f"- Recovery trend: {recovery_data.get('recovery_trend', 'unknown')}"
            ])
            
        # Add user goals if provided
        if user_goals:
            context_parts.extend([
                "\n# User Goals",
                user_goals
            ])
            
        # Add upcoming events if provided
        if upcoming_events:
            context_parts.append("\n# Upcoming Events")
            for event in upcoming_events:
                context_parts.append(f"- {event.get('name', 'Event')}: {event.get('date', 'TBD')}")
                
        return "\n".join(context_parts)

    async def _generate_ai_recommendations(self, context: str, user_id: str) -> str:
        """Generate AI-powered recommendations using GPT-4."""
        prompt = f"""As an expert running coach and sports scientist, analyze the following training data and provide personalized recommendations:

{context}

Please provide specific, actionable training recommendations covering:

1. **Training Focus Areas**: What should the athlete prioritize in the next 2-4 weeks?
2. **Weekly Structure**: Suggested training schedule and workout types
3. **Intensity Distribution**: How to balance easy runs, tempo work, and speed work
4. **Recovery Optimization**: Specific recommendations for rest and recovery
5. **Risk Management**: Any warning signs or areas of concern to monitor
6. **Performance Targets**: Realistic short-term goals and metrics to track

Be specific with paces, distances, and frequencies where appropriate. Consider the athlete's current fitness level and recent trends."""

        messages = [
            {
                "role": "system",
                "content": "You are an expert running coach with deep knowledge of exercise physiology, training periodization, and performance optimization. Provide evidence-based, personalized recommendations."
            },
            {
                "role": "user", 
                "content": prompt
            }
        ]
        
        try:
            response = await openai_service.create_chat_completion(
                messages=messages,
                temperature=0.3,  # Lower temperature for more consistent recommendations
                max_tokens=1200,
                user_id=user_id
            )
            
            return response["content"]
            
        except Exception as e:
            logger.error(f"Failed to generate AI recommendations: {e}")
            return "Unable to generate AI recommendations at this time. Please try again later."

    def _generate_action_items(self, performance_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate structured action items based on performance analysis."""
        action_items = []
        
        overall_trend = performance_analysis.get("overall_trend", "stable")
        pace_trends = performance_analysis.get("pace_trends", {})
        volume_trends = performance_analysis.get("volume_trends", {})
        consistency = performance_analysis.get("consistency", {})
        
        # Pace-based recommendations
        if pace_trends.get("trend") == "declining":
            action_items.append({
                "category": "pace_improvement",
                "priority": "high",
                "action": "Incorporate more tempo runs and interval training",
                "timeline": "2-3 weeks",
                "specific_guidance": "Add 1 tempo run and 1 interval session per week"
            })
            
        # Volume-based recommendations
        volume_trend = volume_trends.get("volume_trend", "stable")
        if volume_trend == "decreasing":
            action_items.append({
                "category": "training_volume",
                "priority": "medium",
                "action": "Gradually increase weekly mileage",
                "timeline": "4-6 weeks", 
                "specific_guidance": "Increase by 10% per week, maximum"
            })
            
        # Consistency recommendations
        consistency_rating = consistency.get("consistency_rating", "medium")
        if consistency_rating == "low":
            action_items.append({
                "category": "consistency",
                "priority": "high",
                "action": "Establish regular training schedule",
                "timeline": "1-2 weeks",
                "specific_guidance": "Aim for at least 3 runs per week on consistent days"
            })
            
        # Recovery recommendations
        recovery_data = performance_analysis.get("recovery_correlation", {})
        if recovery_data.get("avg_recovery_score", 100) < 60:
            action_items.append({
                "category": "recovery",
                "priority": "high",
                "action": "Prioritize sleep and recovery protocols",
                "timeline": "immediate",
                "specific_guidance": "Focus on 8+ hours sleep, reduce training intensity temporarily"
            })
            
        return action_items

    def _calculate_recommendation_priorities(self, performance_analysis: Dict[str, Any]) -> Dict[str, str]:
        """Calculate priority levels for different training areas."""
        priorities = {}
        
        # Pace priority
        pace_trend = performance_analysis.get("pace_trends", {}).get("trend", "stable")
        if pace_trend == "declining":
            priorities["pace_work"] = "high"
        elif pace_trend == "stable":
            priorities["pace_work"] = "medium"
        else:
            priorities["pace_work"] = "low"
            
        # Volume priority
        volume_trend = performance_analysis.get("volume_trends", {}).get("volume_trend", "stable")
        recent_weekly_km = performance_analysis.get("volume_trends", {}).get("recent_weekly_km", 0)
        if recent_weekly_km < 20:  # Low weekly volume
            priorities["volume_building"] = "high"
        elif volume_trend == "decreasing":
            priorities["volume_building"] = "medium"
        else:
            priorities["volume_building"] = "low"
            
        # Consistency priority
        consistency_rating = performance_analysis.get("consistency", {}).get("consistency_rating", "medium")
        if consistency_rating == "low":
            priorities["consistency"] = "high"
        else:
            priorities["consistency"] = "medium"
            
        # Recovery priority
        recovery_data = performance_analysis.get("recovery_correlation", {})
        if recovery_data.get("avg_recovery_score", 100) < 60:
            priorities["recovery"] = "high"
        else:
            priorities["recovery"] = "medium"
            
        return priorities

    def _calculate_confidence_score(self, performance_analysis: Dict[str, Any]) -> float:
        """Calculate confidence score for recommendations based on data quality."""
        confidence_factors = []
        
        # Data volume factor
        total_activities = performance_analysis.get("total_activities", 0)
        if total_activities >= 20:
            confidence_factors.append(1.0)
        elif total_activities >= 10:
            confidence_factors.append(0.8)
        elif total_activities >= 5:
            confidence_factors.append(0.6)
        else:
            confidence_factors.append(0.3)
            
        # Data recency factor
        analysis_period = performance_analysis.get("analysis_period_days", 0)
        if analysis_period >= 60:
            confidence_factors.append(1.0)
        elif analysis_period >= 30:
            confidence_factors.append(0.8)
        else:
            confidence_factors.append(0.6)
            
        # Recovery data availability
        recovery_status = performance_analysis.get("recovery_correlation", {}).get("status", "error")
        if recovery_status == "success":
            confidence_factors.append(1.0)
        else:
            confidence_factors.append(0.7)
            
        return sum(confidence_factors) / len(confidence_factors) if confidence_factors else 0.5


class TrainerService:
    """
    Main AI Trainer service integrating performance analysis and recommendations.
    """
    
    def __init__(self):
        """Initialize trainer service."""
        self.analyzer = PerformanceAnalyzer()
        self.recommendation_engine = TrainingRecommendationEngine()
        
        logger.info("AI Trainer service initialized")

    async def evaluate_athlete(
        self,
        user_id: str,
        analysis_period: int = 90,
        user_goals: Optional[str] = None,
        save_evaluation: bool = True
    ) -> Dict[str, Any]:
        """
        Comprehensive athlete evaluation with performance analysis and recommendations.
        
        Args:
            user_id: User identifier
            analysis_period: Period in days for analysis
            user_goals: User's training goals
            save_evaluation: Whether to save evaluation to database
            
        Returns:
            Dict with complete evaluation results
        """
        try:
            logger.info(f"Starting athlete evaluation for user {user_id}")
            
            # Perform performance analysis
            performance_analysis = await self.analyzer.analyze_performance_trends(
                user_id=user_id,
                analysis_period=analysis_period,
                comparison_period=min(30, analysis_period // 3)
            )
            
            if performance_analysis["status"] != "success":
                return {
                    "status": "evaluation_failed",
                    "reason": performance_analysis.get("message", "Performance analysis failed"),
                    "user_id": user_id
                }
                
            # Generate recommendations
            recommendations = await self.recommendation_engine.generate_training_recommendations(
                user_id=user_id,
                performance_analysis=performance_analysis,
                user_goals=user_goals
            )
            
            # Combine results
            evaluation_result = {
                "status": "success",
                "user_id": user_id,
                "evaluation_date": datetime.utcnow().isoformat(),
                "analysis_period_days": analysis_period,
                "performance_analysis": performance_analysis,
                "recommendations": recommendations,
                "summary": {
                    "overall_trend": performance_analysis.get("overall_trend", "unknown"),
                    "key_strengths": self._identify_strengths(performance_analysis),
                    "improvement_areas": self._identify_improvement_areas(performance_analysis),
                    "confidence_score": recommendations.get("confidence_score", 0.5)
                }
            }
            
            # Save to database if requested
            if save_evaluation:
                await self._save_evaluation(user_id, evaluation_result)
                
            logger.info(f"Athlete evaluation completed for user {user_id}")
            return evaluation_result
            
        except Exception as e:
            logger.error(f"Error in athlete evaluation for user {user_id}: {e}")
            raise TrainerError(f"Athlete evaluation failed: {e}")

    def _identify_strengths(self, performance_analysis: Dict[str, Any]) -> List[str]:
        """Identify athlete's key strengths from performance data."""
        strengths = []
        
        pace_trends = performance_analysis.get("pace_trends", {})
        if pace_trends.get("trend") == "improving":
            strengths.append("Pace improvement - showing consistent speed gains")
            
        consistency = performance_analysis.get("consistency", {})
        if consistency.get("consistency_rating") == "high":
            strengths.append("Training consistency - maintaining regular workout schedule")
            
        volume_trends = performance_analysis.get("volume_trends", {})
        if volume_trends.get("recent_weekly_km", 0) > 40:
            strengths.append("High training volume - building solid aerobic base")
            
        recovery_data = performance_analysis.get("recovery_correlation", {})
        if recovery_data.get("avg_recovery_score", 0) > 75:
            strengths.append("Good recovery - maintaining high readiness scores")
            
        return strengths or ["Consistent training participation"]

    def _identify_improvement_areas(self, performance_analysis: Dict[str, Any]) -> List[str]:
        """Identify areas needing improvement from performance data."""
        improvement_areas = []
        
        pace_trends = performance_analysis.get("pace_trends", {})
        if pace_trends.get("trend") == "declining":
            improvement_areas.append("Pace development - focus on speed and tempo work")
            
        consistency = performance_analysis.get("consistency", {})
        if consistency.get("consistency_rating") == "low":
            improvement_areas.append("Training consistency - establish regular schedule")
            
        volume_trends = performance_analysis.get("volume_trends", {})
        if volume_trends.get("recent_weekly_km", 0) < 20:
            improvement_areas.append("Training volume - gradually increase weekly mileage")
            
        recovery_data = performance_analysis.get("recovery_correlation", {})
        if recovery_data.get("avg_recovery_score", 100) < 60:
            improvement_areas.append("Recovery optimization - prioritize sleep and rest")
            
        return improvement_areas or ["Continue current training approach"]

    async def _save_evaluation(self, user_id: str, evaluation_result: Dict[str, Any]) -> None:
        """Save evaluation results to database."""
        try:
            async with get_database_session() as session:
                evaluation = AITrainerEvaluation(
                    user_id=user_id,
                    evaluation_data=evaluation_result,
                    analysis_period_days=evaluation_result.get("analysis_period_days", 90),
                    confidence_score=evaluation_result.get("summary", {}).get("confidence_score", 0.5),
                    created_at=datetime.utcnow()
                )
                session.add(evaluation)
                await session.commit()
                
                logger.info(f"Saved evaluation for user {user_id}")
                
        except Exception as e:
            logger.error(f"Failed to save evaluation for user {user_id}: {e}")
            # Don't raise - saving is not critical to the evaluation process

    async def get_evaluation_history(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get user's evaluation history."""
        try:
            async with get_database_session() as session:
                query = select(AITrainerEvaluation).where(
                    AITrainerEvaluation.user_id == user_id
                ).order_by(desc(AITrainerEvaluation.created_at)).limit(limit)
                
                result = await session.execute(query)
                evaluations = result.scalars().all()
                
                return [{
                    "id": eval.id,
                    "evaluation_date": eval.created_at.isoformat() if eval.created_at else None,
                    "analysis_period_days": eval.analysis_period_days,
                    "confidence_score": eval.confidence_score,
                    "summary": eval.evaluation_data.get("summary", {}) if eval.evaluation_data else {}
                } for eval in evaluations]
                
        except Exception as e:
            logger.error(f"Error getting evaluation history for user {user_id}: {e}")
            raise TrainerError(f"Failed to get evaluation history: {e}")


# Global service instance
trainer_service = TrainerService()
