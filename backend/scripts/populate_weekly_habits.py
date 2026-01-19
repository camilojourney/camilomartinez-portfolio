#!/usr/bin/env python3
"""
Populate weekly_habits_summary table with historical and current data.

This script:
1. Extracts meditation and workout counts from whoop_workouts
2. Calculates wake-up time statistics from whoop_sleep
3. Calculates workout timing statistics
4. Populates weekly_habits_summary table

Can be run manually or via cron job every Sunday to update the latest week.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional
import asyncio

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import async_session_factory


async def get_week_bounds(date: datetime) -> tuple[datetime, datetime]:
    """
    Get the Sunday-Saturday bounds for a given date.

    Args:
        date: Any date within the week

    Returns:
        Tuple of (week_start Sunday, week_end Saturday)
    """
    # Get the Sunday of the week containing this date
    days_since_sunday = date.weekday() + 1  # Monday=0, so add 1 to get days since Sunday
    if date.weekday() == 6:  # Sunday
        days_since_sunday = 0

    week_start = (date - timedelta(days=days_since_sunday)).replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

    return week_start, week_end


async def calculate_weekly_summary(db: AsyncSession, week_start: datetime) -> Optional[dict]:
    """
    Calculate weekly summary statistics for a given week.

    Args:
        db: Database session
        week_start: Sunday date marking the start of the week

    Returns:
        Dictionary with weekly summary data or None if no data available
    """
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

    # Query meditation count
    meditation_query = text("""
        SELECT COUNT(*) as meditation_count
        FROM whoop_workouts
        WHERE sport_name = 'meditation'
        AND start_time IS NOT NULL
        AND timezone_offset IS NOT NULL
        AND (start_time + timezone_offset::interval) >= :week_start
        AND (start_time + timezone_offset::interval) < :week_end
    """)

    meditation_result = await db.execute(
        meditation_query,
        {"week_start": week_start, "week_end": week_end}
    )
    meditation_count = meditation_result.fetchone()[0] or 0

    # Query training days count (distinct days with workouts, not total workouts)
    # Only count weightlifting, running, boxing
    training_days_query = text("""
        WITH daily AS (
            SELECT
                date_trunc('day', (start_time + timezone_offset::interval)) AS local_day,
                1 AS did_training
            FROM whoop_workouts
            WHERE sport_name IN ('weightlifting_msk', 'weightlifting', 'running', 'boxing')
            AND start_time IS NOT NULL
            AND timezone_offset IS NOT NULL
            AND (start_time + timezone_offset::interval) >= :week_start
            AND (start_time + timezone_offset::interval) < :week_end
            GROUP BY 1
        )
        SELECT COALESCE(COUNT(*), 0) AS training_days
        FROM daily
    """)

    training_result = await db.execute(
        training_days_query,
        {"week_start": week_start, "week_end": week_end}
    )
    training_days = training_result.fetchone()[0] or 0

    # Query workout timing statistics (using local time with timezone offset)
    workout_time_query = text("""
        SELECT
            AVG(
                EXTRACT(HOUR FROM (start_time + timezone_offset::interval)) +
                EXTRACT(MINUTE FROM (start_time + timezone_offset::interval)) / 60.0
            ) as avg_workout_hour,
            STDDEV(
                EXTRACT(HOUR FROM (start_time + timezone_offset::interval)) +
                EXTRACT(MINUTE FROM (start_time + timezone_offset::interval)) / 60.0
            ) as std_workout_hour
        FROM whoop_workouts
        WHERE sport_name IN ('weightlifting_msk', 'weightlifting', 'running', 'boxing')
        AND start_time IS NOT NULL
        AND timezone_offset IS NOT NULL
        AND (start_time + timezone_offset::interval) >= :week_start
        AND (start_time + timezone_offset::interval) < :week_end
    """)

    workout_time_result = await db.execute(
        workout_time_query,
        {"week_start": week_start, "week_end": week_end}
    )
    workout_time_data = workout_time_result.fetchone()

    # Query wake-up time statistics (using local time with timezone offset)
    sleep_query = text("""
        SELECT
            AVG(
                EXTRACT(HOUR FROM (end_time + timezone_offset::interval)) +
                EXTRACT(MINUTE FROM (end_time + timezone_offset::interval)) / 60.0
            ) as avg_wake_hour,
            STDDEV(
                EXTRACT(HOUR FROM (end_time + timezone_offset::interval)) +
                EXTRACT(MINUTE FROM (end_time + timezone_offset::interval)) / 60.0
            ) as std_wake_hour
        FROM whoop_sleep
        WHERE end_time IS NOT NULL
        AND timezone_offset IS NOT NULL
        AND is_nap = false
        AND (end_time + timezone_offset::interval) >= :week_start
        AND (end_time + timezone_offset::interval) < :week_end
    """)

    sleep_result = await db.execute(
        sleep_query,
        {"week_start": week_start, "week_end": week_end}
    )
    sleep_data = sleep_result.fetchone()

    # Query sleep start time statistics (bedtime)
    # Normalize times after midnight (0-6 AM) to 24-30 hour format for proper averaging
    sleep_start_query = text("""
        SELECT
            AVG(
                CASE
                    WHEN EXTRACT(HOUR FROM (start_time + timezone_offset::interval)) >= 0
                         AND EXTRACT(HOUR FROM (start_time + timezone_offset::interval)) < 6
                    THEN EXTRACT(HOUR FROM (start_time + timezone_offset::interval)) + 24 +
                         EXTRACT(MINUTE FROM (start_time + timezone_offset::interval)) / 60.0
                    ELSE EXTRACT(HOUR FROM (start_time + timezone_offset::interval)) +
                         EXTRACT(MINUTE FROM (start_time + timezone_offset::interval)) / 60.0
                END
            ) as avg_sleep_start_hour,
            STDDEV(
                CASE
                    WHEN EXTRACT(HOUR FROM (start_time + timezone_offset::interval)) >= 0
                         AND EXTRACT(HOUR FROM (start_time + timezone_offset::interval)) < 6
                    THEN EXTRACT(HOUR FROM (start_time + timezone_offset::interval)) + 24 +
                         EXTRACT(MINUTE FROM (start_time + timezone_offset::interval)) / 60.0
                    ELSE EXTRACT(HOUR FROM (start_time + timezone_offset::interval)) +
                         EXTRACT(MINUTE FROM (start_time + timezone_offset::interval)) / 60.0
                END
            ) as std_sleep_start_hour
        FROM whoop_sleep
        WHERE start_time IS NOT NULL
        AND timezone_offset IS NOT NULL
        AND is_nap = false
        AND (start_time + timezone_offset::interval) >= :week_start
        AND (start_time + timezone_offset::interval) < :week_end
    """)

    sleep_start_result = await db.execute(
        sleep_start_query,
        {"week_start": week_start, "week_end": week_end}
    )
    sleep_start_data = sleep_start_result.fetchone()

    # If no data exists for this week, return None
    if meditation_count == 0 and training_days == 0 and sleep_data[0] is None:
        return None

    # Normalize sleep start hour back to 0-23.99 range
    avg_sleep_start = None
    if sleep_start_data[0] is not None:
        raw_avg = float(sleep_start_data[0])
        # If >= 24, it's actually early morning (subtract 24 to get 0-6 AM)
        avg_sleep_start = round(raw_avg if raw_avg < 24 else raw_avg - 24, 2)

    return {
        "week_start_date": week_start.date(),
        "week_end_date": (week_start + timedelta(days=6)).date(),
        "meditation_count": meditation_count,
        "workout_count": training_days,  # Now counts training days, not individual workouts
        "avg_wake_hour": round(float(sleep_data[0]), 2) if sleep_data[0] is not None else None,
        "std_wake_hour": round(float(sleep_data[1]), 2) if sleep_data[1] is not None else None,
        "avg_workout_hour": round(float(workout_time_data[0]), 2) if workout_time_data[0] is not None else None,
        "std_workout_hour": round(float(workout_time_data[1]), 2) if workout_time_data[1] is not None else None,
        "avg_sleep_start_hour": avg_sleep_start,
        "std_sleep_start_hour": round(float(sleep_start_data[1]), 2) if sleep_start_data[1] is not None else None,
    }


async def upsert_weekly_summary(db: AsyncSession, summary: dict) -> None:
    """
    Insert or update a weekly summary record.

    Args:
        db: Database session
        summary: Dictionary with weekly summary data
    """
    upsert_query = text("""
        INSERT INTO weekly_habits_summary (
            week_start_date, week_end_date, meditation_count, workout_count,
            avg_wake_hour, std_wake_hour, avg_workout_hour, std_workout_hour,
            avg_sleep_start_hour, std_sleep_start_hour,
            updated_at
        ) VALUES (
            :week_start_date, :week_end_date, :meditation_count, :workout_count,
            :avg_wake_hour, :std_wake_hour, :avg_workout_hour, :std_workout_hour,
            :avg_sleep_start_hour, :std_sleep_start_hour,
            NOW()
        )
        ON CONFLICT (week_start_date)
        DO UPDATE SET
            meditation_count = EXCLUDED.meditation_count,
            workout_count = EXCLUDED.workout_count,
            avg_wake_hour = EXCLUDED.avg_wake_hour,
            std_wake_hour = EXCLUDED.std_wake_hour,
            avg_workout_hour = EXCLUDED.avg_workout_hour,
            std_workout_hour = EXCLUDED.std_workout_hour,
            avg_sleep_start_hour = EXCLUDED.avg_sleep_start_hour,
            std_sleep_start_hour = EXCLUDED.std_sleep_start_hour,
            updated_at = NOW()
    """)

    await db.execute(upsert_query, summary)
    await db.commit()


async def get_date_range(db: AsyncSession) -> tuple[Optional[datetime], Optional[datetime]]:
    """
    Get the earliest and latest dates from workout and sleep data.

    Returns:
        Tuple of (earliest_date, latest_date) or (None, None) if no data
    """
    query = text("""
        SELECT
            MIN(earliest) as min_date,
            MAX(latest) as max_date
        FROM (
            SELECT MIN(start_time) as earliest, MAX(start_time) as latest FROM whoop_workouts
            UNION ALL
            SELECT MIN(end_time) as earliest, MAX(end_time) as latest FROM whoop_sleep
        ) combined
    """)

    result = await db.execute(query)
    row = result.fetchone()

    if row and row[0] and row[1]:
        return row[0], row[1]
    return None, None


async def populate_all_weeks(recalculate_all: bool = False):
    """
    Populate weekly summaries for all weeks with available data.

    Args:
        recalculate_all: If True, recalculate all weeks. If False, only update current week.
    """
    async with async_session_factory() as db:
        print("🔍 Finding date range of available data...")
        earliest_date, latest_date = await get_date_range(db)

        if not earliest_date or not latest_date:
            print("❌ No workout or sleep data found in database")
            return

        print(f"📅 Data range: {earliest_date.date()} to {latest_date.date()}")

        if recalculate_all:
            # Process all weeks from earliest to latest
            current_date = earliest_date
            weeks_processed = 0
            weeks_with_data = 0

            print(f"\n🔄 Processing all weeks...")

            while current_date <= latest_date:
                week_start, _ = await get_week_bounds(current_date)

                summary = await calculate_weekly_summary(db, week_start)
                if summary:
                    await upsert_weekly_summary(db, summary)
                    weeks_with_data += 1

                    # Format avg_wake_hour as HH:MM for display
                    if summary['avg_wake_hour']:
                        wake_hours = int(summary['avg_wake_hour'])
                        wake_minutes = int((summary['avg_wake_hour'] - wake_hours) * 60)
                        wake_time_str = f"{wake_hours:02d}:{wake_minutes:02d}"
                    else:
                        wake_time_str = "no data"

                    # Format avg_sleep_start_hour as HH:MM for display
                    if summary['avg_sleep_start_hour']:
                        sleep_hours = int(summary['avg_sleep_start_hour'])
                        sleep_minutes = int((summary['avg_sleep_start_hour'] - sleep_hours) * 60)
                        sleep_time_str = f"{sleep_hours:02d}:{sleep_minutes:02d}"
                    else:
                        sleep_time_str = "no data"

                    print(f"  ✅ Week of {summary['week_start_date']}: "
                          f"{summary['meditation_count']} meditations, "
                          f"{summary['workout_count']} training days, "
                          f"wake: {wake_time_str}, sleep start: {sleep_time_str}")

                weeks_processed += 1
                current_date += timedelta(days=7)

            print(f"\n✅ Processed {weeks_processed} weeks, populated {weeks_with_data} weeks with data")
        else:
            # Process the PREVIOUS week (the one that just ended)
            # This script runs on Sundays, so we want to capture the week that just finished
            current_date = datetime.now()
            week_start, _ = await get_week_bounds(current_date)

            # Go back to the previous week (the one that just ended)
            previous_week_start = week_start - timedelta(days=7)
            previous_week_end = previous_week_start + timedelta(days=6)

            print(f"\n🔄 Processing last week ({previous_week_start.date()} to {previous_week_end.date()})...")

            summary = await calculate_weekly_summary(db, previous_week_start)
            if summary:
                await upsert_weekly_summary(db, summary)
                print(f"  ✅ Week of {summary['week_start_date']}: "
                      f"{summary['meditation_count']} meditations, "
                      f"{summary['workout_count']} training days")
            else:
                print("  ℹ️  No data available for last week")


async def display_recent_weeks(limit: int = 12):
    """
    Display the most recent weeks from the summary table.

    Args:
        limit: Number of recent weeks to display
    """
    async with async_session_factory() as db:
        query = text("""
            SELECT
                week_start_date,
                week_end_date,
                meditation_count,
                workout_count,
                avg_wake_hour,
                std_wake_hour,
                avg_workout_hour,
                std_workout_hour
            FROM weekly_habits_summary
            ORDER BY week_start_date DESC
            LIMIT :limit
        """)

        result = await db.execute(query, {"limit": limit})
        rows = result.fetchall()

        if not rows:
            print("\n📊 No data in weekly_habits_summary table yet")
            return

        print(f"\n📊 Most Recent {len(rows)} Weeks:")
        print("=" * 120)
        print(f"{'Week Start':<12} {'Week End':<12} {'Med':<5} {'Train':<5} {'Avg Wake':<10} {'Wake σ':<8} {'Avg Workout':<12} {'Workout σ':<10}")
        print("=" * 120)

        for row in rows:
            week_start = row[0]
            week_end = row[1]
            med_count = row[2]
            workout_count = row[3]
            avg_wake = row[4]
            std_wake = row[5]
            avg_workout = row[6]
            std_workout = row[7]

            # Format wake time as HH:MM
            if avg_wake is not None:
                wake_hours = int(avg_wake)
                wake_minutes = int((avg_wake - wake_hours) * 60)
                wake_str = f"{wake_hours:02d}:{wake_minutes:02d}"
            else:
                wake_str = "N/A"

            # Format wake std as HH:MM
            if std_wake is not None:
                std_wake_hours = int(std_wake)
                std_wake_minutes = int((std_wake - std_wake_hours) * 60)
                wake_std_str = f"{std_wake_hours:02d}:{std_wake_minutes:02d}"
            else:
                wake_std_str = "N/A"

            # Format workout time as HH:MM
            if avg_workout is not None:
                workout_hours = int(avg_workout)
                workout_minutes = int((avg_workout - workout_hours) * 60)
                workout_str = f"{workout_hours:02d}:{workout_minutes:02d}"
            else:
                workout_str = "N/A"

            # Format workout std as HH:MM
            if std_workout is not None:
                std_workout_hours = int(std_workout)
                std_workout_minutes = int((std_workout - std_workout_hours) * 60)
                workout_std_str = f"{std_workout_hours:02d}:{std_workout_minutes:02d}"
            else:
                workout_std_str = "N/A"

            print(f"{week_start!s:<12} {week_end!s:<12} {med_count:<5} {workout_count:<5} "
                  f"{wake_str:<10} {wake_std_str:<8} {workout_str:<12} {workout_std_str:<10}")

        print("=" * 120)


async def main():
    """Main entry point for the script."""
    import argparse

    parser = argparse.ArgumentParser(description="Populate weekly habits summary table")
    parser.add_argument(
        "--all",
        action="store_true",
        help="Recalculate all historical weeks (default: only current week)"
    )
    parser.add_argument(
        "--show",
        action="store_true",
        help="Display recent weeks after populating"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=12,
        help="Number of recent weeks to display (default: 12)"
    )

    args = parser.parse_args()

    print("🏃 Weekly Habits Summary Population Script")
    print("=" * 50)

    await populate_all_weeks(recalculate_all=args.all)

    if args.show:
        await display_recent_weeks(limit=args.limit)


if __name__ == "__main__":
    asyncio.run(main())
