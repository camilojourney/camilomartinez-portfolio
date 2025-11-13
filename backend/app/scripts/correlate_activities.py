"""
Activity Correlation Script

Matches Strava runs with WHOOP workouts based on:
- Same date
- Same hour
- Both are running activities

Creates entries in the activity_correlations table.

Usage:
    cd backend
    poetry run python app/scripts/correlate_activities.py
"""

import os
import psycopg2
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DB_CONNECTION_STRING = os.getenv("POSTGRES_URL_NONPRISMA") or os.getenv("DATABASE_URL")

print("🔄 Finding activity correlations...")

try:
    conn = psycopg2.connect(DB_CONNECTION_STRING)
    cur = conn.cursor()

    # Check what we have
    cur.execute("SELECT COUNT(*) FROM strava_runs")
    strava_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM whoop_workouts")
    whoop_count = cur.fetchone()[0]

    print(f"📊 Found {strava_count} Strava runs")
    print(f"📊 Found {whoop_count} WHOOP workouts")

    # Find matches by date and hour
    match_query = """
        SELECT
            s.id as strava_id,
            w.id as whoop_id,
            s.distance_meters as strava_distance,
            s.start_date as strava_time,
            w.start_time as whoop_time,
            w.distance_meters as whoop_distance
        FROM
            strava_runs AS s
        JOIN
            whoop_workouts AS w
            ON DATE(s.start_date) = DATE(w.start_time)
            AND EXTRACT(HOUR FROM s.start_date) = EXTRACT(HOUR FROM w.start_time)
        ORDER BY
            w.start_time DESC
    """

    cur.execute(match_query)
    matches = cur.fetchall()

    print(f"\n✨ Found {len(matches)} matching activities!")

    if len(matches) > 0:
        # Prepare correlations to insert
        correlations = []

        print("\n📊 Matched Activities:")
        print("=" * 80)

        for match in matches:
            strava_id, whoop_id, strava_dist, strava_time, whoop_time, whoop_dist = match

            # Calculate time difference in minutes
            time_diff = abs((whoop_time - strava_time).total_seconds() / 60)
            time_diff_minutes = round(time_diff)

            correlations.append((
                strava_id,
                whoop_id,
                time_diff_minutes,
                strava_dist,
                whoop_dist
            ))

            # Handle NULL distances
            strava_km = f"{strava_dist/1000:.2f}" if strava_dist else "N/A"
            whoop_km = f"{whoop_dist/1000:.2f}" if whoop_dist else "N/A"

            print(f"Strava: {strava_time} | WHOOP: {whoop_time} | Diff: {time_diff_minutes} mins")
            print(f"  Distances: Strava {strava_km} km | WHOOP {whoop_km} km")
            print()

        # Insert correlations (upsert to avoid duplicates)
        insert_query = """
            INSERT INTO activity_correlations (
                strava_run_id,
                whoop_workout_id,
                time_diff_minutes,
                strava_distance_meters,
                whoop_distance_meters
            )
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (strava_run_id, whoop_workout_id) DO UPDATE SET
                time_diff_minutes = EXCLUDED.time_diff_minutes,
                strava_distance_meters = EXCLUDED.strava_distance_meters,
                whoop_distance_meters = EXCLUDED.whoop_distance_meters,
                updated_at = NOW()
        """

        cur.executemany(insert_query, correlations)
        conn.commit()

        print(f"✅ Saved {len(correlations)} correlations to database")
    else:
        print("ℹ️  No new correlations to create")

    cur.close()
    conn.close()

    print("\n✅ Activity correlation completed successfully!")

except Exception as e:
    print(f"❌ ERROR: {e}")
    exit(1)
