"""Extend Strava runs with detailed metrics and splits"""

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0004_extend_strava_runs"
down_revision = "0003_create_strava_runs"
branch_labels = None
depends_on = None


COLUMNS = [
    "elapsed_time_seconds",
    "start_date",
    "start_date_local",
    "utc_offset_seconds",
    "average_speed_mps",
    "max_speed_mps",
    "total_elevation_gain",
    "elev_high",
    "elev_low",
    "suffer_score",
    "perceived_exertion",
    "start_latlng",
    "end_latlng",
    "polyline",
    "summary_polyline",
    "private_note",
]


INDEXES = [
    "idx_strava_runs_sport_date",
    "idx_strava_runs_suffer_score",
]


SPLIT_INDEXES = [
    "idx_splits_run_type",
    "idx_splits_speed",
    "idx_splits_distance_time",
]


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                ALTER TABLE strava_runs
                    ADD COLUMN IF NOT EXISTS elapsed_time_seconds INTEGER,
                    ADD COLUMN IF NOT EXISTS start_date TIMESTAMP,
                    ADD COLUMN IF NOT EXISTS start_date_local TIMESTAMP,
                    ADD COLUMN IF NOT EXISTS utc_offset_seconds INTEGER,
                    ADD COLUMN IF NOT EXISTS average_speed_mps NUMERIC,
                    ADD COLUMN IF NOT EXISTS max_speed_mps NUMERIC,
                    ADD COLUMN IF NOT EXISTS total_elevation_gain NUMERIC,
                    ADD COLUMN IF NOT EXISTS elev_high NUMERIC,
                    ADD COLUMN IF NOT EXISTS elev_low NUMERIC,
                    ADD COLUMN IF NOT EXISTS suffer_score NUMERIC,
                    ADD COLUMN IF NOT EXISTS perceived_exertion INTEGER,
                    ADD COLUMN IF NOT EXISTS start_latlng POINT,
                    ADD COLUMN IF NOT EXISTS end_latlng POINT,
                    ADD COLUMN IF NOT EXISTS polyline TEXT,
                    ADD COLUMN IF NOT EXISTS summary_polyline TEXT,
                    ADD COLUMN IF NOT EXISTS private_note TEXT;

                CREATE TABLE IF NOT EXISTS strava_run_splits (
                    id BIGSERIAL PRIMARY KEY,
                    strava_run_id BIGINT NOT NULL REFERENCES strava_runs(id) ON DELETE CASCADE,
                    split_type TEXT NOT NULL,
                    split_number INTEGER NOT NULL,
                    distance_meters NUMERIC NOT NULL,
                    elapsed_time_seconds INTEGER NOT NULL,
                    moving_time_seconds INTEGER NOT NULL,
                    elevation_difference_meters NUMERIC,
                    average_speed_mps NUMERIC NOT NULL,
                    average_grade_adjusted_speed NUMERIC,
                    pace_zone INTEGER,
                    CONSTRAINT unique_split_per_run UNIQUE (strava_run_id, split_type, split_number)
                );

                CREATE INDEX IF NOT EXISTS idx_strava_runs_sport_date ON strava_runs (sport_type, start_date DESC);
                CREATE INDEX IF NOT EXISTS idx_strava_runs_suffer_score ON strava_runs (suffer_score DESC) WHERE suffer_score IS NOT NULL;

                CREATE INDEX IF NOT EXISTS idx_splits_run_type ON strava_run_splits (strava_run_id, split_type);
                CREATE INDEX IF NOT EXISTS idx_splits_speed ON strava_run_splits (average_speed_mps DESC);
                CREATE INDEX IF NOT EXISTS idx_splits_distance_time ON strava_run_splits (distance_meters, elapsed_time_seconds);

                COMMENT ON COLUMN strava_runs.elapsed_time_seconds IS 'Total elapsed time including stops and pauses';
                COMMENT ON COLUMN strava_runs.start_date IS 'Activity start time in UTC (from Strava API)';
                COMMENT ON COLUMN strava_runs.start_date_local IS 'Activity start time in local timezone';
                COMMENT ON COLUMN strava_runs.utc_offset_seconds IS 'UTC offset in seconds from start_date_local';
                COMMENT ON COLUMN strava_runs.average_speed_mps IS 'Average speed in meters per second';
                COMMENT ON COLUMN strava_runs.max_speed_mps IS 'Maximum speed in meters per second';
                COMMENT ON COLUMN strava_runs.total_elevation_gain IS 'Total elevation gained during activity';
                COMMENT ON COLUMN strava_runs.elev_high IS 'Highest elevation point in meters';
                COMMENT ON COLUMN strava_runs.elev_low IS 'Lowest elevation point in meters';
                COMMENT ON COLUMN strava_runs.suffer_score IS 'Strava suffer score (0-1000+)';
                COMMENT ON COLUMN strava_runs.perceived_exertion IS 'Perceived exertion rating (1-10)';
                COMMENT ON COLUMN strava_runs.start_latlng IS 'Starting coordinates [lat, lng]';
                COMMENT ON COLUMN strava_runs.end_latlng IS 'Ending coordinates [lat, lng]';
                COMMENT ON COLUMN strava_runs.polyline IS 'Detailed route polyline from Strava map';
                COMMENT ON COLUMN strava_runs.summary_polyline IS 'Simplified route polyline from Strava map';
                COMMENT ON COLUMN strava_runs.private_note IS 'Private notes about the activity';

                COMMENT ON TABLE strava_run_splits IS 'Normalized split data from Strava activities (metric and standard)';
                COMMENT ON COLUMN strava_run_splits.split_type IS 'Type of split: metric (1km) or standard (1 mile)';
                COMMENT ON COLUMN strava_run_splits.split_number IS 'Sequential split number within the activity';
                COMMENT ON COLUMN strava_run_splits.distance_meters IS 'Distance covered in this split (meters)';
                COMMENT ON COLUMN strava_run_splits.elapsed_time_seconds IS 'Total time for this split including stops';
                COMMENT ON COLUMN strava_run_splits.moving_time_seconds IS 'Moving time for this split excluding stops';
                COMMENT ON COLUMN strava_run_splits.elevation_difference_meters IS 'Net elevation change during this split';
                COMMENT ON COLUMN strava_run_splits.average_speed_mps IS 'Average speed for this split (meters per second)';
                COMMENT ON COLUMN strava_run_splits.average_grade_adjusted_speed IS 'Grade-adjusted average speed';
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                DROP TABLE IF EXISTS strava_run_splits CASCADE;
                """
            )
        )
    )

    for index in SPLIT_INDEXES:
        op.execute(sa.text(f"DROP INDEX IF EXISTS {index};"))

    for index in INDEXES:
        op.execute(sa.text(f"DROP INDEX IF EXISTS {index};"))

    for column in COLUMNS:
        op.execute(sa.text(f"ALTER TABLE strava_runs DROP COLUMN IF EXISTS {column};"))
