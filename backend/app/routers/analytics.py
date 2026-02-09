"""
Data analysis and dashboard API endpoints.
Analytics services for dashboard data visualization.
"""

import logging
from datetime import datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db_session

logger = logging.getLogger(__name__)
router = APIRouter()


class StrainDataPoint(BaseModel):
    formatted_date: str
    strain: float


class MonthlyStrainData(BaseModel):
    month: str
    average_strain: float
    days_count: int


class StrainRecoveryData(BaseModel):
    strain_date: str
    strain: float
    recovery_score: float


class WorkoutData(BaseModel):
    id: str
    sport_name: str
    start_time: str
    end_time: str


class WorkoutTimeData(BaseModel):
    date: str
    time: str
    timeAsMinutes: int


class ViewDataCounts(BaseModel):
    users: int
    cycles: int
    sleep: int
    recovery: int
    workouts: int


class ViewDataRecent(BaseModel):
    cycles: list[dict[str, Any]]
    recovery: list[dict[str, Any]]
    sleep: list[dict[str, Any]]
    workouts: list[dict[str, Any]]


class ViewDataResponse(BaseModel):
    success: bool
    counts: ViewDataCounts
    recent: ViewDataRecent
    latest_date: Any
    strain: list[dict[str, Any]]
    timestamp: str


@router.get("/")
async def analytics_info():
    """Analytics service information and available endpoints."""
    return {
        "message": "Analytics API endpoints available",
        "endpoints": {
            "strain": "GET /api/analytics/strain-data - Daily strain data",
            "monthly_strain": "GET /api/analytics/monthly-strain - Monthly strain averages",
            "strain_recovery": "GET /api/analytics/strain-recovery - Strain vs recovery correlation",
            "workout_data": "GET /api/analytics/workout-data - Workout activities",
            "workout_times": "GET /api/analytics/workout-times - Workout time patterns"
        },
        "status": "active"
    }


@router.get("/strain-data", response_model=list[StrainDataPoint])
async def get_strain_data(db: AsyncSession = Depends(get_db_session)):
    """Get daily strain data for visualization."""
    try:
        query = text("""
            SELECT
                TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date,
                strain::decimal as strain
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            ORDER BY start_time ASC
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        # Process data for client components
        processed_data = [
            StrainDataPoint(
                formatted_date=str(row.formatted_date),
                strain=float(row.strain)
            )
            for row in rows
        ]

        logger.info(f"Retrieved {len(processed_data)} strain data points")
        return processed_data

    except Exception as e:
        logger.error(f"Error fetching strain data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch strain data") from e


@router.get("/monthly-strain", response_model=list[MonthlyStrainData])
async def get_monthly_strain_data(db: AsyncSession = Depends(get_db_session)):
    """Get monthly strain averages for visualization."""
    try:
        query = text("""
            SELECT
                TO_CHAR(start_time, 'YYYY-MM') AS month,
                AVG(strain::decimal) as average_strain,
                COUNT(*) as days_count
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            GROUP BY TO_CHAR(start_time, 'YYYY-MM')
            ORDER BY month ASC
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        # Process data for client components
        processed_data = [
            MonthlyStrainData(
                month=str(row.month),
                average_strain=float(row.average_strain),
                days_count=int(row.days_count)
            )
            for row in rows
        ]

        logger.info(f"Retrieved {len(processed_data)} monthly strain data points")
        return processed_data

    except Exception as e:
        logger.error(f"Error fetching monthly strain data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch monthly strain data") from e


@router.get("/strain-recovery", response_model=list[StrainRecoveryData])
async def get_strain_recovery_data(db: AsyncSession = Depends(get_db_session)):
    """Get strain vs recovery correlation data."""
    try:
        query = text("""
            SELECT
                c1.start_time::date as strain_date,
                c1.strain,
                r2.recovery_percentage as recovery_score
            FROM whoop_cycles c1
            -- Join with the next day's recovery score
            INNER JOIN whoop_recovery r2 ON
                -- Match recovery records that occurred after this cycle
                r2.cycle_id IN (
                    SELECT c2.id
                    FROM whoop_cycles c2
                    WHERE c2.start_time::date = (c1.start_time::date + interval '1 day')
                )
            WHERE
                c1.strain IS NOT NULL
                AND c1.strain > 0
                AND r2.recovery_percentage IS NOT NULL
                AND r2.recovery_percentage > 0
            ORDER BY c1.start_time ASC
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        # Process data for client components
        processed_data = [
            StrainRecoveryData(
                strain_date=str(row.strain_date),
                strain=float(row.strain),
                recovery_score=float(row.recovery_score)
            )
            for row in rows
        ]

        logger.info(f"Retrieved {len(processed_data)} strain-recovery correlation points")
        return processed_data

    except Exception as e:
        logger.error(f"Error fetching strain-recovery data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch strain-recovery data") from e


@router.get("/workout-data", response_model=list[WorkoutData])
async def get_workout_data(db: AsyncSession = Depends(get_db_session)):
    """Get workout activity data for current year."""
    try:
        query = text("""
            SELECT
                id,
                sport_name,
                start_time,
                end_time
            FROM whoop_workouts
            WHERE
                start_time >= DATE_TRUNC('year', CURRENT_DATE)
                AND end_time > start_time  -- Ensure valid duration
                AND (
                    sport_name = 'weightlifting'
                    OR sport_name = 'weightlifting_msk'
                    OR sport_name = 'running'
                    OR sport_name = 'boxing'
                )
            ORDER BY start_time ASC
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        # Process data for client components
        processed_data = [
            WorkoutData(
                id=str(row.id),
                sport_name=str(row.sport_name),
                start_time=str(row.start_time),
                end_time=str(row.end_time)
            )
            for row in rows
        ]

        logger.info(f"Retrieved {len(processed_data)} workout data points")
        return processed_data

    except Exception as e:
        logger.error(f"Error fetching workout data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch workout data") from e


@router.get("/workout-times", response_model=list[WorkoutTimeData])
async def get_workout_times(db: AsyncSession = Depends(get_db_session)):
    """Get workout time patterns for visualization."""
    try:
        query = text("""
            SELECT
                TO_CHAR(DATE(start_time + (timezone_offset || ' hours')::interval), 'YYYY-MM-DD') AS workout_date,
                TO_CHAR(MIN(start_time + (timezone_offset || ' hours')::interval), 'HH24:MI') AS first_workout_time
            FROM whoop_workouts
            WHERE sport_name IN ('running', 'weightlifting', 'boxing', 'weightlifting_msk')
            GROUP BY workout_date
            ORDER BY workout_date
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        # Process data for client components
        processed_data = []
        for row in rows:
            # Convert time to minutes for comparison
            hours, minutes = row.first_workout_time.split(':')
            time_as_minutes = int(hours) * 60 + int(minutes)

            processed_data.append(WorkoutTimeData(
                date=str(row.workout_date),
                time=str(row.first_workout_time),
                timeAsMinutes=time_as_minutes
            ))

        logger.info(f"Retrieved {len(processed_data)} workout time data points")
        return processed_data

    except Exception as e:
        logger.error(f"Error fetching workout times: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch workout times") from e


@router.get("/view-data", response_model=ViewDataResponse)
async def get_view_data(db: AsyncSession = Depends(get_db_session)):
    """Aggregate dashboard metrics for WHOOP data overview."""
    try:
        counts_queries = {
            "users": "SELECT COUNT(*) as count FROM whoop_users",
            "cycles": "SELECT COUNT(*) as count FROM whoop_cycles",
            "sleep": "SELECT COUNT(*) as count FROM whoop_sleep",
            "recovery": "SELECT COUNT(*) as count FROM whoop_recovery",
            "workouts": "SELECT COUNT(*) as count FROM whoop_workouts",
        }

        counts: dict[str, int] = {}
        for key, sql_query in counts_queries.items():
            result = await db.execute(text(sql_query))
            counts[key] = int(result.scalar() or 0)

        recent_cycles = await db.execute(text("""
            SELECT id, start_time, end_time, strain,
                   TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date
            FROM whoop_cycles
            ORDER BY start_time DESC
            LIMIT 10
        """))

        recent_recovery = await db.execute(text("""
            SELECT cycle_id, recovery_percentage, created_at
            FROM whoop_recovery
            ORDER BY created_at DESC
            LIMIT 10
        """))

        recent_sleep = await db.execute(text("""
            SELECT id, start_time, end_time, sleep_performance_percentage
            FROM whoop_sleep
            ORDER BY start_time DESC
            LIMIT 10
        """))

        recent_workouts = await db.execute(text("""
            SELECT id, start_time, end_time, sport_name, strain
            FROM whoop_workouts
            ORDER BY start_time DESC
            LIMIT 10
        """))

        latest_date_result = await db.execute(text("""
            SELECT MAX(start_time) as latest_cycle_date
            FROM whoop_cycles
        """))

        strain_data_result = await db.execute(text("""
            SELECT
                TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date,
                strain
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            AND start_time >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            ORDER BY start_time DESC
        """))

        def serialize_row(row_mapping) -> dict[str, Any]:
            row_dict = dict(row_mapping)
            for key, value in row_dict.items():
                if isinstance(value, datetime):
                    row_dict[key] = value.isoformat()
                elif isinstance(value, Decimal):
                    row_dict[key] = float(value)
            return row_dict

        recent = {
            "cycles": [serialize_row(row) for row in recent_cycles.mappings()],
            "recovery": [serialize_row(row) for row in recent_recovery.mappings()],
            "sleep": [serialize_row(row) for row in recent_sleep.mappings()],
            "workouts": [serialize_row(row) for row in recent_workouts.mappings()],
        }

        strain = [
            {
                "formatted_date": row["formatted_date"],
                "strain": float(row["strain"]),
            }
            for row in strain_data_result.mappings()
        ]

        latest_date = latest_date_result.scalar()
        if isinstance(latest_date, datetime):
            latest_date = latest_date.isoformat()

        response = {
            "success": True,
            "counts": counts,
            "recent": recent,
            "latest_date": latest_date,
            "strain": strain,
            "timestamp": datetime.utcnow().isoformat(),
        }

        logger.info("Assembled view data metrics for dashboard")
        return response

    except Exception as e:
        logger.error(f"Error fetching view data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch view data") from e
