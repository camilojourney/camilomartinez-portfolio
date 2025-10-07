"""Create analytics materialized views"""

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0014_create_materialized_views"
down_revision = "0013_standardize_milli"  # Fixed: matches the actual revision ID in 0013
branch_labels = None
depends_on = None


VIEWS = [
    "daily_fitness_snapshot",
    "run_performance_details",
    "boxing_performance_details",
    "weightlifting_performance_details",
]


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                DROP MATERIALIZED VIEW IF EXISTS daily_fitness_snapshot;

                CREATE MATERIALIZED VIEW IF NOT EXISTS daily_fitness_snapshot AS
                SELECT
                    wc.user_id,
                    wc.start_time::date AS snapshot_date,
                    wr.recovery_percentage AS whoop_recovery_score,
                    wr.hrv_rmssd_ms AS whoop_hrv,
                    ws.sleep_performance_percentage AS whoop_sleep_performance_percent,
                    (ws.total_in_bed_time_ms / 3600000.0) AS whoop_hours_in_bed,
                    wc.strain AS whoop_day_strain,
                    COALESCE(daily_workouts.whoop_workout_count, 0) AS whoop_workout_count,
                    COALESCE(daily_workouts.whoop_running_minutes, 0) AS whoop_running_minutes,
                    COALESCE(daily_workouts.whoop_boxing_minutes, 0) AS whoop_boxing_minutes,
                    COALESCE(daily_workouts.whoop_weight_training_minutes, 0) AS whoop_weight_training_minutes,
                    COALESCE(daily_workouts.whoop_meditation_sessions, 0) AS whoop_meditation_sessions,
                    COALESCE(daily_workouts.whoop_meditation_minutes, 0) AS whoop_meditation_minutes,
                    COALESCE(daily_workouts.whoop_sauna_minutes, 0) AS whoop_sauna_minutes
                FROM whoop_cycles wc
                LEFT JOIN whoop_recovery wr ON wc.id = wr.cycle_id
                LEFT JOIN (
                    SELECT
                        cycle_id,
                        SUM(total_in_bed_time_ms) AS total_in_bed_time_ms,
                        AVG(sleep_performance_percentage) AS sleep_performance_percentage
                    FROM whoop_sleep
                    GROUP BY cycle_id
                ) ws ON wc.id = ws.cycle_id
                LEFT JOIN (
                    SELECT
                        start_time::date AS workout_date,
                        user_id,
                        COUNT(id) AS whoop_workout_count,
                        SUM(CASE WHEN sport_name = 'running' THEN (EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0) ELSE 0 END) AS whoop_running_minutes,
                        SUM(CASE WHEN sport_name = 'boxing' THEN (EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0) ELSE 0 END) AS whoop_boxing_minutes,
                        SUM(CASE WHEN sport_name IN ('weightlifting', 'weightlifting_msk') THEN (EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0) ELSE 0 END) AS whoop_weight_training_minutes,
                        SUM(CASE WHEN sport_name = 'meditation' THEN 1 ELSE 0 END) AS whoop_meditation_sessions,
                        SUM(CASE WHEN sport_name = 'meditation' THEN (EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0) ELSE 0 END) AS whoop_meditation_minutes,
                        SUM(CASE WHEN sport_name = 'sauna' THEN (EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0) ELSE 0 END) AS whoop_sauna_minutes
                    FROM whoop_workouts
                    GROUP BY workout_date, user_id
                ) AS daily_workouts ON wc.start_time::date = daily_workouts.workout_date
                    AND wc.user_id = daily_workouts.user_id;

                CREATE MATERIALIZED VIEW IF NOT EXISTS run_performance_details AS
                SELECT
                    sr.id AS strava_run_id,
                    sr.name AS run_name,
                    sr.start_date AS run_start_date,
                    (sr.distance_meters * 0.000621371) AS total_distance_miles,
                    60.0 / (sr.average_speed_mps * 2.23694) AS avg_pace_min_per_mile,
                    ww.strain AS whoop_strain,
                    ww.avg_heart_rate_bpm AS whoop_avg_hr,
                    (ww.hr_zone_1_ms / 60000.0) AS whoop_hr_zone1_mins,
                    (ww.hr_zone_2_ms / 60000.0) AS whoop_hr_zone2_mins,
                    (ww.hr_zone_3_ms / 60000.0) AS whoop_hr_zone3_mins,
                    (ww.hr_zone_4_ms / 60000.0) AS whoop_hr_zone4_mins,
                    (ww.hr_zone_5_ms / 60000.0) AS whoop_hr_zone5_mins,
                    srs.split_number,
                    srs.distance_meters AS split_distance_meters,
                    srs.average_speed_mps AS split_average_speed_mps,
                    (srs.distance_meters * 0.000621371) AS split_distance_miles,
                    60.0 / (srs.average_speed_mps * 2.23694) AS split_pace_min_per_mile
                FROM strava_runs sr
                JOIN strava_run_splits srs ON sr.id = srs.strava_run_id
                LEFT JOIN activity_correlations ac ON sr.id = ac.strava_run_id
                LEFT JOIN whoop_workouts ww ON ac.whoop_workout_id = ww.id;

                CREATE MATERIALIZED VIEW IF NOT EXISTS boxing_performance_details AS
                SELECT
                    id AS whoop_workout_id,
                    start_time,
                    strain,
                    avg_heart_rate_bpm,
                    max_heart_rate_bpm,
                    (EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0) AS duration_minutes,
                    (strain / (EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0)) AS strain_density,
                    (hr_zone_0_ms / 60000.0) AS whoop_hr_zone0_mins,
                    (hr_zone_1_ms / 60000.0) AS whoop_hr_zone1_mins,
                    (hr_zone_2_ms / 60000.0) AS whoop_hr_zone2_mins,
                    (hr_zone_3_ms / 60000.0) AS whoop_hr_zone3_mins,
                    (hr_zone_4_ms / 60000.0) AS whoop_hr_zone4_mins,
                    (hr_zone_5_ms / 60000.0) AS whoop_hr_zone5_mins
                FROM whoop_workouts
                WHERE sport_name = 'boxing';

                CREATE MATERIALIZED VIEW IF NOT EXISTS weightlifting_performance_details AS
                SELECT
                    id AS whoop_workout_id,
                    start_time,
                    strain,
                    avg_heart_rate_bpm,
                    max_heart_rate_bpm,
                    (EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0) AS duration_minutes,
                    (strain / (EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0)) AS strain_density,
                    (hr_zone_0_ms / 60000.0) AS whoop_hr_zone0_mins,
                    (hr_zone_1_ms / 60000.0) AS whoop_hr_zone1_mins,
                    (hr_zone_2_ms / 60000.0) AS whoop_hr_zone2_mins,
                    (hr_zone_3_ms / 60000.0) AS whoop_hr_zone3_mins,
                    (hr_zone_4_ms / 60000.0) AS whoop_hr_zone4_mins,
                    (hr_zone_5_ms / 60000.0) AS whoop_hr_zone5_mins
                FROM whoop_workouts
                WHERE sport_name IN ('weightlifting', 'weightlifting_msk');
                """
            )
        )
    )


def downgrade() -> None:
    for view in VIEWS:
        op.execute(sa.text(f"DROP MATERIALIZED VIEW IF EXISTS {view};"))
