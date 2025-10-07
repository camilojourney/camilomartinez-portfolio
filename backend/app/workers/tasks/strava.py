"""
Strava-related background tasks.

Tasks:
- sync_strava_weekly: Fetch new Strava activities weekly (includes automatic token refresh)
- correlate_activities: Match Strava runs with WHOOP workouts
"""

import logging
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.workers.celery_app import app
from app.config.database import async_session_factory

logger = logging.getLogger(__name__)


@app.task(name='app.workers.tasks.strava.correlate_activities')
def correlate_activities() -> Dict[str, Any]:
    """
    Correlate Strava runs with WHOOP workouts based on time proximity.

    Ported from: scripts/pipelines/activity-correlation-etl.js

    Matching logic:
    - Activities within 10 minutes of each other
    - Both must be running activities
    - Confidence scoring based on distance similarity
    - Only correlates activities not already matched

    Returns:
        Dict with correlation statistics
    """
    import asyncio
    return asyncio.run(_correlate_activities_async())


async def _correlate_activities_async() -> Dict[str, Any]:
    """Async implementation of activity correlation."""
    logger.info("🔄 Starting cross-platform activity correlation ETL...")

    async with async_session_factory() as db:
        # Find correlation candidates
        candidates = await _find_correlation_candidates(db)

        if not candidates:
            logger.info("✅ No new correlation candidates found")
            return {
                "status": "success",
                "candidates_found": 0,
                "correlations_created": 0,
                "timestamp": datetime.utcnow().isoformat()
            }

        logger.info(f"📊 Found {len(candidates)} potential correlations")

        # Filter by confidence threshold
        valid_correlations = [c for c in candidates if c['confidence'] >= 0.7]
        logger.info(f"✅ {len(valid_correlations)} correlations passed confidence threshold (>= 0.7)")

        # Insert correlations
        inserted_count = await _insert_correlations(db, valid_correlations)

        logger.info("✅ Activity correlation ETL completed")

        return {
            "status": "success",
            "candidates_found": len(candidates),
            "correlations_created": inserted_count,
            "timestamp": datetime.utcnow().isoformat(),
            "details": valid_correlations
        }


async def _find_correlation_candidates(db: AsyncSession) -> List[Dict[str, Any]]:
    """
    Find Strava/WHOOP activity pairs within 10 minutes of each other.

    NOTE: Not filtering by user_id since Strava and WHOOP have different user IDs.
    """
    query = text("""
        SELECT
            s.id as strava_run_id,
            w.id as whoop_workout_id,
            s.user_id as strava_user_id,
            w.user_id as whoop_user_id,
            EXTRACT(EPOCH FROM (w.start_time - s.start_date)) / 60 as time_diff_minutes,
            s.distance_meters as strava_distance,
            w.distance_meters as whoop_distance,
            CASE
                WHEN s.distance_meters > 0 AND w.distance_meters > 0
                THEN ABS(s.distance_meters - w.distance_meters) * 100.0 / s.distance_meters
                ELSE NULL
            END as distance_diff_percent
        FROM strava_runs s
        JOIN whoop_workouts w
            ON w.start_time BETWEEN (s.start_date - INTERVAL '10 minutes')
               AND (s.start_date + INTERVAL '10 minutes')
        WHERE NOT EXISTS (
            SELECT 1 FROM activity_correlations ac
            WHERE ac.strava_run_id = s.id OR ac.whoop_workout_id = w.id
        )
        AND w.sport_name = 'running'
        ORDER BY s.start_date DESC
    """)

    result = await db.execute(query)
    rows = result.fetchall()

    candidates = []
    for row in rows:
        row_dict = dict(row._mapping)
        confidence = _calculate_confidence(row_dict)
        method = _determine_method(row_dict)

        candidates.append({
            'strava_run_id': row_dict['strava_run_id'],
            'whoop_workout_id': row_dict['whoop_workout_id'],
            'user_id': row_dict['strava_user_id'],
            'time_diff_minutes': float(row_dict['time_diff_minutes']) if row_dict['time_diff_minutes'] else 0,
            'distance_diff_percent': float(row_dict['distance_diff_percent']) if row_dict['distance_diff_percent'] else None,
            'confidence': confidence,
            'method': method
        })

    return candidates


def _calculate_confidence(row: Dict[str, Any]) -> float:
    """
    Calculate confidence score based on multiple factors.

    Base confidence: 0.8 (high since we match within 10 minutes)
    Distance bonus: +0.2 if <5% diff, +0.1 if <15% diff
    Distance penalty: -0.1 if >30% diff
    """
    confidence = 0.8  # High base confidence

    distance_diff = row.get('distance_diff_percent')
    if distance_diff is not None:
        if distance_diff <= 5:
            confidence += 0.2  # Very close distance
        elif distance_diff <= 15:
            confidence += 0.1  # Close distance
        elif distance_diff > 30:
            confidence -= 0.1  # Distance differs significantly

    return min(confidence, 1.0)


def _determine_method(row: Dict[str, Any]) -> str:
    """Determine which matching method was used."""
    distance_diff = row.get('distance_diff_percent')
    if distance_diff is not None and distance_diff <= 10:
        return 'time_and_distance_match'
    return 'time_proximity_match'


async def _insert_correlations(db: AsyncSession, correlations: List[Dict[str, Any]]) -> int:
    """Insert correlation records into the database."""
    if not correlations:
        return 0

    inserted = 0
    for corr in correlations:
        query = text("""
            INSERT INTO activity_correlations
            (strava_run_id, whoop_workout_id)
            VALUES (:strava_run_id, :whoop_workout_id)
            ON CONFLICT (strava_run_id, whoop_workout_id) DO NOTHING
        """)

        await db.execute(query, {
            'strava_run_id': corr['strava_run_id'],
            'whoop_workout_id': corr['whoop_workout_id']
        })
        inserted += 1

    await db.commit()
    logger.info(f"✅ Matched {inserted} activities")

    return inserted


@app.task(name='app.workers.tasks.strava.sync_strava_weekly')
def sync_strava_weekly() -> Dict[str, Any]:
    """
    Sync new Strava activities for the week.

    Calls the Next.js API endpoint to perform the sync.
    This approach reuses existing TypeScript sync logic without duplicating code.

    Returns:
        Dict with sync statistics
    """
    import requests
    import os

    logger.info("📊 Strava weekly sync task triggered")

    try:
        # Get the Next.js API URL from environment or use localhost
        api_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3000")
        endpoint = f"{api_url}/api/strava/sync/weekly"

        logger.info(f"🔗 Calling Next.js API: {endpoint}")

        # Call the Next.js API endpoint
        response = requests.post(endpoint, json={}, timeout=300)  # 5 min timeout
        response.raise_for_status()

        result = response.json()
        summary = result.get('data', {}).get('summary', {})

        logger.info(f"✅ Strava sync completed: {summary.get('totalActivitiesSynced', 0)} activities synced")

        return {
            "status": "success",
            "activities_synced": summary.get('totalActivitiesSynced', 0),
            "users_checked": summary.get('usersChecked', 0),
            "duration_seconds": summary.get('durationSeconds', 0),
            "sync_result": result,
            "timestamp": datetime.utcnow().isoformat()
        }

    except requests.exceptions.Timeout:
        logger.error("❌ Strava sync timed out after 5 minutes")
        return {
            "status": "error",
            "error": "Sync timed out after 5 minutes",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Strava sync failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


